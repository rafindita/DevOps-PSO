terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.0"
    }
  }
}

provider "azurerm" {
  features {}
}

# 1. RESOURCE GROUP
resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location
}

# 2. APP SERVICE PLAN (Linux)
resource "azurerm_service_plan" "main" {
  name                = var.app_service_plan_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  os_type             = "Linux"
  sku_name            = "B1" # Basic tier, murah untuk FP tapi cukup kuat
}

# 3. WEB APP FOR CONTAINERS
resource "azurerm_linux_web_app" "main" {
  name                = var.app_name
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  service_plan_id     = azurerm_service_plan.main.id

  site_config {
    always_on = false # Set ke true kalau pakai tier S1 ke atas
    
    application_stack {
      docker_image     = split(":", var.docker_image)[0]
      docker_image_tag = split(":", var.docker_image)[1]
    }
  }

  app_settings = {
    "WEBSITES_PORT"         = "3000"
    "DOCKER_REGISTRY_SERVER_URL" = "https://ghcr.io"
    "NODE_ENV"              = "production"
    "SKIP_ENV_VALIDATION"   = "1"
    "ENABLE_CRAWLER"        = "false" # Set true kalau sudah ada Redis di Azure
  }
}

output "web_app_url" {
  value = azurerm_linux_web_app.main.default_hostname
}
