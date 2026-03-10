import { PrismaClient } from '@prisma/client';
import { Router, Request, Response } from 'express';
import { getUserGithubToken } from '../utils/github.com';

const prisma = new PrismaClient();
const router = Router();

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
