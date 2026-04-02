import { Octokit } from "@octokit/rest";

/**
 * GitHub User Information Interface
 */
export interface GitHubUserInfo {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  created_at: string;
  updated_at: string;
}

/**
 * GitHub Token Verification Result
 */
export interface GitHubTokenVerification {
  isValid: boolean;
  user?: GitHubUserInfo;
  error?: string;
  statusCode?: number;
}

/**
 * Verifies if a GitHub Personal Token (GHP) is valid and can be used for API requests
 * @param ghp - GitHub Personal Token to verify
 * @returns Promise<GitHubTokenVerification> - Verification result with user info or error details
 */
export async function verifyGitHubToken(
  ghp: string,
): Promise<GitHubTokenVerification> {
  try {
    // Validate token format (basic check)
    if (!ghp || typeof ghp !== "string" || ghp.trim().length === 0) {
      return {
        isValid: false,
        error: "GitHub Personal Token is required and must be a non-empty string",
        statusCode: 400,
      };
    }

    // Initialize Octokit with the token
    const octokit = new Octokit({ auth: ghp });

    // Test the token by fetching authenticated user data
    try {
      const { data } = await octokit.rest.users.getAuthenticated();

      return {
        isValid: true,
        user: {
          id: data.id,
          login: data.login,
          name: data.name,
          email: data.email,
          avatar_url: data.avatar_url,
          bio: data.bio,
          public_repos: data.public_repos,
          followers: data.followers,
          following: data.following,
          created_at: data.created_at,
          updated_at: data.updated_at,
        },
      };
    } catch (error: any) {
      // Handle specific GitHub API errors
      if (error.status === 401) {
        return {
          isValid: false,
          error: "Invalid or expired GitHub Personal Token",
          statusCode: 401,
        };
      } else if (error.status === 403) {
        return {
          isValid: false,
          error:
            "GitHub token does not have required permissions or API rate limit exceeded",
          statusCode: 403,
        };
      } else if (error.status === 404) {
        return {
          isValid: false,
          error: "GitHub API endpoint not found",
          statusCode: 404,
        };
      } else {
        return {
          isValid: false,
          error: `GitHub API error: ${error.message || "Unknown error"}`,
          statusCode: error.status || 500,
        };
      }
    }
  } catch (error: any) {
    return {
      isValid: false,
      error: `Failed to verify GitHub token: ${error.message || "Unknown error"}`,
      statusCode: 500,
    };
  }
}

/**
 * Verifies a GitHub token and throws an error if invalid
 * Useful for middleware and request handlers
 * @param ghp - GitHub Personal Token to verify
 * @returns Promise<GitHubUserInfo> - GitHub user information
 * @throws Error with message and statusCode properties
 */
export async function verifyGitHubTokenOrThrow(
  ghp: string,
): Promise<GitHubUserInfo> {
  const verification = await verifyGitHubToken(ghp);

  if (!verification.isValid) {
    const error = new Error(verification.error) as any;
    error.statusCode = verification.statusCode || 401;
    throw error;
  }

  return verification.user!;
}

/**
 * Get Octokit instance for authenticated GitHub API requests
 * @param ghp - GitHub Personal Token
 * @returns Octokit - Authenticated Octokit instance
 */
export function getAuthenticatedOctokit(ghp: string): Octokit {
  return new Octokit({ auth: ghp });
}

/**
 * Check if a GitHub token is still valid without fetching full user data
 * Lightweight version for quick validation checks
 * @param ghp - GitHub Personal Token to verify
 * @returns Promise<boolean> - True if token is valid, false otherwise
 */
export async function isGitHubTokenValid(ghp: string): Promise<boolean> {
  try {
    if (!ghp || typeof ghp !== "string" || ghp.trim().length === 0) {
      return false;
    }

    const octokit = new Octokit({ auth: ghp });
    await octokit.rest.users.getAuthenticated();
    return true;
  } catch {
    return false;
  }
}

/**
 * Compare two GitHub usernames to verify token belongs to expected user
 * @param ghp - GitHub Personal Token to verify
 * @param expectedUsername - Expected GitHub username
 * @returns Promise<boolean> - True if token belongs to expected user
 */
export async function verifyGitHubTokenBelongsToUser(
  ghp: string,
  expectedUsername: string,
): Promise<boolean> {
  try {
    const verification = await verifyGitHubToken(ghp);
    if (!verification.isValid || !verification.user) {
      return false;
    }
    return (
      verification.user.login.toLowerCase() ===
      expectedUsername.toLowerCase()
    );
  } catch {
    return false;
  }
}
