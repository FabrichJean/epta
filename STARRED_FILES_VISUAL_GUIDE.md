# Starred Files - Visual Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      User Interface                              │
│         (File Browser, Project View, Favorites List)             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Starred Files API                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │   List       │  │   Check      │  │   Star       │           │
│  │   Starred    │  │   Status     │  │   File       │           │
│  │   Files      │  │              │  │              │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
│  ┌──────────────┐  ┌──────────────────────────────────┐          │
│  │   Unstar     │  │   Get File Contents              │          │
│  │   File       │  │   (with isStarred field)         │          │
│  └──────────────┘  └──────────────────────────────────┘          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Database                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Stared Table                                               │ │
│  │ ┌──────┬──────────────────────┬────────┬─────────────────┐ │ │
│  │ │ id   │ path (unique)        │ userId │ createdAt       │ │ │
│  │ ├──────┼──────────────────────┼────────┼─────────────────┤ │ │
│  │ │ 1    │ src/components/Button│ 1      │ 2026-04-02...   │ │ │
│  │ │ 2    │ README.md            │ 1      │ 2026-04-01...   │ │ │
│  │ └──────┴──────────────────────┴────────┴─────────────────┘ │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoint Flow

### 1. List All Starred Files

```
┌─────────────────────────────┐
│  GET /starred/list          │
└──────────────┬──────────────┘
               │
               ▼
        ┌──────────────┐
        │ Authenticate │
        │ (JWT Token)  │
        └──────┬───────┘
               │
               ▼
        ┌─────────────────────────┐
        │ Query Database          │
        │ WHERE userId = current  │
        │ ORDER BY createdAt DESC │
        └──────┬──────────────────┘
               │
               ▼
        ┌──────────────────────┐
        │ Return Array of      │
        │ Starred Files + Count│
        └──────────────────────┘
```

**Request:**
```
GET /api/projects/starred/list
Authorization: Bearer TOKEN
```

**Response (200):**
```json
{
  "count": 2,
  "stareds": [
    {
      "id": 1,
      "path": "src/Button.tsx",
      "userId": 1,
      "createdAt": "2026-04-02T10:30:00Z"
    }
  ]
}
```

---

### 2. Check if File is Starred

```
┌──────────────────────────────────────┐
│  GET /starred/check/:projectId/:path │
└──────────────┬───────────────────────┘
               │
               ▼
        ┌──────────────────────┐
        │ Authenticate         │
        │ (JWT Token)          │
        └──────┬───────────────┘
               │
               ▼
        ┌──────────────────────┐
        │ URL Decode Path      │
        │ (from :path param)   │
        └──────┬───────────────┘
               │
               ▼
        ┌──────────────────────────────┐
        │ Query Database               │
        │ WHERE userId = current       │
        │ AND path = decodedPath       │
        └──────┬───────────────────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
    Found        Not Found
      │             │
      ▼             ▼
   Return        Return
   Record        Null
```

**Request:**
```
GET /api/projects/starred/check/1/src%2FButton.tsx
Authorization: Bearer TOKEN
```

**Response - If Starred (200):**
```json
{
  "isStarred": true,
  "stared": {
    "id": 1,
    "path": "src/Button.tsx",
    "userId": 1,
    "createdAt": "2026-04-02T10:30:00Z"
  }
}
```

**Response - If Not Starred (200):**
```json
{
  "isStarred": false,
  "stared": null
}
```

---

### 3. Star a File

```
┌──────────────────────────────────┐
│  POST /starred/:projectId        │
│  Body: { path: "..." }           │
└──────────────┬────────────────────┘
               │
               ▼
        ┌──────────────────────┐
        │ Authenticate         │
        │ (JWT Token)          │
        └──────┬───────────────┘
               │
               ▼
        ┌──────────────────────┐
        │ Validate Path        │
        │ (required, string)   │
        └──────┬───────────────┘
               │
               ▼
        ┌──────────────────────┐
        │ Check if Already     │
        │ Starred              │
        └──────┬───────────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
    Exists       Not Exists
      │             │
   Error         Continue
  (400)            │
                   ▼
            ┌──────────────────┐
            │ Create Record in  │
            │ Database          │
            └──────┬───────────┘
                   │
                   ▼
            ┌──────────────────┐
            │ Return Created    │
            │ Record with ID    │
            └──────────────────┘
```

**Request:**
```
POST /api/projects/starred/1
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "path": "src/Button.tsx"
}
```

**Response - Success (201):**
```json
{
  "message": "File starred successfully",
  "stared": {
    "id": 1,
    "path": "src/Button.tsx",
    "userId": 1,
    "createdAt": "2026-04-02T10:30:00Z",
    "updatedAt": "2026-04-02T10:30:00Z"
  }
}
```

**Response - Already Starred (400):**
```json
{
  "error": "File is already starred"
}
```

---

### 4. Unstar a File

```
┌──────────────────────────────────┐
│  DELETE /starred/:projectId      │
│  Body: { path: "..." }           │
└──────────────┬────────────────────┘
               │
               ▼
        ┌──────────────────────┐
        │ Authenticate         │
        │ (JWT Token)          │
        └──────┬───────────────┘
               │
               ▼
        ┌──────────────────────┐
        │ Validate Path        │
        │ (required)           │
        └──────┬───────────────┘
               │
               ▼
        ┌──────────────────────┐
        │ Find Star Record     │
        │ in Database          │
        └──────┬───────────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
    Found        Not Found
      │             │
      ▼             ▼
   Delete        Error
   Record        (404)
      │
      ▼
   Return
   Success
```

**Request:**
```
DELETE /api/projects/starred/1
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "path": "src/Button.tsx"
}
```

**Response - Success (200):**
```json
{
  "message": "File unstarred successfully"
}
```

**Response - Not Starred (404):**
```json
{
  "error": "Starred file not found"
}
```

---

### 5. Get File Contents with Star Status

```
┌─────────────────────────────────────┐
│  GET /projects/:id/contents/*       │
└──────────────┬──────────────────────┘
               │
               ▼
        ┌──────────────────────┐
        │ Authenticate         │
        │ (JWT Token)          │
        └──────┬───────────────┘
               │
               ▼
        ┌──────────────────────┐
        │ Get from GitHub      │
        │ (Octokit)            │
        └──────┬───────────────┘
               │
        ┌──────┴──────┐
        ▼             ▼
    Single        Directory
    File           │
      │            ▼
      │     ┌──────────────┐
      │     │ For Each     │
      │     │ File, Check  │
      │     │ if Starred   │
      │     └──────┬───────┘
      │            │
      │            ▼
      │     ┌──────────────┐
      │     │ Query Database
      │     │ WHERE userId
      │     │ AND path
      │     └──────┬───────┘
      │            │
      └────┬───────┘
           │
           ▼
    ┌──────────────────────┐
    │ Return With          │
    │ isStarred Boolean    │
    └──────────────────────┘
```

**Request:**
```
GET /api/projects/1/contents/src
Authorization: Bearer TOKEN
```

**Response - Directory (200):**
```json
{
  "type": "dir",
  "path": "src",
  "contents": [
    {
      "type": "file",
      "name": "Button.tsx",
      "path": "src/Button.tsx",
      "size": 2048,
      "isStarred": true
    },
    {
      "type": "file",
      "name": "Input.tsx",
      "path": "src/Input.tsx",
      "size": 1024,
      "isStarred": false
    }
  ]
}
```

---

## Error Flow Diagram

```
┌─────────────────────────────────┐
│     Starred API Request         │
└────────────────┬────────────────┘
                 │
                 ▼
        ┌────────────────┐
        │ Token Valid?   │
        └────┬───────┬───┘
             │       │
           Yes       No
             │       │
             │       └──────────────┐
             │                      │
             ▼                      ▼
        Continue         ┌─────────────────┐
             │           │ 401 Unauthorized│
             │           └─────────────────┘
             ▼
        ┌────────────┐
        │ Valid Path?│
        └────┬───┬───┘
             │   │
           Yes   No
             │   │
             │   └──────────────┐
             │                  │
             ▼                  ▼
        Continue      ┌──────────────────┐
             │        │ 400 Bad Request  │
             │        └──────────────────┘
             ▼
        ┌──────────────┐
        │ File Exists? │
        │ (for Star)   │
        └────┬───┬─────┘
             │   │
           Yes  Yes (already starred)
             │   │
             │   └──────────────┐
             │                  │
             ▼                  ▼
        Continue      ┌──────────────────┐
             │        │ 400 File Already │
             │        │ Starred          │
             │        └──────────────────┘
             ▼
        ┌──────────────┐
        │ Success!     │
        │ Return 200/  │
        │ 201 Response │
        └──────────────┘
```

---

## Database Query Performance

```
Operation                    | Query Type | Indexes Used | Performance
---------------------------|------------|--------------|------------
List All Starred            | SELECT *   | userId idx   | O(log n)
Check if Starred            | SELECT 1   | userId idx   | O(log n)
Star File                   | INSERT     | PK           | O(1)
Unstar File                 | DELETE     | PK           | O(1)
Check Star in File Contents | SELECT 1   | userId idx   | O(log n)

Legend:
- O(log n) = Logarithmic (fast, indexed)
- O(1) = Constant time (very fast)
- idx = Database index
- PK = Primary key
```

---

## Data Flow Example

### Scenario: User Stars "src/Button.tsx"

```
Timeline →

1. USER CLICKS STAR BUTTON
   │
   ▼

2. FRONTEND SENDS REQUEST
   POST /api/projects/starred/1
   { "path": "src/Button.tsx" }
   │
   ▼

3. MIDDLEWARE VALIDATES TOKEN
   ✓ Token valid
   ✓ User authenticated
   │
   ▼

4. ENDPOINT RECEIVES REQUEST
   - Extract userId: 1
   - Extract path: "src/Button.tsx"
   │
   ▼

5. VALIDATE INPUT
   ✓ path is provided
   ✓ path is string
   │
   ▼

6. CHECK EXISTING RECORD
   Query: SELECT * FROM Stared
          WHERE userId = 1
          AND path = "src/Button.tsx"
   Result: Not found
   │
   ▼

7. CREATE NEW RECORD
   INSERT INTO Stared (path, userId, createdAt, updatedAt)
   VALUES ("src/Button.tsx", 1, NOW(), NOW())
   │
   ▼

8. RETURN SUCCESS
   201 Created
   {
     "message": "File starred successfully",
     "stared": {
       "id": 1,
       "path": "src/Button.tsx",
       "userId": 1,
       "createdAt": "2026-04-02T10:30:00Z"
     }
   }
   │
   ▼

9. FRONTEND UPDATES UI
   ✓ Star button becomes filled
   ✓ File added to starred list
   ✓ Next file view will show isStarred: true
```

---

## Integration Points in System

```
┌────────────────────────────────────────────────────────────┐
│                    EPTA System                             │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────────┐         ┌──────────────────┐        │
│  │  File Browser   │         │  Project View    │        │
│  │  (shows stars)  │         │  (shows stars)   │        │
│  └────────┬────────┘         └────────┬─────────┘        │
│           │                           │                  │
│           └───────────┬───────────────┘                  │
│                       │                                  │
│                       ▼                                  │
│           ┌───────────────────────┐                      │
│           │  Starred Files API    │                      │
│           │  (4 endpoints)        │                      │
│           └───────────┬───────────┘                      │
│                       │                                  │
│           ┌───────────┴───────────┐                      │
│           │                       │                      │
│           ▼                       ▼                      │
│     ┌──────────────┐      ┌─────────────────┐          │
│     │ File Content │      │ Starred List    │          │
│     │ Endpoint     │      │ Endpoint        │          │
│     │ (shows marks)│      │ (list all)      │          │
│     └──────┬───────┘      └────────┬────────┘          │
│            │                       │                    │
│            └───────────┬───────────┘                    │
│                        │                                │
│                        ▼                                │
│              ┌────────────────────┐                     │
│              │  Stared Table      │                     │
│              │  (PostgreSQL/MySQL)│                     │
│              └────────────────────┘                     │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## State Machine: Star Status

```
              ┌─────────────────┐
              │   Not Starred   │
              └────────┬────────┘
                       │
                       │ (User clicks star)
                       │ POST /starred/1
                       ▼
              ┌─────────────────┐
              │     Starring    │
              │   (In Progress) │
              └────────┬────────┘
                       │
                ┌──────┴──────┐
                │             │
             Success       Failure
                │             │
                ▼             ▼
         ┌──────────┐  ┌─────────────┐
         │ Starred  │  │ Not Starred │
         │          │  │  (Error)    │
         └─────┬────┘  └─────────────┘
               │
               │ (User clicks unstar)
               │ DELETE /starred/1
               ▼
         ┌──────────────┐
         │   Unstarring │
         │  (In Progress)│
         └─────┬────────┘
               │
        ┌──────┴──────┐
        │             │
     Success       Failure
        │             │
        ▼             ▼
   Not Starred    Starred
     (Success)   (Error)
```

