# @epta/client

A comprehensive TypeScript client library for interacting with the EPTA API. Provides type-safe methods for authentication, token management, API key operations, short URLs, and GitHub integration.

## Installation

```bash
npm install @epta/client axios
```

## Usage

### Basic Setup - Using EptaApp (Recommended)

```typescript
import { EptaApp } from "@epta/client";

// Initialize the app with configuration
const app = new EptaApp("http://localhost:3000/api");

// Set token after authentication
app.setToken("your_jwt_token");

// Or: Set API key
app.setApiKey("your_api_key");

// Access all clients through the app
const user = await app.auth.getCurrentUser();
const projects = await app.projects.getProjects();
const shortUrl = await app.shortUrl.shortenUrl("https://example.com");
```

### Alternative: Initialize with Existing Credentials

You can initialize with token, API key, or both using either individual parameters or a configuration object:

**Using individual parameters:**
```typescript
import { EptaApp } from "@epta/client";

// With JWT token only
const app = new EptaApp("http://localhost:3000/api", "your_jwt_token");

// With API key only
const app2 = new EptaApp("http://localhost:3000/api", undefined, "your_api_key");

// With both token and API key
const app3 = new EptaApp(
  "http://localhost:3000/api",
  "your_jwt_token",
  "your_api_key"
);
```

**Using a configuration object (Recommended):**
```typescript
import { EptaApp } from "@epta/client";

// With JWT token only
const app = new EptaApp({
  url: "http://localhost:3000/api",
  token: "your_jwt_token"
});

// With API key only
const app2 = new EptaApp({
  url: "http://localhost:3000/api",
  apiKey: "your_api_key"
});

// With both token and API key
const app3 = new EptaApp({
  url: "http://localhost:3000/api",
  token: "your_jwt_token",
  apiKey: "your_api_key"
});
```

Ready to use immediately:
```typescript
const currentUser = await app.auth.getCurrentUser();
```

### Managing Configuration

```typescript
// Get current configuration
const config = app.getConfig();
console.log(config); // { url, token, apiKey }

// Check authentication status
if (app.isAuthenticated()) {
  console.log("User is authenticated");
}

// Check if API key is set
if (app.hasApiKey()) {
  console.log("API key is available");
}

// Update URL
app.setUrl("http://new-api-url.com");

// Update token
app.setToken("new_token");

// Update API key
app.setApiKey("new_api_key");

// Reset everything
app.reset();
```

### Persist Configuration (localStorage example)

```typescript
// Save configuration
localStorage.setItem("epta-config", JSON.stringify(app.toJSON()));

// Restore from saved configuration
const savedConfig = JSON.parse(localStorage.getItem("epta-config") || "{}");
const restoredApp = EptaApp.fromConfig(savedConfig);
```

### Alternative: Individual Clients

Most clients should be used through `EptaApp`. However, you can use individual clients directly:

**Authenticated Clients (require JWT token from EptaApp):**
```typescript
import { EptaAuthClient } from "@epta/client";

const authClient = new EptaAuthClient("http://localhost:3000/api");
await authClient.register("ghp_token");
await authClient.login("ghp_token");
```

**Public Client (GitHub operations without JWT authentication):**
```typescript
import { EptaGitHubClient } from "@epta/client";

const githubClient = new EptaGitHubClient("http://localhost:3000/api");
// Get GitHub info before registering/logging in
const userInfo = await githubClient.getGitHubUserInfo("ghp_token");
```

Note: `EptaShortUrlClient` and `EptaProjectsClient` are designed to be used through `EptaApp` since they require authentication.

### Authentication

#### Register a new user

```typescript
try {
  const response = await app.auth.register("your_github_personal_token");
  console.log("User registered:", response.user);
  // Token is automatically stored
} catch (error) {
  console.error("Registration failed:", error.message);
}
```

#### Login

```typescript
try {
  const response = await app.auth.login("your_github_personal_token");
  console.log("Login successful:", response.user);
  // Token is automatically stored in app
} catch (error) {
  console.error("Login failed:", error.message);
}
```

#### Get current user

```typescript
try {
  const user = await app.auth.getCurrentUser();
  console.log("Current user:", user);
} catch (error) {
  console.error("Failed to fetch user:", error.message);
}
```

### Token Management

```typescript
// Set a token from local storage or previous session
app.setToken("your_jwt_token");

// Get the current token
const token = app.getToken();

// Clear the token
app.clearToken();
```

### Update GitHub Token

```typescript
try {
  const response = await app.auth.updateGitHubToken("new_github_personal_token");
  console.log("GitHub token updated for:", response.user.username);
} catch (error) {
  console.error("Failed to update GitHub token:", error.message);
}
```

### API Key Management

```typescript
// Set an API key
app.setApiKey("your_api_key");

// Get the current API key
const apiKey = app.getApiKey();

// Clear the API key
app.clearApiKey();
```

#### Create an API key

```typescript
try {
  const response = await app.auth.createApiKey("My API Key", 30);
  console.log("API Key created:", response.apiKey);
  console.log("Key preview:", response.keyInfo.keyPreview);
  console.log("Save this key now:", response.warning);
} catch (error) {
  console.error("Failed to create API key:", error.message);
}
```

#### Get all API keys

```typescript
try {
  const response = await app.auth.getApiKeys();
  console.log("Total API keys:", response.total);
  console.log("Active keys:", response.active);
  console.log("All keys:", response.apiKeys);

  // Keys have status: 'active', 'expired', or 'disabled'
  response.apiKeys.forEach((key) => {
    console.log(`${key.name} - ${key.status}`);
  });
} catch (error) {
  console.error("Failed to fetch API keys:", error.message);
}
```

#### Toggle an API key (enable/disable)

```typescript
try {
  const response = await app.auth.toggleApiKey(1);
  console.log(
    "API key is now:",
    response.apiKey?.status === "active" ? "enabled" : "disabled"
  );
} catch (error) {
  console.error("Failed to toggle API key:", error.message);
}
```

#### Regenerate an API key

```typescript
try {
  // Regenerate with same expiration
  const response = await app.auth.regenerateApiKey(1);
  console.log("New API key:", response.key);

  // Or regenerate with new expiration
  const response2 = await app.auth.regenerateApiKey(1, 60);
  console.log("API key regenerated for 60 more days");
} catch (error) {
  console.error("Failed to regenerate API key:", error.message);
}
```

#### Delete an API key

```typescript
try {
  const response = await app.auth.deleteApiKey(1);
  console.log(
    `API key "${response.deletedKey?.name}" has been deleted`
  );
} catch (error) {
  console.error("Failed to delete API key:", error.message);
}
```

## Files API

### Basic Setup

```typescript
import { EptaApp } from "@epta/client";

const app = new EptaApp("http://localhost:3000/api");
```

### Get File

#### Get file as Buffer (Node.js)

```typescript
try {
  const buffer = await app.files.getFile("short-code-123");
  console.log("File size:", buffer.length, "bytes");
} catch (error) {
  console.error("Failed to get file:", error.message);
}
```

#### Get file with metadata

```typescript
try {
  const { buffer, contentType, filename } = 
    await app.files.getFileWithMetadata("short-code-123");
  console.log("Content Type:", contentType);
  console.log("Filename:", filename);
} catch (error) {
  console.error("Failed to get file:", error.message);
}
```

#### Get file as Blob (Browser)

```typescript
try {
  const blob = await app.files.getFileAsBlob("short-code-123");
  console.log("Blob size:", blob.size);
  console.log("Blob type:", blob.type);
} catch (error) {
  console.error("Failed to get file:", error.message);
}
```

#### Get file as Data URL (Browser - Images, etc.)

```typescript
try {
  const dataUrl = await app.files.getFileAsDataUrl("short-code-123");
  // Use in <img> tag
  const img = document.createElement("img");
  img.src = dataUrl;
  document.body.appendChild(img);
} catch (error) {
  console.error("Failed to get file:", error.message);
}
```

#### Download file (Node.js)

```typescript
try {
  await app.files.downloadFile("short-code-123", "./downloaded-file.pdf");
  console.log("File downloaded successfully");
} catch (error) {
  console.error("Failed to download file:", error.message);
}
```

## Error Handling

All methods return promises and throw errors with descriptive messages:

```typescript
try {
  await client.login("invalid_token");
} catch (error) {
  if (error instanceof Error) {
    console.error("Error message:", error.message);
    console.error("Status:", (error as any).status);
    console.error("Response data:", (error as any).data);
  }
}
```

### Short URL Management

#### Create a short URL

```typescript
try {
  const response = await app.shortUrl.shortenUrl("https://github.com/very-long-url");
  console.log("Short URL created:", response.shortUrl);
  console.log("Short code:", response.shortCode);
} catch (error) {
  console.error("Failed to create short URL:", error.message);
}
```

#### Get all your short URLs

```typescript
try {
  const response = await app.shortUrl.getMyShortUrls();
  console.log("Total short URLs:", response.count);
  response.urls.forEach(url => {
    console.log(`${url.shortCode}: ${url.originalUrl} (${url.clicks} clicks)`);
  });
} catch (error) {
  console.error("Failed to fetch short URLs:", error.message);
}
```

#### Delete a short URL

```typescript
try {
  const response = await app.shortUrl.deleteShortUrl("abc123");
  console.log("Short URL deleted:", response.message);
} catch (error) {
  console.error("Failed to delete short URL:", error.message);
}
```

### GitHub Integration

#### Verify GitHub account before registration

You can verify a GitHub account before registering to EPTA:

```typescript
import { EptaGitHubClient } from "@epta/client";

// Create a standalone GitHub client (no authentication needed)
const githubClient = new EptaGitHubClient("http://localhost:3000/api");

try {
  // Verify the GitHub token is valid
  const userInfo = await githubClient.getGitHubUserInfo("your_github_personal_token");
  console.log("GitHub username:", userInfo.username);
  console.log("Followers:", userInfo.followers);
  console.log("Public repos:", userInfo.publicRepos);
  
  // Then register with the same token
  const app = new EptaApp("http://localhost:3000/api");
  const registerResult = await app.auth.register("your_github_personal_token");
  app.setToken(registerResult.token);
} catch (error) {
  console.error("GitHub verification failed:", error.message);
}
```

#### Get GitHub user information via EptaApp

```typescript
try {
  const userInfo = await app.github.getGitHubUserInfo("your_github_personal_token");
  console.log("GitHub username:", userInfo.username);
  console.log("Followers:", userInfo.followers);
  console.log("Public repos:", userInfo.publicRepos);
} catch (error) {
  console.error("Failed to fetch GitHub info:", error.message);
}
```

### Projects Management

#### Create a new project

```typescript
try {
  const response = await app.projects.createProject(
    "My Project",
    "A sample project description"
  );
  console.log("Project created:", response.project.name);
  console.log("GitHub repository:", response.project.link);
} catch (error) {
  console.error("Failed to create project:", error.message);
}
```

#### Get all projects

```typescript
try {
  const response = await app.projects.getProjects();
  response.projects.forEach(project => {
    console.log(`${project.name} - ${project.link}`);
  });
} catch (error) {
  console.error("Failed to fetch projects:", error.message);
}
```

#### Get project contents

```typescript
try {
  // Get root directory
  const root = await app.projects.getContents(projectId);
  console.log("Files in root:", root.contents);

  // Get specific directory
  const src = await app.projects.getContents(projectId, "src");
  console.log("Files in src:", src.contents);
} catch (error) {
  console.error("Failed to fetch contents:", error.message);
}
```

#### Create or update a file

```typescript
try {
  const response = await app.projects.createFile(
    projectId,
    "src/index.ts",
    "export const hello = 'world';",
    "Initial commit"
  );
  console.log("File created:", response.file.path);
  console.log("Public URL:", response.file.publicUrl);
} catch (error) {
  console.error("Failed to create file:", error.message);
}
```

#### Update file content

```typescript
try {
  const response = await app.projects.updateFile(
    projectId,
    "src/index.ts",
    "export const hello = 'updated';",
    "Update index"
  );
  console.log("File updated:", response.file.path);
} catch (error) {
  console.error("Failed to update file:", error.message);
}
```

#### Create a folder

```typescript
try {
  const response = await app.projects.createFolder(
    projectId,
    "src/components",
    "Create components folder"
  );
  console.log("Folder created:", response.folder.path);
} catch (error) {
  console.error("Failed to create folder:", error.message);
}
```

#### Upload a file

```typescript
try {
  // In browser context
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  const file = fileInput.files?.[0];

  if (file) {
    const response = await app.projects.uploadFile(
      projectId,
      file,
      `images/${file.name}`
    );
    console.log("File uploaded:", response.file.path);
    console.log("Public URL:", response.file.publicUrl);
  }
} catch (error) {
  console.error("Failed to upload file:", error.message);
}
```

#### Star a file

```typescript
try {
  const response = await app.projects.starFile(projectId, "src/index.ts");
  console.log("File starred successfully");
} catch (error) {
  console.error("Failed to star file:", error.message);
}
```

#### Check if file is starred

```typescript
try {
  const { isStarred } = await app.projects.checkIsStarred(projectId, "src/index.ts");
  console.log("File is starred:", isStarred);
} catch (error) {
  console.error("Failed to check starred status:", error.message);
}
```

#### Get all starred files

```typescript
try {
  const response = await app.projects.getStarredFiles();
  console.log("Total starred files:", response.count);
  response.stareds.forEach(starred => {
    console.log(`${starred.path} in ${starred.project.name}`);
  });
} catch (error) {
  console.error("Failed to fetch starred files:", error.message);
}
```

#### Unstar a file

```typescript
try {
  const response = await app.projects.unstarFile(projectId, "src/index.ts");
  console.log("File unstarred successfully");
} catch (error) {
  console.error("Failed to unstar file:", error.message);
}
```

#### Update a project

```typescript
try {
  const response = await app.projects.updateProject(
    projectId,
    "Updated Project Name",
    "Updated description"
  );
  console.log("Project updated:", response.project.name);
} catch (error) {
  console.error("Failed to update project:", error.message);
}
```

#### Delete a project

```typescript
try {
  // Delete only from database
  await app.projects.deleteProject(projectId);

  // Or delete from both database and GitHub
  await app.projects.deleteProject(projectId, true);
  console.log("Project deleted successfully");
} catch (error) {
  console.error("Failed to delete project:", error.message);
}
```

## Types

The package exports TypeScript types for all API responses:

```typescript
import type {
  User,
  AuthResponse,
  ApiKeyInfo,
  ApiKeyWithStatus,
  ApiKeysListResponse,
  CreateApiKeyResponse,
  ApiKeyActionResponse,
  UpdateTokenResponse,
  ErrorResponse,
  CreateShortUrlResponse,
  ShortUrlWithClicks,
  MyShortUrlsResponse,
  DeleteShortUrlResponse,
  GitHubUserInfo,
  Project,
  CreateProjectResponse,
  GetProjectsResponse,
  GetContentsResponse,
  CreateFileResponse,
  CreateFolderResponse,
  UploadFileResponse,
  GetStarredFilesResponse,
  StarFileResponse,
  UnstarFileResponse,
  UpdateProjectResponse,
  DeleteProjectResponse,
} from "@epta/client";
```

## API Endpoints

### Authentication

- `POST /auth/register` - Register with GitHub Personal Token
- `POST /auth/login` - Login with GitHub Personal Token
- `GET /auth` - Get current user (requires authentication)
- `PUT /auth/update-token` - Update GitHub token

### API Keys

- `POST /auth/api-keys` - Create a new API key
- `GET /auth/api-keys` - Get all API keys
- `PATCH /auth/api-keys/:id/toggle` - Enable/disable an API key
- `PATCH /auth/api-keys/:id/regenerate` - Regenerate an API key
- `DELETE /auth/api-keys/:id` - Delete an API key

### Short URLs

- `POST /s/shorten` - Create a short URL (requires authentication)
- `GET /s/my-urls` - Get all user's short URLs (requires authentication)
- `DELETE /s/:shortCode` - Delete a short URL (requires authentication)
- `GET /s/:shortCode` - Redirect to original URL (public)

### GitHub

- `POST /github/github-info` - Get GitHub user information from token

### Projects

- `POST /projects` - Create a new project (requires authentication)
- `GET /projects` - Get all projects (requires authentication)
- `GET /projects/:id` - Get a single project (requires authentication)
- `GET /projects/:id/contents/*` - Get contents of a path (requires authentication)
- `POST /projects/:id/contents/*` - Create/update a file (requires authentication)
- `PUT /projects/:id/contents/*` - Update a file (requires authentication)
- `POST /projects/:id/folders/*` - Create a folder (requires authentication)
- `POST /projects/:projectId/upload` - Upload a file (requires authentication)
- `GET /projects/starred/list` - Get all starred files (requires authentication)
- `GET /projects/starred/check/:projectId/:path` - Check if file is starred (requires authentication)
- `POST /projects/starred/:projectId` - Star a file (requires authentication)
- `DELETE /projects/starred/:projectId` - Unstar a file (requires authentication)
- `PUT /projects/:id` - Update a project (requires authentication)
- `DELETE /projects/:id` - Delete a project (requires authentication)

## Requirements

- Node.js >= 14
- TypeScript >= 4.0 (for development)

## License

ISC
