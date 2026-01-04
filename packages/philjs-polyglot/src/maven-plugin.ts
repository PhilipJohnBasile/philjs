
export interface MavenPluginConfig {
  groupId: string;
  artifactId: string;
  version: string;
  goals: string[];
  configuration?: Record<string, any>;
}

export function generateMavenPlugin(config: MavenPluginConfig) {
  const configXml = config.configuration
    ? Object.entries(config.configuration)
      .map(([k, v]) => `    <${k}>${v}</${k}>`)
      .join('\n')
    : '';

  const executions = config.goals.map(goal => `
        <execution>
          <goals>
            <goal>${goal}</goal>
          </goals>
        </execution>`).join('\n');

  return `<plugin>
  <groupId>${config.groupId}</groupId>
  <artifactId>${config.artifactId}</artifactId>
  <version>${config.version}</version>
  ${configXml ? `<configuration>\n${configXml}\n  </configuration>` : ''}
  <executions>${executions}
  </executions>
</plugin>`;
}
