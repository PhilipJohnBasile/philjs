
// Stub for Maven Plugin Generator
export function generateMavenPlugin(artifactId: string) {
    return \`
<plugin>
  <groupId>com.philjs</groupId>
  <artifactId>philjs-maven-plugin</artifactId>
  <version>1.0.0</version>
  <configuration>
    <appDir>src/main/philjs</appDir>
  </configuration>
</plugin>
\`;
}
