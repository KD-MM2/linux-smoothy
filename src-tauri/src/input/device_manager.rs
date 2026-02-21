use std::fs;
use std::os::unix::fs::FileTypeExt;

use evdev::{Device, RelativeAxisType};

#[derive(Debug, Clone)]
pub struct DeviceDescriptor {
    pub path: String,
    pub label: String,
}

fn has_scroll_axes(device: &Device) -> bool {
    let Some(axes) = device.supported_relative_axes() else {
        return false;
    };

    axes.contains(RelativeAxisType::REL_WHEEL)
        || axes.contains(RelativeAxisType::REL_HWHEEL)
        || axes.contains(RelativeAxisType::REL_WHEEL_HI_RES)
        || axes.contains(RelativeAxisType::REL_HWHEEL_HI_RES)
}

pub fn device_supports_scroll(path: &str) -> bool {
    let Ok(device) = Device::open(path) else {
        return false;
    };

    has_scroll_axes(&device)
}

pub fn scan_devices() -> Vec<String> {
    scan_device_descriptors()
        .into_iter()
        .map(|device| device.path)
        .collect()
}

pub fn scan_event_device_paths() -> Vec<String> {
    let mut devices = Vec::new();

    let Ok(entries) = fs::read_dir("/dev/input") else {
        return devices;
    };

    for entry in entries.flatten() {
        let Ok(file_type) = entry.file_type() else {
            continue;
        };

        if !file_type.is_char_device() {
            continue;
        }

        let name = entry.file_name().to_string_lossy().to_string();
        if !name.starts_with("event") {
            continue;
        }

        devices.push(entry.path().to_string_lossy().to_string());
    }

    devices.sort();
    devices
}

pub fn scan_device_descriptors() -> Vec<DeviceDescriptor> {
    let mut devices = Vec::new();

    let Ok(entries) = fs::read_dir("/dev/input") else {
        return devices;
    };

    for entry in entries.flatten() {
        let Ok(file_type) = entry.file_type() else {
            continue;
        };

        if !file_type.is_char_device() {
            continue;
        }

        let name = entry.file_name().to_string_lossy().to_string();
        if !name.starts_with("event") {
            continue;
        }

        let path = entry.path();
        let path_str = path.to_string_lossy().to_string();
        let Ok(device) = Device::open(&path_str) else {
            continue;
        };

        if has_scroll_axes(&device) {
            let label = device
                .name()
                .map(|name| format!("{name} ({path_str})"))
                .unwrap_or_else(|| path_str.clone());

            devices.push(DeviceDescriptor {
                path: path_str,
                label,
            });
        }
    }

    devices.sort_by(|left, right| left.label.cmp(&right.label));
    devices
}
