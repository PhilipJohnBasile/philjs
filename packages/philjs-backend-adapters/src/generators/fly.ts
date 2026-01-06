export const flyToml = (appName: string) => `
# fly.toml app configuration file generated for ${appName} on ${new Date().toISOString()}
#
# See https://fly.io/docs/reference/configuration/ for information about how to use this file.
#

app = "${appName}"
primary_region = "ewr"
kill_signal = "SIGINT"
kill_timeout = "5s"

[experimental]
  auto_rollback = true

[build]
  [build.args]
    NODE_VERSION = "20"

[env]
  PORT = "8080"
  NODE_ENV = "production"

[[services]]
  protocol = "tcp"
  internal_port = 8080
  processes = ["app"]

  [[services.ports]]
    port = 80
    handlers = ["http"]
    force_https = true

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]
  
  [services.concurrency]
    type = "connections"
    hard_limit = 25
    soft_limit = 20

[[vm]]
  size = "shared-cpu-1x"
  memory = "1gb"
  cpus = 1
`;
