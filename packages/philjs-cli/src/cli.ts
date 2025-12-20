
/**
 * PhilJS CLI
 * The framework that thinks ahead
 */

import { Command } from "commander";
import * as pc from "picocolors";
import { startDevServer } from "./dev-server.js";
import { buildProduction } from "./build.js";
import { analyze } from "./analyze.js";
import { generateTypes } from "./generate-types.js";
import { createProject } from "./create.js";
import { addFeature } from "./add.js";
import { migrateProject } from "./migrate.js";
import { registerGenerateCommand } from "./commands/generate.js";
import { registerStorybookCommand } from "./commands/storybook.js";

const program = new Command();

program
  .name("philjs")
  .description("PhilJS - The framework that thinks ahead")
  .version("2.0.0");

// Create project command
program
  .command("create [project-name]")
  .description("Create a new PhilJS project with interactive setup")
  .action(async (projectName) => {
    try {
      await createProject(projectName);
    } catch (error) {
      console.error(pc.red("Failed to create project:"), error);
      process.exit(1);
    }
  });

// Add feature command
program
  .command("add [feature]")
  .description("Add features to an existing PhilJS project")
  .action(async (feature) => {
    try {
      await addFeature(feature);
    } catch (error) {
      console.error(pc.red("Failed to add feature:"), error);
      process.exit(1);
    }
  });

// Migrate command
program
  .command("migrate [framework]")
  .description("Migrate from React, Vue, or Svelte to PhilJS")
  .action(async (framework) => {
    try {
      await migrateProject(framework);
    } catch (error) {
      console.error(pc.red("Migration failed:"), error);
      process.exit(1);
    }
  });

program
  .command("dev")
  .description("Start development server with HMR")
  .option("-p, --port <port>", "Port to run dev server on", "3000")
  .option("--host <host>", "Host to bind to", "localhost")
  .option("--open", "Open browser automatically", false)
  .action(async (options) => {
    console.log(pc.cyan("\nPhilJS Dev Server\n"));

    try {
      await startDevServer({
        port: parseInt(options.port),
        host: options.host,
        open: options.open,
      });
    } catch (error) {
      console.error(pc.red("Failed to start dev server:"), error);
      process.exit(1);
    }
  });

// Build command
program
  .command("build")
  .description("Build for production")
  .option("--ssg", "Generate static site (SSG)", false)
  .option("--analyze", "Analyze bundle size", false)
  .option("--outDir <dir>", "Output directory", "dist")
  .action(async (options) => {
    console.log(pc.cyan("\nBuilding PhilJS app...\n"));

    try {
      await buildProduction({
        ssg: options.ssg,
        analyze: options.analyze,
        outDir: options.outDir,
      });

      console.log(pc.green("\nBuild complete!\n"));
    } catch (error) {
      console.error(pc.red("Build failed:"), error);
      process.exit(1);
    }
  });

// Analyze command
program
  .command("analyze")
  .description("Analyze bundle size and performance")
  .action(async () => {
    console.log(pc.cyan("\nAnalyzing PhilJS app...\n"));

    try {
      await analyze();
    } catch (error) {
      console.error(pc.red("Analysis failed:"), error);
      process.exit(1);
    }
  });

// Generate types command
program
  .command("generate-types")
  .description("Generate TypeScript types for routes")
  .action(async () => {
    console.log(pc.cyan("\nGenerating route types...\n"));

    try {
      await generateTypes();
      console.log(pc.green("\nTypes generated!\n"));
    } catch (error) {
      console.error(pc.red("Type generation failed:"), error);
      process.exit(1);
    }
  });

// Test command
program
  .command("test")
  .description("Run tests with Vitest")
  .option("--watch", "Watch mode", false)
  .option("--coverage", "Generate coverage report", false)
  .action(async (options) => {
    const { spawn } = await import("child_process");

    const args = ["vitest"];
    if (!options.watch) args.push("run");
    if (options.coverage) args.push("--coverage");

    const test = spawn("npx", args, { stdio: "inherit" });

    test.on("exit", (code) => {
      process.exit(code || 0);
    });
  });

// Preview command (serve production build)
program
  .command("preview")
  .description("Preview production build locally")
  .option("-p, --port <port>", "Port to run preview server on", "4173")
  .action(async (options) => {
    console.log(pc.cyan("\nStarting preview server...\n"));

    const { createServer } = await import("vite");
    const server = await createServer({
      mode: "production",
      server: {
        port: parseInt(options.port),
      },
      preview: {
        port: parseInt(options.port),
      },
    });

    await server.listen();
    server.printUrls();
  });

// Register the enhanced generate command with all scaffolding features
// This adds: generate component, page, api, model, scaffold, hook, context, route, store
// Supports interactive mode, configuration, and Handlebars templates
registerGenerateCommand(program);

// Register Storybook commands
// This adds: storybook init, dev, build, generate
registerStorybookCommand(program);

program.parse();
