#!/usr/bin/env node

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

const program = new Command();

program
  .name("philjs")
  .description("PhilJS - The framework that thinks ahead")
  .version("0.1.0");

// Dev server command
program
  .command("dev")
  .description("Start development server with HMR")
  .option("-p, --port <port>", "Port to run dev server on", "3000")
  .option("--host <host>", "Host to bind to", "localhost")
  .option("--open", "Open browser automatically", false)
  .action(async (options) => {
    console.log(pc.cyan("\n⚡ PhilJS Dev Server\n"));

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
    console.log(pc.cyan("\n🔨 Building PhilJS app...\n"));

    try {
      await buildProduction({
        ssg: options.ssg,
        analyze: options.analyze,
        outDir: options.outDir,
      });

      console.log(pc.green("\n✓ Build complete!\n"));
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
    console.log(pc.cyan("\n📊 Analyzing PhilJS app...\n"));

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
    console.log(pc.cyan("\n📝 Generating route types...\n"));

    try {
      await generateTypes();
      console.log(pc.green("\n✓ Types generated!\n"));
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
    console.log(pc.cyan("\n👀 Starting preview server...\n"));

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

program.parse();
