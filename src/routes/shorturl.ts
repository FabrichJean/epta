import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateShortCode } from '../utils/crypto';

const router = Router();
const prisma = new PrismaClient();

// Create short URL (authenticated)
router.post('/shorten', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { url } = req.body;
    const userId = req.userId!;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Check if this URL already has a short code for this user
    const existing = await prisma.shortUrl.findFirst({
      where: {
        originalUrl: url,
        userId
      }
    });

    if (existing) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      return res.json({
        message: 'Short URL already exists',
        shortUrl: `${baseUrl}/s/${existing.shortCode}`,
        shortCode: existing.shortCode,
        originalUrl: existing.originalUrl,
        clicks: existing.clicks,
        createdAt: existing.createdAt
      });
    }

    // Generate unique short code
    let shortCode = generateShortCode();
    let attempts = 0;
    while (await prisma.shortUrl.findUnique({ where: { shortCode } })) {
      shortCode = generateShortCode();
      attempts++;
      if (attempts > 10) {
        shortCode = generateShortCode(8); // Use longer code if many collisions
      }
    }

    // Create short URL
    const shortUrl = await prisma.shortUrl.create({
      data: {
        shortCode,
        originalUrl: url,
        userId
      }
    });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.status(201).json({
      message: 'Short URL created successfully',
      shortUrl: `${baseUrl}/s/${shortUrl.shortCode}`,
      shortCode: shortUrl.shortCode,
      originalUrl: shortUrl.originalUrl,
      createdAt: shortUrl.createdAt
    });
  } catch (error: any) {
    console.error('Create short URL error:', error);
    res.status(500).json({ 
      error: 'Failed to create short URL',
      message: error.message 
    });
  }
});

// Get all short URLs for authenticated user
router.get('/my-urls', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId!;

    const urls = await prisma.shortUrl.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const formattedUrls = urls.map(url => ({
      id: url.id,
      shortUrl: `${baseUrl}/s/${url.shortCode}`,
      shortCode: url.shortCode,
      originalUrl: url.originalUrl,
      clicks: url.clicks,
      createdAt: url.createdAt
    }));

    res.json({
      count: urls.length,
      urls: formattedUrls
    });
  } catch (error: any) {
    console.error('Get short URLs error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve short URLs',
      message: error.message 
    });
  }
});

// Delete short URL
router.delete('/:shortCode', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { shortCode } = req.params;
    const userId = req.userId!;

    const shortUrl = await prisma.shortUrl.findFirst({
      where: {
        shortCode,
        userId
      }
    });

    if (!shortUrl) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    await prisma.shortUrl.delete({
      where: { id: shortUrl.id }
    });

    res.json({ message: 'Short URL deleted successfully' });
  } catch (error: any) {
    console.error('Delete short URL error:', error);
    res.status(500).json({ 
      error: 'Failed to delete short URL',
      message: error.message 
    });
  }
});

// Redirect to original URL (public route)
router.get('/:shortCode', async (req: Request, res: Response) => {
  try {
    const { shortCode } = req.params;

    const shortUrl = await prisma.shortUrl.findUnique({
      where: { shortCode }
    });

    if (!shortUrl) {
      return res.status(404).json({ error: 'Short URL not found' });
    }

    // Increment click count
    await prisma.shortUrl.update({
      where: { id: shortUrl.id },
      data: { clicks: shortUrl.clicks + 1 }
    });

    // Redirect to original URL
    res.redirect(shortUrl.originalUrl);
  } catch (error: any) {
    console.error('Redirect error:', error);
    res.status(500).json({ 
      error: 'Failed to redirect',
      message: error.message 
    });
  }
});

export default router;
