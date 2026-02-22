use std::sync::Arc;

use evdev::{Device, InputEventKind, RelativeAxisType};

use crate::state::{monotonic_now_micros, AppState};

pub fn run_input_reader_loop(state: Arc<AppState>, device_path: String) -> Result<(), String> {
    let mut device = Device::open(&device_path)
        .map_err(|error| format!("failed to open {device_path}: {error}"))?;

    while state.is_daemon_running() {
        let events = match device.fetch_events() {
            Ok(events) => events,
            Err(error) => {
                return Err(format!("failed to read events from {device_path}: {error}"));
            }
        };

        let mut vertical_steps = 0.0_f64;
        let mut horizontal_steps = 0.0_f64;

        for event in events {
            match event.kind() {
                InputEventKind::RelAxis(RelativeAxisType::REL_WHEEL) => {
                    vertical_steps += event.value() as f64;
                }
                InputEventKind::RelAxis(RelativeAxisType::REL_HWHEEL) => {
                    horizontal_steps += event.value() as f64;
                }
                InputEventKind::RelAxis(RelativeAxisType::REL_WHEEL_HI_RES) => {
                    vertical_steps += event.value() as f64 / 120.0;
                }
                InputEventKind::RelAxis(RelativeAxisType::REL_HWHEEL_HI_RES) => {
                    horizontal_steps += event.value() as f64 / 120.0;
                }
                _ => {}
            }
        }

        if vertical_steps != 0.0 || horizontal_steps != 0.0 {
            let mut queue = state.wheel_input_samples.lock();
            queue.push(crate::state::WheelInputSample {
                vertical_steps,
                horizontal_steps,
                timestamp_us: monotonic_now_micros(),
            });
            if queue.len() > 2048 {
                let drain_len = queue.len() - 2048;
                queue.drain(0..drain_len);
            }
        }
    }

    Ok(())
}
