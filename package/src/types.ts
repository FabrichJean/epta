/**
 * EPTA Auth Client - TypeScript client for EPTA Auth API
 * Provides interfaces and types for auth-related API responses
 */

/**
 * Configuration object for EptaApp
 */
export interface EptaConfig {
  url: string;
  token?: string;
  apiKey?: string;
}

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

// Projects API Types
export interface ProjectMetadata {
  fullName?: string;
  defaultBranch?: string;
  language?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Project {
  id: number;
  name: string;
  link: string;
  description: string | null;
  isPrivate: boolean;
  metadata: ProjectMetadata;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: number;
    name: string;
    username: string;
  };
}

export interface CreateProjectResponse {
  message: string;
  project: Project;
}

export interface GetProjectsResponse {
  projects: Project[];
}

export interface FileContent {
  type: "file" | "dir";
  name: string;
  path: string;
  size?: number;
  sha?: string;
  url?: string;
  downloadUrl?: string;
  publicUrl?: string | null;
  shortCode?: string;
  encoding?: string;
  isStarred?: boolean;
  contents?: FileContent[];
}

export interface GetContentsResponse {
  type: "file" | "dir";
  name?: string;
  path: string;
  size?: number;
  sha?: string;
  url?: string;
  downloadUrl?: string;
  publicUrl?: string | null;
  shortCode?: string;
  encoding?: string;
  isStarred?: boolean;
  contents?: FileContent[];
}

export interface CreateFileResponse {
  message: string;
  file: {
    path: string;
    size: number;
    sha?: string;
    url?: string;
    publicUrl: string;
    downloadUrl: string;
    originalDownloadUrl?: string;
    commit?: {
      sha?: string;
      message?: string;
      url?: string;
    };
  };
}

export interface CreateFolderResponse {
  message: string;
  folder: {
    path: string;
    file: {
      path?: string;
      sha?: string;
      url?: string;
    };
    commit?: {
      sha?: string;
      message?: string;
      url?: string;
    };
  };
}

export interface UploadFileResponse {
  message: string;
  file: {
    name: string;
    path: string;
    size: number;
    sha?: string;
    url?: string;
    publicUrl: string;
    downloadUrl: string;
    originalDownloadUrl?: string;
  };
}

export interface StarredFile {
  id: number;
  path: string;
  userId: number;
  projectId: number;
  createdAt: Date;
  project: {
    id: number;
    name: string;
    metadata: ProjectMetadata;
    user: {
      username: string;
    };
  };
  fileDetails?: {
    name: string;
    size: number;
    sha: string;
    url: string;
    downloadUrl: string;
    publicUrl: string;
    shortCode: string;
  };
}

export interface GetStarredFilesResponse {
  count: number;
  stareds: StarredFile[];
}

export interface StarFileResponse {
  message: string;
  stared: {
    id: number;
    path: string;
    userId: number;
    projectId: number;
    createdAt: Date;
  };
}

export interface UnstarFileResponse {
  message: string;
}

export interface UpdateProjectResponse {
  message: string;
  project: Project;
}

export interface DeleteProjectResponse {
  message: string;
}

