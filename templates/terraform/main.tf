# PhilJS Terraform Module

terraform {
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
}

variable "app_name" { type = string }
variable "environment" { type = string, default = "production" }
variable "region" { type = string, default = "us-east-1" }

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "${var.app_name}-${var.environment}"
}

# ECR Repository
resource "aws_ecr_repository" "app" {
  name = var.app_name
  image_scanning_configuration { scan_on_push = true }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "app" {
  family                   = var.app_name
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "256"
  memory                   = "512"
  
  container_definitions = jsonencode([{
    name  = var.app_name
    image = "${aws_ecr_repository.app.repository_url}:latest"
    portMappings = [{ containerPort = 3000 }]
    environment = [
      { name = "NODE_ENV", value = var.environment }
    ]
  }])
}

output "ecr_url" { value = aws_ecr_repository.app.repository_url }
output "cluster_name" { value = aws_ecs_cluster.main.name }
