import { EptaAuthClient } from "./client";
import { EptaFilesClient } from "./filesClient";
import { EptaShortUrlClient } from "./shorturlClient";
import { EptaGitHubClient } from "./githubClient";
import { EptaProjectsClient } from "./projectsClient";
import axios from "axios";

/**
 * Configuration object for EptaApp
 */
interface EptaConfig {
  url: string;
  token?: string;
  apiKey?: string;
}

/**
 * EPTA App Configuration
 * Central configuration and client management for the EPTA API
 * Handles authentication and token injection for all clients
 */
export class EptaApp {
  private _url: string;
  private _token: string | null = null;
  private _apiKey: string | null = null;
  private _axiosInstance: any;
  private _interceptorId: number | null = null;

  // Client instances
  public auth: EptaAuthClient;
  public files: EptaFilesClient;
  public shortUrl: EptaShortUrlClient;
  public github: EptaGitHubClient;
  public projects: EptaProjectsClient;

  constructor(config: EptaConfig | string, token?: string, apiKey?: string) {
    // Handle both object config and individual parameters
    if (typeof config === "string") {
      // Legacy: new EptaApp(url, token?, apiKey?)
      this._url = config;
      this._token = token || null;
      this._apiKey = apiKey || null;
    } else {
      // New: new EptaApp({ url, token?, apiKey? })
      this._url = config.url;
      this._token = config.token || null;
      this._apiKey = config.apiKey || null;
    }

    // Create a centralized axios instance for all clients
    this._axiosInstance = axios.create({
      baseURL: this._url,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Setup request interceptor for this instance
    this.setupAxiosInterceptor();

    // Initialize all clients with the centralized axios instance
    this.auth = new EptaAuthClient(this._url, this._token || undefined);
    this.files = new EptaFilesClient(this._url, this._axiosInstance);
    this.shortUrl = new EptaShortUrlClient(this._url, this._axiosInstance);
    this.github = new EptaGitHubClient(this._url, this._axiosInstance);
    this.projects = new EptaProjectsClient(this._url, this._axiosInstance);
  }

  /**
   * Setup axios interceptor to inject token and apiKey into all requests
   */
  private setupAxiosInterceptor(): void {
    // Remove previous interceptor if it exists
    if (this._interceptorId !== null) {
      this._axiosInstance.interceptors.request.eject(this._interceptorId);
    }

    // Add new interceptor
    this._interceptorId = this._axiosInstance.interceptors.request.use((config: any) => {
      if (!config.headers) {
        config.headers = {};
      }

      // Add token if available
      if (this._token) {
        config.headers.Authorization = `Bearer ${this._token}`;
      }

      // Add API key if available
      if (this._apiKey) {
        config.headers["X-API-Key"] = this._apiKey;
      }

      return config;
    });
  }

  /**
   * Get the API base URL
   */
  getUrl(): string {
    return this._url;
  }

  /**
   * Set the API base URL
   */
  setUrl(url: string): void {
    this._url = url;
    // Recreate axios instance with new URL
    this._axiosInstance = axios.create({
      baseURL: url,
      headers: {
        "Content-Type": "application/json",
      },
    });
    this.setupAxiosInterceptor();
    
    // Update all clients with new axios instance
    this.auth = new EptaAuthClient(url, this._token || undefined);
    this.files = new EptaFilesClient(url, this._axiosInstance);
    this.shortUrl = new EptaShortUrlClient(url, this._axiosInstance);
    this.github = new EptaGitHubClient(url, this._axiosInstance);
    this.projects = new EptaProjectsClient(url, this._axiosInstance);
  }

  /**
   * Get the JWT token
   */
  getToken(): string | null {
    return this._token;
  }

  /**
   * Set the JWT token for all authenticated clients
   */
  setToken(token: string): void {
    this._token = token;
    this.auth.setToken(token);
    // Refresh interceptor to apply new token
    this.setupAxiosInterceptor();
  }

  /**
   * Clear the JWT token
   */
  clearToken(): void {
    this._token = null;
    this.auth.clearToken();
    // Refresh interceptor to remove token
    this.setupAxiosInterceptor();
  }

  /**
   * Get the API key
   */
  getApiKey(): string | null {
    return this._apiKey;
  }

  /**
   * Set the API key
   */
  setApiKey(apiKey: string): void {
    this._apiKey = apiKey;
    // Refresh interceptor to apply new API key
    this.setupAxiosInterceptor();
  }

  /**
   * Clear the API key
   */
  clearApiKey(): void {
    this._apiKey = null;
    // Refresh interceptor to remove API key
    this.setupAxiosInterceptor();
  }

  /**
   * Get all configuration
   */
  getConfig(): {
    url: string;
    token: string | null;
    apiKey: string | null;
  } {
    return {
      url: this._url,
      token: this._token,
      apiKey: this._apiKey,
    };
  }

  /**
   * Check if user is authenticated (has a token)
   */
  isAuthenticated(): boolean {
    return this._token !== null;
  }

  /**
   * Check if API key is set
   */
  hasApiKey(): boolean {
    return this._apiKey !== null;
  }

  /**
   * Reset all configuration and tokens
   */
  reset(): void {
    this._token = null;
    this._apiKey = null;
    this.auth.clearToken();
  }

  /**
   * Initialize from stored configuration (useful for restoring session)
   */
  static fromConfig(config: { url: string; token?: string; apiKey?: string }): EptaApp {
    return new EptaApp(config.url, config.token, config.apiKey);
  }

  /**
   * Export configuration to JSON (for storage)
   */
  toJSON(): {
    url: string;
    token: string | null;
    apiKey: string | null;
  } {
    return this.getConfig();
  }
}

export default EptaApp;
