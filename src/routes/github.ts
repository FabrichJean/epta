import { Router, Request, Response } from 'express';
import { Octokit } from '@octokit/rest';

const router = Router();

// Get GitHub user info from GitHub Personal Token
router.post('/github-info', async (req: Request, res: Response) => {
  try {
    const { ghp } = req.body;

    if (!ghp) {
      return res.status(400).json({ error: 'GitHub Personal Token (ghp) is required' });
    }

    // Initialize Octokit with the provided token
    const octokit = new Octokit({
      auth: ghp,
    });

    // Fetch authenticated user information
    const { data: user } = await octokit.rest.users.getAuthenticated();

    // Return relevant user information
    res.json({
      username: user.login,
      name: user.name,
      email: user.email,
      bio: user.bio,
      location: user.location,
      company: user.company,
      blog: user.blog,
      twitter: user.twitter_username,
      avatarUrl: user.avatar_url,
      publicRepos: user.public_repos,
      publicGists: user.public_gists,
      followers: user.followers,
      following: user.following,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    });
  } catch (error: any) {
    console.error('GitHub API error:', error);
    
    if (error.status === 401) {
      return res.status(401).json({ error: 'Invalid GitHub Personal Token' });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch GitHub information',
      message: error.message 
    });
  }
});

export default router;
