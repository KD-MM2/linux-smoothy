use std::collections::VecDeque;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::time::{sleep, Duration};

use crate::input::uinput::ScrollEmitter;
use crate::state::{monotonic_now_micros, AppState, PhysicsConfig};

const WHEEL_UNIT: f64 = 120.0;
const EPSILON: f64 = 0.000_001;
const MAX_GRAPH_SAMPLES: usize = 240;

#[derive(Debug, Clone)]
struct Impulse {
    start_us: u64,
    total_px: f64,
    emitted_px: f64,
}

#[derive(Debug, Default)]
struct AxisState {
    impulses: VecDeque<Impulse>,
    backlog_px: f64,
    residual_hires: f64,
    detent_carry_hires: f64,
}

#[derive(Debug, Default)]
struct SmoothState {
    vertical: AxisState,
    horizontal: AxisState,
    combo: u32,
    last_input_us: u64,
}

fn clamp(value: f64, min: f64, max: f64) -> f64 {
    value.max(min).min(max)
}

fn ease(progress: f64, easing_mode: &str) -> f64 {
    if progress <= 0.0 {
        return 0.0;
    }
    if progress >= 1.0 {
        return 1.0;
    }

    if easing_mode.eq_ignore_ascii_case("linear") {
        return progress;
    }

    let inverse = 1.0 - progress;
    1.0 - inverse * inverse * inverse
}

fn ease_derivative(progress: f64, easing_mode: &str) -> f64 {
    if progress <= 0.0 || progress >= 1.0 {
        return 0.0;
    }

    if easing_mode.eq_ignore_ascii_case("linear") {
        return 1.0;
    }

    let inverse = 1.0 - progress;
    3.0 * inverse * inverse
}

fn trunc_toward_zero(value: f64) -> i32 {
    if value >= 0.0 {
        value.floor() as i32
    } else {
        value.ceil() as i32
    }
}

fn compute_scale(smooth_state: &mut SmoothState, timestamp_us: u64, config: &PhysicsConfig) -> f64 {
    let acceleration_delta_us = config.acceleration_delta_ms * 1_000.0;
    if smooth_state.last_input_us != 0
        && (timestamp_us.saturating_sub(smooth_state.last_input_us) as f64) <= acceleration_delta_us
    {
        smooth_state.combo = smooth_state.combo.saturating_add(1);
    } else {
        smooth_state.combo = 1;
    }
    smooth_state.last_input_us = timestamp_us;

    let target_scale = clamp(config.acceleration_scale, 1.0, config.max_step_scale);
    if smooth_state.combo <= 1 || target_scale <= 1.0 {
        return 1.0;
    }

    let combo = smooth_state.combo as f64;
    let factor = 1.0 - (-config.acceleration_ramp_k * (combo - 1.0)).exp();
    clamp(
        1.0 + (target_scale - 1.0) * factor,
        1.0,
        config.max_step_scale,
    )
}

fn queue_distance_with_coalescing(
    axis: &mut AxisState,
    distance_px: f64,
    timestamp_us: u64,
    max_backlog_px: f64,
    coalesce_window_us: u64,
) {
    if distance_px.abs() <= EPSILON {
        return;
    }

    let clamped_backlog = clamp(
        axis.backlog_px + distance_px,
        -max_backlog_px,
        max_backlog_px,
    );
    let accepted = clamped_backlog - axis.backlog_px;
    if accepted.abs() <= EPSILON {
        return;
    }

    axis.backlog_px = clamped_backlog;

    if let Some(last) = axis.impulses.back_mut() {
        let same_direction =
            (last.total_px >= 0.0 && accepted >= 0.0) || (last.total_px <= 0.0 && accepted <= 0.0);
        let within_window = timestamp_us.saturating_sub(last.start_us) <= coalesce_window_us;
        if same_direction && within_window {
            last.total_px += accepted;
            return;
        }
    }

    if axis.impulses.len() >= 64 {
        if let Some(last) = axis.impulses.back_mut() {
            last.total_px += accepted;
        }
        return;
    }

    axis.impulses.push_back(Impulse {
        start_us: timestamp_us,
        total_px: accepted,
        emitted_px: 0.0,
    });
}

fn release_axis(axis: &mut AxisState, now_us: u64, animation_us: f64, easing_mode: &str) -> f64 {
    let mut released_px = 0.0;

    axis.impulses.retain_mut(|impulse| {
        let progress = (now_us.saturating_sub(impulse.start_us) as f64) / animation_us;

        let target = if progress >= 1.0 {
            impulse.total_px
        } else if progress <= 0.0 {
            0.0
        } else {
            impulse.total_px * ease(progress, easing_mode)
        };

        let delta = target - impulse.emitted_px;
        if delta != 0.0 {
            impulse.emitted_px = target;
            released_px += delta;
        }

        progress < 1.0
    });

    axis.backlog_px -= released_px;
    released_px
}

fn estimate_axis_velocity_px_per_us(
    axis: &AxisState,
    now_us: u64,
    animation_us: f64,
    easing_mode: &str,
) -> f64 {
    axis.impulses
        .iter()
        .map(|impulse| {
            let progress = (now_us.saturating_sub(impulse.start_us) as f64) / animation_us;
            let derivative = ease_derivative(progress, easing_mode);
            (impulse.total_px * derivative) / animation_us
        })
        .sum()
}

fn px_to_hires(delta_px: f64, residual_hires: f64, hires_per_px: f64) -> (i32, f64) {
    let hires_value = delta_px * hires_per_px + residual_hires;
    let hires_delta = trunc_toward_zero(hires_value);
    let next_residual = hires_value - hires_delta as f64;
    (hires_delta, next_residual)
}

fn emit_axis_events(
    emitter: &mut ScrollEmitter,
    axis: &mut AxisState,
    hires_delta: i32,
    vertical: bool,
) -> Result<(), String> {
    if hires_delta == 0 {
        return Ok(());
    }

    if vertical {
        emitter.emit_vertical_hires(hires_delta)?;
    } else {
        emitter.emit_horizontal_hires(hires_delta)?;
    }

    axis.detent_carry_hires += hires_delta as f64;
    let detents = trunc_toward_zero(axis.detent_carry_hires / WHEEL_UNIT);
    if detents != 0 {
        axis.detent_carry_hires -= detents as f64 * WHEEL_UNIT;
        if vertical {
            emitter.emit_vertical_scroll(detents)?;
        } else {
            emitter.emit_horizontal_scroll(detents)?;
        }
    }

    Ok(())
}

pub async fn run_physics_loop(state: Arc<AppState>, mut emitter: ScrollEmitter, app: AppHandle) {
    let mut smooth_state = SmoothState::default();
    let mut velocity_ema = 0.0_f64;

    while state.is_daemon_running() {
        let config = state.config.lock().clone();
        let step_size_px = config.step_size_px.max(1.0);
        let hires_per_px = WHEEL_UNIT / step_size_px;
        let animation_us = (config.animation_time_ms * 1_000.0).max(EPSILON);
        let timer_interval_us = (config.timer_interval_ms * 1_000.0 + 0.5).floor().max(1.0) as u64;
        let coalesce_window_us = timer_interval_us.saturating_mul(3);

        let inputs = {
            let mut queue = state.wheel_input_samples.lock();
            std::mem::take(&mut *queue)
        };

        let mut immediate_vertical_px = 0.0_f64;
        let mut immediate_horizontal_px = 0.0_f64;

        for input in inputs {
            let scale = if config.enable_acceleration {
                compute_scale(&mut smooth_state, input.timestamp_us, &config)
            } else {
                1.0
            };

            let direction_sign = if config.reverse_direction { -1.0 } else { 1.0 };
            let vertical_steps = input.vertical_steps * direction_sign * config.pulse_scale;
            let horizontal_steps = if config.enable_horizontal {
                input.horizontal_steps * direction_sign * config.pulse_scale
            } else {
                0.0
            };

            if vertical_steps != 0.0 {
                let distance_px = vertical_steps * step_size_px * scale;
                if config.enable_smoothing {
                    queue_distance_with_coalescing(
                        &mut smooth_state.vertical,
                        distance_px,
                        input.timestamp_us,
                        config.max_backlog_px,
                        coalesce_window_us,
                    );
                } else {
                    immediate_vertical_px += distance_px;
                }
            }

            if horizontal_steps != 0.0 {
                let distance_px = horizontal_steps * step_size_px * scale;
                if config.enable_smoothing {
                    queue_distance_with_coalescing(
                        &mut smooth_state.horizontal,
                        distance_px,
                        input.timestamp_us,
                        config.max_backlog_px,
                        coalesce_window_us,
                    );
                } else {
                    immediate_horizontal_px += distance_px;
                }
            }
        }

        let now_us = monotonic_now_micros();
        let (released_vertical_px, released_horizontal_px) = if config.enable_smoothing {
            (
                release_axis(
                    &mut smooth_state.vertical,
                    now_us,
                    animation_us,
                    &config.easing,
                ),
                release_axis(
                    &mut smooth_state.horizontal,
                    now_us,
                    animation_us,
                    &config.easing,
                ),
            )
        } else {
            (immediate_vertical_px, immediate_horizontal_px)
        };

        let (vertical_hires, vertical_residual) = px_to_hires(
            released_vertical_px,
            smooth_state.vertical.residual_hires,
            hires_per_px,
        );
        smooth_state.vertical.residual_hires = vertical_residual;

        let (horizontal_hires, horizontal_residual) = px_to_hires(
            released_horizontal_px,
            smooth_state.horizontal.residual_hires,
            hires_per_px,
        );
        smooth_state.horizontal.residual_hires = horizontal_residual;

        if vertical_hires != 0 || horizontal_hires != 0 {
            if let Err(error) = emit_axis_events(
                &mut emitter,
                &mut smooth_state.vertical,
                vertical_hires,
                true,
            ) {
                eprintln!("virtual scroll emitter stopped: {error}");
                state.mark_daemon_running(false);
                break;
            }

            if let Err(error) = emit_axis_events(
                &mut emitter,
                &mut smooth_state.horizontal,
                horizontal_hires,
                false,
            ) {
                eprintln!("virtual horizontal scroll emitter stopped: {error}");
                state.mark_daemon_running(false);
                break;
            }
        }

        let velocity_px_per_us = estimate_axis_velocity_px_per_us(
            &smooth_state.vertical,
            now_us,
            animation_us,
            &config.easing,
        );
        let raw_velocity =
            (velocity_px_per_us * hires_per_px / WHEEL_UNIT) * timer_interval_us as f64;
        let ema_alpha = 0.22_f64;
        velocity_ema += ema_alpha * (raw_velocity - velocity_ema);
        let velocity = velocity_ema;

        {
            let mut last_velocity = state.last_velocity.lock();
            *last_velocity = velocity;
        }

        let _ = app.emit("velocity-sample", velocity);

        {
            let mut graph_data = state.velocity_graph_data.lock();
            graph_data.push(velocity);
            if graph_data.len() > MAX_GRAPH_SAMPLES {
                let drain_len = graph_data.len() - MAX_GRAPH_SAMPLES;
                graph_data.drain(0..drain_len);
            }
        }

        sleep(Duration::from_micros(timer_interval_us)).await;
    }

    let mut last_velocity = state.last_velocity.lock();
    *last_velocity = 0.0;
    let _ = app.emit("velocity-sample", 0.0_f64);
}
