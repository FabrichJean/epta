# EPTA - GitHub-Integrated Project Management & File Sharing API

A comprehensive TypeScript API for managing GitHub-integrated projects, sharing files with short URLs, managing API keys, and organizing project files. Built with Express, TypeScript, Prisma, and GitHub's Octokit API.

## Overview

EPTA is a full-featured backend API that bridges GitHub repositories with a modern file sharing and project management system. It provides:

- **GitHub Authentication**: Register and login with GitHub Personal Tokens
- **Project Management**: Create and manage GitHub-linked projects
- **File Operations**: Upload files to GitHub repositories with automatic short URL generation
- **Short URL System**: Create shareable short codes for files and URLs with click tracking
- **API Keys**: Generate and manage API keys for programmatic access
- **File Starring**: Mark important files for quick access
- **GitHub Integration**: Fetch user information, manage files directly in GitHub repositories

## Features

### Authentication & Authorization
- GitHub-based registration and login
- JWT token management
- API key generation with expiration tracking
- API key enable/disable functionality
- Token refresh and management

### Project Management
- Create projects linked to GitHub repositories
- Read and write files directly to GitHub repos
- Create and manage directory structures
- File upload and metadata management
- Delete entire projects with optional GitHub cleanup

### File Sharing
- Upload files to seed projects
- Automatic short code generation
- File download with metadata (filename, content-type)
- Multiple file retrieval formats (Buffer, Blob, Data URL)
- File discovery by short code

### Short URL System
- Create short codes for long URLs
- Click tracking and analytics
- User-owned URL management
- URL deletion and cleanup

### File Starring
- Mark important files in projects
- Quick access to starred files
- Per-project starring organization

### GitHub Integration
- Direct Octokit integration for repository operations
- GitHub user information fetching
- Multi-file upload to repositories
- Repository metadata management

## Technology Stack

- **Runtime**: Node.js (v14+)
- **Framework**: Express.js
- **Language**: TypeScript 5.3+
- **Database**: MySQL with Prisma ORM
- **Authentication**: JWT tokens
- **GitHub Integration**: Octokit/rest.js
- **File Handling**: Multer
- **Development**: Nodemon

## Setup

### Prerequisites

- Node.js v14 or higher
- npm or yarn
- MySQL database
- GitHub Personal Access Token (for testing)

### Installation

1. **Clone the repository**:
```bash
git clone <repository-url>
cd epta
```

2. **Install dependencies**:
```bash
npm install
```

3. **Setup environment variables**:
```bash
cp .env.example .env
```

4. **Configure your `.env` file**:
```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/epta"

# Server
PORT=3000
NODE_ENV=development

# GitHub (for testing)
GITHUB_TOKEN=your_github_personal_token
```

5. **Generate Prisma Client**:
```bash
npm run prisma:generate
```

6. **Run database migrations**:
```bash
npm run prisma:migrate
```

7. **Seed the database (optional)**:
```bash
npm run prisma:seed
```

## Development

### Start the development server

```bash
npm run dev
```

The server will start on `http://localhost:3000` with hot reload enabled via Nodemon.

### Available Scripts

- `npm run dev` - Start development server with auto-reload
- `npm run build` - Build TypeScript for production
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma Client
- `npm run prisma:migrate` - Run pending database migrations
- `npm run prisma:migrate:dev` - Create and run migrations in development
- `npm run prisma:studio` - Open Prisma Studio (database GUI)
- `npm run prisma:seed` - Run database seeding script

## Project Structure

```
epta/
├── prisma/
│   ├── schema.prisma         # Data models and database schema
│   ├── migrations/           # Migration history
│   ├── seed.ts              # Database seeding script
│   └── migration_lock.toml   # Migration lock file
├── src/
│   ├── index.ts             # Express app entry point
│   ├── middleware/
│   │   └── auth.ts          # Authentication middleware
│   ├── routes/
│   │   ├── auth.ts          # Authentication endpoints
│   │   ├── files.ts         # File operations endpoints
│   │   ├── github.ts        # GitHub integration endpoints
│   │   ├── projects.ts      # Project management endpoints
│   │   └── shorturl.ts      # Short URL endpoints
│   └── utils/
│       ├── auth.ts          # Authentication utilities
│       ├── apiKey.ts        # API key management
│       ├── crypto.ts        # Encryption utilities
│       ├── github.ts        # GitHub utilities
│       ├── project.ts       # Project utilities
│       └── websocket.ts     # WebSocket utilities
├── public/
│   ├── explorer.html        # File explorer UI
│   ├── playground.html      # API playground
│   └── epta.code-workspace  # VS Code workspace config
├── .env.example             # Environment variables template
├── nodemon.json             # Nodemon configuration
├── package.json             # Project dependencies
├── tsconfig.json            # TypeScript configuration
└── README.md                # This file
```

## API Endpoints

### Authentication Routes (`/auth`)
- `POST /auth/register` - Register with GitHub Personal Token
- `POST /auth/login` - Login with GitHub Personal Token
- `GET /auth` - Get current authenticated user
- `PUT /auth/update-token` - Update GitHub token
- `POST /auth/api-keys` - Create API key
- `GET /auth/api-keys` - List API keys
- `PATCH /auth/api-keys/:id/toggle` - Enable/disable API key
- `PATCH /auth/api-keys/:id/regenerate` - Regenerate API key
- `DELETE /auth/api-keys/:id` - Delete API key

### Files Routes (`/f` & `/files`)
- `GET /f/:shortCode` - Get file by short code
- `POST /files/upload` - Upload file to seed project

### Projects Routes (`/projects`)
- `POST /projects` - Create new project
- `GET /projects` - List user's projects
- `GET /projects/:id` - Get project details
- `GET /projects/:id/contents/*` - Get project file/folder contents
- `POST /projects/:id/contents/*` - Create/update files
- `POST /projects/:id/folders/*` - Create folders
- `PUT /projects/:id` - Update project
- `DELETE /projects/:id` - Delete project
- `POST /projects/:projectId/upload` - Upload file to project
- `GET /projects/starred/list` - Get starred files
- `GET /projects/starred/check/:projectId/:path` - Check if file is starred
- `POST /projects/starred/:projectId` - Star a file
- `DELETE /projects/starred/:projectId` - Unstar a file

### Short URL Routes (`/s`)
- `POST /s/shorten` - Create short URL
- `GET /s/my-urls` - Get user's short URLs
- `DELETE /s/:shortCode` - Delete short URL
- `GET /s/:shortCode` - Redirect to original URL (public)

### GitHub Routes (`/github`)
- `POST /github/github-info` - Get GitHub user information from token

## Database Models

### User
- User account with GitHub integration
- Stores encrypted GitHub Personal Token
- Relations: projects, api_keys, starred_files

### Project
- GitHub-linked project repository
- Stores repository metadata and description
- Relations: owner (User), starred files

### ApiKey
- Programmatic access tokens
- Expiration tracking and status management
- Usage analytics with last_used_at

### ShortUrl
- Short URL codes with click tracking
- Supports public redirect URLs
- Click analytics

### Stared (File Starring)
- Bookmarks for important files in projects
- Unique per user-project-path combination

### JsonTable
- Storage for dynamic JSON-based tables
- User-defined column and row structure

## Client Library

This project includes a comprehensive TypeScript client library (`@epta/client`) for easy integration:

### Features
- Type-safe API client
- Automatic JWT token management
- API key handling
- File upload with FormData support
- Short URL management
- Project operations

### Installation
```bash
npm install @epta/client axios
```

### Usage
```typescript
import { EptaApp } from "@epta/client";

const app = new EptaApp("http://localhost:3000/api");
app.setToken("your_jwt_token");

// Use any of the available clients
const user = await app.auth.getCurrentUser();
const projects = await app.projects.getProjects();
const files = await app.files.getFile("short-code-123");
```

For detailed client documentation, see [`package/README.md`](./package/README.md)

## Authentication Flow

1. **Register**: User provides GitHub Personal Token → System creates account with encrypted token
2. **Login**: User provides GitHub Personal Token → System validates and returns JWT
3. **Authenticated Requests**: Include JWT in Authorization header
4. **API Keys**: Alternative authentication method for programmatic access with expiration

## Error Handling

All endpoints return standardized error responses:

```json
{
  "error": "Error type",
  "message": "Detailed error message",
  "status": 400
}
```

Common error codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Internal Server Error

## Development Tips

### Database Management
```bash
# View data with Prisma Studio
npm run prisma:studio

# Create a new migration after schema changes
npm run prisma:migrate:dev -- --name your_migration_name

# Reset database (development only!)
npx prisma migrate reset
```

### File Upload Testing
Use the `/public/playground.html` for testing file uploads and API endpoints.

### WebSocket Support
The application includes WebSocket utilities for real-time features. Check `src/utils/websocket.ts` for implementation details.

## Contributing

1. Create a feature branch
2. Make your changes
3. Run TypeScript checks: `npx tsc --noEmit`
4. Commit with clear messages
5. Push and create a Pull Request

## License

ISC

## Support

For issues, questions, or feature requests, please open an issue on the repository.
