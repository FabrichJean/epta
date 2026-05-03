# @epta/auth-client

A comprehensive TypeScript client library for interacting with the EPTA API. Provides type-safe methods for authentication, token management, API key operations, short URLs, and GitHub integration.

## Installation

```bash
npm install @epta/auth-client axios
```

## Usage

### Basic Setup

```typescript
import { 
  EptaAuthClient, 
  EptaShortUrlClient, 
  EptaGitHubClient 
} from "@epta/auth-client";

const authClient = new EptaAuthClient("http://localhost:3000/api");
const shortUrlClient = new EptaShortUrlClient("http://localhost:3000/api");
const githubClient = new EptaGitHubClient("http://localhost:3000/api");
```

### Authentication

#### Register a new user

```typescript
try {
  const response = await client.register("your_github_personal_token");
  console.log("User registered:", response.user);
  // Token is automatically stored
} catch (error) {
  console.error("Registration failed:", error.message);
}
```

#### Login

```typescript
try {
  const response = await client.login("your_github_personal_token");
  console.log("Login successful:", response.user);
  // Token is automatically stored
} catch (error) {
  console.error("Login failed:", error.message);
}
```

#### Get current user

```typescript
try {
  const user = await client.getCurrentUser();
  console.log("Current user:", user);
} catch (error) {
  console.error("Failed to fetch user:", error.message);
}
```

### Token Management

```typescript
// Set a token from local storage or previous session
client.setToken("your_jwt_token");

// Get the current token
const token = client.getToken();

// Clear the token
client.clearToken();
```

### Update GitHub Token

```typescript
try {
  const response = await client.updateGitHubToken("new_github_personal_token");
  console.log("GitHub token updated for:", response.user.username);
} catch (error) {
  console.error("Failed to update GitHub token:", error.message);
}
```

### API Key Management


```typescript
// Set a apikey from local storage or previous session
client.setApiKey("your_api_key");

// Get the current apikey
const apiKey = client.getApiKey();

// Clear the token
client.clearApiKey();
```

#### Create an API key

```typescript
try {
  const response = await client.createApiKey("My API Key", 30);
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
  const response = await client.getApiKeys();
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
  const response = await client.toggleApiKey(1);
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
  const response = await client.regenerateApiKey(1);
  console.log("New API key:", response.key);

  // Or regenerate with new expiration
  const response2 = await client.regenerateApiKey(1, 60);
  console.log("API key regenerated for 60 more days");
} catch (error) {
  console.error("Failed to regenerate API key:", error.message);
}
```

#### Delete an API key

```typescript
try {
  const response = await client.deleteApiKey(1);
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
import { EptaFilesClient } from "@epta/auth-client";

const filesClient = new EptaFilesClient("http://localhost:3000/api");
```

### Get File

#### Get file as Buffer (Node.js)

```typescript
try {
  const buffer = await filesClient.getFile("short-code-123");
  console.log("File size:", buffer.length, "bytes");
} catch (error) {
  console.error("Failed to get file:", error.message);
}
```

#### Get file with metadata

```typescript
try {
  const { buffer, contentType, filename } = 
    await filesClient.getFileWithMetadata("short-code-123");
  console.log("Content Type:", contentType);
  console.log("Filename:", filename);
} catch (error) {
  console.error("Failed to get file:", error.message);
}
```

#### Get file as Blob (Browser)

```typescript
try {
  const blob = await filesClient.getFileAsBlob("short-code-123");
  console.log("Blob size:", blob.size);
  console.log("Blob type:", blob.type);
} catch (error) {
  console.error("Failed to get file:", error.message);
}
```

#### Get file as Data URL (Browser - Images, etc.)

```typescript
try {
  const dataUrl = await filesClient.getFileAsDataUrl("short-code-123");
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
  await filesClient.downloadFile("short-code-123", "./downloaded-file.pdf");
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
  const response = await shortUrlClient.shortenUrl("https://github.com/very-long-url");
  console.log("Short URL created:", response.shortUrl);
  console.log("Short code:", response.shortCode);
} catch (error) {
  console.error("Failed to create short URL:", error.message);
}
```

#### Get all your short URLs

```typescript
try {
  const response = await shortUrlClient.getMyShortUrls();
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
  const response = await shortUrlClient.deleteShortUrl("abc123");
  console.log("Short URL deleted:", response.message);
} catch (error) {
  console.error("Failed to delete short URL:", error.message);
}
```

### GitHub Integration

#### Get GitHub user information

```typescript
try {
  const userInfo = await githubClient.getGitHubUserInfo("your_github_personal_token");
  console.log("GitHub username:", userInfo.username);
  console.log("Followers:", userInfo.followers);
  console.log("Public repos:", userInfo.publicRepos);
} catch (error) {
  console.error("Failed to fetch GitHub info:", error.message);
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
} from "@epta/auth-client";
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

## Requirements

- Node.js >= 14
- TypeScript >= 4.0 (for development)

## License

ISC
