import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { Octokit } from "@octokit/rest";
import { encryptToken, decryptToken } from "../utils/crypto";
import { authenticate, AuthRequest } from "../middleware/auth";
import {
  generateApiKey,
  hashApiKey,
  createApiKeyPreview,
} from "../utils/apiKey";

const router = Router();
const prisma = new PrismaClient();

// Add status information
interface ApiKeyInfo {
  id: number;
  name: string;
  keyPreview: string;
  expiresAt: Date;
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
}

interface ApiKeyWithStatus extends ApiKeyInfo {
  status: "active" | "expired" | "disabled";
}

// Register: GitHub Personal Token
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { ghp } = req.body;

    if (!ghp) {
      return res
        .status(400)
        .json({ error: "GitHub Personal Token is required" });
    }

    // Fetch GitHub user information
    const octokit = new Octokit({ auth: ghp });
    let githubUser;

    try {
      const { data } = await octokit.rest.users.getAuthenticated();
      githubUser = data;
    } catch (error: any) {
      if (error.status === 401) {
        return res.status(401).json({ error: "Invalid GitHub Personal Token" });
      }
      throw error;
    }

    // Check if user already exists by email or username
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: githubUser.email || "" }, { username: githubUser.login }],
      },
    });

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with this email or username already exists" });
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
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
      expiresIn: "7d",
    });

    res.status(201).json({
      message: "User registered successfully",
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
    console.error("Registration error:", error);
    res.status(500).json({ error: "Failed to register user" });
  }
});

// Login: GitHub Personal Token
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { ghp } = req.body;

    if (!ghp) {
      return res
        .status(400)
        .json({ error: "GitHub Personal Token is required" });
    }

    // Verify token with GitHub API
    const octokit = new Octokit({ auth: ghp });
    let githubUser;

    try {
      const { data } = await octokit.rest.users.getAuthenticated();
      githubUser = data;
    } catch (error: any) {
      if (error.status === 401) {
        return res.status(401).json({ error: "Invalid GitHub Personal Token" });
      }
      throw error;
    }

    // Find user by username
    const authenticatedUser = await prisma.user.findFirst({
      where: { username: githubUser.login },
    });

    if (!authenticatedUser) {
      return res
        .status(401)
        .json({ error: "User not found. Please register first." });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: authenticatedUser.id },
      process.env.JWT_SECRET!,
      { expiresIn: "7d" },
    );

    // Encrypt the GitHub Personal Token
    const encryptedGhp = encryptToken(ghp);

    await prisma.user.updateMany({
      where: { username: githubUser.login },
      data: { githubToken: encryptedGhp },
    });

    res.json({
      message: "Login successful",
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
    console.error("Login error:", error);
    res.status(500).json({ error: "Failed to login" });
  }
});

// Update GitHub Token: Update the stored GitHub Personal Token
router.put(
  "/update-token",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const { ghp } = req.body;
      const userId = req.userId!;

      if (!ghp) {
        return res
          .status(400)
          .json({ error: "GitHub Personal Token is required" });
      }

      // Verify the new token with GitHub API
      const octokit = new Octokit({ auth: ghp });
      let githubUser;

      try {
        const { data } = await octokit.rest.users.getAuthenticated();
        githubUser = data;
      } catch (error: any) {
        if (error.status === 401) {
          return res
            .status(401)
            .json({ error: "Invalid GitHub Personal Token" });
        }
        throw error;
      }

      // Get current user
      const currentUser = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!currentUser) {
        return res.status(404).json({ error: "User not found" });
      }

      // Verify that the token belongs to the same GitHub account
      if (currentUser.username !== githubUser.login) {
        return res.status(403).json({
          error: "Token mismatch",
          message: `This token belongs to @${githubUser.login} but you are logged in as @${currentUser.username}`,
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
        message: "GitHub token updated successfully",
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          username: updatedUser.username,
          avatarUrl: updatedUser.avatarUrl,
        },
      });
    } catch (error) {
      console.error("Update token error:", error);
      res.status(500).json({ error: "Failed to update GitHub token" });
    }
  },
);

router.get("/", authenticate, (req: AuthRequest, res: Response) => {
  res.status(200).json(req.user);
});

// Create API Key
router.post(
  "/api-keys",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const { name, expiresInDays } = req.body;

      if (!name || typeof name !== "string" || name.trim().length === 0) {
        return res.status(400).json({ error: "API key name is required" });
      }

      if (
        !expiresInDays ||
        typeof expiresInDays !== "number" ||
        expiresInDays < 1 ||
        expiresInDays > 365
      ) {
        return res
          .status(400)
          .json({ error: "expiresInDays must be between 1 and 365 days" });
      }

      // Check if user already has 10 active API keys (limit)
      const existingKeysCount = await prisma.apiKey.count({
        where: {
          userId,
          isActive: true,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (existingKeysCount >= 10) {
        return res
          .status(400)
          .json({
            error:
              "Maximum of 10 active API keys allowed. Please delete some existing keys.",
          });
      }

      // Generate API key
      const apiKey = generateApiKey();
      const keyHash = hashApiKey(apiKey);
      const keyPreview = createApiKeyPreview(apiKey);

      // Calculate expiration date
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);

      // Create API key record
      const createdApiKey = await prisma.apiKey.create({
        data: {
          name: name.trim(),
          keyHash,
          keyPreview,
          userId,
          expiresAt,
        },
        select: {
          id: true,
          name: true,
          keyPreview: true,
          expiresAt: true,
          isActive: true,
          createdAt: true,
          lastUsedAt: true,
        },
      });

      res.status(201).json({
        message: "API key created successfully",
        apiKey: apiKey, // Return the full key only once
        keyInfo: createdApiKey,
        warning: "Save this API key now. You will not be able to see it again.",
      });
    } catch (error) {
      console.error("Create API key error:", error);
      res.status(500).json({ error: "Failed to create API key" });
    }
  },
);

// Get all API keys for the user
router.get(
  "/api-keys",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;

      const apiKeys = await prisma.apiKey.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          keyPreview: true,
          expiresAt: true,
          isActive: true,
          lastUsedAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });

      const keysWithStatus: ApiKeyWithStatus[] = (apiKeys as ApiKeyInfo[]).map(
        (key): ApiKeyWithStatus => ({
          ...key,
          status: !key.isActive
            ? "disabled"
            : key.expiresAt < new Date()
              ? "expired"
              : "active",
        }),
      );

      res.json({
        apiKeys: keysWithStatus,
        total: apiKeys.length,
        active: keysWithStatus.filter((k) => k.status === "active").length,
      });
    } catch (error) {
      console.error("Get API keys error:", error);
      res.status(500).json({ error: "Failed to fetch API keys" });
    }
  },
);

// Delete an API key
router.delete(
  "/api-keys/:id",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const apiKeyId = parseInt(req.params.id);

      if (isNaN(apiKeyId)) {
        return res.status(400).json({ error: "Invalid API key ID" });
      }

      // Check if the API key belongs to the user
      const apiKey = await prisma.apiKey.findFirst({
        where: {
          id: apiKeyId,
          userId,
        },
      });

      if (!apiKey) {
        return res.status(404).json({ error: "API key not found" });
      }

      // Delete the API key
      await prisma.apiKey.delete({
        where: { id: apiKeyId },
      });

      res.json({
        message: "API key deleted successfully",
        deletedKey: {
          id: apiKey.id,
          name: apiKey.name,
          keyPreview: apiKey.keyPreview,
        },
      });
    } catch (error) {
      console.error("Delete API key error:", error);
      res.status(500).json({ error: "Failed to delete API key" });
    }
  },
);

// Disable/Enable an API key
router.patch(
  "/api-keys/:id/toggle",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const apiKeyId = parseInt(req.params.id);

      if (isNaN(apiKeyId)) {
        return res.status(400).json({ error: "Invalid API key ID" });
      }

      // Check if the API key belongs to the user
      const apiKey = await prisma.apiKey.findFirst({
        where: {
          id: apiKeyId,
          userId,
        },
      });

      if (!apiKey) {
        return res.status(404).json({ error: "API key not found" });
      }

      // Toggle the active status
      const updatedApiKey = await prisma.apiKey.update({
        where: { id: apiKeyId },
        data: { isActive: !apiKey.isActive },
        select: {
          id: true,
          name: true,
          keyPreview: true,
          isActive: true,
          expiresAt: true,
          lastUsedAt: true,
          createdAt: true,
        },
      });

      res.json({
        message: `API key ${updatedApiKey.isActive ? "enabled" : "disabled"} successfully`,
        apiKey: {
          ...updatedApiKey,
          status: !updatedApiKey.isActive
            ? "disabled"
            : updatedApiKey.expiresAt < new Date()
              ? "expired"
              : "active",
        },
      });
    } catch (error) {
      console.error("Toggle API key error:", error);
      res.status(500).json({ error: "Failed to toggle API key status" });
    }
  },
);

// Regenerate an API key
router.patch(
  "/api-keys/:id/regenerate",
  authenticate,
  async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId!;
      const apiKeyId = parseInt(req.params.id);
      const { expiresInDays } = req.body;

      if (isNaN(apiKeyId)) {
        return res.status(400).json({ error: "Invalid API key ID" });
      }

      // Validate expiresInDays if provided
      if (expiresInDays !== undefined) {
        if (
          typeof expiresInDays !== "number" ||
          expiresInDays < 1 ||
          expiresInDays > 365
        ) {
          return res
            .status(400)
            .json({ error: "expiresInDays must be between 1 and 365 days" });
        }
      }

      // Check if the API key belongs to the user
      const existingApiKey = await prisma.apiKey.findFirst({
        where: {
          id: apiKeyId,
          userId,
        },
      });

      if (!existingApiKey) {
        return res.status(404).json({ error: "API key not found" });
      }

      // Generate new API key
      const newKey = generateApiKey();
      const keyHash = hashApiKey(newKey);
      const keyPreview = createApiKeyPreview(newKey);

      // Calculate new expiration date if provided, otherwise keep existing
      let newExpiresAt = existingApiKey.expiresAt;
      if (expiresInDays !== undefined) {
        newExpiresAt = new Date();
        newExpiresAt.setDate(newExpiresAt.getDate() + expiresInDays);
      }

      // Update the API key with new values
      const updatedApiKey = await prisma.apiKey.update({
        where: { id: apiKeyId },
        data: {
          keyHash,
          keyPreview,
          expiresAt: newExpiresAt,
          isActive: true, // Reactivate when regenerating
          lastUsedAt: null, // Reset usage tracking
          updatedAt: new Date(),
        },
        select: {
          id: true,
          name: true,
          keyPreview: true,
          isActive: true,
          expiresAt: true,
          lastUsedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      res.json({
        message: "API key regenerated successfully",
        apiKey: {
          ...updatedApiKey,
          key: newKey, // Only returned once during regeneration
          status: !updatedApiKey.isActive
            ? "disabled"
            : updatedApiKey.expiresAt < new Date()
              ? "expired"
              : "active",
        },
        expirationUpdated: expiresInDays !== undefined,
      });
    } catch (error) {
      console.error("Regenerate API key error:", error);
      res.status(500).json({ error: "Failed to regenerate API key" });
    }
  },
);

export default router;
