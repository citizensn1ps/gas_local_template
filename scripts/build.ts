import { build, stop } from "https://deno.land/x/esbuild@v0.24.0/mod.js";
import { GasPlugin } from "npm:esbuild-gas-plugin@0.10.0";

await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  outfile: "dist/Code.js",
  plugins: [GasPlugin],
  charset: "utf8",
  target: "es2020",
});

stop();

console.log("✓ Build complete: dist/Code.js");
