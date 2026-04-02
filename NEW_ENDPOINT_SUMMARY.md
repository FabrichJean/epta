# New Endpoint: POST /projects/:id/contents/*

## Summary

A new endpoint has been added to support creating and updating files with direct text content, providing a simpler alternative to multipart form-data file uploads.

## Endpoint Details

### Route
```
POST /projects/:id/contents/*
```

### Authentication
Required - JWT Bearer token in Authorization header

### Request Body
```json
{
  "content": "file content as string",
  "message": "Optional commit message"
}
```

### Request Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `:id` | integer | Project ID |
| `*` (path) | string | File path in repository (e.g., `src/app.js`, `docs/readme.md`) |
| `content` | string | File content (required) |
| `message` | string | Commit message (optional, defaults to "Create/update {path}") |

### Response (201 Created)
```json
{
  "message": "File created/updated successfully",
  "file": {
    "path": "src/app.js",
    "size": 256,
    "sha": "abc123...",
    "url": "https://github.com/user/repo/blob/main/src/app.js",
    "publicUrl": "http://localhost:4000/f/abc123",
    "downloadUrl": "http://localhost:4000/s/abc123",
    "originalDownloadUrl": "https://raw.githubusercontent.com/...",
    "commit": {
      "sha": "def456...",
      "message": "Create/update src/app.js",
      "url": "https://github.com/user/repo/commit/def456..."
    }
  }
}
```

## Usage Examples

### cURL
```bash
curl -X POST http://localhost:4000/projects/6/contents/src/app.js \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "console.log(\"Hello World\");",
    "message": "Initial app setup"
  }'
```

### JavaScript (Fetch)
```javascript
const fileContent = `console.log("Hello World");`;

fetch('http://localhost:4000/projects/6/contents/src/app.js', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    content: fileContent,
    message: 'Initial app setup'
  })
})
.then(res => res.json())
.then(data => {
  console.log('File created:', data.file.path);
  console.log('Public URL:', data.file.publicUrl);
})
```

### Node.js (axios)
```javascript
const axios = require('axios');

const content = `function greet(name) {
  return \`Hello, \${name}!\`;
}

module.exports = { greet };`;

await axios.post('http://localhost:4000/projects/6/contents/src/utils.js', {
  content: content,
  message: 'Add utility functions'
}, {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN',
    'Content-Type': 'application/json'
  }
});

console.log('File created successfully');
```

## Features

✅ **Simple Text Upload** - No need for multipart form-data  
✅ **Direct Content in Body** - Send raw text directly in JSON  
✅ **Automatic Commit Messages** - Auto-generated if not provided  
✅ **GitHub Integration** - Creates/updates files directly on GitHub  
✅ **Short URLs** - Auto-generates short URLs for file access  
✅ **User Validation** - Ensures user exists and owns the project  
✅ **Proper Error Handling** - Clear error messages with appropriate HTTP status codes  

## Error Responses

### 400 Bad Request
- Missing file path
- Missing or null content

### 401 Unauthorized
- Invalid or missing JWT token
- GitHub token not found
- GitHub authentication failed

### 404 Not Found
- Project not found
- Repository not found on GitHub

### 500 Internal Server Error
- Database or GitHub API errors

## Validation & Security

1. **User Authentication**: Requires valid JWT token
2. **Project Ownership**: Only the project owner can create/update files
3. **File Path Validation**: Non-empty path required
4. **Content Validation**: Content must be provided (not empty)
5. **GitHub Integration**: Uses authenticated Octokit client with user's token

## Implementation Details

- **Location**: `src/routes/projects.ts` (lines ~296-370)
- **Dependencies**: Octokit, Prisma ORM, Express.js
- **Database Operations**:
  - Validates user and project exist
  - Creates short URL entry in database
  - Links to GitHub commit SHA
- **GitHub Operations**:
  - Uses `octokit.rest.repos.createOrUpdateFileContents()`
  - Encodes content as base64 per GitHub API requirements
  - Returns commit metadata

## Testing in Playground

The endpoint is available in the playground at:
- **UI Section**: "Create/Update File with Text Content"
- **Endpoint ID**: `create-file-text`
- **Location**: Navigation menu under "File Operations"

Interactive form includes:
- JWT token input
- Project ID field
- File path input with examples
- Large textarea for file content
- Optional commit message field
- Response display with file metadata and public URL

## Differences from Upload Endpoint

| Feature | `POST /contents/*` (New) | `POST /upload` (Existing) |
|---------|-------------------------|--------------------------|
| Request Format | JSON body | multipart/form-data |
| File Source | Text string in body | File from filesystem |
| Use Case | Text content (code, docs, config) | Binary files (images, archives) |
| Complexity | Simple | Requires FormData |
| Performance | Lighter payload | Larger payload for binary |

## Advantages

1. **Simplicity**: No need to handle file streams or FormData
2. **IDE Integration**: Easier to integrate in code editors/IDEs
3. **CI/CD**: Better for automated file generation in scripts
4. **Text Content**: Optimized for text files (source code, documentation)
5. **Network**: Smaller payloads for text content
