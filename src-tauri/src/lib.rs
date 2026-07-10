mod commands;
mod verification;
mod tray;
mod window;
pub mod services;

use commands::*;
use tauri::Manager;

// Importar comandos de privacidade
use commands::privacy_windows;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            tray::create_tray(app.app_handle())?;
            if let Some(icon) = app.default_window_icon().cloned() {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.set_icon(icon);
                }
            }
            Ok(())
        })
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let label = window.label().to_string();
                api.prevent_close();
                if label == "main" {
                    window::hide_main_window(&window.app_handle());
                } else {
                    window::hide_main_window(&window.app_handle());
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            get_system_info,
            get_cpu_metrics,
            get_memory_metrics,
            get_disk_metrics,
            get_network_metrics,
            get_top_processes,
            generate_system_alerts,
            get_uptime,
            get_security_protections_status,
            run_verification,
            notify_app,
            // Comandos de privacidade
            privacy_windows::get_privacy_summary,
            privacy_windows::get_privacy_recommendations,
            privacy_windows::set_defender_realtime_protection,
            privacy_windows::open_windows_security
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
