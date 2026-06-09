variable "resource_group_name" {
  description = "Name of the resource group"
  default     = "ScholarSeek-RG"
}

variable "location" {
  description = "Azure region to deploy resources"
  default     = "Southeast Asia"
}

variable "app_service_plan_name" {
  description = "Name of the App Service Plan"
  default     = "asp-scholarseek-prod"
}

variable "app_name" {
  description = "Name of the Web App"
  default     = "scholar-seek-app"
}

variable "docker_image" {
  description = "Docker image to deploy"
  default     = "ghcr.io/danielbarz/devops-pso:latest"
}

variable "alert_email_address" {
  description = "Email address to receive critical alerts"
  default     = "your-email@example.com"
}

