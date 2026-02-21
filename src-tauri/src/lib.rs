mod commands;
mod input;
mod physics;
mod state;

use std::sync::Arc;
use tauri::Manager;

use commands::{
    get_devices, get_permission_status, get_physics, get_status, get_velocity_graph,
    push_scroll_delta, start_daemon, stop_daemon, update_physics,
};
use state::{AppState, SharedState};

#[derive(Debug, Clone, Copy, Default)]
pub struct RunOptions {
    pub daemon_mode: bool,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    run_with_options(RunOptions::default());
}

pub fn run_with_options(options: RunOptions) {
    let daemon_mode = options.daemon_mode;

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(SharedState(Arc::new(AppState::new())))
        .setup(move |app| {
            if daemon_mode {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.hide();
                }

                let state = app.state::<SharedState>();
                if let Err(error) = commands::start_daemon_internal(&app.handle(), &state, None) {
                    eprintln!("failed to start daemon mode: {error}");
                }
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_physics,
            update_physics,
            get_status,
            get_velocity_graph,
            get_devices,
            get_permission_status,
            start_daemon,
            stop_daemon,
            push_scroll_delta
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
