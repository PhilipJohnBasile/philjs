export const railwayToml = (appName: string) => `
[build]
builder = "nixpacks"
buildCommand = "pnpm run build"

[deploy]
startCommand = "pnpm run start"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "on_failure"

[service]
name = "${appName}"
`;
