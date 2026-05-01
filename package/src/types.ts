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
