/**
 * EPTA Auth Client - TypeScript client for EPTA Auth API
 * Provides interfaces and types for auth-related API responses
 */

export interface User {
  id: number;
  name: string;
  email: string;
  username: string;
  avatarUrl: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

export interface ApiKeyInfo {
  id: number;
  name: string;
  keyPreview: string;
  expiresAt: Date;
  isActive: boolean;
  lastUsedAt: Date | null;
  createdAt: Date;
}

export interface ApiKeyWithStatus extends ApiKeyInfo {
  status: "active" | "expired" | "disabled";
}

export interface ApiKeysListResponse {
  apiKeys: ApiKeyWithStatus[];
  total: number;
  active: number;
}

export interface CreateApiKeyResponse {
  message: string;
  apiKey: string;
  keyInfo: ApiKeyInfo;
  warning: string;
}

export interface ApiKeyActionResponse {
  message: string;
  apiKey?: ApiKeyWithStatus;
  deletedKey?: {
    id: number;
    name: string;
    keyPreview: string;
  };
  expirationUpdated?: boolean;
  key?: string;
  status?: "active" | "expired" | "disabled";
}

export interface UpdateTokenResponse {
  message: string;
  user: User;
}

export interface ErrorResponse {
  error: string;
  message?: string;
  statusCode?: number;
}

// Files API Types
export interface FileMetadata {
  buffer: Buffer;
  contentType: string;
  filename?: string;
}

export interface ShortUrlInfo {
  shortCode: string;
  originalUrl: string;
  clicks: number;
  createdAt: Date;
}

// Short URL API Types
export interface CreateShortUrlResponse {
  message: string;
  shortUrl: string;
  shortCode: string;
  originalUrl: string;
  createdAt?: Date;
}

export interface ShortUrlWithClicks extends CreateShortUrlResponse {
  clicks: number;
}

export interface MyShortUrlsResponse {
  count: number;
  urls: ShortUrlWithClicks[];
}

export interface DeleteShortUrlResponse {
  message: string;
}

// GitHub API Types
export interface GitHubUserInfo {
  username: string;
  name: string | null;
  email: string | null;
  bio: string | null;
  location: string | null;
  company: string | null;
  blog: string | null;
  twitter: string | null;
  avatarUrl: string;
  publicRepos: number;
  publicGists: number;
  followers: number;
  following: number;
  createdAt: string;
  updatedAt: string;
}
