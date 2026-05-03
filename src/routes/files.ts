import { PrismaClient } from '@prisma/client';
import { Router, Request, Response } from 'express';
import multer from 'multer';
import { Octokit } from '@octokit/rest';
import { getUserGithubToken } from '../utils/github.com';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateShortCode } from '../utils/crypto';

const prisma = new PrismaClient();
const router = Router();

// Configure multer for memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
});

// Upload file to seed project
router.post('/upload', authenticate, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const file = req.file;
    let { path } = req.body;

    if (!file) {
      return res.status(400).json({ error: 'File is required' });
    }

    // Generate appropriate path if not provided
    if (!path) {
      const extension = file.originalname.split('.').pop()?.toLowerCase() || '';
      let folder = 'files'; // default folder
      
      // Categorize file by extension
      if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension)) {
        folder = 'images';
      } else if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension)) {
        folder = 'documents';
      } else if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(extension)) {
        folder = 'videos';
      } else if (['mp3', 'wav', 'flac', 'aac', 'ogg'].includes(extension)) {
        folder = 'audio';
      } else if (['js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'go', 'rs'].includes(extension)) {
        folder = 'code';
      }
      
      path = `${folder}/${file.originalname}`;
    }

    const projectName = process.env.SEED_PROJECT_NAME

    // Get the first project (seed project) for the user
    const project = await prisma.project.findFirst({
      where: { name: projectName },
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ error: 'No projects found for user' });
    }

    const userId = project.userId;

    // Get user's GitHub token
    const ghp = await getUserGithubToken(userId);
    if (!ghp) {
      return res.status(401).json({ error: 'GitHub token not found. Please re-authenticate.' });
    }

    const octokit = new Octokit({ auth: ghp });
    const repoName = (project.metadata as any)?.fullName?.split('/')[1] || project.name;
    const owner = project.user.username;

    // Convert file buffer to base64
    const content = file.buffer.toString('base64');

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
          userId,
        },
      });

      res.status(201).json({
        message: 'File uploaded successfully',
        file: {
          name: file.originalname,
          path,
          size: file.size,
          url: data.content?.html_url || '',
          downloadUrl: data.content?.download_url || '',
          shortCode: shortUrl.shortCode,
          shortUrl: `${req.protocol}://${req.get('host')}/f/${shortUrl.shortCode}`,
        },
        project: {
          id: project.id,
          name: project.name,
          link: project.link,
        },
      });
    } catch (error: any) {
      console.error('GitHub file upload error:', error);
      
      if (error.status === 401) {
        return res.status(401).json({ 
          error: 'GitHub authentication failed',
          message: 'Your GitHub token is invalid or has been revoked. Please log in again.'
        });
      }

      return res.status(500).json({ 
        error: 'Failed to upload file to GitHub',
        message: error.message 
      });
    }
  } catch (error: any) {
    console.error('Upload file error:', error);
    res.status(500).json({ 
      error: 'Failed to upload file',
      message: error.message 
    });
  }
});

// Serve file by short code (public route)
router.get('/:shortCode', async (req: Request, res: Response) => {
  try {
    const { shortCode } = req.params;

    // Find the short URL
    const shortUrl = await prisma.shortUrl.findUnique({
      where: { shortCode }
    });

    if (!shortUrl) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Increment click count
    await prisma.shortUrl.update({
      where: { id: shortUrl.id },
      data: { clicks: shortUrl.clicks + 1 }
    });

    // If the URL has a userId, use their GitHub token for authentication
    let githubToken: string | null = null;
    if (shortUrl.userId) {
      githubToken = await getUserGithubToken(shortUrl.userId);
    }

    // Fetch the file content from GitHub
    try {
      const headers: Record<string, string> = {
        'User-Agent': 'EPTA-File-Server'
      };

      // Add authentication if we have a token
      if (githubToken) {
        headers['Authorization'] = `token ${githubToken}`;
      }

      const response = await fetch(shortUrl.originalUrl, { headers });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          return res.status(403).json({ 
            error: 'Access denied',
            message: 'This file is from a private repository and the access token is no longer valid.'
          });
        }
        throw new Error(`GitHub returned ${response.status}`);
      }

      // Get the content type from GitHub response
      const contentType = response.headers.get('content-type') || 'application/octet-stream';

      // Get file content as buffer
      const buffer = await response.arrayBuffer();

      // Set appropriate headers
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.setHeader('Access-Control-Allow-Origin', '*'); // Allow CORS

      // Extract filename from originalUrl if possible
      const urlParts = shortUrl.originalUrl.split('/');
      const filename = urlParts[urlParts.length - 1].split('?')[0]; // Remove query params
      if (filename) {
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      }

      // Send the file
      res.send(Buffer.from(buffer));
    } catch (error: any) {
      console.error('Error fetching file from GitHub:', error);
      
      // If authentication failed and we have the original URL, try redirect as fallback
      if (!githubToken && error.message.includes('401')) {
        return res.status(403).json({ 
          error: 'Access denied',
          message: 'This file requires authentication. Please contact the file owner.'
        });
      }
      
      return res.status(500).json({ 
        error: 'Failed to fetch file',
        message: 'The file could not be retrieved from GitHub. It may have been deleted or moved.'
      });
    }
  } catch (error: any) {
    console.error('Serve file error:', error);
    res.status(500).json({ 
      error: 'Failed to serve file',
      message: error.message 
    });
  }
});

export default router;
