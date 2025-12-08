# Google Apps Script Project

Local development environment for Google Apps Script using Deno and TypeScript.

## Prerequisites

- [Deno](https://deno.land/)
- [clasp](https://github.com/google/clasp) (`npm install -g @google/clasp`)
- [gas_libs](https://github.com/citizensn1ps/gas_libs) set up at `~/dev/gas_libs/`

## Quick Start
```bash
# Build
deno task build

# Run tests
deno task test

# Push to dev
deno task push:dev

# Watch logs
deno task logs
```

## Project Structure
```
├── src/           # TypeScript source files
├── tests/         # Test files
├── dist/          # Build output (pushed to Apps Script)
├── scripts/       # Build scripts
├── appsscript.json
├── SCOPES.md      # OAuth scope reference
└── SETUP.md       # Post-clone setup instructions
```

## Writing Code

Export functions to GAS using the `global` object:
```typescript
function myFunction(): void {
  // Your code here
}

declare const global: { [key: string]: unknown };
global.myFunction = myFunction;
```

## Configuration

- `.clasp.dev.json` - Dev script config (gitignored)
- `.clasp.prod.json` - Prod script config (gitignored)
- `appsscript.json` - GAS manifest (committed)
- `deno.json` - Deno config and tasks

See [SETUP.md](./SETUP.md) for detailed setup instructions.
