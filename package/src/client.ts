import axios, { AxiosInstance, AxiosError } from "axios";
import {
  User,
  AuthResponse,
  ApiKeysListResponse,
  CreateApiKeyResponse,
  ApiKeyActionResponse,
  UpdateTokenResponse,
  ErrorResponse,
} from "./types";

/**
 * EPTA Auth Client
 * A TypeScript client for interacting with the EPTA Auth API
 */
export class EptaAuthClient {
  private client: AxiosInstance;
  private token: string | null = null;
  private apiKey: string | null = null;

  constructor(baseURL: string, token?: string, apiKey?: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (token) {
      this.setToken(token);
    }
    if (apiKey) {
        this.setApiKey(apiKey);
    }

    // Add interceptor to include token in all requests
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      if (this.apiKey) {
        config.headers['x-api-key'] = this.apiKey;
      }
      return config;
    });
  }

  /**
   * Set or update the JWT token
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Set or update the APikey
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
  }

  /**
   * Get the current apiKey
   */
  getApiKey(): string | null {
    return this.apiKey;
  }

  /**
   * Clear the stored apiKey
   */
  clearApiKey(): void {
    this.apiKey = null;
  }

   /**
   * Get the current token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Clear the stored token
   */
  clearToken(): void {
    this.token = null;
  }

  /**
   * Register a new user with GitHub Personal Token
   * @param ghp - GitHub Personal Token
   * @returns AuthResponse with user data and JWT token
   */
  async register(ghp: string): Promise<AuthResponse> {
    try {
      const response = await this.client.post<AuthResponse>("/auth/register", {
        ghp,
      });
      this.setToken(response.data.token);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Login with GitHub Personal Token
   * @param ghp - GitHub Personal Token
   * @returns AuthResponse with user data and JWT token
   */
  async login(ghp: string): Promise<AuthResponse> {
    try {
      const response = await this.client.post<AuthResponse>("/auth/login", {
        ghp,
      });
      this.setToken(response.data.token);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get current authenticated user information
   * Requires valid JWT token
   * @returns User data
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await this.client.get<User>("/auth");
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update GitHub Personal Token
   * @param ghp - New GitHub Personal Token
   * @returns UpdateTokenResponse with updated user data
   */
  async updateGitHubToken(ghp: string): Promise<UpdateTokenResponse> {
    try {
      const response = await this.client.put<UpdateTokenResponse>(
        "/auth/update-token",
        { ghp }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Create a new API key
   * @param name - Name for the API key
   * @param expiresInDays - Number of days before the key expires (1-365)
   * @returns CreateApiKeyResponse with the generated key (only returned once)
   */
  async createApiKey(
    name: string,
    expiresInDays: number
  ): Promise<CreateApiKeyResponse> {
    try {
      const response = await this.client.post<CreateApiKeyResponse>(
        "/auth/api-keys",
        {
          name,
          expiresInDays,
        }
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get all API keys for the current user
   * @returns ApiKeysListResponse with all API keys and metadata
   */
  async getApiKeys(): Promise<ApiKeysListResponse> {
    try {
      const response = await this.client.get<ApiKeysListResponse>(
        "/auth/api-keys"
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete an API key
   * @param keyId - ID of the API key to delete
   * @returns ApiKeyActionResponse with deletion confirmation
   */
  async deleteApiKey(keyId: number): Promise<ApiKeyActionResponse> {
    try {
      const response = await this.client.delete<ApiKeyActionResponse>(
        `/auth/api-keys/${keyId}`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Enable or disable an API key
   * @param keyId - ID of the API key to toggle
   * @returns ApiKeyActionResponse with updated key status
   */
  async toggleApiKey(keyId: number): Promise<ApiKeyActionResponse> {
    try {
      const response = await this.client.patch<ApiKeyActionResponse>(
        `/auth/api-keys/${keyId}/toggle`
      );
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Regenerate an API key
   * @param keyId - ID of the API key to regenerate
   * @param expiresInDays - Optional: New expiration period (1-365 days)
   * @returns ApiKeyActionResponse with the new API key
   */
  async regenerateApiKey(
    keyId: number,
    expiresInDays?: number
  ): Promise<ApiKeyActionResponse> {
    try {
      const response = await this.client.patch<ApiKeyActionResponse>(
        `/auth/api-keys/${keyId}/regenerate`,
        expiresInDays !== undefined ? { expiresInDays } : {}
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

export default EptaAuthClient;
