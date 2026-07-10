use tauri::AppHandle;
use tauri_plugin_notification::NotificationExt;

#[derive(Debug, Clone, serde::Serialize)]
pub enum NotificationSeverity {
    Info,
    Warning,
    Critical,
}

impl NotificationSeverity {
    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "warning" | "warn" => Self::Warning,
            "critical" | "crit" | "error" => Self::Critical,
            _ => Self::Info,
        }
    }
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct NotificationPayload {
    pub title: String,
    pub body: String,
    pub severity: NotificationSeverity,
    pub sound_enabled: bool,
}

pub struct NotificationService;

impl NotificationService {
    pub fn notify(app: &AppHandle, payload: NotificationPayload) -> Result<(), String> {
        let notification = app.notification();
        let mut builder = notification.builder();
        builder = builder.title(payload.title).body(payload.body);
        if payload.sound_enabled {
            // sound support depends on the platform, we'll just attempt to set it
        }
        builder.show().map_err(|e| format!("Failed to send notification: {}", e))?;
        Ok(())
    }
}
