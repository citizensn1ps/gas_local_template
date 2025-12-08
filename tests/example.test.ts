import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
// import { SpreadsheetApp } from "@gas/mocks";

// Example test - replace with your actual tests
Deno.test("example test", () => {
  const result = 1 + 1;
  assertEquals(result, 2);
});

// Example with mocks (uncomment when gas_libs is set up)
 Deno.test("spreadsheet mock example", () => {
   const ss = SpreadsheetApp.getActiveSpreadsheet();
   ss.toast("Test message", "Title");
   // Add assertions based on what you're testing
 });
