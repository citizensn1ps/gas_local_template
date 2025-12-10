// scripts/setup.ts

const decoder = new TextDecoder();
const encoder = new TextEncoder();

// ============================================================================
// Config
// ============================================================================

interface Config {
  gasLibsPath: string;
  gcpDevProjectId: string;
  gcpDevProjectNumber: string;
  claspDevUser: string;
}

const DEFAULTS: Config = {
  gasLibsPath: "/Users/alex/dev/gas_libs",
  gcpDevProjectId: "gas-dev-env",
  gcpDevProjectNumber: "549065074538",
  claspDevUser: "gasDev",
};

async function loadConfig(): Promise<Config> {
  try {
    const denoConfig = JSON.parse(await Deno.readTextFile("deno.json"));
    const userConfig = denoConfig.config || {};
    return {
      gasLibsPath: userConfig.gasLibsPath || DEFAULTS.gasLibsPath,
      gcpDevProjectId: userConfig.gcpDevProjectId || DEFAULTS.gcpDevProjectId,
      claspDevUser: userConfig.claspDevUser || DEFAULTS.claspDevUser,
    };
  } catch {
    console.log("⚠️  Could not read deno.json, using defaults");
    return DEFAULTS;
  }
}

// ============================================================================
// Utilities
// ============================================================================

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

function clearScreen() {
  console.log("\x1b[2J\x1b[H");
}

// ============================================================================
// Menu Components
// ============================================================================

async function selectOne(title: string, options: string[]): Promise<number> {
  while (true) {
    clearScreen();
    console.log(`\n${title}\n`);
    options.forEach((opt, i) => {
      console.log(`  ${i + 1}. ${opt}`);
    });
    console.log("");

    const choice = await prompt(`Enter choice (1-${options.length}): `);
    const num = parseInt(choice);

    if (num >= 1 && num <= options.length) {
      return num - 1;
    }
  }
}

async function toggleMenu(title: string, options: string[], selected: boolean[]): Promise<boolean[]> {
  while (true) {
    clearScreen();
    console.log(`\n${title}\n`);
    options.forEach((opt, i) => {
      const check = selected[i] ? "x" : " ";
      console.log(`  [${check}] ${i + 1}. ${opt}`);
    });
    console.log("");

    const input = await prompt("Enter number to toggle, or press Enter to continue: ");

    if (input === "") {
      return selected;
    }

    const num = parseInt(input);
    if (num >= 1 && num <= options.length) {
      selected[num - 1] = !selected[num - 1];
    }
  }
}

// ============================================================================
// Project Creation Functions
// ============================================================================

async function createStandalone(name: string): Promise<{ success: boolean; scriptId?: string }> {
  console.log("\n📝 Creating standalone script...");
  const result = await run(["clasp", "create", "--type", "standalone", "--title", name, "--rootDir", "dist"]);

  if (!result.success) {
    console.error("❌ Failed:", result.output);
    return { success: false };
  }

  const config = JSON.parse(await Deno.readTextFile(".clasp.json"));
  return { success: true, scriptId: config.scriptId };
}

async function createContainerBound(name: string, parentId: string): Promise<{ success: boolean; scriptId?: string }> {
  console.log("\n📝 Creating container-bound script...");
  const result = await run(["clasp", "create", "--parentId", parentId, "--title", name, "--rootDir", "dist"]);

  if (!result.success) {
    console.error("❌ Failed:", result.output);
    return { success: false };
  }

  const config = JSON.parse(await Deno.readTextFile(".clasp.json"));
  return { success: true, scriptId: config.scriptId };
}

async function cloneExisting(scriptId: string): Promise<{ success: boolean }> {
  console.log("\n📥 Cloning existing script...");
  const result = await run(["clasp", "clone", scriptId, "--rootDir", "dist"]);

  if (!result.success) {
    console.error("❌ Failed:", result.output);
    return { success: false };
  }

  return { success: true };
}

async function migrateExisting(scriptId: string): Promise<{ success: boolean }> {
  console.log("\n📥 Cloning existing script...");
  const cloneResult = await run(["clasp", "clone", scriptId]);

  if (!cloneResult.success) {
    console.error("❌ Clone failed:", cloneResult.output);
    return { success: false };
  }

  console.log("📦 Migrating files to src/...");

  for await (const entry of Deno.readDir(".")) {
    if (entry.isFile && entry.name.endsWith(".js") && entry.name !== "appsscript.json") {
      const oldPath = entry.name;
      const newPath = `src/${entry.name.replace(".js", ".ts")}`;

      let content = await Deno.readTextFile(oldPath);

      if (!content.includes("@gas/types")) {
        content = `/// <reference types="@gas/types" />\n\n${content}`;
      }

      const funcRegex = /^function\s+(\w+)\s*\(/gm;
      const funcs: string[] = [];
      let match;
      while ((match = funcRegex.exec(content)) !== null) {
        funcs.push(match[1]);
      }

      if (funcs.length > 0 && !content.includes("global.")) {
        content += `\n\n// Expose functions to Google Apps Script runtime\n`;
        content += `declare const global: { [key: string]: unknown };\n`;
        funcs.forEach((f) => {
          content += `global.${f} = ${f};\n`;
        });
      }

      await Deno.writeTextFile(newPath, content);
      await Deno.remove(oldPath);
      console.log(`  ✓ ${oldPath} → ${newPath}`);
    }
  }

  const config = JSON.parse(await Deno.readTextFile(".clasp.json"));
  config.rootDir = "dist";
  await Deno.writeTextFile(".clasp.json", JSON.stringify(config, null, 2));

  return { success: true };
}

// ============================================================================
// Configuration Functions
// ============================================================================

async function setupDevConfig(
  scriptId: string,
  features: { logs: boolean; run: boolean },
  config: Config
): Promise<void> {
  const claspConfig: Record<string, unknown> = {
    scriptId,
    rootDir: "dist",
  };

  if (features.logs || features.run) {
    claspConfig.projectId = config.gcpDevProjectId;
  }

  await Deno.writeTextFile(".clasp.dev.json", JSON.stringify(claspConfig, null, 2));

  try {
    await Deno.remove(".clasp.json");
  } catch {
    // Ignore if doesn't exist
  }
}

async function setupProdConfig(scriptId: string): Promise<void> {
  const config = {
    scriptId,
    rootDir: "dist",
  };

  await Deno.writeTextFile(".clasp.prod.json", JSON.stringify(config, null, 2));

  try {
    await Deno.remove(".clasp.json");
  } catch {
    // Ignore if doesn't exist
  }
}

async function updateManifest(features: { run: boolean }): Promise<void> {
  const manifest = JSON.parse(await Deno.readTextFile("appsscript.json"));

  if (features.run) {
    manifest.executionApi = { access: "ANYONE" };
  }

  await Deno.writeTextFile("appsscript.json", JSON.stringify(manifest, null, 2));
}

// ============================================================================
// Main Setup Flow
// ============================================================================

async function main() {
  const config = await loadConfig();

  console.log("\n🚀 Google Apps Script Project Setup");
  console.log("─".repeat(40));
  console.log(`   GCP Project:  ${config.gcpDevProjectId}`);
  console.log(`   Clasp User:   ${config.claspDevUser}`);
  console.log(`   Gas Libs:     ${config.gasLibsPath}`);
  console.log("─".repeat(40));

  await prompt("\nPress Enter to continue...");

  // -------------------------------------------------------------------------
  // Step 1: Project Mode
  // -------------------------------------------------------------------------
  const modeIndex = await selectOne("📁 Project Mode", [
    "New standalone script",
    "New container-bound script (attach to existing Sheet/Doc/Form)",
    "Clone existing script",
    "Migrate existing script (clone + restructure)",
  ]);

  const projectName = await prompt("\nProject name: ");
  if (!projectName) {
    console.error("❌ Project name required");
    Deno.exit(1);
  }

  // -------------------------------------------------------------------------
  // Step 2: Mode-specific setup
  // -------------------------------------------------------------------------
  let devScriptId: string | undefined;

  switch (modeIndex) {
    case 0: {
      const result = await createStandalone(`${projectName} (dev)`);
      if (!result.success) Deno.exit(1);
      devScriptId = result.scriptId;
      break;
    }

    case 1: {
      const containerType = await selectOne("Container type", [
        "Google Sheet",
        "Google Doc",
        "Google Form",
      ]);
      const containerNames = ["Sheet", "Doc", "Form"];
      const parentId = await prompt(`\nEnter ${containerNames[containerType]} ID: `);
      if (!parentId) {
        console.error("❌ Container ID required");
        Deno.exit(1);
      }
      const result = await createContainerBound(`${projectName} (dev)`, parentId);
      if (!result.success) Deno.exit(1);
      devScriptId = result.scriptId;
      break;
    }

    case 2: {
      const scriptId = await prompt("\nEnter script ID to clone: ");
      if (!scriptId) {
        console.error("❌ Script ID required");
        Deno.exit(1);
      }
      const result = await cloneExisting(scriptId);
      if (!result.success) Deno.exit(1);
      const claspConfig = JSON.parse(await Deno.readTextFile(".clasp.json"));
      devScriptId = claspConfig.scriptId;
      break;
    }

    case 3: {
      const scriptId = await prompt("\nEnter script ID to migrate: ");
      if (!scriptId) {
        console.error("❌ Script ID required");
        Deno.exit(1);
      }
      const result = await migrateExisting(scriptId);
      if (!result.success) Deno.exit(1);
      const claspConfig = JSON.parse(await Deno.readTextFile(".clasp.json"));
      devScriptId = claspConfig.scriptId;
      break;
    }
  }

  // -------------------------------------------------------------------------
  // Step 3: Feature Selection
  // -------------------------------------------------------------------------
  const featureOptions = [
    "Local log streaming (clasp logs)",
    "Local function execution (clasp run)",
    "Create separate prod script",
  ];
  const featureDefaults = [true, true, true];

  const features = await toggleMenu("📦 Configure features", featureOptions, featureDefaults);

  const enableLogs = features[0];
  const enableRun = features[1];
  const createProd = features[2];

  // -------------------------------------------------------------------------
  // Step 4: Configure dev script
  // -------------------------------------------------------------------------
  console.log("\n⚙️  Configuring dev environment...");

  await setupDevConfig(devScriptId!, { logs: enableLogs, run: enableRun }, config);
  console.log("✓ Created .clasp.dev.json");

  await updateManifest({ run: enableRun });
  console.log("✓ Updated appsscript.json");

  // -------------------------------------------------------------------------
  // Step 5: Create prod script if requested
  // -------------------------------------------------------------------------
  if (createProd) {
    console.log("\n📝 Creating prod script...");

    let prodResult: { success: boolean; scriptId?: string };

    if (modeIndex === 0) {
      prodResult = await createStandalone(`${projectName} (prod)`);
    } else if (modeIndex === 1) {
      const useSameContainer = (await prompt("Use same container for prod? (y/n) [n]: ")) || "n";
      let prodParentId: string;
      if (useSameContainer.toLowerCase() === "y") {
        const devConfig = JSON.parse(await Deno.readTextFile(".clasp.dev.json"));
        prodParentId = devConfig.parentId;
        if (!prodParentId) {
          prodParentId = await prompt("Enter prod container ID: ");
        }
      } else {
        prodParentId = await prompt("Enter prod container ID: ");
      }
      if (!prodParentId) {
        console.error("❌ Container ID required for prod");
        Deno.exit(1);
      }
      prodResult = await createContainerBound(`${projectName} (prod)`, prodParentId);
    } else {
      prodResult = await createStandalone(`${projectName} (prod)`);
    }

    if (prodResult.success && prodResult.scriptId) {
      await setupProdConfig(prodResult.scriptId);
      console.log("✓ Created .clasp.prod.json");
    }
  }

  // -------------------------------------------------------------------------
  // Step 6: Build and push
  // -------------------------------------------------------------------------
  const doBuild = (await prompt("\nBuild and push now? (y/n) [y]: ")) || "y";

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

    if (enableRun) {
      const doDeploy = (await prompt("\nCreate API executable deployment? (y/n) [y]: ")) || "y";
      if (doDeploy.toLowerCase() === "y") {
        console.log("\n🚀 Deploying...");
        const deployResult = await run([
          "clasp",
          "deploy",
          "--project",
          ".clasp.dev.json",
          "-d",
          "dev",
        ]);
        if (!deployResult.success) {
          console.error("❌ Deploy failed:", deployResult.output);
          Deno.exit(1);
        }
        console.log("✓ Deployed as API executable");
      }
    }
  }

  // -------------------------------------------------------------------------
  // Step 7: Done
  // -------------------------------------------------------------------------
  console.log("\n" + "═".repeat(60));
  console.log("✅ Setup complete!");
  console.log("═".repeat(60));

  if (enableLogs || enableRun) {
    console.log("\n📋 Manual steps required (one-time):\n");
    console.log("  1. Bind dev script to GCP project:");
    console.log("     clasp open --project .clasp.dev.json");
    console.log(`     → Project Settings → Change project → GCP Project Dev Number: ${config.gcpDevProjectNumber}\n`);

    if (enableRun) {
      console.log("  2. Re-authenticate for clasp run:");
      console.log(`     clasp login --creds ${config.claspDevUser} --project .clasp.dev.json\n`);
    }
  }

  console.log("📋 Available commands:\n");
  console.log("  deno task build      # Compile TypeScript");
  console.log("  deno task test       # Run tests");
  console.log("  deno task push:dev   # Push to dev script");
  if (createProd) {
    console.log("  deno task push:prod  # Push to prod script");
  }
  if (enableLogs) {
    console.log("  deno task logs       # Stream logs");
  }
  if (enableRun) {
    console.log("  deno task run        # Run function via clasp");
  }
  console.log("");
}

main();
