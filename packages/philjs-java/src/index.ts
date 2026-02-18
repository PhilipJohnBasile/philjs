/**
 * @philjs/java
 *
 * Java/Spring Boot integration for PhilJS applications.
 * Provides utilities for running Java/JVM processes, managing Spring Boot
 * services, and generating Spring configuration files.
 */

import { spawn, type ChildProcess, type SpawnOptions } from 'node:child_process';
import { join, resolve } from 'node:path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';

// ============================================================================
// Types
// ============================================================================

export interface JavaProcessOptions {
  /** Java home directory */
  javaHome?: string;
  /** Classpath entries */
  classpath?: string[];
  /** JVM arguments */
  jvmArgs?: string[];
  /** Main class to run */
  mainClass?: string;
  /** Program arguments */
  args?: string[];
  /** Working directory */
  cwd?: string;
  /** Environment variables */
  env?: Record<string, string>;
  /** Inherit stdio */
  inheritStdio?: boolean;
}

export interface SpringBootConfig {
  /** Application name */
  name: string;
  /** Server port */
  port?: number;
  /** Active profiles */
  profiles?: string[];
  /** PhilJS integration enabled */
  philjsEnabled?: boolean;
  /** Static resources path */
  staticPath?: string;
  /** Additional properties */
  properties?: Record<string, string | number | boolean>;
}

export interface MavenDependency {
  groupId: string;
  artifactId: string;
  version: string;
  scope?: 'compile' | 'provided' | 'runtime' | 'test';
}

export interface GradleDependency {
  configuration: 'implementation' | 'compileOnly' | 'runtimeOnly' | 'testImplementation';
  notation: string;
}

export interface JavaVersion {
  major: number;
  minor: number;
  patch: number;
  vendor?: string;
  fullVersion: string;
}

export interface JvmInfo {
  version: JavaVersion;
  home: string;
  isJdk: boolean;
  vmName: string;
}

// ============================================================================
// Java Process Management
// ============================================================================

/**
 * Find Java executable in system PATH or JAVA_HOME
 */
export function findJava(javaHome?: string): string | null {
  const home = javaHome || process.env.JAVA_HOME;

  if (home) {
    const javaBin = process.platform === 'win32'
      ? join(home, 'bin', 'java.exe')
      : join(home, 'bin', 'java');
    if (existsSync(javaBin)) return javaBin;
  }

  // Check common locations
  const commonPaths = process.platform === 'win32'
    ? [
        'C:\\Program Files\\Java\\jdk*\\bin\\java.exe',
        'C:\\Program Files\\Eclipse Adoptium\\jdk*\\bin\\java.exe',
      ]
    : [
        '/usr/bin/java',
        '/usr/local/bin/java',
        '/opt/java/bin/java',
      ];

  for (const path of commonPaths) {
    if (!path.includes('*') && existsSync(path)) {
      return path;
    }
  }

  return null;
}

/**
 * Get JVM information from java executable
 */
export async function getJvmInfo(javaPath?: string): Promise<JvmInfo | null> {
  const java = javaPath || findJava();
  if (!java) return null;

  return new Promise((resolve) => {
    const proc = spawn(java, ['-version'], { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';

    proc.stderr.on('data', (data) => { output += data.toString(); });
    proc.stdout.on('data', (data) => { output += data.toString(); });

    proc.on('close', (code) => {
      if (code !== 0) {
        resolve(null);
        return;
      }

      const versionMatch = output.match(/version "(\d+)(?:\.(\d+))?(?:\.(\d+))?/);
      if (!versionMatch) {
        resolve(null);
        return;
      }

      const major = parseInt(versionMatch[1], 10);
      const minor = parseInt(versionMatch[2] || '0', 10);
      const patch = parseInt(versionMatch[3] || '0', 10);

      const vmMatch = output.match(/^(.+) \(/m);
      const vmName = vmMatch ? vmMatch[1] : 'Unknown';

      const home = java.replace(/[/\\]bin[/\\]java(\.exe)?$/, '');
      const isJdk = existsSync(join(home, 'lib', 'tools.jar')) ||
                    existsSync(join(home, 'bin', 'javac')) ||
                    existsSync(join(home, 'bin', 'javac.exe'));

      resolve({
        version: {
          major,
          minor,
          patch,
          fullVersion: `${major}.${minor}.${patch}`,
        },
        home,
        isJdk,
        vmName,
      });
    });
  });
}

/**
 * Run a Java process
 */
export function runJava(options: JavaProcessOptions): ChildProcess {
  const java = findJava(options.javaHome);
  if (!java) {
    throw new Error('Java executable not found. Set JAVA_HOME or provide javaHome option.');
  }

  const args: string[] = [];

  // JVM arguments
  if (options.jvmArgs) {
    args.push(...options.jvmArgs);
  }

  // Classpath
  if (options.classpath && options.classpath.length > 0) {
    const separator = process.platform === 'win32' ? ';' : ':';
    args.push('-cp', options.classpath.join(separator));
  }

  // Main class
  if (options.mainClass) {
    args.push(options.mainClass);
  }

  // Program arguments
  if (options.args) {
    args.push(...options.args);
  }

  const spawnOptions: SpawnOptions = {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    stdio: options.inheritStdio ? 'inherit' : 'pipe',
  };

  return spawn(java, args, spawnOptions);
}

/**
 * Run a JAR file
 */
export function runJar(
  jarPath: string,
  options: Omit<JavaProcessOptions, 'mainClass' | 'classpath'> = {}
): ChildProcess {
  const java = findJava(options.javaHome);
  if (!java) {
    throw new Error('Java executable not found.');
  }

  const args: string[] = [];

  if (options.jvmArgs) {
    args.push(...options.jvmArgs);
  }

  args.push('-jar', resolve(jarPath));

  if (options.args) {
    args.push(...options.args);
  }

  return spawn(java, args, {
    cwd: options.cwd,
    env: { ...process.env, ...options.env },
    stdio: options.inheritStdio ? 'inherit' : 'pipe',
  });
}

// ============================================================================
// Spring Boot Integration
// ============================================================================

/**
 * Generate Spring Boot application.properties
 */
export function generateSpringProperties(config: SpringBootConfig): string {
  const lines: string[] = [
    `# Generated by @philjs/java`,
    `spring.application.name=${config.name}`,
  ];

  if (config.port) {
    lines.push(`server.port=${config.port}`);
  }

  if (config.profiles && config.profiles.length > 0) {
    lines.push(`spring.profiles.active=${config.profiles.join(',')}`);
  }

  if (config.philjsEnabled !== false) {
    lines.push(`philjs.enabled=true`);
  }

  if (config.staticPath) {
    lines.push(`spring.web.resources.static-locations=classpath:/static/,file:${config.staticPath}/`);
  }

  if (config.properties) {
    for (const [key, value] of Object.entries(config.properties)) {
      lines.push(`${key}=${value}`);
    }
  }

  return lines.join('\n');
}

/**
 * Generate Spring Boot application.yml
 */
export function generateSpringYaml(config: SpringBootConfig): string {
  const yaml: Record<string, unknown> = {
    spring: {
      application: {
        name: config.name,
      },
    },
  };

  if (config.profiles && config.profiles.length > 0) {
    (yaml.spring as Record<string, unknown>).profiles = {
      active: config.profiles.join(','),
    };
  }

  if (config.port) {
    yaml.server = { port: config.port };
  }

  if (config.philjsEnabled !== false) {
    yaml.philjs = { enabled: true };
  }

  return stringifyYaml(yaml);
}

function stringifyYaml(obj: unknown, indent = 0): string {
  if (obj === null || obj === undefined) return 'null';
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);

  if (Array.isArray(obj)) {
    return obj.map((item) => `${' '.repeat(indent)}- ${stringifyYaml(item, indent + 2)}`).join('\n');
  }

  if (typeof obj === 'object') {
    const entries = Object.entries(obj);
    return entries
      .map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          return `${' '.repeat(indent)}${key}:\n${stringifyYaml(value, indent + 2)}`;
        }
        return `${' '.repeat(indent)}${key}: ${stringifyYaml(value, indent)}`;
      })
      .join('\n');
  }

  return String(obj);
}

/**
 * Write Spring Boot configuration to project
 */
export function writeSpringConfig(
  projectDir: string,
  config: SpringBootConfig,
  format: 'properties' | 'yaml' = 'properties'
): void {
  const resourcesDir = join(projectDir, 'src', 'main', 'resources');

  if (!existsSync(resourcesDir)) {
    mkdirSync(resourcesDir, { recursive: true });
  }

  const filename = format === 'yaml' ? 'application.yml' : 'application.properties';
  const content = format === 'yaml'
    ? generateSpringYaml(config)
    : generateSpringProperties(config);

  writeFileSync(join(resourcesDir, filename), content, 'utf-8');
}

// ============================================================================
// Build Tool Integration
// ============================================================================

/**
 * PhilJS Maven dependency
 */
export const PHILJS_MAVEN_DEPENDENCY: MavenDependency = {
  groupId: 'com.philjs',
  artifactId: 'philjs-spring-boot-starter',
  version: '0.1.0',
  scope: 'compile',
};

/**
 * Generate Maven dependency XML
 */
export function toMavenDependency(dep: MavenDependency): string {
  let xml = `    <dependency>\n`;
  xml += `      <groupId>${dep.groupId}</groupId>\n`;
  xml += `      <artifactId>${dep.artifactId}</artifactId>\n`;
  xml += `      <version>${dep.version}</version>\n`;
  if (dep.scope && dep.scope !== 'compile') {
    xml += `      <scope>${dep.scope}</scope>\n`;
  }
  xml += `    </dependency>`;
  return xml;
}

/**
 * PhilJS Gradle dependency
 */
export const PHILJS_GRADLE_DEPENDENCY: GradleDependency = {
  configuration: 'implementation',
  notation: 'com.philjs:philjs-spring-boot-starter:0.1.0',
};

/**
 * Generate Gradle dependency line
 */
export function toGradleDependency(dep: GradleDependency): string {
  return `${dep.configuration} '${dep.notation}'`;
}

// ============================================================================
// Spring Boot Runner
// ============================================================================

export interface SpringBootRunnerOptions {
  /** Project directory containing pom.xml or build.gradle */
  projectDir: string;
  /** Additional profiles to activate */
  profiles?: string[];
  /** Debug port for remote debugging */
  debugPort?: number;
  /** Additional JVM arguments */
  jvmArgs?: string[];
  /** Build tool: 'maven' or 'gradle' */
  buildTool?: 'maven' | 'gradle';
}

/**
 * Detect build tool in a Spring Boot project
 */
export function detectBuildTool(projectDir: string): 'maven' | 'gradle' | null {
  if (existsSync(join(projectDir, 'pom.xml'))) return 'maven';
  if (existsSync(join(projectDir, 'build.gradle')) ||
      existsSync(join(projectDir, 'build.gradle.kts'))) return 'gradle';
  return null;
}

/**
 * Run a Spring Boot application
 */
export function runSpringBoot(options: SpringBootRunnerOptions): ChildProcess {
  const buildTool = options.buildTool || detectBuildTool(options.projectDir);
  if (!buildTool) {
    throw new Error('Could not detect build tool. Ensure pom.xml or build.gradle exists.');
  }

  const args: string[] = [];
  const env: Record<string, string> = {};

  // Build profiles argument
  if (options.profiles && options.profiles.length > 0) {
    env.SPRING_PROFILES_ACTIVE = options.profiles.join(',');
  }

  // Debug configuration
  if (options.debugPort) {
    const debugArg = `-agentlib:jdwp=transport=dt_socket,server=y,suspend=n,address=*:${options.debugPort}`;
    if (buildTool === 'maven') {
      env.MAVEN_OPTS = debugArg;
    } else {
      args.push(`-Dorg.gradle.jvmargs="${debugArg}"`);
    }
  }

  // Additional JVM args
  if (options.jvmArgs && options.jvmArgs.length > 0) {
    if (buildTool === 'maven') {
      env.MAVEN_OPTS = (env.MAVEN_OPTS || '') + ' ' + options.jvmArgs.join(' ');
    }
  }

  const command = buildTool === 'maven'
    ? process.platform === 'win32' ? 'mvnw.cmd' : './mvnw'
    : process.platform === 'win32' ? 'gradlew.bat' : './gradlew';

  const runArgs = buildTool === 'maven'
    ? ['spring-boot:run', ...args]
    : ['bootRun', ...args];

  return spawn(command, runArgs, {
    cwd: options.projectDir,
    env: { ...process.env, ...env },
    stdio: 'inherit',
    shell: true,
  });
}

// ============================================================================
// Project Scaffolding
// ============================================================================

export interface SpringBootProjectOptions {
  /** Project name */
  name: string;
  /** Group ID */
  groupId?: string;
  /** Artifact ID */
  artifactId?: string;
  /** Java version */
  javaVersion?: 17 | 21 | 22;
  /** Spring Boot version */
  springBootVersion?: string;
  /** Additional dependencies */
  dependencies?: string[];
  /** Include PhilJS integration */
  includePhiljs?: boolean;
}

/**
 * Generate pom.xml for a Spring Boot project with PhilJS integration
 */
export function generatePomXml(options: SpringBootProjectOptions): string {
  const groupId = options.groupId || 'com.example';
  const artifactId = options.artifactId || options.name.toLowerCase().replace(/\s+/g, '-');
  const javaVersion = options.javaVersion || 21;
  const springBootVersion = options.springBootVersion || '3.2.0';

  const dependencies = [`
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-web</artifactId>
    </dependency>`];

  if (options.includePhiljs !== false) {
    dependencies.push(toMavenDependency(PHILJS_MAVEN_DEPENDENCY));
  }

  if (options.dependencies) {
    for (const dep of options.dependencies) {
      if (dep === 'data-jpa') {
        dependencies.push(`
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>`);
      } else if (dep === 'security') {
        dependencies.push(`
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-security</artifactId>
    </dependency>`);
      }
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>${springBootVersion}</version>
    <relativePath/>
  </parent>

  <groupId>${groupId}</groupId>
  <artifactId>${artifactId}</artifactId>
  <version>0.1.0-SNAPSHOT</version>
  <name>${options.name}</name>
  <description>Spring Boot project with PhilJS integration</description>

  <properties>
    <java.version>${javaVersion}</java.version>
  </properties>

  <dependencies>
${dependencies.join('\n')}
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
      </plugin>
    </plugins>
  </build>
</project>`;
}

// ============================================================================
// Exports
// ============================================================================

export default {
  findJava,
  getJvmInfo,
  runJava,
  runJar,
  generateSpringProperties,
  generateSpringYaml,
  writeSpringConfig,
  toMavenDependency,
  toGradleDependency,
  detectBuildTool,
  runSpringBoot,
  generatePomXml,
  PHILJS_MAVEN_DEPENDENCY,
  PHILJS_GRADLE_DEPENDENCY,
};
