import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { Octokit } from '@octokit/rest';

const router = Router();
const prisma = new PrismaClient();

// Register: GitHub Personal Token
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { ghp } = req.body;

    if (!ghp) {
      return res.status(400).json({ error: 'GitHub Personal Token is required' });
    }

    // Fetch GitHub user information
    const octokit = new Octokit({ auth: ghp });
    let githubUser;
    
    try {
      const { data } = await octokit.rest.users.getAuthenticated();
      githubUser = data;
    } catch (error: any) {
      if (error.status === 401) {
        return res.status(401).json({ error: 'Invalid GitHub Personal Token' });
      }
      throw error;
    }

    // Check if user already exists by email or username
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: githubUser.email || '' },
          { username: githubUser.login }
        ]
      }
    });

    if (existingUser) {
      return res.status(400).json({ error: 'User with this email or username already exists' });
    }

    // Hash the GitHub Personal Token
    const hashedGhp = await bcrypt.hash(ghp, 10);

    // Create user with GitHub data
    const user = await prisma.user.create({
      data: {
        name: githubUser.name || githubUser.login,
        email: githubUser.email || `${githubUser.login}@github.user`,
        username: githubUser.login,
        avatarUrl: githubUser.avatar_url,
        githubToken: hashedGhp,
      },
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// Login: GitHub Personal Token
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { ghp } = req.body;

    if (!ghp) {
      return res.status(400).json({ error: 'GitHub Personal Token is required' });
    }

    // Get all users (since we can't query by hashed token)
    const users = await prisma.user.findMany();

    // Find user by comparing hashed tokens
    let authenticatedUser = null;
    for (const user of users) {
      const isValid = await bcrypt.compare(ghp, user.githubToken);
      if (isValid) {
        authenticatedUser = user;
        break;
      }
    }

    if (!authenticatedUser) {
      return res.status(401).json({ error: 'Invalid GitHub Personal Token' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: authenticatedUser.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: authenticatedUser.id,
        name: authenticatedUser.name,
        email: authenticatedUser.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

export default router;
