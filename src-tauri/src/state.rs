use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc,
};

#[derive(Debug, Clone, Copy)]
pub struct WheelInputSample {
    pub vertical_steps: f64,
    pub horizontal_steps: f64,
    pub timestamp_us: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PhysicsConfig {
    pub step_size_px: f64,
    pub pulse_scale: f64,
    pub animation_time_ms: f64,
    pub acceleration_delta_ms: f64,
    pub acceleration_scale: f64,
    pub acceleration_ramp_k: f64,
    pub max_step_scale: f64,
    pub max_backlog_px: f64,
    pub timer_interval_ms: f64,
    pub easing: String,
    pub reverse_direction: bool,
    pub enable_acceleration: bool,
    pub enable_smoothing: bool,
    pub enable_horizontal: bool,
}

impl Default for PhysicsConfig {
    fn default() -> Self {
        Self {
            step_size_px: 90.0,
            pulse_scale: 0.8,
            animation_time_ms: 420.0,
            acceleration_delta_ms: 70.0,
            acceleration_scale: 7.0,
            acceleration_ramp_k: 0.45,
            max_step_scale: 4.0,
            max_backlog_px: 3600.0,
            timer_interval_ms: 4.6,
            easing: "easeOutCubic".to_string(),
            reverse_direction: false,
            enable_acceleration: true,
            enable_smoothing: true,
            enable_horizontal: true,
        }
    }
}

pub struct AppState {
    pub config: Mutex<PhysicsConfig>,
    pub active_device: Mutex<Option<String>>,
    pub velocity_graph_data: Mutex<Vec<f64>>,
    pub wheel_input_samples: Mutex<Vec<WheelInputSample>>,
    pub last_velocity: Mutex<f64>,
    daemon_running: AtomicBool,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            config: Mutex::new(PhysicsConfig::default()),
            active_device: Mutex::new(None),
            velocity_graph_data: Mutex::new(Vec::with_capacity(240)),
            wheel_input_samples: Mutex::new(Vec::with_capacity(256)),
            last_velocity: Mutex::new(0.0),
            daemon_running: AtomicBool::new(false),
        }
    }

    pub fn mark_daemon_running(&self, running: bool) {
        self.daemon_running.store(running, Ordering::SeqCst);
    }

    pub fn is_daemon_running(&self) -> bool {
        self.daemon_running.load(Ordering::SeqCst)
    }
}

pub struct SharedState(pub Arc<AppState>);
