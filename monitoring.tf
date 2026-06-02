# ====================================================================
# 1. LOG ANALYTICS WORKSPACE (Wadah Penyimpanan Semua Log & Metrik)
# ====================================================================
resource "azurerm_log_analytics_workspace" "monitoring_law" {
  name                = "law-scholarseek-prod"
  location            = "Southeast Asia"
  resource_group_name = "ScholarSeek" # Pastikan nama Resource Group sesuai di Azure kalian
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

# ====================================================================
# 2. SENSOR DIAGNOSTIC SETTINGS (Menyaring Log Console Bun & Elysia)
# ====================================================================
resource "azurerm_monitor_diagnostic_setting" "elysia_bun_sensor" {
  name                       = "ds-elysia-bun-logs"
  
  # DISESUAIKAN: Menembak langsung ke ID resource Web App kelompokmu secara dinamis
  target_resource_id         = azurerm_linux_web_app.scholar_seek.id 
  log_analytics_workspace_id = azurerm_log_analytics_workspace.monitoring_law.id

  # Menangkap error internal, console.log(), dan jalannya query Drizzle ORM dari container Bun
  enabled_log {
    category = "AppServiceConsoleLogs"
  }

  metric {
    category = "AllMetrics"
  }
}

# ====================================================================
# 3. ACTION GROUP WEBHOOK (Jembatan Otomatis ke Google Sheets)
# ====================================================================
resource "azurerm_monitor_action_group" "sheets_webhook_target" {
  name                = "ag-scholarseek-alert"
  resource_group_name = "ScholarSeek"
  short_name          = "AlertSheets"

  webhook_receiver {
    name                    = "google-sheets-receiver"
    # DISESUAIKAN: Taruh URL Webhook Google Apps Script kelompokmu di sini jika sudah ada
    service_uri             = "https://your-google-sheets-webhook-url.com" 
    use_common_alert_schema = true
  }
}

# ====================================================================
# 4. METRIC ALERT RULE (Alarm Otomatis jika Server Crash / HTTP 5xx)
# ====================================================================
resource "azurerm_monitor_metric_alert" "http_5xx_critical_alert" {
  name                = "alert-critical-elysia-bun"
  resource_group_name = "ScholarSeek"
  
  # DISESUAIKAN: Menggunakan ID resource Web App yang sama
  scopes              = [azurerm_linux_web_app.scholar_seek.id]
  
  description         = "Alarm otomatis aktif jika API Elysia/Bun melempar error internal server HTTP 5xx."
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

