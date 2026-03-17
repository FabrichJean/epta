import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { Octokit } from '@octokit/rest';
import { encryptToken, decryptToken } from '../utils/crypto';
import { authenticate, AuthRequest } from '../middleware/auth';

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

    // Encrypt the GitHub Personal Token
    const encryptedGhp = encryptToken(ghp);

    // Create user with GitHub data
    const user = await prisma.user.create({
      data: {
        name: githubUser.name || githubUser.login,
        email: githubUser.email || `${githubUser.login}@github.user`,
        username: githubUser.login,
        avatarUrl: githubUser.avatar_url,
        githubToken: encryptedGhp,
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

    // Verify token with GitHub API
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

    // Find user by username
    const authenticatedUser = await prisma.user.findFirst({
      where: { username: githubUser.login }
    });

    if (!authenticatedUser) {
      return res.status(401).json({ error: 'User not found. Please register first.' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: authenticatedUser.id },
      process.env.JWT_SECRET!,
      { expiresIn: '7d' }
    );

    // Encrypt the GitHub Personal Token
    const encryptedGhp = encryptToken(ghp);

    await prisma.user.updateMany({
      where: {username: githubUser.login},
      data: {githubToken: encryptedGhp}
    });


    res.json({
      message: 'Login successful',
      token,
      user: {
        id: authenticatedUser.id,
        name: authenticatedUser.name,
        email: authenticatedUser.email,
        username: authenticatedUser.username,
        avatarUrl: authenticatedUser.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Update GitHub Token: Update the stored GitHub Personal Token
router.put('/update-token', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { ghp } = req.body;
    const userId = req.userId!;

    if (!ghp) {
      return res.status(400).json({ error: 'GitHub Personal Token is required' });
    }

    // Verify the new token with GitHub API
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

    // Get current user
    const currentUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify that the token belongs to the same GitHub account
    if (currentUser.username !== githubUser.login) {
      return res.status(403).json({ 
        error: 'Token mismatch', 
        message: `This token belongs to @${githubUser.login} but you are logged in as @${currentUser.username}` 
      });
    }

    // Encrypt the new GitHub Personal Token
    const encryptedGhp = encryptToken(ghp);

    // Update the user's GitHub token and profile info
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        githubToken: encryptedGhp,
        name: githubUser.name || githubUser.login,
        avatarUrl: githubUser.avatar_url,
      },
    });

    res.json({
      message: 'GitHub token updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        username: updatedUser.username,
        avatarUrl: updatedUser.avatarUrl,
      },
    });
  } catch (error) {
    console.error('Update token error:', error);
    res.status(500).json({ error: 'Failed to update GitHub token' });
  }
});

router.get('/', authenticate, (req: AuthRequest, res: Response) => {
  return res.json(req.user)
})

export default router;
