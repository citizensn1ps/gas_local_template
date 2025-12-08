# Project Setup

After creating a project from this template:

## 1. Configure gas_libs path

Edit `deno.json` and update the paths if your `gas_libs` is in a different location:
```json
{
  "imports": {
    "@gas/types": "/Users/alex/dev/gas_libs/types/",
    "@gas/mocks": "/Users/alex/dev/gas_libs/mocks/gasmask/mod.ts"
  }
}
```

## 2. Create Apps Script projects

### For container-bound scripts (attached to a Sheet/Doc/Form):
```bash
# Create dev script
clasp create --title "My Project (dev)" --parentId "YOUR_SHEET_ID" --rootDir dist
mv .clasp.json .clasp.dev.json

# Create prod script  
clasp create --title "My Project (prod)" --parentId "YOUR_SHEET_ID" --rootDir dist
mv .clasp.json .clasp.prod.json
```

### For standalone scripts:
```bash
# Create dev script
clasp create --title "My Project (dev)" --type standalone --rootDir dist
mv .clasp.json .clasp.dev.json

# Create prod script
clasp create --title "My Project (prod)" --type standalone --rootDir dist
mv .clasp.json .clasp.prod.json
```

## 3. Configure dev script for logging/debugging

1. Add `"projectId": "gas-dev-env"` to `.clasp.dev.json`
2. Open the dev script: `clasp open --project .clasp.dev.json`
3. Go to Project Settings → Change project → Select `gas-dev-env`

## 4. Add scopes

Edit `appsscript.json` and add the scopes your script needs.
See `SCOPES.md` for common scopes.

## 5. Build and push
```bash
deno task build      # Compile TypeScript
deno task push:dev   # Push to dev script
deno task logs       # Watch logs
```

## 6. For clasp run support

Add to `appsscript.json`:
```json
"executionApi": {
  "access": "ANYONE"
}
```

Then deploy as API executable and re-authenticate:
```bash
clasp login --user gasDev --creds ~/.config/clasp/client_secret.json --project .clasp.dev.json
```
