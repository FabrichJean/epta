import axios, { AxiosInstance, AxiosError } from "axios";
import { GitHubUserInfo, ErrorResponse } from "./types";

/**
 * EPTA GitHub Client
 * A TypeScript client for GitHub-related API operations
 */
export class EptaGitHubClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  /**
   * Get GitHub user information from a GitHub Personal Token
   * @param ghp - GitHub Personal Token
   * @returns GitHubUserInfo with detailed user information
   */
  async getGitHubUserInfo(ghp: string): Promise<GitHubUserInfo> {
    try {
      const response = await this.client.post<GitHubUserInfo>(
        "/github/github-info",
        { ghp }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle and format API errors
   */
  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ErrorResponse>;
      const message =
        axiosError.response?.data?.error ||
        axiosError.response?.data?.message ||
        axiosError.message ||
        "Unknown error occurred";

      const customError = new Error(message);
      (customError as any).status = axiosError.response?.status;
      (customError as any).data = axiosError.response?.data;
      return customError;
    }

    return error instanceof Error ? error : new Error("Unknown error occurred");
  }
}

export default EptaGitHubClient;
