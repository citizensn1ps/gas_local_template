/**
 * Dev Runner - Execute GAS code locally with mocks
 *
 * Usage:
 *   deno task run              # Lists functions, prompts for selection
 *   deno task run <function>   # Runs specific function directly
 *
 * Looks for data.csv in project root and loads it into
 * a mock spreadsheet before running src/main.ts
 */

import { SpreadsheetApp, Logger } from "@gas/mocks";
import { parse } from "jsr:@std/csv";

// Inject mocks as globals (mimics GAS environment)
(globalThis as any).SpreadsheetApp = SpreadsheetApp;
(globalThis as any).Logger = Logger;

// Look for test data in project root
const DATA_FILE = new URL("../data.csv", import.meta.url);

try {
  const csvText = await Deno.readTextFile(DATA_FILE);
  const rows = parse(csvText);

  // Create a spreadsheet with the data
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.insertSheet("Sheet1");
  sheet.rows = rows;

  console.log(`✓ Loaded ${rows.length} rows from data.csv\n`);
} catch (e) {
  if (e instanceof Deno.errors.NotFound) {
    console.log("ℹ No data.csv found, running with empty sheet\n");
  } else {
    throw e;
  }
}

// Import the module (this runs and populates globalThis)
await import("../src/main.ts");

const g = globalThis as Record<string, unknown>;

// Get available functions (exclude built-ins and private functions)
const availableFunctions = Object.keys(g)
  .filter((key) => typeof g[key] === "function" && !key.startsWith("_"));

// Get function name from args or prompt
let functionName = Deno.args[0];

if (!functionName) {
  console.log("Available functions:");
  availableFunctions.forEach((key) => console.log(`  - ${key}`));
  console.log("");

  functionName = prompt("Enter function name:")?.trim() ?? "";

  if (!functionName) {
    console.log("No function specified. Exiting.");
    Deno.exit(0);
  }
}

if (typeof g[functionName] === "function") {
  console.log(`\n--- Running ${functionName}() ---\n`);
  const result = await (g[functionName] as Function)();
  if (result !== undefined) {
    console.log("\nReturned:", result);
  }
  console.log("\n--- Done ---");
} else {
  console.error(`✗ Function "${functionName}" not found`);
  console.log("\nAvailable functions:");
  availableFunctions.forEach((key) => console.log(`  - ${key}`));
  Deno.exit(1);
}
