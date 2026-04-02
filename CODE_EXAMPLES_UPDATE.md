# API Playground Code Examples Update

## Overview
The EPTA API Playground has been enhanced with comprehensive code snippet examples for each endpoint. Users can now easily see how to use the API with cURL, JavaScript (Fetch), and Node.js (axios).

## Updated Endpoints with Code Examples

### Authentication Endpoints
1. **Register User** (`POST /auth/register`)
   - Examples: cURL, JavaScript Fetch, Node.js axios
   - Shows how to create an account with GitHub token

2. **Login** (`POST /auth/login`)
   - Examples: cURL, JavaScript Fetch, Node.js axios
   - Shows how to authenticate and get JWT token

### Project Management
3. **Create Project** (`POST /projects`)
   - Examples: cURL, JavaScript Fetch, Node.js axios
   - Shows how to create a new project with name and description

### File Operations
4. **Get Project Contents** (`GET /projects/:id/contents/*`)
   - Examples: cURL (root and specific folder), JavaScript Fetch, Node.js axios
   - Shows how to browse repository structure

5. **Upload File** (`POST /projects/:id/upload`)
   - Examples: cURL, JavaScript Fetch (FormData), Node.js (form-data)
   - Shows how to upload files with multipart form data
   - Includes progress tracking information

6. **Update File Content** (`PUT /projects/:id/contents/*`)
   - Examples: cURL, JavaScript Fetch, Node.js axios
   - Shows how to update file content with commit message

7. **Delete File** (`DELETE /projects/:id/contents/*`)
   - Examples: cURL, JavaScript Fetch, Node.js axios
   - Shows how to delete files from repository

### Bulk Operations
8. **Create Folder** (`POST /projects/{projectId}/folders/{path}`)
   - Examples: cURL, JavaScript Fetch, Node.js axios
   - Shows how to create nested folder structures with .gitkeep file

9. **Bulk Delete Files** (`DELETE /projects/{projectId}/contents`)
   - Examples: cURL, JavaScript Fetch, Node.js axios
   - Shows how to delete multiple files in one operation
   - Shows proper path array formatting

### Search & Discovery
10. **Search Projects & Files** (`GET /projects/search`)
    - Examples: cURL (all projects and specific project), JavaScript Fetch, Node.js axios
    - Shows how to use query parameters for search
    - Shows how to filter by project and depth

### URL Shortening
11. **Shorten URL** (`POST /url/shorten`)
    - Examples: cURL, JavaScript Fetch, Node.js axios
    - Shows how to create short URLs

### Starred Files (Favorites)
12. **List Starred Files** (`GET /projects/starred/list`)
    - Examples: cURL, JavaScript Fetch, Node.js axios
    - Shows how to retrieve all starred files

13. **Check Star Status** (`GET /projects/starred/check/:projectId/:path`)
    - Examples: cURL, JavaScript Fetch (with URL encoding), Node.js axios
    - Shows proper URL encoding for file paths

14. **Star File** (`POST /projects/starred/:projectId`)
    - Examples: cURL, JavaScript Fetch, Node.js axios
    - Shows how to mark a file as favorite

15. **Unstar File** (`DELETE /projects/starred/:projectId`)
    - Examples: cURL, JavaScript Fetch, Node.js axios
    - Shows how to remove a file from favorites

## Code Example Format

Each endpoint now includes a collapsible "Code Examples" section with:

### cURL Examples
- Basic command-line examples
- Proper header formatting
- JSON payload examples
- URL encoding examples where needed

### JavaScript (Fetch) Examples
- Modern Fetch API usage
- Promise chains
- Error handling patterns
- FormData usage for file uploads
- URL encoding for special characters

### Node.js (axios) Examples
- axios library usage
- Headers and authentication setup
- Request/response patterns
- FormData for file uploads
- Query parameters

## Features

✅ **Interactive & Collapsible**: Code examples are hidden by default in `<details>` tags
✅ **Syntax Highlighted**: Dark themed code blocks for better readability
✅ **Multiple Languages**: cURL, JavaScript, and Node.js examples
✅ **Best Practices**: Shows proper error handling and authentication
✅ **Real-World Examples**: Uses realistic data and paths
✅ **Responsive Design**: Adapts to mobile and tablet screens
✅ **Copy-Friendly**: Monospace font for easy copying

## Usage Tips

1. **Authentication**: Always replace `YOUR_JWT_TOKEN` with actual token
2. **Base URL**: Replace `http://localhost:4000` with your API server
3. **Project IDs**: Use actual project IDs from your system
4. **File Paths**: Use proper path formatting (e.g., `src/components/Button.tsx`)
5. **URL Encoding**: File paths with special characters need URL encoding

## Testing the Examples

Users can:
1. Click on any endpoint to expand it
2. Expand the "Code Examples" section
3. Copy any example code
4. Adapt the example for their use case
5. Use the form-based tester in the same endpoint section for quick testing

## Technical Details

- Code examples use proper HTTP methods (GET, POST, PUT, DELETE)
- All examples include proper headers (Authorization, Content-Type)
- File upload examples demonstrate FormData/form-data usage
- URL parameters are shown with proper encoding
- Query parameters use URLSearchParams or axios params

## Mobile Responsive

All code examples are responsive and adapt to:
- Desktop (large code blocks)
- Tablet (medium-sized code blocks)
- Mobile (wrapped and scrollable code blocks)

## Future Enhancements

Possible improvements:
- Syntax highlighting for code blocks
- Copy button for easy code copying
- Live playground environment
- API response examples
- WebSocket examples for real-time features
