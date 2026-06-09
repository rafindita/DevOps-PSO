# ====================================================================
# 1. LOG ANALYTICS WORKSPACE
# ====================================================================
resource "azurerm_log_analytics_workspace" "monitoring_law" {
  name                = "law-scholarseek-prod"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

# ====================================================================
# 2. SENSOR DIAGNOSTIC SETTINGS (Dinamis mengambil ID dari Web App)
# ====================================================================
resource "azurerm_monitor_diagnostic_setting" "elysia_bun_sensor" {
  name                       = "ds-elysia-bun-logs"
  target_resource_id         = azurerm_linux_web_app.main.id
  log_analytics_workspace_id = azurerm_log_analytics_workspace.monitoring_law.id

  enabled_log {
    category = "AppServiceConsoleLogs"
  }

  metric {
    category = "AllMetrics"
  }
}

# ====================================================================
# 3. ACTION GROUP (Notifikasi via Email)
# ====================================================================
resource "azurerm_monitor_action_group" "main_alert_group" {
  name                = "ag-scholarseek-alert"
  resource_group_name = azurerm_resource_group.main.name
  short_name          = "Alerts"

  email_receiver {
    name                    = "send-to-admin"
    email_address           = var.alert_email_address
    use_common_alert_schema = true
  }
}

# ====================================================================
# 4. METRIC ALERT RULE
# ====================================================================
resource "azurerm_monitor_metric_alert" "http_5xx_critical_alert" {
  name                = "alert-critical-elysia-bun"
  resource_group_name = azurerm_resource_group.main.name
  
  scopes              = [azurerm_linux_web_app.main.id]
  
  description         = "Alarm otomatis aktif jika API Elysia melempar error HTTP 5xx."
  severity            = 1
  frequency           = "PT1M"
  window_size         = "PT5M"

  criteria {
    metric_namespace = "Microsoft.Web/sites"
    metric_name      = "Http5xx"
    aggregation      = "Total"
    operator         = "GreaterThan"
    threshold        = 5
  }

  action {
    action_group_id = azurerm_monitor_action_group.sheets_webhook_target.id
  }
}
 }
}
