import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Octokit } from '@octokit/rest';
import multer from 'multer';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getUserGithubToken } from '../utils/github.com';
import { generateShortCode } from '../utils/crypto';
import { extractProjectId } from '../utils/project';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  // limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Create project - creates a private GitHub repository and saves to database
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    const userId = req.userId!;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    // Get user's GitHub token from database
    const ghp = await getUserGithubToken(userId);
    if (!ghp) {
      return res.status(401).json({ error: 'GitHub token not found. Please re-authenticate.' });
    }

    // Initialize Octokit with user's token
    const octokit = new Octokit({ auth: ghp });

    // Create private GitHub repository
    let repoData;
    try {
      const { data } = await octokit.rest.repos.createForAuthenticatedUser({
        name,
        description: description || '',
        private: true,
        auto_init: true, // Initialize with README
      });
      repoData = data;
    } catch (error: any) {
      if (error.status === 401) {
        return res.status(401).json({ 
          error: 'GitHub authentication failed', 
          message: 'Your GitHub token is invalid or has been revoked. Please log in again with a new token.',
          details: error.message 
        });
      }
      if (error.status === 422) {
        return res.status(400).json({ error: 'Repository name already exists on GitHub' });
      }
      throw error;
    }

    // Save project to database
    const project = await prisma.project.create({
      data: {
        name: repoData.name,
        link: repoData.html_url,
        description: repoData.description,
        isPrivate: repoData.private,
        metadata: {
          fullName: repoData.full_name,
          defaultBranch: repoData.default_branch,
          language: repoData.language,
          createdAt: repoData.created_at,
        },
        userId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true,
          }
        }
      }
    });

    res.status(201).json({
      message: 'Project created successfully',
      project,
    });
  } catch (error: any) {
    console.error('Create project error:', error);
    res.status(500).json({ 
      error: 'Failed to create project',
      message: error.message 
    });
  }
});

// Get all projects for authenticated user
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const projects = await prisma.project.findMany({
      // where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ projects });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// Get single project
router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const projectId = parseInt(req.params.id);

    const project = await prisma.project.findFirst({
      where: { 
        id: projectId,
        userId 
      },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({ project });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Get contents of a path in project repository
router.get('/:id/contents/*', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const projectId = parseInt(req.params.id);
    const path = req.params[0] || ''; // Get everything after /contents/

    // Get user's GitHub token
    const ghp = await getUserGithubToken(userId);
    if (!ghp) {
      return res.status(401).json({ error: 'GitHub token not found. Please re-authenticate.' });
    }

    // Get project
    const project = await prisma.project.findFirst({
      where: { 
        id: projectId,
      },
      include: {
        user: {
          select: { username: true }
        }
      }
    });
    

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const octokit = new Octokit({ auth: ghp });
    const repoName = (project.metadata as any)?.fullName?.split('/')[1] || project.name;
    const owner = project.user.username;
    
    try {
      // Get contents from GitHub
      const { data } = await octokit.rest.repos.getContent({
        owner,
        repo: repoName,
        path: path
      });

      // If it's a single file, return file details
      if (!Array.isArray(data)) {
        const fileData: any = data;
        
        // Check if short URL already exists for this file
        let shortUrl = await prisma.shortUrl.findFirst({
          where: {
            originalUrl: fileData.download_url,
            userId
          }
        });
        
        // Generate permanent public URL for this file if it doesn't exist
        let shortCode = shortUrl?.shortCode;
        if (!shortUrl) {
          shortCode = generateShortCode();
          let attempts = 0;
          
          // Ensure the short code is unique
          while (await prisma.shortUrl.findUnique({ where: { shortCode } })) {
            shortCode = generateShortCode();
            attempts++;
            if (attempts > 10) {
              shortCode = generateShortCode(8);
            }
          }
          
          shortUrl = await prisma.shortUrl.create({
            data: {
              shortCode,
              originalUrl: fileData.download_url,
              userId
            }
          });
        }
        
        const publicUrl = `${req.protocol}://${req.get('host')}/f/${shortCode}`;
        
        // Check if file is starred
        const stared = await prisma.stared.findFirst({
          where: {
            userId,
            projectId,
            path: fileData.path
          }
        });
        
        return res.json({
          type: 'file',
          name: fileData.name,
          path: fileData.path,
          size: fileData.size,
          sha: fileData.sha,
          url: fileData.html_url,
          downloadUrl: fileData.download_url,
          publicUrl: publicUrl, // Permanent public URL
          shortCode,
          encoding: fileData.encoding,
          isStarred: !!stared // Whether the file is starred
        });
      }

      // If it's a directory, return list of contents with publicUrl for files
      const contents = await Promise.all(
        data
          .filter((item: any) => item.name !== '.keep') // Filter out .keep files
          .map(async (item: any) => {
        let publicUrl = null;
        let shortCode = null;
        let isStarred = false;
        
        // Generate publicUrl only for files, not directories
        if (item.type === 'file' && item.download_url) {
          // Check if short URL already exists for this file
          let shortUrl = await prisma.shortUrl.findFirst({
            where: {
              originalUrl: item.download_url,
              userId
            }
          });
          
          // Create short URL if it doesn't exist
          if (!shortUrl) {
            shortCode = generateShortCode();
            let attempts = 0;
            
            // Ensure the short code is unique
            while (await prisma.shortUrl.findUnique({ where: { shortCode } })) {
              shortCode = generateShortCode();
              attempts++;
              if (attempts > 10) {
                shortCode = generateShortCode(8);
              }
            }
            
            shortUrl = await prisma.shortUrl.create({
              data: {
                shortCode,
                originalUrl: item.download_url,
                userId
              }
            });
          }
          
          shortCode = shortUrl.shortCode;
          publicUrl = `${req.protocol}://${req.get('host')}/f/${shortCode}`;
        }
        
        // Check if file is starred
        if (item.type === 'file') {
          const stared = await prisma.stared.findFirst({
            where: {
              userId,
              projectId,
              path: item.path
            }
          });
          isStarred = !!stared;
        }
        
        return {
          type: item.type, // 'file' or 'dir'
          name: item.name,
          path: item.path,
          size: item.size,
          sha: item.sha,
          url: item.html_url,
          downloadUrl: item.download_url,
          publicUrl: publicUrl, // Permanent public URL for files only
          shortCode: shortCode, // shortCode for files only
          isStarred: isStarred // Whether the file is starred
        };
      })
      );
      
      // Filter out any null/undefined entries
      const filteredContents = contents.filter(item => item !== null);

      res.json({
        type: 'dir',
        path: path || '/',
        contents: filteredContents
      });
    } catch (error: any) {
      if (error.status === 401) {
        return res.status(401).json({ 
          error: 'GitHub authentication failed', 
          message: 'Your GitHub token is invalid or has been revoked. Please log in again with a new token.',
          details: error.message 
        });
      }
      if (error.status === 404) {
        return res.status(404).json({ 
          error: 'Path not found',
          message: `The path '${path}' does not exist in this repository.`
        });
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Get contents error:', error);
    res.status(500).json({ 
      error: 'Failed to get contents',
      message: error.message 
    });
  }
});

// Upload/Create file with text content
router.post('/:id/contents/*', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const projectId = parseInt(req.params.id);
    const path = req.params[0] || ''; // Get everything after /contents/
    const { content, message } = req.body;

    if (!path) {
      return res.status(400).json({ error: 'File path is required' });
    }

    if (content === undefined || content === null) {
      return res.status(400).json({ error: 'File content is required' });
    }

    // Get user's GitHub token
    const ghp = await getUserGithubToken(userId);
    if (!ghp) {
      return res.status(401).json({ error: 'GitHub token not found. Please re-authenticate.' });
    }

    // Get project
    const project = await prisma.project.findFirst({
      where: { 
        id: projectId,
      },
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const octokit = new Octokit({ auth: ghp });
    const repoName = (project.metadata as any)?.fullName?.split('/')[1] || project.name;
    const owner = project.user.username;

    // Convert content to base64
    const contentBuffer = Buffer.from(content, 'utf-8');
    const base64Content = contentBuffer.toString('base64');

    try {
      // Create or update file on GitHub
      const { data } = await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo: repoName,
        path: path,
        message: message || `Create/update ${path}`,
        content: base64Content,
      });

      // Generate short code for file serving
      let shortCode = generateShortCode();
      let attempts = 0;
      while (await prisma.shortUrl.findUnique({ where: { shortCode } })) {
        shortCode = generateShortCode();
        attempts++;
        if (attempts > 10) {
          shortCode = generateShortCode(8);
        }
      }

      // Create short URL in database for direct file access
      const shortUrl = await prisma.shortUrl.create({
        data: {
          shortCode,
          originalUrl: data.content?.download_url || '',
          userId
        }
      });

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const publicUrl = `${baseUrl}/f/${shortCode}`;

      res.status(201).json({
        message: 'File created/updated successfully',
        file: {
          path: path,
          size: contentBuffer.length,
          sha: data.content?.sha,
          url: data.content?.html_url,
          publicUrl: publicUrl,
          downloadUrl: `${baseUrl}/s/${shortCode}`,
          originalDownloadUrl: data.content?.download_url,
          commit: {
            sha: data.commit?.sha,
            message: data.commit?.message,
            url: data.commit?.html_url,
          }
        },
      });
    } catch (error: any) {
      if (error.status === 401) {
        return res.status(401).json({ 
          error: 'GitHub authentication failed', 
          message: 'Your GitHub token is invalid or has been revoked. Please log in again with a new token.',
          details: error.message 
        });
      }
      if (error.status === 404) {
        return res.status(404).json({ error: 'Repository not found on GitHub' });
      }
      if (error.status === 422) {
        return res.status(400).json({ error: 'Invalid file path or repository state' });
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Create file error:', error);
    res.status(500).json({ 
      error: 'Failed to create file',
      message: error.message 
    });
  }
});

router.post('/:id/folders/*', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const projectId = parseInt(req.params.id);
    const folderPath = req.params[0]; // Get everything after /folders/
    const { message } = req.body;

    if (!folderPath) {
      return res.status(400).json({ error: 'Folder path is required' });
    }

    // Get user's GitHub token
    const ghp = await getUserGithubToken(userId);
    if (!ghp) {
      return res.status(401).json({ error: 'GitHub token not found. Please re-authenticate.' });
    }

    // Get project and verify ownership
    const project = await prisma.project.findFirst({
      where: { 
        id: projectId,
        userId 
      },
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const octokit = new Octokit({ auth: ghp });
    const repoName = (project.metadata as any)?.fullName?.split('/')[1] || project.name;
    const owner = project.user.username;

    // Create folder by adding a .keep file
    const cleanPath = folderPath.replace(/\/+$/, ''); // Remove trailing slashes
    const keepFilePath = `${cleanPath}/.keep`;
    const commitMessage = message || `Create folder structure: ${cleanPath}`;

    try {
      // Create empty .keep file to establish the folder structure
      const { data } = await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo: repoName,
        path: keepFilePath,
        message: commitMessage,
        content: '', // Empty content (base64 encoded empty string)
      });

      res.status(201).json({
        message: 'Folder created successfully',
        folder: {
          path: cleanPath,
          file: {
            path: data.content?.path,
            sha: data.content?.sha,
            url: data.content?.html_url,
          },
          commit: {
            sha: data.commit?.sha,
            message: data.commit?.message,
            url: data.commit?.html_url,
          }
        }
      });
    } catch (error: any) {
      if (error.status === 401) {
        return res.status(401).json({ 
          error: 'GitHub authentication failed', 
          message: 'Your GitHub token is invalid or has been revoked. Please log in again with a new token.',
          details: error.message 
        });
      }
      if (error.status === 404) {
        return res.status(404).json({ error: 'Repository not found on GitHub' });
      }
      if (error.status === 422) {
        return res.status(400).json({ error: 'Invalid folder path or repository state' });
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Create folder error:', error);
    res.status(500).json({ 
      error: 'Failed to create folder',
      message: error.message 
    });
  }
});

// Update project - updates GitHub repo name and database
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    const userId = req.userId!;
    const projectId = parseInt(req.params.id);

    // Get user's GitHub token from database
    const ghp = await getUserGithubToken(userId);
    if (!ghp) {
      return res.status(401).json({ error: 'GitHub token not found. Please re-authenticate.' });
    }

    // Get existing project
    const existingProject = await prisma.project.findFirst({
      where: { 
        id: projectId,
        userId 
      },
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const octokit = new Octokit({ auth: ghp });
    
    // Get user info to construct repo owner/name
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Extract current repo name from metadata or link
    const currentRepoName = (existingProject.metadata as any)?.fullName?.split('/')[1] || existingProject.name;

    // Update GitHub repository
    try {
      const { data: repoData } = await octokit.rest.repos.update({
        owner: user.username,
        repo: currentRepoName,
        name: name || existingProject.name,
        description: description !== undefined ? description : existingProject.description,
      });

      // Update database
      const updatedProject = await prisma.project.update({
        where: { id: projectId },
        data: {
          name: repoData.name,
          link: repoData.html_url,
          description: repoData.description,
          metadata: {
            fullName: repoData.full_name,
            defaultBranch: repoData.default_branch,
            language: repoData.language,
            updatedAt: repoData.updated_at,
          },
        },
      });

      res.json({
        message: 'Project updated successfully',
        project: updatedProject,
      });
    } catch (error: any) {
      if (error.status === 401) {
        return res.status(401).json({ 
          error: 'GitHub authentication failed', 
          message: 'Your GitHub token is invalid or has been revoked. Please log in again with a new token.',
          details: error.message 
        });
      }
      if (error.status === 404) {
        return res.status(404).json({ error: 'GitHub repository not found' });
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Update project error:', error);
    res.status(500).json({ 
      error: 'Failed to update project',
      message: error.message 
    });
  }
});

// Delete project - removes from database (optionally can delete from GitHub)
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const projectId = parseInt(req.params.id);
    const { deleteFromGithub } = req.body;

    // Get existing project
    const existingProject = await prisma.project.findFirst({
      where: { 
        id: projectId,
        userId 
      },
    });

    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // If user wants to delete from GitHub as well
    if (deleteFromGithub) {
      // Get user's GitHub token from database
      const ghp = await getUserGithubToken(userId);
      
      if (ghp) {
        const octokit = new Octokit({ auth: ghp });
        
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { username: true }
        });

        if (user) {
          const repoName = (existingProject.metadata as any)?.fullName?.split('/')[1] || existingProject.name;
          
          try {
            await octokit.rest.repos.delete({
              owner: user.username,
              repo: repoName,
            });
          } catch (error: any) {
            console.error('GitHub deletion error:', error);
            // Continue with database deletion even if GitHub deletion fails
          }
        }
      }
    }

    // Delete from database
    await prisma.project.delete({
      where: { id: projectId },
    });

    res.json({
      message: 'Project deleted successfully',
    });
  } catch (error: any) {
    console.error('Delete project error:', error);
    res.status(500).json({ 
      error: 'Failed to delete project',
      message: error.message 
    });
  }
});

// Upload file to GitHub repository
router.post('/:projectId/upload', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const projectId = await extractProjectId(req);

    let { path } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'File is required' });
    }

    if (!path) {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Get file extension from the uploaded file
    const fileExtension = file.originalname.split('.').pop()?.toLowerCase();
    const pathExtension = path.split('.').pop()?.toLowerCase();

    // Validate that path extension matches file extension
    if (fileExtension && pathExtension !== fileExtension) {
      return res.status(400).json({ 
        error: 'File extension mismatch',
        message: `The file '${file.originalname}' has extension '.${fileExtension}' but the path '${path}' has extension '.${pathExtension}'`,
        suggestion: `Try using: ${path.substring(0, path.lastIndexOf('.') + 1)}${fileExtension} or images/${file.originalname}`
      });
    }

    // Get user's GitHub token from database
    const ghp = await getUserGithubToken(userId);
    if (!ghp) {
      return res.status(401).json({ error: 'GitHub token not found. Please re-authenticate.' });
    }

    // Get project
    const project = await prisma.project.findFirst({
      where: { 
        id: projectId,
      },
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const octokit = new Octokit({ auth: ghp });
    const repoName = (project.metadata as any)?.fullName?.split('/')[1] || project.name;
    const owner = project.user.username;

    // Convert file buffer to base64
    const content = file.buffer.toString('base64');

    // Upload file to GitHub
    try {
  
      const { data } = await octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo: repoName,
        path: path,
        message: `Upload ${file.originalname}`,
        content: content,
      });

      // Generate short code for file serving
      let shortCode = generateShortCode();
      let attempts = 0;
      while (await prisma.shortUrl.findUnique({ where: { shortCode } })) {
        shortCode = generateShortCode();
        attempts++;
        if (attempts > 10) {
          shortCode = generateShortCode(8);
        }
      }

      // Create short URL in database for direct file access
      const shortUrl = await prisma.shortUrl.create({
        data: {
          shortCode,
          originalUrl: data.content?.download_url || '',
          userId
        }
      });

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const publicUrl = `${baseUrl}/f/${shortCode}`;

      res.json({
        message: 'File uploaded successfully',
        file: {
          name: file.originalname,
          path: path,
          size: file.size,
          sha: data.content?.sha,
          url: data.content?.html_url,
          publicUrl: publicUrl,  // Public permanent link
          downloadUrl: `${baseUrl}/s/${shortCode}`,  // Redirect link
          originalDownloadUrl: data.content?.download_url,
        },
      });
    } catch (error: any) {
      // console.log(error);
      
      if (error.status === 401) {
        return res.status(401).json({ 
          error: 'GitHub authentication failed', 
          message: 'Your GitHub token is invalid or has been revoked. Please log in again with a new token.',
          details: error.message 
        });
      }
      if (error.status === 404) {
        return res.status(404).json({ error: 'Repository not found on GitHub' });
      }
      if (error.status === 422) {
        return res.status(400).json({ error: 'Invalid file path or repository state' });
      }
      throw error;
    }
  } catch (error: any) {
    console.error('Upload file error:', error);
    res.status(500).json({ 
      error: 'Failed to upload file',
      message: error.message 
    });
  }
});

// Get all starred files for authenticated user
router.get('/starred/list', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    // Get user's GitHub token
    const ghp = await getUserGithubToken(userId);
    if (!ghp) {
      return res.status(401).json({ error: 'GitHub token not found. Please re-authenticate.' });
    }

    const stareds = await prisma.stared.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            metadata: true,
            user: {
              select: { username: true }
            }
          }
        }
      }
    });

    const octokit = new Octokit({ auth: ghp });

    // Fetch detailed information for each starred file from GitHub
    const starredFiles = await Promise.all(
      stareds.map(async (stared) => {
        try {
          const project = stared.project;
          const repoName = (project.metadata as any)?.fullName?.split('/')[1] || project.name;
          const owner = project.user.username;

          const { data } = await octokit.rest.repos.getContent({
            owner,
            repo: repoName,
            path: stared.path
          });

          // If it's a file, return the detailed structure
          if (!Array.isArray(data)) {
            const fileData: any = data;
            
            // Check if a public URL already exists for this file
            let publicUrl = null;
            let shortCode = null;
            const existingShortUrl = await prisma.shortUrl.findFirst({
              where: {
                originalUrl: fileData.download_url,
                userId
              }
            });

            if (existingShortUrl) {
              shortCode = existingShortUrl.shortCode;
              publicUrl = `${process.env.BASE_URL || 'http://localhost:4000'}/f/${shortCode}`;
            } else {
              // Generate new public URL
              shortCode = generateShortCode();
              const shortUrl = await prisma.shortUrl.create({
                data: {
                  shortCode,
                  originalUrl: fileData.download_url,
                  userId
                }
              });
              publicUrl = `${process.env.BASE_URL || 'http://localhost:4000'}/f/${shortCode}`;
            }

            return {
              type: 'file',
              name: fileData.name,
              path: fileData.path,
              size: fileData.size,
              sha: fileData.sha,
              url: fileData.html_url,
              downloadUrl: fileData.download_url,
              publicUrl: publicUrl,
              shortCode: shortCode,
              isStarred: true
            };
          }

          return null;
        } catch (error: any) {
          console.error(`Error fetching starred file ${stared.path}:`, error);
          return null;
        }
      })
    );

    // Filter out any null entries (files that couldn't be fetched)
    const validStarredFiles = starredFiles.filter(file => file !== null);

    res.json({ 
      count: validStarredFiles.length,
      stareds: validStarredFiles
    });
  } catch (error: any) {
    console.error('Get starred files error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch starred files',
      message: error.message 
    });
  }
});

// Check if a file is starred
router.get('/starred/check/:projectId/:path', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { projectId, path } = req.params;
    const projectIdNum = parseInt(projectId);

    const stared = await prisma.stared.findFirst({
      where: { 
        userId,
        projectId: projectIdNum,
        path: decodeURIComponent(path)
      },
    });

    res.json({ 
      isStarred: !!stared,
      stared: stared || null
    });
  } catch (error: any) {
    console.error('Check starred file error:', error);
    res.status(500).json({ 
      error: 'Failed to check starred status',
      message: error.message 
    });
  }
});

// Star a file
router.post('/starred/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { projectId } = req.params;
    const { path } = req.body;
    const projectIdNum = parseInt(projectId);

    if (!path) {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    console.log({user, userId});
    

    if (!user) {
      return res.status(401).json({ error: 'User not found or invalid token' });
    }

    // Verify project exists and belongs to user
    const project = await prisma.project.findUnique({
      where: { id: projectIdNum },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.userId !== userId) {
      return res.status(403).json({ error: 'You do not have permission to star files in this project' });
    }

    // Check if file is already starred
    const existing = await prisma.stared.findFirst({
      where: { 
        userId,
        projectId: projectIdNum,
        path
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'File is already starred' });
    }

    const stared = await prisma.stared.create({
      data: {
        path,
        userId,
        projectId: projectIdNum,
      },
    });

    res.status(201).json({
      message: 'File starred successfully',
      stared,
    });
  } catch (error: any) {
    console.error('Star file error:', error);
    res.status(500).json({ 
      error: 'Failed to star file',
      message: error.message 
    });
  }
});

// Unstar a file
router.delete('/starred/:projectId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;
    const { projectId } = req.params;
    const { path } = req.body;
    const projectIdNum = parseInt(projectId);

    if (!path) {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found or invalid token' });
    }

    // Verify project exists and belongs to user
    const project = await prisma.project.findUnique({
      where: { id: projectIdNum },
    });

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (project.userId !== userId) {
      return res.status(403).json({ error: 'You do not have permission to unstar files in this project' });
    }

    const stared = await prisma.stared.findFirst({
      where: { 
        userId,
        projectId: projectIdNum,
        path
      },
    });

    if (!stared) {
      return res.status(404).json({ error: 'Starred file not found' });
    }

    await prisma.stared.delete({
      where: { id: stared.id },
    });

    res.json({
      message: 'File unstarred successfully',
    });
  } catch (error: any) {
    console.error('Unstar file error:', error);
    res.status(500).json({ 
      error: 'Failed to unstar file',
      message: error.message 
    });
  }
});

export default router;
