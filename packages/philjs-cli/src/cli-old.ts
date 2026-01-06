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
import { generateComponent, generateRoute, generatePage, generateHook, generateStore } from "./generators.js";

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
  .action(async (options: { port: string; host: string; open: boolean }) => {

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
  .action(async (options: { ssg: boolean; analyze: boolean; outDir: string }) => {
    console.log(pc.cyan("\n🔨 Building PhilJS app...\n"));

    try {
      await buildProduction({
        ssg: options.ssg,
        analyze: options.analyze,
        outDir: options.outDir,
      });

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
  .action(async (options: { watch: boolean; coverage: boolean }) => {
    const { spawn } = await import("child_process");

    const args = ["vitest"];
    if (!options.watch) args.push("run");
    if (options.coverage) args.push("--coverage");

    const test = spawn("npx", args, { stdio: "inherit" });

    test.on("exit", (code: number | null) => {
      process.exit(code ?? 0);
    });
  });

// Preview command (serve production build)
program
  .command("preview")
  .description("Preview production build locally")
  .option("-p, --port <port>", "Port to run preview server on", "4173")
  .action(async (options: { port: string }) => {
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

// Generate command group
const generateCmd = program.command("generate");
generateCmd.alias("g");
generateCmd.description("Generate components, routes, pages, hooks, and stores");

// Generate component
const componentCmd = generateCmd.command("component <name>");
componentCmd.alias("c");
componentCmd
  .description("Generate a new component")
  .option("-d, --directory <dir>", "Target directory", "src/components")
  .option("--no-test", "Skip test file generation")
  .option("--with-styles", "Generate CSS module file")
  .option("--js", "Use JavaScript instead of TypeScript")
  .action(async (name: string, options: { directory: string; test: boolean; withStyles: boolean; js: boolean }) => {
    console.log(pc.cyan(`\n📦 Generating component: ${name}\n`));
    try {
      await generateComponent({
        name,
        directory: options.directory,
        typescript: !options.js,
        withTest: options.test !== false,
        withStyles: options.withStyles,
      });
      console.log(pc.green(`\n✓ Component ${name} created!\n`));
    } catch (error) {
      console.error(pc.red("Failed to generate component:"), error);
      process.exit(1);
    }
  });

// Generate route
const routeCmd = generateCmd.command("route <name>");
routeCmd.alias("r");
routeCmd
  .description("Generate a new route with loader")
  .option("-d, --directory <dir>", "Target directory", "src/routes")
  .option("--no-test", "Skip test file generation")
  .option("--js", "Use JavaScript instead of TypeScript")
  .action(async (name: string, options: { directory: string; test: boolean; js: boolean }) => {
    console.log(pc.cyan(`\n🛤️  Generating route: ${name}\n`));
    try {
      await generateRoute({
        name,
        directory: options.directory,
        typescript: !options.js,
        withTest: options.test !== false,
      });
      console.log(pc.green(`\n✓ Route ${name} created!\n`));
    } catch (error) {
      console.error(pc.red("Failed to generate route:"), error);
      process.exit(1);
    }
  });

// Generate page
const pageCmd = generateCmd.command("page <name>");
pageCmd.alias("p");
pageCmd
  .description("Generate a new page component with SEO")
  .option("-d, --directory <dir>", "Target directory", "src/pages")
  .option("--no-test", "Skip test file generation")
  .option("--js", "Use JavaScript instead of TypeScript")
  .action(async (name: string, options: { directory: string; test: boolean; js: boolean }) => {
    console.log(pc.cyan(`\n📄 Generating page: ${name}\n`));
    try {
      await generatePage({
        name,
        directory: options.directory,
        typescript: !options.js,
        withTest: options.test !== false,
      });
      console.log(pc.green(`\n✓ Page ${name} created!\n`));
    } catch (error) {
      console.error(pc.red("Failed to generate page:"), error);
      process.exit(1);
    }
  });

// Generate hook
const hookCmd = generateCmd.command("hook <name>");
hookCmd.alias("h");
hookCmd
  .description("Generate a custom hook")
  .option("-d, --directory <dir>", "Target directory", "src/hooks")
  .option("--no-test", "Skip test file generation")
  .option("--js", "Use JavaScript instead of TypeScript")
  .action(async (name: string, options: { directory: string; test: boolean; js: boolean }) => {
    console.log(pc.cyan(`\n🪝 Generating hook: ${name}\n`));
    try {
      await generateHook({
        name,
        directory: options.directory,
        typescript: !options.js,
        withTest: options.test !== false,
      });
      console.log(pc.green(`\n✓ Hook ${name} created!\n`));
    } catch (error) {
      console.error(pc.red("Failed to generate hook:"), error);
      process.exit(1);
    }
  });

// Generate store
const storeCmd = generateCmd.command("store <name>");
storeCmd.alias("s");
storeCmd
  .description("Generate a state store")
  .option("-d, --directory <dir>", "Target directory", "src/stores")
  .option("--no-test", "Skip test file generation")
  .option("--js", "Use JavaScript instead of TypeScript")
  .action(async (name: string, options: { directory: string; test: boolean; js: boolean }) => {
    console.log(pc.cyan(`\n🗃️  Generating store: ${name}\n`));
    try {
      await generateStore({
        name,
        directory: options.directory,
        typescript: !options.js,
        withTest: options.test !== false,
      });
      console.log(pc.green(`\n✓ Store ${name} created!\n`));
    } catch (error) {
      console.error(pc.red("Failed to generate store:"), error);
      process.exit(1);
    }
  });

program.parse();
