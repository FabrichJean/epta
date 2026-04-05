# 🎨 Visual Guide: Code Highlighting & Copy Features

## Feature Overview

### 1️⃣ Syntax Highlighting

#### Before (Plain Text)
```
fetch('http://localhost:4000/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ghp: 'ghp_xxxxxxxxxxxx' })
})
.then(res => res.json())
.then(data => console.log('Registered:', data))
```

#### After (With Syntax Highlighting)
```javascript
fetch('http://localhost:4000/auth/register', {      // ← keyword + function
  method: 'POST',                                   // ← attribute + string
  headers: { 'Content-Type': 'application/json' },  // ← string literal
  body: JSON.stringify({ ghp: 'ghp_xxxxxxxxxxxx' })
})
.then(res => res.json())     // ← chained method calls in blue
.then(data => console.log('Registered:', data))
```

**Color Breakdown:**
- Keywords: `POST`, `fetch`, `import`, `const` → **Purple** (#c678dd)
- Strings: `'Content-Type'`, `'application/json'` → **Green** (#98c379)
- Functions: `JSON.stringify`, `console.log` → **Blue** (#61afef)
- Attributes: Object keys → **Red** (#e06c75)
- Numbers: Values like `123`, `0` → **Orange** (#d19a66)

---

### 2️⃣ Copy-to-Clipboard Button

#### Default State (Invisible)
```
┌──────────────────────────────────────────────────┐
│ curl -X POST http://localhost:4000/auth/register │
│   -H "Content-Type: application/json" \          │
│   -d '{"ghp": "ghp_xxxxxxxxxxxx"}'               │
└──────────────────────────────────────────────────┘
```

#### Hover State (Button Appears)
```
        📋 Copy ← Fade in with blue background
        ↓
┌──────────────────────────────────────────────────┐
│ curl -X POST http://localhost:4000/auth/register │
│   -H "Content-Type: application/json" \          │
│   -d '{"ghp": "ghp_xxxxxxxxxxxx"}'               │
└──────────────────────────────────────────────────┘
```

#### Clicked State (Feedback)
```
        ✓ Copied! ← Green background, success message
        ↓
┌──────────────────────────────────────────────────┐
│ curl -X POST http://localhost:4000/auth/register │
│   -H "Content-Type: application/json" \          │
│   -d '{"ghp": "ghp_xxxxxxxxxxxx"}'               │
└──────────────────────────────────────────────────┘
        (Auto-resets after 2 seconds)
```

---

### 3️⃣ Multi-Language Tabs

#### Tab Interface
```
┌─────────────────────────────────────────┐
│ [cURL] [JavaScript] [Python] [Node.js] │ ← 4 language tabs
├─────────────────────────────────────────┤
│                                         │
│  curl -X POST ...                       │ ← Code snippet
│                                         │ ← With syntax highlighting
│                                         │ ← 📋 Copy button
│                                         │
└─────────────────────────────────────────┘
```

#### Click on "Python" Tab
```
┌─────────────────────────────────────────┐
│ [cURL] [JavaScript] [Python*] [Node.js] │ ← Python tab is active
├─────────────────────────────────────────┤
│                                         │
│  import requests                        │ ← Python code appears
│                                         │ ← Syntax highlighting applied
│  response = requests.post(...)          │ ← 📋 Copy button ready
│                                         │
└─────────────────────────────────────────┘
```

---

## Language-Specific Examples

### Example 1: Python Request
```python
import requests

response = requests.post(
    'http://localhost:4000/auth/register',  # ← String (Green)
    json={'ghp': 'ghp_xxxxxxxxxxxx'}        # ← Dict notation
)
data = response.json()                      # ← Method call (Blue)
print('Token:', data.get('token'))          # ← Built-in function (Purple)
```

**Highlighted Elements:**
- `import` → **Purple** (keyword)
- `'http://...'` → **Green** (string)
- `requests.post()` → **Blue** (function)
- `json=` → **Red** (parameter)
- `response.json()` → **Blue** (method)
- `print()` → **Blue** (built-in)

---

### Example 2: JavaScript Fetch
```javascript
fetch('http://localhost:4000/auth/register', {
  method: 'POST',                          // ← String literal (Green)
  headers: { 'Content-Type': ... },        // ← Object literal
  body: JSON.stringify({...})              // ← Built-in function (Blue)
})
  .then(res => res.json())                 // ← Arrow function, chaining
  .then(data => console.log(data))         // ← Another then block
```

**Highlighted Elements:**
- `'POST'` → **Green** (string)
- `fetch`, `JSON.stringify` → **Blue** (functions)
- `.then()` → **Blue** (method)
- `=>` → **Purple** (arrow syntax)
- Comments → **Gray** (inactive)

---

### Example 3: cURL Command
```bash
curl -X POST http://localhost:4000/auth/register \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"ghp": "ghp_xxxxxxxxxxxx"}'
```

**Highlighted Elements:**
- `curl`, `POST` → **Purple** (commands/keywords)
- `-X`, `-H`, `-d` → **Orange** (flags)
- `"Authorization: ..."` → **Green** (strings)
- `http://...` → **Blue** (URLs)
- `\` → Gray (escape characters)

---

## User Interaction Flow

### Scenario: Developer wants to copy Python code

```
1. User sees API endpoint          2. Hovers over code block
   ↓                                  ↓
   ┌─────────────────┐               📋 Copy button appears
   │ [ Code Example ]│               with smooth fade-in
   └─────────────────┘

3. User clicks copy button          4. Visual feedback
   ↓                                  ↓
   Code is copied to clipboard        ✓ Copied! (green)
   ↓                                  ↓
   Can paste anywhere                 After 2 seconds: resets
```

### Code is color-coded every step:
- Appears in syntax highlighted format
- Remains highlighted during hover
- Still highlighted when copied
- Highlighting persists across tab switches

---

## Color Reference Chart

```
┌────────────────────┬──────────┬─────────────┐
│ Element            │ Color    │ Hex Value   │
├────────────────────┼──────────┼─────────────┤
│ Keywords           │ Purple   │ #c678dd     │
│ Strings            │ Green    │ #98c379     │
│ Numbers            │ Orange   │ #d19a66     │
│ Functions          │ Blue     │ #61afef     │
│ Attributes         │ Red      │ #e06c75     │
│ Background         │ Dark Gray│ #282c34     │
│ Default Text       │ Light    │ #abb2bf     │
│ Copy Button        │ Blue     │ #0969da     │
│ Button Hover       │ Blue     │ #0860ca     │
│ Button Copied      │ Green    │ #28a745     │
└────────────────────┴──────────┴─────────────┘
```

---

## Animation Timeline

### Copy Button Interaction

```
Time →
│
├─ 0.0s: User moves mouse over code
│        ↓
│        Fade-in starts
│
├─ 0.2s: Copy button fully visible (opacity: 1)
│        ↓
│        User can click
│
├─ 0.2s: User clicks button
│        ↓
│        Code goes to clipboard
│        Button turns green
│        Text changes to "✓ Copied!"
│
├─ 2.0s: Timer ends
│        ↓
│        Fade back to initial state
│        Text back to "📋 Copy"
│        Color back to blue
│
└─ 2.2s: Ready for next interaction
```

---

## Responsive Design

### Desktop (1024px+)
```
Tab Headers: [cURL] [JavaScript] [Python] [Node.js]
Copy Button: Positioned absolutely, top-right
Code Area: Full width, horizontal scroll if needed
Font Size: 0.85rem
```

### Tablet (768px - 1023px)
```
Tab Headers: Still showing 4 tabs (wrapped if needed)
Copy Button: Touch-friendly, larger hit area
Code Area: Scrollable horizontally
Font Size: 0.85rem (readable on tablet)
```

### Mobile (< 768px)
```
Tab Headers: Wrap to 2x2 grid if needed
Copy Button: Full width of button area
Code Area: Horizontally scrollable
Font Size: 0.85rem (zoom-able)
```

---

## Feature Comparison

```
                 BEFORE          AFTER
────────────────────────────────────────────
Syntax            ✗              ✅ Colorful
Highlighting

Copy Button       ✗              ✅ Floating

Languages         3              ✅ 4 per tab

Visual Feedback   ✗              ✅ "✓ Copied!"

Code Readability  ⭐⭐            ⭐⭐⭐⭐⭐

Developer UX      ⭐⭐            ⭐⭐⭐⭐⭐

Professional      ⭐⭐⭐          ⭐⭐⭐⭐⭐
Look
```

---

## Implementation Diagram

```
┌─────────────────────────────────────────┐
│          Playground Page                │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  Register Endpoint                │  │
│  │                                   │  │
│  │  [cURL] [JS] [Python] [Node.js]   │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │ curl -X POST ...            │  │  │
│  │  │                      📋 Copy│  │  │
│  │  │ (Syntax Highlighted)        │  │  │
│  │  └─────────────────────────────┘  │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  Login Endpoint                   │  │
│  │                                   │  │
│  │  [cURL] [JS] [Python] [Node.js]   │  │
│  │  ┌─────────────────────────────┐  │  │
│  │  │ import requests             │  │  │
│  │  │                      📋 Copy│  │  │
│  │  │ (Syntax Highlighted)        │  │  │
│  │  └─────────────────────────────┘  │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│  (More endpoints below...)              │
│                                         │
└─────────────────────────────────────────┘
```

---

## Technology Stack

```
┌────────────────────────────────────────┐
│         Syntax Highlighting             │
│    (Highlight.js v11.9.0 - 8KB)        │
│                                        │
│    • Language detection                │
│    • Color token mapping               │
│    • Theme: Atom One Dark              │
└────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────┐
│         Copy-to-Clipboard              │
│    (Native Clipboard API)              │
│                                        │
│    • navigator.clipboard.writeText()   │
│    • No external library needed        │
└────────────────────────────────────────┘
                    ↓
┌────────────────────────────────────────┐
│         DOM & Event Handling           │
│    (Vanilla JavaScript)                │
│                                        │
│    • Event listeners                   │
│    • CSS class management              │
│    • State tracking                    │
└────────────────────────────────────────┘
```

---

## Summary

✅ **Syntax Highlighting** - Color-coded code for better readability
✅ **Copy Button** - One-click copy with visual feedback
✅ **4 Languages** - cURL, JavaScript, Python, Node.js
✅ **Smooth Animations** - Professional feel with transitions
✅ **Mobile Friendly** - Works great on all devices
✅ **Zero Errors** - Production-ready code

**Result**: A world-class, professional API playground! 🚀
