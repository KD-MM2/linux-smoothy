export type PhysicsConfig = {
  step_size_px: number;
  pulse_scale: number;
  animation_time_ms: number;
  acceleration_delta_ms: number;
  acceleration_scale: number;
  acceleration_ramp_k: number;
  max_step_scale: number;
  max_backlog_px: number;
  timer_interval_ms: number;
  easing: "easeOutCubic" | "linear";
  reverse_direction: boolean;
  enable_acceleration: boolean;
  enable_smoothing: boolean;
  enable_horizontal: boolean;
};

export type RuntimeStatus = {
  daemon_running: boolean;
  active_device: string | null;
  last_velocity: number;
};

export type DeviceInfo = {
  path: string;
  label: string;
};

export type PermissionStatus = {
  input_device_count: number;
  can_read_any_input: boolean;
  can_write_uinput: boolean;
  uinput_exists: boolean;
};

export type TuningPreset = "custom" | "normal" | "aggressive" | "precision";
export type ViewScreen =
  | "home"
  | "settings"
  | "profiles"
  | "about"
  | "profile-editor";

export type Profile = {
  id: string;
  name: string;
  config: PhysicsConfig;
};

export const PRESETS: Record<TuningPreset, PhysicsConfig> = {
  custom: {
    step_size_px: 90,
    pulse_scale: 0.95,
    animation_time_ms: 520,
    acceleration_delta_ms: 90,
    acceleration_scale: 4.2,
    acceleration_ramp_k: 0.34,
    max_step_scale: 4.2,
    max_backlog_px: 3600,
    timer_interval_ms: 4.0,
    easing: "easeOutCubic",
    reverse_direction: false,
    enable_acceleration: true,
    enable_smoothing: true,
    enable_horizontal: true,
  },
  normal: {
    step_size_px: 90,
    pulse_scale: 2.5,
    animation_time_ms: 320,
    acceleration_delta_ms: 80,
    acceleration_scale: 4,
    acceleration_ramp_k: 0.45,
    max_step_scale: 4,
    max_backlog_px: 2600,
    timer_interval_ms: 8,
    easing: "easeOutCubic",
    reverse_direction: false,
    enable_acceleration: true,
    enable_smoothing: true,
    enable_horizontal: true,
  },
  aggressive: {
    step_size_px: 90,
    pulse_scale: 4,
    animation_time_ms: 360,
    acceleration_delta_ms: 70,
    acceleration_scale: 7,
    acceleration_ramp_k: 0.55,
    max_step_scale: 7,
    max_backlog_px: 3600,
    timer_interval_ms: 8,
    easing: "easeOutCubic",
    reverse_direction: false,
    enable_acceleration: true,
    enable_smoothing: true,
    enable_horizontal: true,
  },
  precision: {
    step_size_px: 70,
    pulse_scale: 1.8,
    animation_time_ms: 260,
    acceleration_delta_ms: 90,
    acceleration_scale: 3,
    acceleration_ramp_k: 0.35,
    max_step_scale: 3,
    max_backlog_px: 2000,
    timer_interval_ms: 8,
    easing: "easeOutCubic",
    reverse_direction: false,
    enable_acceleration: true,
    enable_smoothing: true,
    enable_horizontal: true,
  },
};

export function cloneConfig(config: PhysicsConfig): PhysicsConfig {
  return { ...config };
}

export const FIELD_CONFIG: Array<{
  key:
    | "step_size_px"
    | "pulse_scale"
    | "animation_time_ms"
    | "acceleration_delta_ms"
    | "acceleration_scale"
    | "acceleration_ramp_k"
    | "max_step_scale"
    | "max_backlog_px"
    | "timer_interval_ms";
  label: string;
  min: number;
  max: number;
  step: number;
}> = [
  { key: "step_size_px", label: "Step Size (px)", min: 1, max: 500, step: 1 },
  { key: "pulse_scale", label: "Pulse Scale", min: 0.1, max: 15, step: 0.01 },
  {
    key: "animation_time_ms",
    label: "Animation Time (ms)",
    min: 1,
    max: 2000,
    step: 1,
  },
  {
    key: "acceleration_delta_ms",
    label: "Acceleration Delta (ms)",
    min: 1,
    max: 500,
    step: 1,
  },
  {
    key: "acceleration_scale",
    label: "Acceleration Scale",
    min: 1,
    max: 20,
    step: 0.01,
  },
  {
    key: "acceleration_ramp_k",
    label: "Acceleration Ramp K",
    min: 0.01,
    max: 5,
    step: 0.01,
  },
  {
    key: "max_step_scale",
    label: "Max Step Scale",
    min: 1,
    max: 20,
    step: 0.01,
  },
  {
    key: "max_backlog_px",
    label: "Max Backlog (px)",
    min: 1,
    max: 30000,
    step: 1,
  },
  {
    key: "timer_interval_ms",
    label: "Timer Interval (ms)",
    min: 1,
    max: 100,
    step: 0.1,
  },
];
