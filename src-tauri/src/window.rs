use tauri::{AppHandle, Manager};

pub fn hide_main_window(app: &AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.hide();
    } else {
        for w in app.webview_windows().values() {
            let _ = w.hide();
        }
    }
}

pub fn show_main_window(app: &AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.set_focus();
    } else {
        for w in app.webview_windows().values() {
            let _ = w.show();
            let _ = w.set_focus();
            break;
        }
    }
}
