mod config;
mod server_sidecar;
mod startup;

use startup::{spawn_server_startup, ServerStartup, StartupStatusDto};
use tauri::{Manager, RunEvent};

#[tauri::command]
fn get_server_startup_state(startup: tauri::State<ServerStartup>) -> StartupStatusDto {
    startup.snapshot()
}

#[tauri::command]
fn restart_application(app: tauri::AppHandle) {
    app.restart();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_server_startup_state,
            restart_application,
        ])
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            app.manage(server_sidecar::ServerSidecar::empty());
            app.manage(ServerStartup::new());

            spawn_server_startup(app.handle().clone());

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            if let RunEvent::Exit = event {
                if let Some(sidecar) = app.try_state::<server_sidecar::ServerSidecar>() {
                    sidecar.stop();
                }
            }
        });
}
