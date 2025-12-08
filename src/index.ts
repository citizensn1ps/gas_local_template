/// <reference types="@gas/types" />

/**
 * Runs when the spreadsheet is opened.
 */
function onOpen(e: GoogleAppsScript.Events.SheetsOnOpen): void {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("My Script")
    .addItem("Run", "showMessage")
    .addToUi();
}

/**
 * Shows a toast message.
 */
function showMessage(): void {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  ss.toast("Hello from the script!", "My Script", 3);
}

// Expose functions to Google Apps Script runtime
declare const global: { [key: string]: unknown };
global.onOpen = onOpen;
global.showMessage = showMessage;
