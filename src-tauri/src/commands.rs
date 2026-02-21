use serde::Serialize;
use std::fs::OpenOptions;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::State;
use tauri::{AppHandle, Emitter};

use crate::{
    input::{device_manager, reader::run_input_reader_loop, uinput::ScrollEmitter},
    physics::engine::run_physics_loop,
    state::{PhysicsConfig, SharedState},
};

#[derive(Debug, Clone, Serialize)]
pub struct RuntimeStatus {
    pub daemon_running: bool,
    pub active_device: Option<String>,
    pub last_velocity: f64,
}

#[derive(Debug, Clone, Serialize)]
pub struct DeviceInfo {
    pub path: String,
    pub label: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct PermissionStatus {
    pub input_device_count: usize,
    pub can_read_any_input: bool,
    pub can_write_uinput: bool,
    pub uinput_exists: bool,
}

fn build_runtime_status(state: &SharedState) -> RuntimeStatus {
    RuntimeStatus {
        daemon_running: state.0.is_daemon_running(),
        active_device: state.0.active_device.lock().clone(),
        last_velocity: *state.0.last_velocity.lock(),
    }
}

fn emit_runtime_status(app: &AppHandle, state: &SharedState) {
    let _ = app.emit("runtime-status", build_runtime_status(state));
}

fn now_micros() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|duration| duration.as_micros() as u64)
        .unwrap_or(0)
}

fn build_permission_status() -> PermissionStatus {
    let all_event_devices = device_manager::scan_event_device_paths();

    let can_read_any_input = all_event_devices.iter().any(|path| {
        OpenOptions::new()
            .read(true)
            .open(path)
            .map(|_| true)
            .unwrap_or(false)
    });

    let uinput_exists = std::path::Path::new("/dev/uinput").exists();
    let can_write_uinput = OpenOptions::new()
        .read(true)
        .write(true)
        .open("/dev/uinput")
        .map(|_| true)
        .unwrap_or(false);

    PermissionStatus {
        input_device_count: all_event_devices.len(),
        can_read_any_input,
        can_write_uinput,
        uinput_exists,
    }
}

pub fn start_daemon_internal(
    app: &AppHandle,
    state: &SharedState,
    device_path: Option<String>,
) -> Result<(), String> {
    if state.0.is_daemon_running() {
        return Err("daemon is already running".to_string());
    }

    let resolved_devices = if let Some(path) = device_path {
        if device_manager::device_supports_scroll(&path) {
            vec![path]
        } else {
            Vec::new()
        }
    } else {
        device_manager::scan_devices()
    };

    if resolved_devices.is_empty() {
        let permissions = build_permission_status();

        if permissions.input_device_count == 0 {
            return Err("no /dev/input/event* devices were found".to_string());
        }

        if !permissions.can_read_any_input {
            return Err(
                    "permission denied while reading /dev/input/event*: add your user to the input group and reload udev rules"
                        .to_string(),
                );
        }

        return Err(
                "no scroll-capable input device found (expected REL_WHEEL/REL_HWHEEL or HI_RES wheel axes)"
                    .to_string(),
            );
    }

    let mut readable_devices = Vec::new();
    for path in resolved_devices {
        if OpenOptions::new().read(true).open(&path).is_ok() {
            readable_devices.push(path);
        }
    }

    if readable_devices.is_empty() {
        return Err(
            "permission denied while reading selected scroll devices: add your user to the input group and reload udev rules"
                .to_string(),
        );
    }

    let emitter = ScrollEmitter::create().map_err(|error| {
        if error.contains("Permission denied") {
            format!("permission denied while opening /dev/uinput: {error}")
        } else {
            error
        }
    })?;

    let active_device_label = if readable_devices.len() == 1 {
        readable_devices[0].clone()
    } else {
        format!("{} devices", readable_devices.len())
    };

    *state.0.active_device.lock() = Some(active_device_label);
    state.0.wheel_input_samples.lock().clear();
    state.0.mark_daemon_running(true);
    emit_runtime_status(app, state);

    for device in readable_devices {
        let input_state = state.0.clone();
        tauri::async_runtime::spawn_blocking(move || {
            if let Err(error) = run_input_reader_loop(input_state.clone(), device.clone()) {
                eprintln!("input reader stopped for {device}: {error}");
            }
        });
    }

    let loop_state = state.0.clone();
    let loop_app = app.clone();
    tauri::async_runtime::spawn(async move {
        run_physics_loop(loop_state.clone(), emitter, loop_app.clone()).await;
        loop_state.mark_daemon_running(false);
        *loop_state.active_device.lock() = None;
        let _ = loop_app.emit(
            "runtime-status",
            RuntimeStatus {
                daemon_running: false,
                active_device: None,
                last_velocity: *loop_state.last_velocity.lock(),
            },
        );
    });

    Ok(())
}

pub fn stop_daemon_internal(app: &AppHandle, state: &SharedState) {
    state.0.mark_daemon_running(false);
    *state.0.active_device.lock() = None;
    emit_runtime_status(app, state);
}

#[tauri::command]
pub fn get_physics(state: State<'_, SharedState>) -> PhysicsConfig {
    state.0.config.lock().clone()
}

#[tauri::command]
pub fn update_physics(state: State<'_, SharedState>, config: PhysicsConfig) {
    let mut current = state.0.config.lock();
    *current = config;
}

#[tauri::command]
pub fn get_status(state: State<'_, SharedState>) -> RuntimeStatus {
    build_runtime_status(&state)
}

#[tauri::command]
pub fn get_velocity_graph(state: State<'_, SharedState>) -> Vec<f64> {
    state.0.velocity_graph_data.lock().clone()
}

#[tauri::command]
pub fn get_devices() -> Vec<DeviceInfo> {
    device_manager::scan_device_descriptors()
        .into_iter()
        .map(|device| DeviceInfo {
            path: device.path,
            label: device.label,
        })
        .collect()
}

#[tauri::command]
pub fn get_permission_status() -> PermissionStatus {
    build_permission_status()
}

#[tauri::command]
pub fn start_daemon(
    app: AppHandle,
    state: State<'_, SharedState>,
    device_path: Option<String>,
) -> Result<(), String> {
    start_daemon_internal(&app, &state, device_path)
}

#[tauri::command]
pub fn stop_daemon(app: AppHandle, state: State<'_, SharedState>) {
    stop_daemon_internal(&app, &state);
}

#[tauri::command]
pub fn push_scroll_delta(state: State<'_, SharedState>, delta: f64) {
    let mut queue = state.0.wheel_input_samples.lock();
    queue.push(crate::state::WheelInputSample {
        vertical_steps: delta,
        horizontal_steps: 0.0,
        timestamp_us: now_micros(),
    });
}
