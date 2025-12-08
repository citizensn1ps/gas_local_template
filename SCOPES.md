# Common OAuth Scopes

Copy these into `appsscript.json` as needed.

## Spreadsheets
```
"https://www.googleapis.com/auth/spreadsheets.currentonly"
"https://www.googleapis.com/auth/spreadsheets"
```

## Drive
```
"https://www.googleapis.com/auth/drive"
"https://www.googleapis.com/auth/drive.readonly"
"https://www.googleapis.com/auth/drive.file"
```

## Gmail
```
"https://www.googleapis.com/auth/gmail.readonly"
"https://www.googleapis.com/auth/gmail.send"
"https://www.googleapis.com/auth/gmail.compose"
"https://www.googleapis.com/auth/gmail.modify"
```

## Calendar
```
"https://www.googleapis.com/auth/calendar"
"https://www.googleapis.com/auth/calendar.readonly"
"https://www.googleapis.com/auth/calendar.events"
```

## Docs
```
"https://www.googleapis.com/auth/documents"
"https://www.googleapis.com/auth/documents.readonly"
```

## Forms
```
"https://www.googleapis.com/auth/forms"
"https://www.googleapis.com/auth/forms.currentonly"
```

## Script / Utilities
```
"https://www.googleapis.com/auth/script.external_request"
"https://www.googleapis.com/auth/script.scriptapp"
"https://www.googleapis.com/auth/script.send_mail"
"https://www.googleapis.com/auth/script.container.ui"
"https://www.googleapis.com/auth/userinfo.email"
```

## For clasp run (API Executable)

Add to `appsscript.json`:
```json
"executionApi": {
  "access": "ANYONE"
}
```
