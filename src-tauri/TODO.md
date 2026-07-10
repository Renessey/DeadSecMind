# TODO - Correções build (DeadSecMind / Tauri 2)

- [x] Unificar módulo `commands` removendo ambiguidade entre `src-tauri/src/commands.rs` e `src-tauri/src/commands/mod.rs`
  - [x] Mover o conteúdo de `commands.rs` para `commands/mod.rs` (ou para submódulo e re-export)
  - [x] Garantir que `notify_app` também esteja re-exportado no hub `commands`
  - [x] Ajustar `src-tauri/src/lib.rs` (imports/`use commands::*;`)
- [x] Corrigir `window.rs` importando `tauri::Manager` para liberar `get_webview_window`/`windows()`
- [x] Corrigir `notification_service.rs` importando `tauri_plugin_notification::NotificationExt` para liberar `app.notification()`
- [x] Corrigir `tray.rs` para API/Tauri 2 correta (namespaces e tipos)
- [ ] Corrigir `.system_tray(tray::build_tray())` em `lib.rs` (se exigir feature/trait/plugin)
- [ ] Validar build até funcionar o `npm run tauri dev`


