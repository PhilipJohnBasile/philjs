
import * as fs from 'fs';
import * as path from 'path';

// Stub for CLI Generators
export function scaffold(type: 'shadcn' | 'component' | 'route', name: string, dir: string = '.') {
  console.log(`Scaffolding ${type}: ${name} in ${dir}`);

  const componentName = name.charAt(0).toUpperCase() + name.slice(1);
  const fileName = `${name}.tsx`;
  const fullPath = path.join(dir, fileName);

  if (type === 'shadcn') {
    // Should verify component exists in registry and fetch it
    console.log('Fetching shadcn component registry...');
    // Mock registry fetch
    const template = `
import * as React from "react"
import { cn } from "@/lib/utils"

export interface ${componentName}Props extends React.HTMLAttributes<HTMLDivElement> {}

const ${componentName} = React.forwardRef<HTMLDivElement, ${componentName}Props>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("phil-ui-${name}", className)} {...props} />
  )
)
${componentName}.displayName = "${componentName}"

export { ${componentName} }
`;
    // In real CLI, fs.writeFileSync(fullPath, template);
    return template;
  }

  if (type === 'component') {
    return `export function ${componentName}() { return <div>${componentName}</div>; }`;
  }
}
