use std::io::{BufRead, BufReader, Read};
use std::net::{SocketAddr, TcpStream};
use std::path::PathBuf;
use std::process::{Child, Command, Stdio};
use std::sync::Mutex;
use std::thread;
use std::time::{Duration, Instant};

use tauri::AppHandle;
use tauri::Manager;
use tauri_plugin_shell::ShellExt;

use crate::config::{apply_sidecar_env, resolve_server_port, server_socket, SERVER_PORT_ENV};

/// Must match `bundle.externalBin` in `tauri.conf.json`.
const SIDECAR_CONFIG_PATH: &str = "binaries/basabaka-server";

const READY_TIMEOUT: Duration = Duration::from_secs(30);
const READY_POLL_INTERVAL: Duration = Duration::from_millis(100);

pub struct ServerSidecar(Mutex<Option<Child>>);

impl ServerSidecar {
    pub fn empty() -> Self {
        Self(Mutex::new(None))
    }

    /// Spawns the sidecar, waits until it accepts connections, and stores the child process.
    /// Returns the resolved listen port.
    pub fn start_and_store(app: &AppHandle) -> Result<u16, String> {
        let sidecar = app
            .try_state::<Self>()
            .ok_or_else(|| "server sidecar state is not initialized".to_string())?;

        if sidecar.0.lock().unwrap().is_some() {
            return Ok(resolve_server_port(app));
        }

        let (child, port) = spawn_and_wait_ready(app)?;
        *sidecar.0.lock().unwrap() = Some(child);
        Ok(port)
    }

    pub fn stop(&self) {
        if let Some(mut child) = self.0.lock().unwrap().take() {
            let _ = child.kill();
            let _ = child.wait();
        }
    }
}

fn spawn_and_wait_ready(app: &AppHandle) -> Result<(Child, u16), String> {
    let port = resolve_server_port(app);
    let socket = server_socket(port);
    let server_addr: SocketAddr = socket
        .parse()
        .map_err(|error| format!("invalid server address `{socket}`: {error}"))?;

    // Stale sidecars (or a leftover `pnpm dev:server`) leave the port open and
    // make readiness look green while the new process dies with EADDRINUSE.
    free_server_port(server_addr, &socket)?;

    let path = resolve_sidecar_path(app)?;
    log::info!(
        "starting server sidecar at {} (port {port})",
        path.display()
    );

    let mut command = Command::new(&path);
    command
        .env(SERVER_PORT_ENV, port.to_string())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());
    apply_sidecar_env(&mut command, app);

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        command.creation_flags(CREATE_NO_WINDOW);
    }

    let mut child = command
        .spawn()
        .map_err(|error| format!("failed to spawn sidecar: {error}"))?;

    pipe_lines(child.stdout.take(), |line| log::info!("[server] {line}"));
    pipe_lines(child.stderr.take(), |line| log::error!("[server] {line}"));

    wait_until_ready(&mut child, server_addr)?;

    log::info!("server ready at http://{socket}");

    Ok((child, port))
}

fn port_is_in_use(addr: SocketAddr) -> bool {
    TcpStream::connect_timeout(&addr, Duration::from_millis(100)).is_ok()
}

/// If something already listens on the sidecar port, terminate those listeners
/// and wait until the port is free again.
fn free_server_port(addr: SocketAddr, socket: &str) -> Result<(), String> {
    if !port_is_in_use(addr) {
        return Ok(());
    }

    log::warn!("{socket} is already in use; stopping leftover listener(s)");
    kill_listeners_on_port(addr.port())?;

    let deadline = Instant::now() + Duration::from_secs(5);
    while Instant::now() < deadline {
        if !port_is_in_use(addr) {
            return Ok(());
        }
        thread::sleep(Duration::from_millis(100));
    }

    Err(format!(
        "{socket} is still in use after stopping leftover processes"
    ))
}

#[cfg(unix)]
fn kill_listeners_on_port(port: u16) -> Result<(), String> {
    let output = Command::new("lsof")
        .args([
            "-nP",
            &format!("-tiTCP:{port}"),
            "-sTCP:LISTEN",
        ])
        .output()
        .map_err(|error| format!("failed to run lsof for port {port}: {error}"))?;

    // lsof exits 1 when nothing matches — treat as success.
    if output.status.code() == Some(1) && output.stdout.is_empty() {
        return Ok(());
    }

    let stdout = String::from_utf8_lossy(&output.stdout);
    let pids: Vec<&str> = stdout.split_whitespace().collect();
    if pids.is_empty() {
        return Ok(());
    }

    log::info!("killing process(es) on port {port}: {}", pids.join(", "));
    for pid in pids {
        let status = Command::new("kill")
            .args(["-TERM", pid])
            .status()
            .map_err(|error| format!("failed to kill pid {pid}: {error}"))?;
        if !status.success() {
            let _ = Command::new("kill").args(["-KILL", pid]).status();
        }
    }

    Ok(())
}

#[cfg(windows)]
fn kill_listeners_on_port(port: u16) -> Result<(), String> {
    let script = format!(
        "$conns = Get-NetTCPConnection -LocalPort {port} -State Listen -ErrorAction SilentlyContinue; \
         if ($conns) {{ $conns | ForEach-Object {{ Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }} }}"
    );

    let status = Command::new("powershell")
        .args(["-NoProfile", "-Command", &script])
        .status()
        .map_err(|error| format!("failed to stop listeners on port {port}: {error}"))?;

    if !status.success() {
        // Fallback: kill by sidecar process name pattern.
        let _ = Command::new("powershell")
            .args([
                "-NoProfile",
                "-Command",
                "Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.Name -like 'basabaka-server*' } | Stop-Process -Force",
            ])
            .status();
    }

    Ok(())
}

fn pipe_lines<R, F>(stream: Option<R>, log_line: F)
where
    R: Read + Send + 'static,
    F: Fn(String) + Send + 'static,
{
    let Some(stream) = stream else {
        return;
    };

    thread::spawn(move || {
        for line in BufReader::new(stream).lines().map_while(Result::ok) {
            #[cfg(debug_assertions)]
            println!("[server] {line}");
            log_line(line);
        }
    });
}

fn wait_until_ready(child: &mut Child, addr: SocketAddr) -> Result<(), String> {
    let deadline = Instant::now() + READY_TIMEOUT;

    while Instant::now() < deadline {
        if let Some(status) = child
            .try_wait()
            .map_err(|error| format!("failed to poll sidecar process: {error}"))?
        {
            return Err(format!(
                "sidecar exited before the server became ready (status: {status})"
            ));
        }

        if TcpStream::connect_timeout(&addr, Duration::from_millis(200)).is_ok() {
            return Ok(());
        }

        thread::sleep(READY_POLL_INTERVAL);
    }

    Err(format!(
        "timed out after {}s waiting for server at {addr}",
        READY_TIMEOUT.as_secs()
    ))
}

/// Tauri sidecar path resolution, with a single dev-layout fallback (flat `.exe` next to the app).
fn resolve_sidecar_path(app: &AppHandle) -> Result<PathBuf, String> {
    if let Ok(command) = app.shell().sidecar(SIDECAR_CONFIG_PATH) {
        let std_command: Command = command.into();
        let path = PathBuf::from(std_command.get_program());
        if path.is_file() {
            return Ok(path);
        }
    }

    let exe_path = std::env::current_exe().map_err(|error| error.to_string())?;
    let exe_dir = exe_path
        .parent()
        .ok_or_else(|| "current executable has no parent directory".to_string())?;

    let base_dir = if exe_dir.ends_with("deps") {
        exe_dir.parent().unwrap_or(exe_dir)
    } else {
        exe_dir
    };

    let file_name = PathBuf::from(SIDECAR_CONFIG_PATH)
        .file_name()
        .map(PathBuf::from)
        .ok_or_else(|| format!("invalid sidecar config path: {SIDECAR_CONFIG_PATH}"))?;

    #[cfg(windows)]
    let fallback = {
        let mut path = base_dir.join(file_name);
        if path.extension().is_none() {
            path.as_mut_os_string().push(".exe");
        }
        path
    };

    #[cfg(not(windows))]
    let fallback = base_dir.join(file_name);

    if fallback.is_file() {
        return Ok(fallback);
    }

    Err(format!(
        "sidecar binary not found (configured as `{SIDECAR_CONFIG_PATH}`, checked Tauri path and {})",
        fallback.display()
    ))
}
