# Starred Files - Quick Reference Guide

## Quick API Reference

### Endpoints Summary

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `GET` | `/api/projects/starred/list` | Get all starred files |
| `GET` | `/api/projects/starred/check/:projectId/:path` | Check if file is starred |
| `POST` | `/api/projects/starred/:projectId` | Star a file |
| `DELETE` | `/api/projects/starred/:projectId` | Unstar a file |

---

## 30-Second Start Guide

### 1. Get All Your Starred Files
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/projects/starred/list
```

### 2. Star a File
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"path":"src/components/Button.tsx"}' \
  http://localhost:3000/api/projects/starred/1
```

### 3. Unstar a File
```bash
curl -X DELETE \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"path":"src/components/Button.tsx"}' \
  http://localhost:3000/api/projects/starred/1
```

### 4. Check Star Status
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/projects/starred/check/1/src%2Fcomponents%2FButton.tsx
```

---

## Common Use Cases

### List all starred files and iterate
```typescript
async function getAllStarredFiles() {
  const response = await fetch('/api/projects/starred/list', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

const { stareds } = await getAllStarredFiles();
stareds.forEach(file => console.log(file.path));
```

### Toggle star status
```typescript
async function toggleStar(projectId, path) {
  const checkRes = await fetch(`/api/projects/starred/check/${projectId}/${encodeURIComponent(path)}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const { isStarred } = await checkRes.json();
  
  const method = isStarred ? 'DELETE' : 'POST';
  const res = await fetch(`/api/projects/starred/${projectId}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ path })
  });
  return res.json();
}
```

### Get file with star status
```typescript
// When you fetch file contents, isStarred is automatically included
const response = await fetch(`/api/projects/1/contents/src/components/Button.tsx`, {
  headers: { 'Authorization': `Bearer ${token}` }
});
const file = await response.json();
console.log(`Is starred: ${file.isStarred}`);
```

---

## Response Examples

### Star a File Response
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

### Get Starred Files Response
```json
{
  "count": 2,
  "stareds": [
    {
      "id": 1,
      "path": "src/components/Button.tsx",
      "userId": 1,
      "createdAt": "2026-04-02T10:30:00Z",
      "updatedAt": "2026-04-02T10:30:00Z"
    }
  ]
}
```

---

## Important Notes

✅ **Remember to URL encode paths** when using in URL parameters:
```javascript
// ✓ Correct
const encoded = encodeURIComponent('src/components/Button.tsx');
const url = `/api/projects/starred/check/1/${encoded}`;

// ✗ Wrong
const url = `/api/projects/starred/check/1/src/components/Button.tsx`;
```

✅ **Path must be exact**:
```javascript
// These are different
"src/Button.tsx"     // correct
"src/buttons/Button.tsx"   // different file
"Button.tsx"         // incomplete path
```

✅ **Star status is included in file contents**:
```javascript
// When fetching directory or file contents, isStarred is automatically included
GET /api/projects/1/contents/src
// Response includes isStarred: true/false for each file
```

---

## Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `"File path is required"` | Missing `path` in request body | Add `"path": "..."` to your JSON |
| `"File is already starred"` | Trying to star same file twice | Use DELETE to unstar first |
| `"Starred file not found"` | Trying to unstar a file that isn't starred | Use GET /check to verify first |
| `"Unauthorized"` | Missing or invalid token | Check `Authorization` header |

---

## Integration Points

The starred system is automatically integrated into:

1. **File Contents Endpoint**: `GET /api/projects/:id/contents/*`
   - Returns `isStarred: boolean` for each file

2. **File Details**: When viewing a single file
   - Includes `isStarred: boolean`

3. **Directory Listing**: When browsing folders
   - Each file shows `isStarred` status

---

## Database Schema (Reference)

```prisma
model Stared {
    id        Int       @id @default(autoincrement())
    path      String    @unique      // File path
    userId    Int
    user      User      @relation(...)
    createdAt DateTime  @default(now())
    updatedAt DateTime  @updatedAt
    
    @@index([userId])
}
```

**Key Points:**
- `path` is unique per user (enforced by schema)
- Automatically cascades delete when user is deleted
- Indexed on `userId` for fast lookups

---

## Common Workflows

### Workflow 1: Display files with star indicators

```typescript
// Fetch directory
const res = await fetch(`/api/projects/1/contents/src`);
const { contents } = await res.json();

// Render with star indicator
contents.forEach(file => {
  if (file.type === 'file') {
    console.log(`${file.name} ${file.isStarred ? '⭐' : '☆'}`);
  }
});
```

### Workflow 2: Quick access to favorite files

```typescript
// Get all starred files
const { stareds } = await fetch('/api/projects/starred/list').then(r => r.json());

// Create quick links
const favorites = stareds.map(s => ({
  name: s.path.split('/').pop(),
  path: s.path,
  starred: true
}));
```

### Workflow 3: Sync star status across sessions

```typescript
// On app load, sync all starred files
async function syncStarredFiles() {
  const { stareds } = await fetch('/api/projects/starred/list').then(r => r.json());
  localStorage.setItem('starredFiles', JSON.stringify(stareds));
}

// Use local copy for instant UI
const cached = JSON.parse(localStorage.getItem('starredFiles') || '[]');
```

