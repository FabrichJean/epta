import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { Octokit } from '@octokit/rest';
import { decryptToken } from '../utils/crypto';

const router = Router();
const prisma = new PrismaClient();

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

    // Fetch the file content from GitHub
    try {
      const response = await fetch(shortUrl.originalUrl);
      
      if (!response.ok) {
        throw new Error('Failed to fetch file from GitHub');
      }

      // Get the content type from GitHub response
      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      
      // Get file content as buffer
      const buffer = await response.arrayBuffer();
      
      // Set appropriate headers
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      
      // Extract filename from originalUrl if possible
      const urlParts = shortUrl.originalUrl.split('/');
      const filename = urlParts[urlParts.length - 1];
      if (filename) {
        res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
      }

      // Send the file
      res.send(Buffer.from(buffer));
    } catch (error) {
      console.error('Error fetching file from GitHub:', error);
      // Fallback to redirect
      res.redirect(shortUrl.originalUrl);
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
