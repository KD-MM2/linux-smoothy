# Smoothy

Smoothy is a Rust + Tauri desktop app for Linux that adds smooth, inertial mouse-wheel scrolling (Mac-like feel) with runtime tuning.

It captures wheel input from real devices, processes it with a smoothing/acceleration engine, and re-emits optimized wheel events through a virtual `uinput` device.

---

## Features

- Smooth wheel animation with easing (`easeOutCubic` / `linear`)
- Exponential acceleration ramp for rapid scrolling
- Backlog handling and sub-step precision output
- Vertical + optional horizontal wheel support
- Runtime controls from GUI (no restart required)
- Profile-based tuning (`custom`, `normal`, `aggressive`, `precision`)
- Diagnostics panel (permissions, device visibility, velocity graph)
- Exit behavior control: `ask`, `exit`, or `minimize`

---

## How It Works

Smoothy uses a split pipeline inside one app:

1. **Input Reader (evdev)**
   - Reads wheel events from `/dev/input/event*`
   - Supports both standard and hi-res wheel axes

2. **Physics Engine (Rust)**
   - Converts wheel steps to virtual distance (`step_size_px`, `pulse_scale`)
   - Applies acceleration combo scaling for burst input
   - Releases queued impulses over time with easing
   - Converts virtual distance to hi-res + discrete wheel events

3. **Virtual Emitter (uinput)**
   - Emits smoothed wheel events through `/dev/uinput`

4. **Tauri GUI (React + TypeScript)**
   - Updates physics config at runtime through commands
   - Displays service state, permissions, and velocity diagnostics

---

## Installation and Setup

### 1) Prerequisites

- Linux desktop environment
- Node.js + npm
- Rust toolchain (`cargo`, `rustc`)
- Tauri Linux build dependencies (WebKit/GTK packages for your distro)

> If Linux GUI dependencies are missing, `cargo check` / Tauri build steps will fail.

### 2) Clone and install dependencies

```bash
git clone <your-repo-url>
cd smoothy
npm install
```

### 3) Configure Linux input permissions (required)

Smoothy needs read access to `/dev/input/event*` and write access to `/dev/uinput`.

Run:

```bash
sudo bash resources/install-linux-permissions.sh
```

Then **log out and log back in** so your `input` group membership is applied.

Included resources:

- `resources/99-smoothy.rules`
- `resources/install-linux-permissions.sh`
- `resources/smoothy.service`

### 4) Run in development mode

```bash
npm run tauri dev
```

### 5) Build production app

```bash
npm run tauri:build
```

---

## Usage

1. Open the app and go to **Home**.
2. Start the service from the app menu.
3. Tune behavior via profile or numeric parameters.
4. Use **Settings** to:
   - inspect diagnostics
   - view velocity graph
   - configure close-button behavior (`ask` / `exit` / `minimize`)

If the service cannot start, check **Settings > Diagnostic** first (input readability + `uinput` availability).

---

## Run as a User Daemon (Optional)

You can run Smoothy in daemon mode with `--daemon`.

Use the provided systemd user template:

1. Copy `resources/smoothy.service` to `~/.config/systemd/user/smoothy.service`
2. Update `ExecStart=` to your installed Smoothy binary path
3. Enable and start:

```bash
systemctl --user daemon-reload
systemctl --user enable --now smoothy.service
```

---

## Linux Packaging

Build `.deb` and `.AppImage` bundles:

```bash
npm run package:linux
```

Alternative direct command:

```bash
npm run tauri:bundle:linux
```

Notes:

- AppImage flow uses `NO_STRIP=1` to avoid linuxdeploy strip issues on some RELR-enabled systems.
- Output directory: `src-tauri/target/release/bundle/`

---

## Roadmap

### Near-term

- Better onboarding for Linux permissions and startup checks
- Per-device profile assignment and automatic device mapping
- Safer profile import/export and sharing

### Mid-term

- System tray controls and richer background behavior
- Improved diagnostics (event counters, latency indicators, error hints)
- More preset calibration for different wheel hardware

### Long-term

- Optional advanced tuning assistant (guided recommendations)
- Better desktop integration across distros/compositors
- Stability/performance hardening for broader hardware coverage

---

## Tech Stack

- Backend: Rust, Tokio, evdev, uinput
- Desktop shell: Tauri v2
- Frontend: React + TypeScript + Tailwind + Radix UI primitives

## Support / Donation

If Smoothy helps your workflow, you can support development here:

- https://paypal.me/kaotd

---
