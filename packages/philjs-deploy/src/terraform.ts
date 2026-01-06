
export interface DeployConfig {
    appName: string;
    cloud: 'aws' | 'gcp' | 'azure';
    region?: string;
    resources?: string[]; // e.g., ["database", "cache", "storage"]
}

export class TerraformGenerator {
    generate(config: DeployConfig): Record<string, string> {
        const region = config.region || (config.cloud === 'aws' ? 'us-east-1' : config.cloud === 'gcp' ? 'us-central1' : 'eastus');

        let mainTf = this.generateProvider(config.cloud, region);
        mainTf += `\n\n# Application: ${config.appName}\n`;

        if (config.resources?.includes('database')) {
            mainTf += this.generateDatabase(config.cloud, config.appName);
        }

        if (config.resources?.includes('cache')) {
            mainTf += this.generateCache(config.cloud, config.appName);
        }

        if (config.resources?.includes('storage')) {
            mainTf += this.generateStorage(config.cloud, config.appName);
        }

        return {
            'main.tf': mainTf,
            'variables.tf': this.generateVariables(config),
        };
    }

    private generateProvider(cloud: string, region: string): string {
        switch (cloud) {
            case 'aws':
                return `provider "aws" {\n  region = "${region}"\n}`;
            case 'gcp':
                return `provider "google" {\n  region = "${region}"\n  project = var.project_id\n}`;
            case 'azure':
                return `provider "azurerm" {\n  features {}\n}`;
            default:
                throw new Error(`Unsupported cloud: ${cloud}`);
        }
    }

    private generateDatabase(cloud: string, appName: string): string {
        switch (cloud) {
            case 'aws':
                return `
resource "aws_db_instance" "default" {
  allocated_storage    = 10
  db_name              = "${appName.replace(/-/g, '_')}_db"
  engine               = "postgres"
  instance_class       = "db.t3.micro"
  username             = var.db_username
  password             = var.db_password
  skip_final_snapshot  = true
}
`;
            case 'gcp':
                return `
resource "google_sql_database_instance" "master" {
  name             = "${appName}-db-instance"
  database_version = "POSTGRES_13"
  settings {
    tier = "db-f1-micro"
  }
}
`;
            case 'azure':
                return `
resource "azurerm_postgresql_server" "example" {
  name                = "${appName}-psql"
  location            = azurerm_resource_group.example.location
  resource_group_name = azurerm_resource_group.example.name
  sku_name            = "B_Gen5_1"
  version             = "11"
}
`;
            default:
                return '';
        }
    }

    private generateCache(cloud: string, appName: string): string {
        switch (cloud) {
            case 'aws':
                return `
resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "${appName}-redis"
  engine               = "redis"
  node_type            = "cache.t3.micro"
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
}
`;
            case 'gcp':
                return `
resource "google_redis_instance" "cache" {
  name           = "${appName}-redis"
  tier           = "BASIC"
  memory_size_gb = 1
  region         = var.region

  redis_version  = "REDIS_7_0"
  display_name   = "${appName} Redis Cache"
}
`;
            case 'azure':
                return `
resource "azurerm_redis_cache" "example" {
  name                = "${appName}-redis"
  location            = azurerm_resource_group.example.location
  resource_group_name = azurerm_resource_group.example.name
  capacity            = 0
  family              = "C"
  sku_name            = "Basic"
  enable_non_ssl_port = false
  minimum_tls_version = "1.2"
}
`;
            default:
                return '';
        }
    }

    private generateStorage(cloud: string, appName: string): string {
        switch (cloud) {
            case 'aws':
                return `
resource "aws_s3_bucket" "assets" {
  bucket = "${appName}-assets"
  acl    = "private"
}
`;
            default:
                return `\n# Storage for ${appName} (${cloud})\n`;
        }
    }

    private generateVariables(config: DeployConfig): string {
        let vars = `variable "environment" {\n  default = "production"\n}\n`;
        if (config.resources?.includes('database')) {
            vars += `variable "db_username" {}\nvariable "db_password" {}\n`;
        }
        if (config.cloud === 'gcp') {
            vars += `variable "project_id" {}\n`;
        }
        return vars;
    }
}
