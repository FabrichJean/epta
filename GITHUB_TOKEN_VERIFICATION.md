# GitHub Token Verification Utility

A comprehensive utility module for verifying and managing GitHub Personal Tokens (GHP) across all API requests.

## File Location
`src/utils/github.ts`

## Functions

### 1. `verifyGitHubToken(ghp: string): Promise<GitHubTokenVerification>`

**Purpose**: Verify a GitHub Personal Token and retrieve user information.

**Parameters**:
- `ghp` (string): GitHub Personal Token to verify

**Returns**: Promise resolving to `GitHubTokenVerification` object:
```typescript
{
  isValid: boolean;           // Whether token is valid
  user?: GitHubUserInfo;      // GitHub user data (if valid)
  error?: string;             // Error message (if invalid)
  statusCode?: number;        // HTTP status code for error
}
```

**Usage Example**:
```typescript
import { verifyGitHubToken } from "../utils/github";

const verification = await verifyGitHubToken(ghp);

if (!verification.isValid) {
  return res.status(verification.statusCode || 401).json({
    error: verification.error,
  });
}

const githubUser = verification.user!;
// Use githubUser.login, githubUser.name, etc.
```

**Error Cases**:
- 400: Missing or invalid token format
- 401: Invalid or expired token
- 403: Token lacks required permissions or rate limit exceeded
- 404: GitHub API endpoint not found
- 500: Network or server error

---

### 2. `verifyGitHubTokenOrThrow(ghp: string): Promise<GitHubUserInfo>`

**Purpose**: Verify token and throw error if invalid (useful for middleware).

**Parameters**:
- `ghp` (string): GitHub Personal Token to verify

**Returns**: Promise resolving to `GitHubUserInfo` if valid

**Throws**: Error with `statusCode` property for HTTP status

**Usage Example**:
```typescript
import { verifyGitHubTokenOrThrow } from "../utils/github";

try {
  const githubUser = await verifyGitHubTokenOrThrow(ghp);
  // Use githubUser directly
} catch (error: any) {
  return res.status(error.statusCode || 401).json({
    error: error.message,
  });
}
```

---

### 3. `getAuthenticatedOctokit(ghp: string): Octokit`

**Purpose**: Get an authenticated Octokit instance for GitHub API requests.

**Parameters**:
- `ghp` (string): GitHub Personal Token

**Returns**: Octokit instance ready for API requests

**Usage Example**:
```typescript
import { getAuthenticatedOctokit } from "../utils/github";

const octokit = getAuthenticatedOctokit(ghp);
const { data: repos } = await octokit.rest.repos.listForAuthenticatedUser();
```

---

### 4. `isGitHubTokenValid(ghp: string): Promise<boolean>`

**Purpose**: Quick lightweight validation check without fetching full user data.

**Parameters**:
- `ghp` (string): GitHub Personal Token to check

**Returns**: Promise<boolean> - true if valid, false otherwise

**Usage Example**:
```typescript
import { isGitHubTokenValid } from "../utils/github";

const isValid = await isGitHubTokenValid(ghp);
if (!isValid) {
  return res.status(401).json({ error: "Invalid token" });
}
```

---

### 5. `verifyGitHubTokenBelongsToUser(ghp: string, expectedUsername: string): Promise<boolean>`

**Purpose**: Verify that a token belongs to a specific GitHub user.

**Parameters**:
- `ghp` (string): GitHub Personal Token to verify
- `expectedUsername` (string): Expected GitHub username

**Returns**: Promise<boolean> - true if token matches user

**Usage Example**:
```typescript
import { verifyGitHubTokenBelongsToUser } from "../utils/github";

const belongs = await verifyGitHubTokenBelongsToUser(ghp, currentUser.username);
if (!belongs) {
  return res.status(403).json({
    error: "Token does not belong to your GitHub account",
  });
}
```

---

## Type Definitions

### GitHubUserInfo
```typescript
interface GitHubUserInfo {
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
```

### GitHubTokenVerification
```typescript
interface GitHubTokenVerification {
  isValid: boolean;
  user?: GitHubUserInfo;
  error?: string;
  statusCode?: number;
}
```

---

## Integration with Auth Routes

The utility is already integrated into the auth routes:

### register endpoint
- Uses `verifyGitHubToken()` to validate token
- Returns appropriate error with status code
- Creates user with verified GitHub data

### login endpoint
- Uses `verifyGitHubToken()` to validate token
- Returns appropriate error with status code
- Updates user's encrypted GitHub token

### update-token endpoint
- Uses `verifyGitHubToken()` to validate new token
- Checks token belongs to same GitHub account
- Updates user's encrypted GitHub token

---

## Best Practices

1. **Always validate before storing**: Always verify token before encrypting and storing
2. **Use appropriate function**: 
   - Use `verifyGitHubToken()` for full control over error handling
   - Use `verifyGitHubTokenOrThrow()` for middleware/routes that throw
   - Use `isGitHubTokenValid()` for quick checks
3. **Error handling**: Always check `statusCode` for appropriate HTTP response
4. **Rate limiting**: GitHub API has rate limits; consider caching validation results for short periods
5. **Security**: Never log or expose the full token; use keyPreview instead

---

## Error Response Examples

### Invalid Token
```json
{
  "error": "Invalid or expired GitHub Personal Token",
  "statusCode": 401
}
```

### Token Mismatch
```json
{
  "error": "Token mismatch",
  "message": "This token belongs to @other-user but you are logged in as @current-user",
  "statusCode": 403
}
```

### Rate Limited
```json
{
  "error": "GitHub token does not have required permissions or API rate limit exceeded",
  "statusCode": 403
}
```

---

## Testing

To test token verification in the playground:

1. Register with a valid GitHub Personal Token (ghp_xxxx)
2. Login with the same token
3. Update token with a different valid token
4. Try with an invalid token to see error handling

All endpoints now use centralized verification with consistent error responses.
