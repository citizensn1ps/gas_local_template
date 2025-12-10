// scripts/setup.ts

const decoder = new TextDecoder();
const encoder = new TextEncoder();

async function prompt(message: string): Promise<string> {
  await Deno.stdout.write(encoder.encode(message));
  const buf = new Uint8Array(1024);
  const n = await Deno.stdin.read(buf);
  return decoder.decode(buf.subarray(0, n!)).trim();
}

async function run(cmd: string[]): Promise<{ success: boolean; output: string }> {
  const command = new Deno.Command(cmd[0], {
    args: cmd.slice(1),
    stdout: "piped",
    stderr: "piped",
  });
  const { success, stdout, stderr } = await command.output();
  const output = decoder.decode(success ? stdout : stderr);
  return { success, output };
}

console.log("\n🚀 Google Apps Script Project Setup\n");

// 1. Project type
const projectType = await prompt("Project type (standalone/sheet/doc/form) [standalone]: ") || "standalone";

let claspArgs: string[];
if (projectType === "standalone") {
  claspArgs = ["clasp", "create", "--type", "standalone", "--rootDir", "dist"];
} else {
  const parentId = await prompt(`Enter the ${projectType} ID: `);
  if (!parentId) {
    console.error("❌ Parent ID required for container-bound scripts");
    Deno.exit(1);
  }
  claspArgs = ["clasp", "create", "--parentId", parentId, "--rootDir", "dist"];
}

// 2. Project name
const projectName = await prompt("Project name: ");
if (!projectName) {
  console.error("❌ Project name required");
  Deno.exit(1);
}

// 3. Dev features
const enableLocalDev = await prompt("\nEnable local dev features (clasp run, logs)? (y/n) [y]: ") || "y";
const localDevEnabled = enableLocalDev.toLowerCase() === "y";

// 4. Create dev script
console.log("\n📝 Creating dev script...");
const devResult = await run([...claspArgs, "--title", `${projectName} (dev)`]);
if (!devResult.success) {
  console.error("❌ Failed to create dev script:", devResult.output);
  Deno.exit(1);
}

// Move and update .clasp.json to .clasp.dev.json
const claspConfig = JSON.parse(await Deno.readTextFile(".clasp.json"));
if (localDevEnabled) {
  claspConfig.projectId = "gas-dev-env";
}
await Deno.writeTextFile(".clasp.dev.json", JSON.stringify(claspConfig, null, 2));
await Deno.remove(".clasp.json");
console.log("✓ Created .clasp.dev.json");

// 5. Update appsscript.json if local dev enabled
if (localDevEnabled) {
  const manifest = JSON.parse(await Deno.readTextFile("appsscript.json"));
  manifest.executionApi = { access: "ANYONE" };
  await Deno.writeTextFile("appsscript.json", JSON.stringify(manifest, null, 2));
  console.log("✓ Added executionApi to appsscript.json");
}

// 6. Create prod script?
const createProd = await prompt("\nCreate prod script too? (y/n) [y]: ") || "y";
if (createProd.toLowerCase() === "y") {
  console.log("\n📝 Creating prod script...");
  const prodResult = await run([...claspArgs, "--title", `${projectName} (prod)`]);
  if (!prodResult.success) {
    console.error("❌ Failed to create prod script:", prodResult.output);
    Deno.exit(1);
  }
  await Deno.rename(".clasp.json", ".clasp.prod.json");
  console.log("✓ Created .clasp.prod.json");
}

// 7. Build and push
const doBuild = await prompt("\nBuild and push now? (y/n) [y]: ") || "y";
if (doBuild.toLowerCase() === "y") {
  console.log("\n📦 Building...");
  const buildResult = await run(["deno", "task", "build"]);
  if (!buildResult.success) {
    console.error("❌ Build failed:", buildResult.output);
    Deno.exit(1);
  }
  console.log("✓ Build complete");

  console.log("\n📤 Pushing to dev...");
  const pushResult = await run(["clasp", "push", "--project", ".clasp.dev.json"]);
  if (!pushResult.success) {
    console.error("❌ Push failed:", pushResult.output);
    Deno.exit(1);
  }
  console.log("✓ Pushed to dev");

  // 8. Deploy if local dev enabled
  if (localDevEnabled) {
    const doDeploy = await prompt("\nCreate API executable deployment? (y/n) [y]: ") || "y";
    if (doDeploy.toLowerCase() === "y") {
      console.log("\n🚀 Deploying...");
      const deployResult = await run(["clasp", "deploy", "--project", ".clasp.dev.json", "-d", "dev"]);
      if (!deployResult.success) {
        console.error("❌ Deploy failed:", deployResult.output);
        Deno.exit(1);
      }
      console.log("✓ Deployed as API executable");
    }
  }
}

// 9. Done
console.log("\n✅ Setup complete!\n");

if (localDevEnabled) {
  console.log("Next steps:");
  console.log("  1. Bind dev script to GCP project (one-time):");
  console.log("     clasp open --project .clasp.dev.json");
  console.log("     → Project Settings → Change project → gas-dev-env");
  console.log("  2. Re-authenticate for clasp run (one-time):");
  console.log("     clasp login --creds ~/.config/clasp/client_secret.json --project .clasp.dev.json");
  console.log("");
} else {
  console.log("Next steps:");
  console.log("  deno task build");
  console.log("  deno task push:dev");
  console.log("");
}
