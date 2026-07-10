use tauri::AppHandle;
use tauri::menu::{Menu, MenuItem, SubmenuBuilder};
use tauri::tray::TrayIconBuilder;
use crate::window::{hide_main_window, show_main_window};

const MENU_OPEN_ID: &str = "tray-open";
const MENU_HIDE_ID: &str = "tray-hide";
const MENU_QUIT_ID: &str = "tray-quit";

pub fn create_tray(app: &AppHandle) -> tauri::Result<()> {
    let open = MenuItem::with_id(app, MENU_OPEN_ID, "Abrir", true, None::<&str>)?;
    let hide = MenuItem::with_id(app, MENU_HIDE_ID, "Ocultar", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, MENU_QUIT_ID, "Sair", true, None::<&str>)?;
    
    let menu = Menu::with_items(app, &[
        &SubmenuBuilder::new(app, "DeadSecMind")
            .items(&[&open, &hide, &quit])
            .build()?
    ])?;
    
    let mut tray_builder = TrayIconBuilder::new()
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray, _event| {
            let app = tray.app_handle();
            show_main_window(app);
        })
        .on_menu_event(|app, event| match event.id().as_ref() {
            MENU_OPEN_ID => show_main_window(app),
            MENU_HIDE_ID => hide_main_window(app),
            MENU_QUIT_ID => app.exit(0),
            _ => {}
        });

    if let Some(icon) = app.default_window_icon().cloned() {
        tray_builder = tray_builder.icon(icon);
    }

    let _tray = tray_builder.build(app)?;
        
    Ok(())
}
