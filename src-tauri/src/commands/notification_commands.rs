use tauri::command;
use tauri::AppHandle;

use crate::services::notification_service::{
  NotificationPayload, NotificationSeverity, NotificationService,
};

#[command]
pub fn notify_app(
  app: AppHandle,
  title: String,
  body: String,
  severity: String,
  sound_enabled: bool,
) -> Result<(), String> {
  NotificationService::notify(
    &app,
    NotificationPayload {
      title,
      body,
      severity: NotificationSeverity::from_str(&severity),
      sound_enabled,
    },
  )
}
