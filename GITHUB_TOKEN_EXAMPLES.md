/**
 * Example: Using GitHub Token Verification Utility in Other Routes
 * 
 * This file demonstrates how to use the GitHub token verification utility
 * in other route handlers beyond authentication.
 */

// EXAMPLE 1: Using in a GitHub API call route
// ============================================

import { Router, Request, Response } from "express";
import {
  verifyGitHubToken,
  getAuthenticatedOctokit,
  isGitHubTokenValid,
} from "../utils/github";
import { authenticate, AuthRequest } from "../middleware/auth";

const router = Router();

// Get GitHub repositories for a user
router.post("/api/github-repos", async (req: Request, res: Response) => {
  try {
    const { ghp } = req.body;

    // Verify token first
    const verification = await verifyGitHubToken(ghp);
    if (!verification.isValid) {
      return res.status(verification.statusCode || 401).json({
        error: verification.error,
      });
    }

    // Get authenticated Octokit instance
    const octokit = getAuthenticatedOctokit(ghp);

    // Make authenticated GitHub API calls
    const { data: repos } =
      await octokit.rest.repos.listForAuthenticatedUser({
        per_page: 30,
        sort: "updated",
      });

    res.json({
      message: "Repositories retrieved successfully",
      repos: repos.map((r) => ({
        id: r.id,
        name: r.name,
        url: r.html_url,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
      })),
    });
  } catch (error) {
    console.error("Error fetching repositories:", error);
    res.status(500).json({ error: "Failed to fetch repositories" });
  }
});

// EXAMPLE 2: Using in authenticated routes (with JWT)
// ===================================================

router.get(
  "/api/github-profile",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;

      // In a real scenario, you would decrypt the stored token
      // For this example, we'll assume it comes from request body
      const { ghp } = req.body;

      if (!ghp) {
        return res.status(400).json({
          error: "GitHub Personal Token is required",
        });
      }

      // Quick validation
      const isValid = await isGitHubTokenValid(ghp);
      if (!isValid) {
        return res.status(401).json({
          error: "Invalid GitHub Personal Token",
        });
      }

      // Get Octokit and fetch profile
      const octokit = getAuthenticatedOctokit(ghp);
      const { data: profile } = await octokit.rest.users.getAuthenticated();

      res.json({
        profile: {
          name: profile.name,
          bio: profile.bio,
          company: profile.company,
          location: profile.location,
          followers: profile.followers,
          following: profile.following,
          publicRepos: profile.public_repos,
        },
      });
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  },
);

// EXAMPLE 3: Middleware for GitHub token verification
// ===================================================

export async function verifyGitHubTokenMiddleware(
  req: any,
  res: Response,
  next: any,
) {
  try {
    const { ghp } = req.body;

    if (!ghp) {
      return res.status(400).json({
        error: "GitHub Personal Token is required",
      });
    }

    const verification = await verifyGitHubToken(ghp);

    if (!verification.isValid) {
      return res.status(verification.statusCode || 401).json({
        error: verification.error,
      });
    }

    // Attach verified user to request
    req.githubUser = verification.user;
    req.octokit = getAuthenticatedOctokit(ghp);
    next();
  } catch (error) {
    res.status(500).json({ error: "Token verification failed" });
  }
}

// Usage of middleware:
router.post(
  "/api/create-repo",
  verifyGitHubTokenMiddleware,
  async (req: any, res: Response) => {
    try {
      const { repoName, description } = req.body;
      const octokit = req.octokit;

      const { data: repo } = await octokit.rest.repos.createForAuthenticatedUser(
        {
          name: repoName,
          description,
          private: false,
        },
      );

      res.status(201).json({
        message: "Repository created successfully",
        repo: {
          name: repo.name,
          url: repo.html_url,
        },
      });
    } catch (error: any) {
      console.error("Error creating repository:", error);
      res.status(500).json({
        error: "Failed to create repository",
        details: error.message,
      });
    }
  },
);

// EXAMPLE 4: Batch token verification
// ===================================

export async function verifyMultipleTokens(tokens: string[]) {
  const results = await Promise.all(
    tokens.map(async (token) => ({
      token,
      isValid: await isGitHubTokenValid(token),
    })),
  );

  return results.filter((r) => r.isValid).map((r) => r.token);
}

// EXAMPLE 5: Token validation with specific requirements
// ======================================================

export async function verifyTokenWithScope(ghp: string, requiredScope: string) {
  try {
    const verification = await verifyGitHubToken(ghp);

    if (!verification.isValid) {
      return {
        isValid: false,
        error: verification.error,
      };
    }

    // Get token details (in real scenario, check header X-OAuth-Scopes)
    const octokit = getAuthenticatedOctokit(ghp);

    // You can add additional checks here
    // For example, verify the user has certain repositories

    return {
      isValid: true,
      user: verification.user,
    };
  } catch (error: any) {
    return {
      isValid: false,
      error: error.message,
    };
  }
}

export default router;
