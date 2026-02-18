/**
 * @philjs/webstorm
 *
 * WebStorm/IntelliJ IDEA plugin utilities for PhilJS.
 * Provides tooling for generating plugin configurations and live templates.
 */

import { join, resolve } from 'node:path';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';

// ============================================================================
// Types
// ============================================================================

export interface PluginConfig {
  id: string;
  name: string;
  version: string;
  vendor: {
    name: string;
    email?: string;
    url?: string;
  };
  description: string;
  changeNotes?: string;
  ideaVersion?: {
    sinceBuild?: string;
    untilBuild?: string;
  };
  dependencies?: string[];
}

export interface LiveTemplate {
  name: string;
  abbreviation: string;
  description: string;
  template: string;
  context?: 'TypeScript' | 'JavaScript' | 'HTML' | 'OTHER';
  variables?: Array<{
    name: string;
    expression?: string;
    defaultValue?: string;
    alwaysStopAt?: boolean;
  }>;
}

export interface LiveTemplateGroup {
  name: string;
  templates: LiveTemplate[];
}

export interface FileType {
  name: string;
  extensions: string[];
  icon?: string;
}

// ============================================================================
// Plugin Generation
// ============================================================================

/**
 * Generate IntelliJ plugin.xml content
 */
export function generatePluginXml(config: PluginConfig): string {
  const vendor = config.vendor.email || config.vendor.url
    ? `<vendor${config.vendor.email ? ` email="${escapeXml(config.vendor.email)}"` : ''}${config.vendor.url ? ` url="${escapeXml(config.vendor.url)}"` : ''}>${escapeXml(config.vendor.name)}</vendor>`
    : `<vendor>${escapeXml(config.vendor.name)}</vendor>`;

  const ideaVersion = config.ideaVersion
    ? `<idea-version${config.ideaVersion.sinceBuild ? ` since-build="${config.ideaVersion.sinceBuild}"` : ''}${config.ideaVersion.untilBuild ? ` until-build="${config.ideaVersion.untilBuild}"` : ''}/>`
    : '';

  const dependencies = config.dependencies
    ? config.dependencies.map(dep => `  <depends>${escapeXml(dep)}</depends>`).join('\n')
    : '  <depends>com.intellij.modules.platform</depends>';

  const changeNotes = config.changeNotes
    ? `<change-notes><![CDATA[${config.changeNotes}]]></change-notes>`
    : '';

  return `<idea-plugin>
  <id>${escapeXml(config.id)}</id>
  <name>${escapeXml(config.name)}</name>
  <version>${escapeXml(config.version)}</version>
  ${vendor}

  <description><![CDATA[${config.description}]]></description>
  ${changeNotes}
  ${ideaVersion}
${dependencies}

  <extensions defaultExtensionNs="com.intellij">
  </extensions>
</idea-plugin>`;
}

/**
 * Write plugin.xml to project directory
 */
export function writePluginXml(projectDir: string, config: PluginConfig): void {
  const metaInfDir = join(projectDir, 'src', 'main', 'resources', 'META-INF');
  if (!existsSync(metaInfDir)) {
    mkdirSync(metaInfDir, { recursive: true });
  }

  const content = generatePluginXml(config);
  writeFileSync(join(metaInfDir, 'plugin.xml'), content, 'utf-8');
}

// ============================================================================
// Live Templates
// ============================================================================

/**
 * PhilJS signal live templates
 */
export const PHILJS_TEMPLATES: LiveTemplateGroup = {
  name: 'PhilJS',
  templates: [
    {
      name: 'signal',
      abbreviation: 'sig',
      description: 'Create a PhilJS signal',
      template: 'const $NAME$ = signal<$TYPE$>($VALUE$);$END$',
      context: 'TypeScript',
      variables: [
        { name: 'NAME', expression: 'suggestVariableName()', alwaysStopAt: true },
        { name: 'TYPE', defaultValue: 'unknown', alwaysStopAt: true },
        { name: 'VALUE', defaultValue: '', alwaysStopAt: true },
      ],
    },
    {
      name: 'memo',
      abbreviation: 'memo',
      description: 'Create a PhilJS memo (computed signal)',
      template: 'const $NAME$ = memo(() => {\n  return $EXPR$;\n});$END$',
      context: 'TypeScript',
      variables: [
        { name: 'NAME', expression: 'suggestVariableName()', alwaysStopAt: true },
        { name: 'EXPR', defaultValue: '', alwaysStopAt: true },
      ],
    },
    {
      name: 'effect',
      abbreviation: 'eff',
      description: 'Create a PhilJS effect',
      template: 'effect(() => {\n  $BODY$\n});$END$',
      context: 'TypeScript',
      variables: [
        { name: 'BODY', defaultValue: '', alwaysStopAt: true },
      ],
    },
    {
      name: 'component',
      abbreviation: 'comp',
      description: 'Create a PhilJS component',
      template: 'export function $NAME$($PROPS$) {\n  return html`\n    <div>\n      $CONTENT$\n    </div>\n  `;\n}$END$',
      context: 'TypeScript',
      variables: [
        { name: 'NAME', expression: 'capitalize(fileNameWithoutExtension())', alwaysStopAt: true },
        { name: 'PROPS', defaultValue: '', alwaysStopAt: true },
        { name: 'CONTENT', defaultValue: '', alwaysStopAt: true },
      ],
    },
    {
      name: 'batch',
      abbreviation: 'batch',
      description: 'Create a PhilJS batch update',
      template: 'batch(() => {\n  $BODY$\n});$END$',
      context: 'TypeScript',
      variables: [
        { name: 'BODY', defaultValue: '', alwaysStopAt: true },
      ],
    },
    {
      name: 'resource',
      abbreviation: 'res',
      description: 'Create a PhilJS resource',
      template: 'const $NAME$ = resource(async () => {\n  return $EXPR$;\n});$END$',
      context: 'TypeScript',
      variables: [
        { name: 'NAME', expression: 'suggestVariableName()', alwaysStopAt: true },
        { name: 'EXPR', defaultValue: 'await fetch()', alwaysStopAt: true },
      ],
    },
    {
      name: 'linkedSignal',
      abbreviation: 'lsig',
      description: 'Create a PhilJS linked signal',
      template: 'const $NAME$ = linkedSignal(() => $SOURCE$);$END$',
      context: 'TypeScript',
      variables: [
        { name: 'NAME', expression: 'suggestVariableName()', alwaysStopAt: true },
        { name: 'SOURCE', defaultValue: '', alwaysStopAt: true },
      ],
    },
  ],
};

/**
 * Generate IntelliJ live template XML
 */
export function generateLiveTemplateXml(group: LiveTemplateGroup): string {
  const templates = group.templates.map(template => {
    const vars = template.variables
      ? template.variables.map(v => {
          const attrs = [
            `name="${escapeXml(v.name)}"`,
            v.expression ? `expression="${escapeXml(v.expression)}"` : '',
            v.defaultValue !== undefined ? `defaultValue="${escapeXml(v.defaultValue)}"` : '',
            v.alwaysStopAt !== undefined ? `alwaysStopAt="${v.alwaysStopAt}"` : '',
          ].filter(Boolean).join(' ');
          return `      <variable ${attrs}/>`;
        }).join('\n')
      : '';

    const context = template.context || 'OTHER';
    const contextElement = `      <context>\n        <option name="${context}" value="true"/>\n      </context>`;

    return `    <template name="${escapeXml(template.abbreviation)}"
              value="${escapeXml(template.template)}"
              description="${escapeXml(template.description)}"
              toReformat="true"
              toShortenFQNames="true">
${vars}
${contextElement}
    </template>`;
  }).join('\n\n');

  return `<templateSet group="${escapeXml(group.name)}">
${templates}
</templateSet>`;
}

/**
 * Write live templates to user's IDE config directory
 */
export function writeLiveTemplates(configDir: string, group: LiveTemplateGroup): void {
  const templatesDir = join(configDir, 'templates');
  if (!existsSync(templatesDir)) {
    mkdirSync(templatesDir, { recursive: true });
  }

  const content = generateLiveTemplateXml(group);
  const filename = `${group.name.toLowerCase().replace(/\s+/g, '-')}.xml`;
  writeFileSync(join(templatesDir, filename), content, 'utf-8');
}

/**
 * Get WebStorm/IntelliJ config directory for the current OS
 */
export function getIdeConfigDir(ideName: string = 'WebStorm'): string | null {
  const home = process.env.HOME || process.env.USERPROFILE;
  if (!home) return null;

  const platform = process.platform;
  const year = new Date().getFullYear();
  const version = `${year}.1`;

  if (platform === 'darwin') {
    return join(home, 'Library', 'Application Support', 'JetBrains', `${ideName}${version}`);
  } else if (platform === 'win32') {
    return join(home, 'AppData', 'Roaming', 'JetBrains', `${ideName}${version}`);
  } else {
    return join(home, `.config/JetBrains/${ideName}${version}`);
  }
}

// ============================================================================
// File Type Registration
// ============================================================================

/**
 * Generate file type XML for custom file extensions
 */
export function generateFileTypeXml(fileType: FileType): string {
  const patterns = fileType.extensions.map(ext => `      <wildcardPattern pattern="*.${ext}"/>`).join('\n');

  return `<component name="FileTypeManager" version="18">
  <extensionMap>
    <mapping ext="${fileType.extensions[0]}" type="${escapeXml(fileType.name)}"/>
  </extensionMap>
  <filetype binary="false" name="${escapeXml(fileType.name)}" description="${escapeXml(fileType.name)} files">
    <wildcardPatterns>
${patterns}
    </wildcardPatterns>
  </filetype>
</component>`;
}

// ============================================================================
// Code Snippets Export
// ============================================================================

/**
 * Export PhilJS snippets as JSON (for VS Code compatibility check)
 */
export function exportSnippetsAsJson(): Record<string, {
  prefix: string;
  body: string[];
  description: string;
}> {
  const snippets: Record<string, { prefix: string; body: string[]; description: string }> = {};

  for (const template of PHILJS_TEMPLATES.templates) {
    snippets[template.name] = {
      prefix: template.abbreviation,
      body: template.template.split('\n').map(line =>
        line.replace(/\$([A-Z]+)\$/g, '${$1}').replace(/\$END\$/g, '$0')
      ),
      description: template.description,
    };
  }

  return snippets;
}

// ============================================================================
// Plugin Project Scaffolding
// ============================================================================

export interface PluginProjectOptions {
  name: string;
  packageName?: string;
  version?: string;
  outputDir?: string;
  includeTemplates?: boolean;
}

/**
 * Scaffold a new IntelliJ plugin project structure
 */
export function scaffoldPluginProject(options: PluginProjectOptions): void {
  const dir = options.outputDir || `./${options.name.toLowerCase().replace(/\s+/g, '-')}`;
  const packageName = options.packageName || `com.philjs.${options.name.toLowerCase().replace(/\s+/g, '')}`;

  // Create directories
  const dirs = [
    join(dir, 'src', 'main', 'resources', 'META-INF'),
    join(dir, 'src', 'main', 'kotlin', ...packageName.split('.')),
  ];

  for (const d of dirs) {
    if (!existsSync(d)) {
      mkdirSync(d, { recursive: true });
    }
  }

  // Write plugin.xml
  writePluginXml(dir, {
    id: packageName,
    name: options.name,
    version: options.version || '1.0.0',
    vendor: {
      name: 'PhilJS Team',
      email: 'support@philjs.dev',
      url: 'https://philjs.dev',
    },
    description: `${options.name} plugin for IntelliJ IDEA and WebStorm.`,
  });

  // Write build.gradle.kts
  const buildGradle = `plugins {
    id("org.jetbrains.kotlin.jvm") version "1.9.0"
    id("org.jetbrains.intellij") version "1.15.0"
}

group = "${packageName}"
version = "${options.version || '1.0.0'}"

repositories {
    mavenCentral()
}

intellij {
    version.set("2023.1")
    type.set("IU")
    plugins.set(listOf("JavaScript"))
}

tasks {
    patchPluginXml {
        sinceBuild.set("231")
        untilBuild.set("241.*")
    }
}
`;

  writeFileSync(join(dir, 'build.gradle.kts'), buildGradle, 'utf-8');

  // Write settings.gradle.kts
  writeFileSync(join(dir, 'settings.gradle.kts'), `rootProject.name = "${options.name}"\n`, 'utf-8');

  // Write .gitignore
  writeFileSync(join(dir, '.gitignore'), `build/
.gradle/
.idea/
*.iml
out/
`, 'utf-8');
}

// ============================================================================
// Installation
// ============================================================================

/**
 * Install PhilJS live templates to WebStorm/IntelliJ
 */
export function installTemplates(ideName: string = 'WebStorm'): boolean {
  const configDir = getIdeConfigDir(ideName);
  if (!configDir) {
    console.error('Could not determine IDE config directory');
    return false;
  }

  try {
    writeLiveTemplates(configDir, PHILJS_TEMPLATES);
    console.log(`Templates installed to: ${configDir}/templates/`);
    return true;
  } catch (error) {
    console.error('Failed to install templates:', error);
    return false;
  }
}

// ============================================================================
// Utilities
// ============================================================================

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ============================================================================
// Exports
// ============================================================================

export default {
  generatePluginXml,
  writePluginXml,
  generateLiveTemplateXml,
  writeLiveTemplates,
  getIdeConfigDir,
  generateFileTypeXml,
  exportSnippetsAsJson,
  scaffoldPluginProject,
  installTemplates,
  PHILJS_TEMPLATES,
};
