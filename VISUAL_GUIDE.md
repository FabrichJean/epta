# GitHub Token Verification - Visual Guide

## 🎯 Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     API ROUTES                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  POST /auth/register      POST /auth/login                  │
│  PUT /auth/update-token   POST /api/github-info             │
│  GET /projects/:id        etc...                            │
│                                                              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ All call
                   ▼
┌─────────────────────────────────────────────────────────────┐
│            GITHUB TOKEN VERIFICATION UTILITY                │
│                    (src/utils/github.ts)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ verifyGitHubToken(ghp)                               │  │
│  │ → GitHubTokenVerification { isValid, user, error }   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ verifyGitHubTokenOrThrow(ghp)                        │  │
│  │ → GitHubUserInfo | throws Error                      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ getAuthenticatedOctokit(ghp)                         │  │
│  │ → Octokit (for GitHub API calls)                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ isGitHubTokenValid(ghp)                              │  │
│  │ → boolean                                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ verifyGitHubTokenBelongsToUser(ghp, username)       │  │
│  │ → boolean                                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Uses
                   ▼
┌─────────────────────────────────────────────────────────────┐
│              EXTERNAL DEPENDENCIES                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Octokit (@octokit/rest)  →  GitHub API v3                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Request Flow Diagram

```
┌─────────────────┐
│   POST Request  │
│  /auth/register │
└────────┬────────┘
         │
         ▼
    ┌─────────────┐
    │  Extract    │
    │   GHP from  │◄─── {"ghp": "ghp_xxxxx"}
    │   Request   │
    └────┬────────┘
         │
         ▼
    ┌──────────────────────┐
    │ Check if GHP exists? │
    └────┬────────┬────────┘
         │        │
      YES│        │NO
         ▼        ▼
    [Error]   ┌──────────────────────────────┐
         │    │ Call verifyGitHubToken(ghp)  │
         │    └────┬────────────────────────┘
         │         │
         │         ▼
         │    ┌─────────────────────────┐
         │    │ Send to GitHub API      │
         │    │ /user endpoint          │
         │    └────┬────────┬───────────┘
         │         │        │
         │      Valid   Invalid/Error
         │         │        │
         │         ▼        ▼
         │    ┌─────┐  ┌────────────────┐
         │    │User │  │Return Error    │
         │    │Data │  │with StatusCode │
         │    └──┬──┘  └────────────────┘
         │       │
         └──────┬┘
                │
                ▼
         ┌──────────────────┐
         │ Create User      │
         │ Encrypt Token    │
         │ Return JWT Token │
         └──────────────────┘
```

---

## 📊 Error Handling Decision Tree

```
                    ┌─ verifyGitHubToken() ─┐
                    │                       │
                    ├─ isValid: true        │
                    │ user: GitHubUserInfo  │
                    │                       │
                    ├─ isValid: false       │
                    │ statusCode: 400       │ ← Missing token
                    │                       │
                    ├─ isValid: false       │
                    │ statusCode: 401       │ ← Invalid/expired token
                    │                       │
                    ├─ isValid: false       │
                    │ statusCode: 403       │ ← Permission/rate limit
                    │                       │
                    ├─ isValid: false       │
                    │ statusCode: 404       │ ← API endpoint not found
                    │                       │
                    └─ isValid: false       │
                      statusCode: 500       │ ← Network/server error
```

---

## 🎯 Function Selection Guide

```
                      Need Token Check?
                             │
                ┌────────────┴────────────┐
                │                         │
         Just true/false?        Need full validation?
                │                         │
                ▼                    ┌────┴───────┐
         isGitHubTokenValid()       │             │
                                Need user data?  Need exceptions?
                                    │             │
                                    ▼             ▼
                            verifyGitHubToken() verifyGitHubTokenOrThrow()
                                    │             │
                            Extract user    Auto-throw on
                            from response   invalid token


                      Need to make GitHub API calls?
                             │
                             ▼
                    getAuthenticatedOctokit()
                             │
                             ▼
                    Use for octokit.rest.* calls


                      Need to verify ownership?
                             │
                             ▼
                verifyGitHubTokenBelongsToUser()
                             │
                             ▼
                    Returns true/false
```

---

## 📈 Code Reduction Visualization

```
Before Integration:
┌────────────────────────────────────┐
│ register endpoint (25 lines)        │
│ ├─ Validation (4 lines)            │
│ ├─ Octokit setup (1 line)          │
│ ├─ Try-catch (1 line)              │
│ ├─ API call (2 lines)              │
│ ├─ Error handling (3 lines)        │
│ ├─ User creation (8 lines)         │
│ └─ Response (6 lines)              │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ login endpoint (25 lines)           │
│ ├─ Validation (4 lines)            │
│ ├─ [Repeated: 11 lines from above] │
│ ├─ User lookup (5 lines)           │
│ └─ Response (5 lines)              │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ update-token endpoint (25 lines)    │
│ ├─ Validation (4 lines)            │
│ ├─ [Repeated: 11 lines from above] │
│ ├─ User update (5 lines)           │
│ └─ Response (5 lines)              │
└────────────────────────────────────┘

Total Duplication: 33 lines (39 lines total for 3 endpoints)


After Integration:
┌────────────────────────────────────┐
│ src/utils/github.ts (200 lines)    │
│ └─ All logic in one place          │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│ register endpoint (20 lines)        │
│ ├─ Validation (4 lines)            │
│ ├─ Verify call (3 lines) ◄─────┐  │
│ ├─ User creation (8 lines)     │  │
│ └─ Response (5 lines)          │  │
└────────────────────────────────┼───┘
                                 │
┌────────────────────────────────┼───┐
│ login endpoint (20 lines)       │   │
│ ├─ Validation (4 lines)        │   │
│ ├─ Verify call (3 lines) ◄─────┤   │
│ ├─ User lookup (5 lines)       │   │
│ └─ Response (8 lines)          │   │
└────────────────────────────────┼───┘
                                 │
┌────────────────────────────────┼───┐
│ update-token endpoint (20 lines)│   │
│ ├─ Validation (4 lines)        │   │
│ ├─ Verify call (3 lines) ◄─────┤   │
│ ├─ User update (5 lines)       │   │
│ └─ Response (8 lines)          │   │
└────────────────────────────────┼───┘
                                 │
                    All call same utility ─┘

Total: 60 lines + 200 line utility
No duplication! Clear, maintainable code!
```

---

## 🔐 Security Flow

```
User provides GHP
       │
       ▼
┌──────────────────┐
│ Validate Format  │
│ (not empty, etc) │
└─────┬────────────┘
      │
      ▼
┌──────────────────┐
│ Send to GitHub   │
│ Verify Authentic │
└─────┬────────────┘
      │
      ├─ Valid? ─┐
      │          │
      │    ┌─────▼──────┐
      │    │ Extract    │
      │    │ User Info  │
      │    └─────┬──────┘
      │          │
      │    ┌─────▼──────────────┐
      │    │ Before storing:    │
      │    │ - Encrypt token    │
      │    │ - Verify ownership │
      │    │ - Save to DB       │
      │    └────────────────────┘
      │
      └─ Invalid? ─┐
                   │
              ┌────▼──────┐
              │ Return    │
              │ Error +   │
              │ Status    │
              │ Code      │
              └───────────┘
```

---

## 📞 Quick Reference Matrix

```
┌─────────────────────────────┬─────────────────┬──────────────────────┐
│ Function                    │ Use When        │ Returns              │
├─────────────────────────────┼─────────────────┼──────────────────────┤
│ verifyGitHubToken()         │ Full control    │ GitHubTokenVerif.    │
│                             │ over errors     │ {isValid, user,      │
│                             │                 │  error, statusCode}  │
├─────────────────────────────┼─────────────────┼──────────────────────┤
│ verifyGitHubTokenOrThrow()  │ Middleware      │ GitHubUserInfo       │
│                             │ or error ctch   │ or throws Error      │
├─────────────────────────────┼─────────────────┼──────────────────────┤
│ getAuthenticatedOctokit()   │ GitHub API      │ Octokit instance     │
│                             │ calls needed    │                      │
├─────────────────────────────┼─────────────────┼──────────────────────┤
│ isGitHubTokenValid()        │ Quick check     │ true/false           │
│                             │ (no user data)  │                      │
├─────────────────────────────┼─────────────────┼──────────────────────┤
│ verifyGitHubTokenBelongsTo  │ User ownership  │ true/false           │
│ User()                      │ verification    │                      │
└─────────────────────────────┴─────────────────┴──────────────────────┘
```

---

## 🎓 Learning Path

```
START
  │
  ├─ Read: QUICK_REFERENCE.md
  │  └─ 5 min overview
  │
  ├─ Read: GITHUB_TOKEN_VERIFICATION.md
  │  └─ 10 min API reference
  │
  ├─ Read: GITHUB_TOKEN_EXAMPLES.md
  │  └─ 15 min code examples
  │
  ├─ Review: src/utils/github.ts
  │  └─ 10 min source code
  │
  ├─ Review: src/routes/auth.ts
  │  └─ 10 min integration
  │
  ├─ Run tests
  │  └─ 5 min verification
  │
  └─ Ready to integrate! ✅
     (~55 minutes total)
```

---

**Generated**: April 2, 2026  
**Status**: ✅ Complete  
**Diagrams**: ASCII art for clarity  
**Reference**: For visual learners
