use std::fs;
use std::path::{Path, PathBuf};

use serde::Deserialize;
use tauri::{AppHandle, Manager};

pub const DEFAULT_SERVER_PORT: u16 = 3001;
pub const SERVER_HOST: &str = "127.0.0.1";
pub const SERVER_PORT_ENV: &str = "BASEBAKA_SERVER_PORT";

const CONFIG_FILE_NAME: &str = "basebaka.config.json";
const LOCAL_CONFIG_FILE_NAME: &str = "basebaka.config.local.json";

#[derive(Debug, Deserialize, Default)]
#[serde(rename_all = "camelCase")]
struct ConfigFile {
    server_port: Option<u16>,
}

/// Resolve listen port: env → local config → defaults config → 3001.
pub fn resolve_server_port(app: &AppHandle) -> u16 {
    if let Ok(raw) = std::env::var(SERVER_PORT_ENV) {
        if let Ok(port) = raw.parse::<u16>() {
            if port > 0 {
                return port;
            }
        }
        log::warn!("ignoring invalid {SERVER_PORT_ENV}={raw}");
    }

    for path in config_candidate_paths(app) {
        if let Some(port) = read_port_from_file(&path) {
            log::info!("using server port {port} from {}", path.display());
            return port;
        }
    }

    DEFAULT_SERVER_PORT
}

pub fn server_socket(port: u16) -> String {
    format!("{SERVER_HOST}:{port}")
}

fn read_port_from_file(path: &Path) -> Option<u16> {
    let contents = fs::read_to_string(path).ok()?;
    let parsed: ConfigFile = match serde_json::from_str(&contents) {
        Ok(value) => value,
        Err(error) => {
            log::warn!("ignoring invalid config {}: {error}", path.display());
            return None;
        }
    };

    match parsed.server_port {
        Some(port) if port > 0 => Some(port),
        Some(_) => {
            log::warn!("ignoring invalid serverPort in {}", path.display());
            None
        }
        None => None,
    }
}

fn config_candidate_paths(app: &AppHandle) -> Vec<PathBuf> {
    let mut paths = Vec::new();
    let mut push_pair = |root: PathBuf| {
        paths.push(root.join(LOCAL_CONFIG_FILE_NAME));
        paths.push(root.join(CONFIG_FILE_NAME));
    };

    if let Ok(cwd) = std::env::current_dir() {
        push_pair(cwd.clone());
        if let Some(parent) = cwd.parent() {
            push_pair(parent.to_path_buf());
        }
    }

    if let Ok(resource_dir) = app.path().resource_dir() {
        push_pair(resource_dir);
    }

    if let Ok(exe) = std::env::current_exe() {
        let mut dir = exe.parent().map(Path::to_path_buf);
        for _ in 0..8 {
            let Some(current) = dir else {
                break;
            };
            push_pair(current.clone());
            dir = current.parent().map(Path::to_path_buf);
        }
    }

    // Prefer local overrides first while keeping discovery order stable.
    let mut locals = Vec::new();
    let mut defaults = Vec::new();
    for path in paths {
        if path
            .file_name()
            .is_some_and(|name| name == LOCAL_CONFIG_FILE_NAME)
        {
            locals.push(path);
        } else {
            defaults.push(path);
        }
    }

    locals.extend(defaults);
    locals
}
