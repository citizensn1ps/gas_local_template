## Development Guide

## Configuration

Customize the dev environment in `deno.json`:
```json
{
  "config": {
    "gasLibsPath": "",
    "gcpDevProjectId": "",
    "claspDevUser": ""
  }
}
```

| Property | Default | Description |
|----------|---------|-------------|
| `gasLibsPath` | `/Users/alex/dev/gas_libs` | Path to types and mocks |
| `gcpDevProjectId` | `gas-dev-env` | GCP project for logs/clasp run |
| `claspDevUser` | `gasDev` | Clasp user profile for dev |

Leave empty to use defaults.

## Writing Code

### The Global Pattern

Google Apps Script expects top-level functions to be available globally. Since we bundle with esbuild, we need to explicitly expose functions to the GAS runtime.

**How it works:**
```typescript
// src/index.ts

/// <reference types="@gas/types" />

// 1. Write your function
function onOpen(e: GoogleAppsScript.Events.SheetsOnOpen): void {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("My Script")
    .addItem("Run", "showMessage")
    .addToUi();
}

function showMessage(): void {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.toast("Hello!", "My Script", 3);
}

// 2. Expose to GAS runtime
declare const global: { [key: string]: unknown };
global.onOpen = onOpen;
global.showMessage = showMessage;
```

**What happens during build:**

The esbuild plugin transforms this into:
```javascript
var global = this;

// Stub declarations (GAS can see these as entry points)
function onOpen(e) {}
function showMessage() {}

// IIFE with actual implementation
(() => {
  function onOpen(e) {
    const ui = SpreadsheetApp.getUi();
    // ...
  }
  function showMessage() {
    // ...
  }
  
  // Overwrites stubs with real implementations
  global.onOpen = onOpen;
  global.showMessage = showMessage;
})();
```

**Key points:**
- Any function you want callable from GAS (triggers, menu items, buttons) must be assigned to `global`
- Helper functions that are only called internally don't need to be on `global`
- The `declare const global` line is TypeScript syntax — it tells TS that `global` exists

---

## Types

Types provide autocomplete and error checking but are stripped during build.

### Using Types

Add the reference directive at the top of your source files:
```typescript
/// <reference types="@gas/types" />
```

Now you get full IntelliSense for GAS APIs:
```typescript
// Autocomplete works for SpreadsheetApp, DriveApp, GmailApp, etc.
const ss = SpreadsheetApp.getActiveSpreadsheet();
const sheet = ss.getActiveSheet();
const range = sheet.getRange("A1:B10");
const values = range.getValues(); // TypeScript knows this is any[][]
```

### Event Types

Use proper event types for triggers:
```typescript
function onOpen(e: GoogleAppsScript.Events.SheetsOnOpen): void { }
function onEdit(e: GoogleAppsScript.Events.SheetsOnEdit): void { }
function onFormSubmit(e: GoogleAppsScript.Events.FormsOnFormSubmit): void { }
function doGet(e: GoogleAppsScript.Events.DoGet): GoogleAppsScript.HTML.HtmlOutput { }
function doPost(e: GoogleAppsScript.Events.DoPost): GoogleAppsScript.Content.TextOutput { }
```

### Important

- **DO NOT** import from `@gas/types` — use the `/// <reference>` directive
- **DO NOT** import from `@gas/mocks` in source files — mocks are for tests only
- Types are stripped at build time — they don't add any code to your bundle

---

## Testing with Mocks

Mocks let you run tests locally without connecting to Google's servers.

### Writing Tests
```typescript
// tests/myfunction.test.ts

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { SpreadsheetApp } from "@gas/mocks";

Deno.test("should create menu on open", () => {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const ui = SpreadsheetApp.getUi();
  
  // Your assertions here
  assertEquals(typeof ss.toast, "function");
});
```

### Available Mocks

From `@gas/mocks`:

- `SpreadsheetApp` — Sheets API
- `PropertiesService` — Script/User/Document properties
- `CacheService` — Caching
- `UrlFetchApp` — HTTP requests
- `Logger` — Logging
- `ScriptApp` — Triggers, script info
- `Session` — Current user info

### Running Tests
```bash
deno task test
```

### Source vs Test Imports

| File | Types | Mocks |
|------|-------|-------|
| `src/*.ts` | `/// <reference types="@gas/types" />` | ❌ Never |
| `tests/*.test.ts` | Not needed | `import { ... } from "@gas/mocks"` |

---

## Logging

### In Your Code

Use `console.log()` — it maps to GAS's `Logger.log()`:
```typescript
function myFunction(): void {
  console.log("Starting function");
  console.log("Data:", JSON.stringify(someData));
}
```

### Viewing Logs

Stream logs to your terminal:
```bash
deno task logs
```

This requires:
- Dev script bound to `gas-dev-env` GCP project
- Function must have been executed (logs only appear after execution)

---

## Remote Execution

Run functions from your terminal without opening the browser.

### Setup (One-Time)

1. Ensure `executionApi` is in `appsscript.json`:
```json
{
  "executionApi": {
    "access": "ANYONE"
  }
}
```

2. Deploy as API executable:
```bash
deno task deploy:dev
```

3. Authenticate with your GCP credentials:
```bash
clasp login --user gasDev --project .clasp.dev.json
```

### Running Functions
```bash
# Run a function with no arguments
deno task run -- myFunction

# Run with arguments (JSON array)
clasp run --project .clasp.dev.json myFunction -p '["arg1", "arg2"]'
```

### Limitations

- `getActiveSpreadsheet()` returns `null` — use `openById()` instead
- Only functions exposed via `global` can be run
- Arguments and return values must be JSON-serializable

---

## Workflow Summary

### Development Cycle
```bash
# 1. Edit source files in src/

# 2. Build
deno task build

# 3. Push to dev
deno task push:dev

# 4. Test in browser or via clasp run
clasp open --project .clasp.dev.json
# or
deno task run -- myFunction

# 5. Watch logs
deno task logs
```

### Testing Cycle
```bash
# 1. Write tests in tests/

# 2. Run tests locally
deno task test

# 3. Debug with Deno's built-in debugger if needed
```

### Production Deployment
```bash
# 1. Ensure everything works in dev

# 2. Push to prod
deno task push:prod

# 3. Deploy prod if needed
clasp deploy --project .clasp.prod.json -d "v1.0.0"
```

