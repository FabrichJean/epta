import { EptaAuthClient } from "./client";
import { EptaFilesClient } from "./filesClient";
import { EptaShortUrlClient } from "./shorturlClient";
import { EptaGitHubClient } from "./githubClient";
import { EptaProjectsClient } from "./projectsClient";
import axios from "axios";

/**
 * EPTA App Configuration
 * Central configuration and client management for the EPTA API
 * Handles authentication and token injection for all clients
 */
export class EptaApp {
  private _url: string;
  private _token: string | null = null;
  private _apiKey: string | null = null;

  // Client instances
  public auth: EptaAuthClient;
  public files: EptaFilesClient;
  public shortUrl: EptaShortUrlClient;
  public github: EptaGitHubClient;
  public projects: EptaProjectsClient;

  constructor(url: string, token?: string, apiKey?: string) {
    this._url = url;
    this._token = token || null;
    this._apiKey = apiKey || null;

    // Initialize all clients
    this.auth = new EptaAuthClient(url, token);
    this.files = new EptaFilesClient(url);
    this.shortUrl = new EptaShortUrlClient(url);
    this.github = new EptaGitHubClient(url);
    this.projects = new EptaProjectsClient(url);

    // Setup global interceptor for authenticated requests
    this.setupAxiosInterceptor();
  }

  /**
   * Setup axios interceptor to inject token into all requests
   */
  private setupAxiosInterceptor(): void {
    axios.interceptors.request.use((config: any) => {
      if (this._token) {
        config.headers.Authorization = `Bearer ${this._token}`;
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
    // Update all clients with new URL
    this.auth = new EptaAuthClient(url, this._token || undefined);
    this.files = new EptaFilesClient(url);
    this.shortUrl = new EptaShortUrlClient(url);
    this.github = new EptaGitHubClient(url);
    this.projects = new EptaProjectsClient(url);
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
  }

  /**
   * Clear the JWT token
   */
  clearToken(): void {
    this._token = null;
    this.auth.clearToken();
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
  }

  /**
   * Clear the API key
   */
  clearApiKey(): void {
    this._apiKey = null;
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
