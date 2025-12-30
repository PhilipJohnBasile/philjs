#!/usr/bin/env node
/**
 * PhilJS Native CLI
 *
 * Command-line tools for building and running PhilJS Native apps.
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync, cpSync, rmSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { execSync, spawn, spawnSync, type SpawnOptions } from 'child_process';

// ============================================================================
// Security Utilities
// ============================================================================

/**
 * Validate simulator name to prevent command injection
 */
function validateSimulatorName(name: string): boolean {
  // Only allow alphanumeric, spaces, and common punctuation for device names
  return /^[a-zA-Z0-9\s\-_.()]+$/.test(name) && name.length <= 100;
}

/**
 * Validate path to prevent path traversal and injection
 */
function validatePath(path: string): boolean {
  // Disallow shell metacharacters and path traversal
  return !/[;&|`$<>]/.test(path) && !path.includes('..') && path.length <= 500;
}

/**
 * Validate port number
 */
function validatePort(port: string | number): number {
  const portNum = typeof port === 'string' ? parseInt(port, 10) : port;
  if (isNaN(portNum) || portNum < 1 || portNum > 65535) {
    throw new Error('Invalid port number');
  }
  return portNum;
}

// ============================================================================
// Types
// ============================================================================

interface ProjectConfig {
  name: string;
  displayName: string;
  bundleId: string;
  version: string;
  platforms: ('ios' | 'android' | 'web')[];
  icons?: {
    ios?: string;
    android?: string;
  };
  splash?: {
    backgroundColor?: string;
    image?: string;
  };
}

interface BuildConfig {
  outDir: string;
  mode: 'development' | 'production';
  platform: 'ios' | 'android' | 'web';
  verbose: boolean;
}

// ============================================================================
// CLI Entry Point
// ============================================================================

const args = process.argv.slice(2);
const command = args[0];

async function main(): Promise<void> {
  switch (command) {
    case 'init':
      await initProject(args[1]);
      break;
    case 'run':
      await runApp(args[1] as 'ios' | 'android' | 'web', parseOptions(args.slice(2)));
      break;
    case 'build':
      await buildApp(parseOptions(args.slice(1)));
      break;
    case 'start':
      await startDevServer(parseOptions(args.slice(1)));
      break;
    case 'add':
      await addPlatform(args[1] as 'ios' | 'android');
      break;
    case 'doctor':
      await runDoctor();
      break;
    case 'upgrade':
      await upgradeProject();
      break;
    case '--help':
    case '-h':
    case undefined:
      showHelp();
      break;
    case '--version':
    case '-v':
      showVersion();
      break;
    default:
      console.error(`Unknown command: ${command}`);
      showHelp();
      process.exit(1);
  }
}

function parseOptions(args: string[]): Record<string, string | boolean> {
  const options: Record<string, string | boolean> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg!.startsWith('--')) {
      const key = arg!.slice(2);
      const nextArg = args[i + 1];

      if (nextArg && !nextArg.startsWith('-')) {
        options[key] = nextArg;
        i++;
      } else {
        options[key] = true;
      }
    } else if (arg!.startsWith('-')) {
      const key = arg!.slice(1);
      options[key] = true;
    }
  }

  return options;
}

// ============================================================================
// Commands
// ============================================================================

/**
 * Initialize a new PhilJS Native project
 */
async function initProject(name?: string): Promise<void> {
  const projectName = name || 'my-philjs-app';
  const projectDir = resolve(process.cwd(), projectName);

  console.log(`\n  Creating a new PhilJS Native app in ${projectDir}\n`);

  if (existsSync(projectDir)) {
    console.error(`  Error: Directory ${projectName} already exists.`);
    process.exit(1);
  }

  // Create project structure
  mkdirSync(projectDir, { recursive: true });
  mkdirSync(join(projectDir, 'src'));
  mkdirSync(join(projectDir, 'src/screens'));
  mkdirSync(join(projectDir, 'src/components'));
  mkdirSync(join(projectDir, 'assets'));

  // Create philjs.config.json
  const config: ProjectConfig = {
    name: projectName,
    displayName: toDisplayName(projectName),
    bundleId: `com.philjs.${projectName.toLowerCase().replace(/-/g, '')}`,
    version: '1.0.0',
    platforms: ['ios', 'android', 'web'],
  };

  writeFileSync(
    join(projectDir, 'philjs.config.json'),
    JSON.stringify(config, null, 2)
  );

  // Create package.json
  const packageJson = {
    name: projectName,
    version: '1.0.0',
    private: true,
    type: 'module',
    scripts: {
      start: 'philjs-native start',
      'run:ios': 'philjs-native run ios',
      'run:android': 'philjs-native run android',
      'run:web': 'philjs-native run web',
      build: 'philjs-native build',
      'build:ios': 'philjs-native build --platform ios',
      'build:android': 'philjs-native build --platform android',
      'build:web': 'philjs-native build --platform web',
    },
    dependencies: {
      'philjs-core': '^2.0.0',
      'philjs-native': '^2.0.0',
    },
    devDependencies: {
      typescript: '^5.0.0',
      vitest: '^1.0.0',
    },
  };

  writeFileSync(
    join(projectDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'ESNext',
      lib: ['ES2022', 'DOM'],
      moduleResolution: 'bundler',
      strict: true,
      skipLibCheck: true,
      esModuleInterop: true,
      jsx: 'react-jsx',
      jsxImportSource: 'philjs-core',
      outDir: './dist',
      rootDir: './src',
    },
    include: ['src/**/*'],
    exclude: ['node_modules'],
  };

  writeFileSync(
    join(projectDir, 'tsconfig.json'),
    JSON.stringify(tsconfig, null, 2)
  );

  // Create App.tsx
  const appContent = `import {
  createNativeApp,
  View,
  Text,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  useColorScheme,
} from 'philjs-native';

function App() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={styles.content}>
        <Text style={[styles.title, isDark && styles.darkText]}>
          Welcome to PhilJS Native!
        </Text>
        <Text style={[styles.subtitle, isDark && styles.darkText]}>
          Edit src/App.tsx to get started
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
  },
  darkText: {
    color: '#FFFFFF',
  },
});

// Initialize the app
const app = createNativeApp({
  root: App,
});

app.render();

export default App;
`;

  writeFileSync(join(projectDir, 'src/App.tsx'), appContent);

  // Create index.html for web
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <meta name="theme-color" content="#007AFF">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="default">
  <title>${config.displayName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #root {
      height: 100%;
      width: 100%;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    @supports (padding: env(safe-area-inset-top)) {
      :root {
        --safe-area-inset-top: env(safe-area-inset-top);
        --safe-area-inset-right: env(safe-area-inset-right);
        --safe-area-inset-bottom: env(safe-area-inset-bottom);
        --safe-area-inset-left: env(safe-area-inset-left);
      }
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/App.tsx"></script>
</body>
</html>
`;

  writeFileSync(join(projectDir, 'index.html'), htmlContent);

  // Create .gitignore
  const gitignore = `# Dependencies
node_modules/

# Build output
dist/
build/
.philjs/

# Native
ios/Pods/
android/.gradle/
android/build/
*.xcworkspace
*.pbxuser
*.mode1v3
*.mode2v3
*.perspectivev3
xcuserdata/
*.xccheckout
*.hmap
*.ipa
*.dSYM.zip
*.dSYM
*.apk
*.aab

# IDE
.idea/
.vscode/
*.swp
*.swo
.DS_Store

# Logs
*.log
npm-debug.log*
yarn-error.log*

# Environment
.env
.env.local
.env.*.local
`;

  writeFileSync(join(projectDir, '.gitignore'), gitignore);

  console.log('  Created project structure');
  console.log('');
  console.log('  Next steps:');
  console.log(`    cd ${projectName}`);
  console.log('    npm install');
  console.log('    npm run start');
  console.log('');
  console.log('  To run on a specific platform:');
  console.log('    npm run run:ios     # iOS simulator');
  console.log('    npm run run:android # Android emulator');
  console.log('    npm run run:web     # Web browser');
  console.log('');
}

/**
 * Run the app on a specific platform
 */
async function runApp(
  platform: 'ios' | 'android' | 'web',
  options: Record<string, string | boolean>
): Promise<void> {
  if (!platform) {
    console.error('  Error: Please specify a platform (ios, android, or web)');
    process.exit(1);
  }

  const config = loadConfig();
  console.log(`\n  Running ${config.displayName} on ${platform}...\n`);

  switch (platform) {
    case 'ios':
      await runIOS(config, options);
      break;
    case 'android':
      await runAndroid(config, options);
      break;
    case 'web':
      await runWeb(config, options);
      break;
  }
}

/**
 * Run on iOS
 */
async function runIOS(
  config: ProjectConfig,
  options: Record<string, string | boolean>
): Promise<void> {
  // Check for macOS
  if (process.platform !== 'darwin') {
    console.error('  Error: iOS development requires macOS');
    process.exit(1);
  }

  // Check for Xcode
  try {
    execSync('xcodebuild -version', { stdio: 'pipe' });
  } catch {
    console.error('  Error: Xcode is not installed');
    console.log('  Install Xcode from the App Store');
    process.exit(1);
  }

  const iosDir = join(process.cwd(), 'ios');

  // Initialize iOS project if needed
  if (!existsSync(iosDir)) {
    console.log('  Initializing iOS project...');
    await initIOSProject(config);
  }

  // Install CocoaPods dependencies
  console.log('  Installing CocoaPods dependencies...');
  spawnSync('pod', ['install'], { cwd: iosDir, stdio: 'inherit' });

  // Build and run - validate simulator name
  const simulator = options['simulator'] as string || 'iPhone 15';
  if (!validateSimulatorName(simulator)) {
    console.error('  Error: Invalid simulator name');
    process.exit(1);
  }
  console.log(`  Building for ${simulator}...`);

  // Use spawnSync with args array to prevent command injection
  const buildArgs = [
    '-workspace', `${config.name}.xcworkspace`,
    '-scheme', config.name,
    '-configuration', 'Debug',
    '-destination', `platform=iOS Simulator,name=${simulator}`,
    '-derivedDataPath', 'build',
  ];

  const buildResult = spawnSync('xcodebuild', buildArgs, { cwd: iosDir, stdio: 'inherit' });
  if (buildResult.status !== 0) {
    console.error('  Build failed');
    process.exit(1);
  }

  // Launch simulator and app using args arrays
  console.log('  Launching app...');
  spawnSync('xcrun', ['simctl', 'boot', simulator], { stdio: 'pipe' });
  spawnSync('open', ['-a', 'Simulator'], { stdio: 'pipe' });

  const appPath = join(iosDir, 'build/Build/Products/Debug-iphonesimulator', `${config.name}.app`);
  spawnSync('xcrun', ['simctl', 'install', 'booted', appPath], { stdio: 'inherit' });
  spawnSync('xcrun', ['simctl', 'launch', 'booted', config.bundleId], { stdio: 'inherit' });
}

/**
 * Run on Android
 */
async function runAndroid(
  config: ProjectConfig,
  options: Record<string, string | boolean>
): Promise<void> {
  // Check for Android SDK
  const androidHome = process.env['ANDROID_HOME'] || process.env['ANDROID_SDK_ROOT'];
  if (!androidHome) {
    console.error('  Error: ANDROID_HOME or ANDROID_SDK_ROOT is not set');
    console.log('  Install Android Studio and set up the SDK');
    process.exit(1);
  }

  const androidDir = join(process.cwd(), 'android');

  // Initialize Android project if needed
  if (!existsSync(androidDir)) {
    console.log('  Initializing Android project...');
    await initAndroidProject(config);
  }

  // Build and install
  console.log('  Building Android app...');
  const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

  // Use spawnSync with args array
  const gradleResult = spawnSync(gradleCmd, ['assembleDebug'], { cwd: androidDir, stdio: 'inherit' });
  if (gradleResult.status !== 0) {
    console.error('  Build failed');
    process.exit(1);
  }

  // Install on device/emulator
  console.log('  Installing on device...');
  const apkPath = join(androidDir, 'app/build/outputs/apk/debug/app-debug.apk');
  spawnSync('adb', ['install', '-r', apkPath], { stdio: 'inherit' });

  // Launch app - validate bundleId format
  if (!/^[a-zA-Z][a-zA-Z0-9_.]*$/.test(config.bundleId)) {
    console.error('  Error: Invalid bundle ID');
    process.exit(1);
  }
  console.log('  Launching app...');
  spawnSync('adb', ['shell', 'am', 'start', '-n', `${config.bundleId}/.MainActivity`], { stdio: 'inherit' });
}

/**
 * Run on web
 */
async function runWeb(
  config: ProjectConfig,
  options: Record<string, string | boolean>
): Promise<void> {
  // Validate port
  const port = validatePort(options['port'] as string || '3000');

  console.log(`  Starting development server on http://localhost:${port}`);
  console.log('  Press Ctrl+C to stop\n');

  // Start Vite dev server without shell: true
  try {
    const vite = spawn('npx', ['vite', '--port', port.toString(), '--open'], {
      stdio: 'inherit',
    });

    vite.on('error', (err) => {
      console.error('  Error starting dev server:', err.message);
    });
  } catch (error) {
    console.error('  Error: Could not start development server');
    console.log('  Make sure Vite is installed: npm install -D vite');
  }
}

/**
 * Build the app for production
 */
async function buildApp(options: Record<string, string | boolean>): Promise<void> {
  const config = loadConfig();
  const platform = options['platform'] as string || 'web';
  const outDir = options['outDir'] as string || 'dist';

  console.log(`\n  Building ${config.displayName} for ${platform}...\n`);

  switch (platform) {
    case 'ios':
      await buildIOS(config, outDir);
      break;
    case 'android':
      await buildAndroid(config, outDir);
      break;
    case 'web':
      await buildWeb(config, outDir);
      break;
    default:
      console.error(`  Unknown platform: ${platform}`);
      process.exit(1);
  }

  console.log(`\n  Build complete! Output: ${outDir}\n`);
}

async function buildIOS(config: ProjectConfig, outDir: string): Promise<void> {
  if (process.platform !== 'darwin') {
    console.error('  Error: iOS builds require macOS');
    process.exit(1);
  }

  // Validate output directory
  if (!validatePath(outDir)) {
    console.error('  Error: Invalid output directory');
    process.exit(1);
  }

  const iosDir = join(process.cwd(), 'ios');

  // Use spawnSync with args array
  const buildArgs = [
    '-workspace', `${config.name}.xcworkspace`,
    '-scheme', config.name,
    '-configuration', 'Release',
    '-archivePath', `${outDir}/${config.name}.xcarchive`,
    'archive',
  ];

  const result = spawnSync('xcodebuild', buildArgs, { cwd: iosDir, stdio: 'inherit' });
  if (result.status !== 0) {
    console.error('  Build failed');
    process.exit(1);
  }
}

async function buildAndroid(config: ProjectConfig, outDir: string): Promise<void> {
  // Validate output directory
  if (!validatePath(outDir)) {
    console.error('  Error: Invalid output directory');
    process.exit(1);
  }

  const androidDir = join(process.cwd(), 'android');
  const gradleCmd = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

  // Use spawnSync with args array
  const result = spawnSync(gradleCmd, ['assembleRelease'], { cwd: androidDir, stdio: 'inherit' });
  if (result.status !== 0) {
    console.error('  Build failed');
    process.exit(1);
  }

  // Copy APK to output directory
  mkdirSync(outDir, { recursive: true });
  const apkPath = join(androidDir, 'app/build/outputs/apk/release/app-release.apk');
  cpSync(apkPath, join(outDir, `${config.name}.apk`));
}

async function buildWeb(config: ProjectConfig, outDir: string): Promise<void> {
  // Validate output directory
  if (!validatePath(outDir)) {
    console.error('  Error: Invalid output directory');
    process.exit(1);
  }

  // Use spawnSync with args array
  const result = spawnSync('npx', ['vite', 'build', '--outDir', outDir], { stdio: 'inherit' });
  if (result.status !== 0) {
    console.error('  Build failed');
    process.exit(1);
  }
}

/**
 * Start the development server
 */
async function startDevServer(options: Record<string, string | boolean>): Promise<void> {
  // Validate port
  const port = validatePort(options['port'] as string || '3000');

  const localIP = await getLocalIP();
  console.log(`\n  Starting PhilJS Native development server...\n`);
  console.log(`  Local:   http://localhost:${port}`);
  console.log(`  Network: http://${localIP}:${port}`);
  console.log('\n  Press Ctrl+C to stop\n');

  // Use spawn without shell: true
  spawn('npx', ['vite', '--port', port.toString(), '--host'], {
    stdio: 'inherit',
  });
}

/**
 * Add a native platform
 */
async function addPlatform(platform: 'ios' | 'android'): Promise<void> {
  const config = loadConfig();

  if (platform === 'ios') {
    await initIOSProject(config);
    console.log('\n  iOS platform added successfully!\n');
  } else if (platform === 'android') {
    await initAndroidProject(config);
    console.log('\n  Android platform added successfully!\n');
  } else {
    console.error('  Error: Unknown platform. Use "ios" or "android"');
    process.exit(1);
  }
}

/**
 * Run diagnostics
 */
async function runDoctor(): Promise<void> {
  console.log('\n  PhilJS Native Doctor\n');
  console.log('  Checking your development environment...\n');

  const checks: { name: string; check: () => boolean }[] = [
    {
      name: 'Node.js',
      check: () => {
        const version = process.version;
        console.log(`    Node.js: ${version}`);
        return parseInt(version.slice(1), 10) >= 18;
      },
    },
    {
      name: 'npm',
      check: () => {
        try {
          const version = execSync('npm --version', { encoding: 'utf-8' }).trim();
          console.log(`    npm: ${version}`);
          return true;
        } catch {
          return false;
        }
      },
    },
    {
      name: 'Xcode (macOS only)',
      check: () => {
        if (process.platform !== 'darwin') {
          console.log('    Xcode: N/A (not macOS)');
          return true;
        }
        try {
          const version = execSync('xcodebuild -version', { encoding: 'utf-8' }).split('\n')[0];
          console.log(`    ${version}`);
          return true;
        } catch {
          console.log('    Xcode: Not installed');
          return false;
        }
      },
    },
    {
      name: 'Android SDK',
      check: () => {
        const androidHome = process.env['ANDROID_HOME'] || process.env['ANDROID_SDK_ROOT'];
        if (androidHome) {
          console.log(`    Android SDK: ${androidHome}`);
          return true;
        }
        console.log('    Android SDK: Not found');
        return false;
      },
    },
  ];

  let allPassed = true;

  for (const { name, check } of checks) {
    const passed = check();
    if (!passed) {
      allPassed = false;
      console.log(`    [FAIL] ${name} - needs attention`);
    }
  }

  console.log('');

  if (allPassed) {
    console.log('  All checks passed!\n');
  } else {
    console.log('  Some checks failed. Please address the issues above.\n');
  }
}

/**
 * Upgrade project to latest PhilJS Native version
 */
async function upgradeProject(): Promise<void> {
  console.log('\n  Upgrading PhilJS Native...\n');

  // Use spawnSync with args array
  spawnSync('npm', ['update', 'philjs-native', 'philjs-core'], { stdio: 'inherit' });

  console.log('\n  Upgrade complete!\n');
}

// ============================================================================
// Helper Functions
// ============================================================================

function loadConfig(): ProjectConfig {
  const configPath = join(process.cwd(), 'philjs.config.json');

  if (!existsSync(configPath)) {
    console.error('  Error: philjs.config.json not found');
    console.log('  Run "philjs-native init" to create a new project');
    process.exit(1);
  }

  return JSON.parse(readFileSync(configPath, 'utf-8'));
}

function toDisplayName(name: string): string {
  return name
    .split(/[-_]/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

async function getLocalIP(): Promise<string> {
  try {
    const os = await import('os');
    const nets = os.networkInterfaces();

    for (const name of Object.keys(nets)) {
      for (const net of nets[name] || []) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
  } catch {
    // Ignore
  }

  return 'localhost';
}

async function initIOSProject(config: ProjectConfig): Promise<void> {
  const iosDir = join(process.cwd(), 'ios');
  mkdirSync(iosDir, { recursive: true });

  // Create Podfile
  const podfile = `platform :ios, '13.0'

target '${config.name}' do
  use_frameworks!

  # PhilJS Native dependencies
  # pod 'PhilJSNative', :path => '../node_modules/philjs-native/ios'
end
`;

  writeFileSync(join(iosDir, 'Podfile'), podfile);

  console.log('  Created iOS project structure');
  console.log('  Note: Full iOS project generation requires Xcode');
}

async function initAndroidProject(config: ProjectConfig): Promise<void> {
  const androidDir = join(process.cwd(), 'android');
  mkdirSync(join(androidDir, 'app/src/main/java'), { recursive: true });
  mkdirSync(join(androidDir, 'app/src/main/res'), { recursive: true });

  // Create build.gradle
  const buildGradle = `buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.0.0'
        classpath 'org.jetbrains.kotlin:kotlin-gradle-plugin:1.8.0'
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
`;

  writeFileSync(join(androidDir, 'build.gradle'), buildGradle);

  // Create settings.gradle
  const settingsGradle = `rootProject.name = '${config.name}'
include ':app'
`;

  writeFileSync(join(androidDir, 'settings.gradle'), settingsGradle);

  console.log('  Created Android project structure');
}

function showHelp(): void {
  console.log(`
  PhilJS Native CLI

  Usage:
    philjs-native <command> [options]

  Commands:
    init [name]         Create a new PhilJS Native project
    run <platform>      Run the app on iOS, Android, or Web
    build               Build the app for production
    start               Start the development server
    add <platform>      Add iOS or Android platform
    doctor              Check development environment
    upgrade             Upgrade to latest PhilJS Native

  Options:
    --help, -h          Show this help message
    --version, -v       Show version number

  Examples:
    philjs-native init my-app
    philjs-native run ios
    philjs-native run android --device
    philjs-native build --platform ios
`);
}

function showVersion(): void {
  console.log('philjs-native version 2.0.0');
}

// Run CLI
main().catch((error) => {
  console.error('Error:', error.message);
  process.exit(1);
});
