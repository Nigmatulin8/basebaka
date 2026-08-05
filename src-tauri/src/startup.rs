use std::sync::Mutex;

use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager};

pub const EVENT_READY: &str = "server-startup-ready";
pub const EVENT_FAILED: &str = "server-startup-failed";

#[derive(Clone, Serialize)]
#[serde(tag = "status", rename_all = "camelCase")]
pub enum StartupStatusDto {
    Loading,
    Ready { port: u16 },
    Failed { message: String },
}

pub struct ServerStartup(Mutex<StartupStatusDto>);

impl ServerStartup {
    pub fn new() -> Self {
        Self(Mutex::new(StartupStatusDto::Loading))
    }

    pub fn snapshot(&self) -> StartupStatusDto {
        self.0.lock().unwrap().clone()
    }

    pub fn set_ready(&self, app: &AppHandle, port: u16) {
        *self.0.lock().unwrap() = StartupStatusDto::Ready { port };
        let _ = app.emit(EVENT_READY, port);
    }

    pub fn set_failed(&self, app: &AppHandle, message: String) {
        let dto = StartupStatusDto::Failed {
            message: message.clone(),
        };
        *self.0.lock().unwrap() = dto;
        let _ = app.emit(EVENT_FAILED, message);
    }
}

pub fn spawn_server_startup(app: AppHandle) {
    tauri::async_runtime::spawn(async move {
        let result = tauri::async_runtime::spawn_blocking({
            let app = app.clone();
            move || crate::server_sidecar::ServerSidecar::start_and_store(&app)
        })
        .await;

        match result {
            Ok(Ok(port)) => {
                if let Some(startup) = app.try_state::<ServerStartup>() {
                    startup.set_ready(&app, port);
                }
            }
            Ok(Err(error)) => {
                if let Some(startup) = app.try_state::<ServerStartup>() {
                    startup.set_failed(&app, error);
                }
            }
            Err(join_error) => {
                if let Some(startup) = app.try_state::<ServerStartup>() {
                    startup.set_failed(&app, format!("startup task failed: {join_error}"));
                }
            }
        }
    });
}
