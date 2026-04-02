# Starred Files API Documentation

## Overview

The Starred Files feature allows users to mark files as favorites for quick access and organization. Each starred file is tracked with timestamps and can be easily managed through the API.

---

## API Endpoints

### 1. Get All Starred Files

**Endpoint:** `GET /api/projects/starred/list`

**Authentication:** Required (JWT Token)

**Description:** Retrieve all starred files for the authenticated user, sorted by most recent first.

**Response:**
```json
{
  "count": 5,
  "stareds": [
    {
      "id": 1,
      "path": "src/components/Button.tsx",
      "userId": 1,
      "createdAt": "2026-04-02T10:30:00Z",
      "updatedAt": "2026-04-02T10:30:00Z"
    },
    {
      "id": 2,
      "path": "README.md",
      "userId": 1,
      "createdAt": "2026-04-01T15:45:00Z",
      "updatedAt": "2026-04-01T15:45:00Z"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Successfully retrieved starred files
- `401 Unauthorized` - Invalid or missing authentication token
- `500 Internal Server Error` - Server error

---

### 2. Check if File is Starred

**Endpoint:** `GET /api/projects/starred/check/:projectId/:path`

**Authentication:** Required (JWT Token)

**Parameters:**
- `projectId` (URL param): ID of the project
- `path` (URL param): File path (URL encoded)

**Description:** Check whether a specific file is starred by the authenticated user.

**Example:**
```
GET /api/projects/starred/check/1/src%2Fcomponents%2FButton.tsx
```

**Response:**
```json
{
  "isStarred": true,
  "stared": {
    "id": 1,
    "path": "src/components/Button.tsx",
    "userId": 1,
    "createdAt": "2026-04-02T10:30:00Z",
    "updatedAt": "2026-04-02T10:30:00Z"
  }
}
```

Or if not starred:
```json
{
  "isStarred": false,
  "stared": null
}
```

**Status Codes:**
- `200 OK` - Successfully checked starred status
- `401 Unauthorized` - Invalid or missing authentication token
- `500 Internal Server Error` - Server error

---

### 3. Star a File

**Endpoint:** `POST /api/projects/starred/:projectId`

**Authentication:** Required (JWT Token)

**Parameters:**
- `projectId` (URL param): ID of the project

**Request Body:**
```json
{
  "path": "src/components/Button.tsx"
}
```

**Description:** Mark a file as starred. Returns an error if the file is already starred.

**Response:**
```json
{
  "message": "File starred successfully",
  "stared": {
    "id": 1,
    "path": "src/components/Button.tsx",
    "userId": 1,
    "createdAt": "2026-04-02T10:30:00Z",
    "updatedAt": "2026-04-02T10:30:00Z"
  }
}
```

**Status Codes:**
- `201 Created` - File successfully starred
- `400 Bad Request` - Missing path or file already starred
- `401 Unauthorized` - Invalid or missing authentication token
- `500 Internal Server Error` - Server error

---

### 4. Unstar a File

**Endpoint:** `DELETE /api/projects/starred/:projectId`

**Authentication:** Required (JWT Token)

**Parameters:**
- `projectId` (URL param): ID of the project

**Request Body:**
```json
{
  "path": "src/components/Button.tsx"
}
```

**Description:** Remove a file from starred. Returns an error if the file is not starred.

**Response:**
```json
{
  "message": "File unstarred successfully"
}
```

**Status Codes:**
- `200 OK` - File successfully unstarred
- `400 Bad Request` - Missing path parameter
- `401 Unauthorized` - Invalid or missing authentication token
- `404 Not Found` - File is not starred
- `500 Internal Server Error` - Server error

---

## Database Schema

The `Stared` model stores starred file information:

```prisma
model Stared {
    id        Int       @id @default(autoincrement())
    path      String    @unique  // Full file path
    userId    Int
    user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
    createdAt DateTime  @default(now())
    updatedAt DateTime  @updatedAt

    @@index([userId])
}
```

**Fields:**
- `id`: Unique identifier
- `path`: Full file path (e.g., "src/components/Button.tsx") - unique constraint
- `userId`: Owner of the starred file
- `user`: Relationship to User model
- `createdAt`: When the file was starred
- `updatedAt`: When the record was last updated

---

## Integration with File Contents

When retrieving file contents via `GET /api/projects/:id/contents/*`, the response includes an `isStarred` field for each file:

**File Details Response:**
```json
{
  "type": "file",
  "name": "Button.tsx",
  "path": "src/components/Button.tsx",
  "size": 2048,
  "sha": "abc123def456",
  "url": "https://github.com/...",
  "downloadUrl": "https://raw.githubusercontent.com/...",
  "publicUrl": "http://localhost:3000/f/xyz789",
  "content": "base64encodedcontent",
  "encoding": "base64",
  "isStarred": true
}
```

**Directory Contents Response:**
```json
{
  "type": "dir",
  "path": "src/components",
  "contents": [
    {
      "type": "file",
      "name": "Button.tsx",
      "path": "src/components/Button.tsx",
      "size": 2048,
      "sha": "abc123def456",
      "url": "https://github.com/...",
      "downloadUrl": "https://raw.githubusercontent.com/...",
      "publicUrl": "http://localhost:3000/f/xyz789",
      "isStarred": true
    },
    {
      "type": "file",
      "name": "Input.tsx",
      "path": "src/components/Input.tsx",
      "size": 1536,
      "sha": "def456ghi789",
      "url": "https://github.com/...",
      "downloadUrl": "https://raw.githubusercontent.com/...",
      "publicUrl": "http://localhost:3000/f/abc456",
      "isStarred": false
    }
  ]
}
```

---

## Usage Examples

### JavaScript/TypeScript

```typescript
// Get all starred files
const response = await fetch('/api/projects/starred/list', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const data = await response.json();
console.log(data.stareds);

// Check if file is starred
const checkResponse = await fetch('/api/projects/starred/check/1/src%2Fcomponents%2FButton.tsx', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
const checkData = await checkResponse.json();
console.log(checkData.isStarred);

// Star a file
const starResponse = await fetch('/api/projects/starred/1', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    path: 'src/components/Button.tsx'
  })
});
const starData = await starResponse.json();
console.log(starData.message);

// Unstar a file
const unstarResponse = await fetch('/api/projects/starred/1', {
  method: 'DELETE',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    path: 'src/components/Button.tsx'
  })
});
const unstarData = await unstarResponse.json();
console.log(unstarData.message);
```

### cURL

```bash
# Get all starred files
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/projects/starred/list

# Check if file is starred
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/projects/starred/check/1/src%2Fcomponents%2FButton.tsx

# Star a file
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"path":"src/components/Button.tsx"}' \
  http://localhost:3000/api/projects/starred/1

# Unstar a file
curl -X DELETE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"path":"src/components/Button.tsx"}' \
  http://localhost:3000/api/projects/starred/1
```

---

## Error Handling

### Common Error Responses

**Missing Path Parameter:**
```json
{
  "error": "File path is required"
}
```

**File Already Starred:**
```json
{
  "error": "File is already starred"
}
```

**File Not Starred (when trying to unstar):**
```json
{
  "error": "Starred file not found"
}
```

**Authentication Failed:**
```json
{
  "error": "Unauthorized"
}
```

---

## Best Practices

1. **URL Encoding**: Always URL-encode file paths containing special characters (/, \, etc.)
   ```javascript
   const encodedPath = encodeURIComponent('src/components/Button.tsx');
   ```

2. **Check Before Starring**: Use the check endpoint before starring to provide better UX
   ```javascript
   const { isStarred } = await checkStarredStatus(projectId, filePath);
   if (!isStarred) {
     await starFile(projectId, filePath);
   }
   ```

3. **Handle Duplicates**: The system prevents duplicate starred entries using unique constraint
   ```javascript
   // This will return 400 error
   await starFile(1, 'src/Button.tsx');
   await starFile(1, 'src/Button.tsx'); // Error: already starred
   ```

4. **Optimize List Retrieval**: Cache starred files list locally and update on star/unstar actions

---

## Future Enhancements

- [ ] Bulk star/unstar operations
- [ ] Star collections or folders
- [ ] Search/filter starred files
- [ ] Notes/tags for starred files
- [ ] Share starred collections with team members
- [ ] Star statistics and analytics

