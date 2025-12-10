# Google Apps Script Local Development Template

A Deno-based local development environment for Google Apps Script with TypeScript, testing, and deployment tooling.

## Features

- **TypeScript** — Full type checking with GAS type definitions
- **Local Testing** — Unit tests with mocked GAS APIs
- **Dev/Prod Workflow** — Separate scripts for development and production
- **Local Logs** — Stream logs from GAS to your terminal
- **Remote Execution** — Run functions via CLI with `clasp run`
- **Automated Setup** — Interactive script handles project creation

## Prerequisites

- [Deno](https://deno.land/)
- [clasp](https://github.com/google/clasp) (`npm install -g @google/clasp`)
- [gas_libs](https://github.com/citizensn1ps/gas_libs) at `~/dev/gas_libs/`
- GCP project `gas-dev-env` configured (for logs/remote execution)

Both GAS libs and GCP Project are configurable in deno.json. The setup script has default values, but if they need to change for some reason, they can be added there.

## Quick Start

### 1. Create a new project from this template
```bash
gh repo create my-project --template citizensn1ps/gas_local_template --clone --private
cd my-project
```

### 2. Run the setup script
```bash
deno task setup
```

This will prompt you to:
- Choose project mode (new, clone, or migrate existing)
- Name your project
- Select features (logs, remote execution, prod script)
- Build and push

### 3. Complete GCP binding (if using logs/remote execution)
```bash
clasp open --project .clasp.dev.json
```

Then in Apps Script UI:
- Go to **Project Settings**
- Click **Change project**
- Select **gas-dev-env**

### 4. Start developing
```bash
deno task build      # Compile TypeScript
deno task test       # Run tests
deno task push:dev   # Push to dev script
deno task logs       # Stream logs
```

## Project Structure
```
├── src/               # TypeScript source files
│   └── index.ts       # Entry point
├── tests/             # Test files
│   └── example.test.ts
├── dist/              # Build output (pushed to GAS)
│   ├── Code.js
│   └── appsscript.json
├── scripts/
│   ├── build.ts       # Esbuild bundler
│   └── setup.ts       # Project setup wizard
├── deno.json          # Deno config and tasks
├── appsscript.json    # GAS manifest
├── .clasp.dev.json    # Dev script config (gitignored)
├── .clasp.prod.json   # Prod script config (gitignored)
├── SCOPES.md          # OAuth scope reference
└── DEVELOPMENT.md     # Development guide
```

## Available Tasks

| Task | Description |
|------|-------------|
| `deno task setup` | Interactive project setup |
| `deno task build` | Compile TypeScript to dist/ |
| `deno task test` | Run tests |
| `deno task push:dev` | Push to dev script |
| `deno task push:prod` | Push to prod script |
| `deno task deploy:dev` | Deploy as API executable |
| `deno task logs` | Stream logs from dev script |
| `deno task run` | Run function via clasp |

## Documentation

- [DEVELOPMENT.md](./DEVELOPMENT.md) — How to write code, use types, mocks, and the global pattern
- [SCOPES.md](./SCOPES.md) — OAuth scope reference
