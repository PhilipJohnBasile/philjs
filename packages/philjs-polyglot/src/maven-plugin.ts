
export interface MavenDependency {
  groupId: string;
  artifactId: string;
  version: string;
  scope?: 'compile' | 'provided' | 'runtime' | 'test' | 'system';
}

export interface MavenPluginConfig {
  groupId: string;
  artifactId: string;
  version: string;
  packaging?: 'jar' | 'war' | 'pom';
  name?: string;
  dependencies?: MavenDependency[];
  properties?: Record<string, string>;
  buildPlugins?: MavenDependency[]; // Reusing interface for plugins
}

export function generatePomXml(config: MavenPluginConfig): string {
  const depsXml = config.dependencies?.map(d => \`
        <dependency>
            <groupId>\${d.groupId}</groupId>
            <artifactId>\${d.artifactId}</artifactId>
            <version>\${d.version}</version>
            \${d.scope ? \`<scope>\${d.scope}</scope>\` : ''}
        </dependency>\`).join('') || '';

    const propsXml = config.properties ? Object.entries(config.properties)
        .map(([k, v]) => \`        <\${k}>\${v}</\${k}>\`)
        .join('\\n') : '';

    return \`<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>\${config.groupId}</groupId>
    <artifactId>\${config.artifactId}</artifactId>
    <version>\${config.version}</version>
    <packaging>\${config.packaging || 'jar'}</packaging>
    \${config.name ? \`<name>\${config.name}</name>\` : ''}

    <properties>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
        <maven.compiler.source>17</maven.compiler.source>
        <maven.compiler.target>17</maven.compiler.target>
\${propsXml}
    </properties>

    <dependencies>\${depsXml}
    </dependencies>

    <build>
        <plugins>
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-compiler-plugin</artifactId>
                <version>3.8.1</version>
            </plugin>
        </plugins>
    </build>
</project>\`;
}
