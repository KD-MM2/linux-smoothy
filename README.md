## Linux Permissions and Daemon Setup

Smoothy needs access to `/dev/input/event*` and `/dev/uinput`.

1. Install udev rules and add your user to `input` group:

   `sudo bash resources/install-linux-permissions.sh`

2. Log out and log back in (required for new group membership).

3. Optional: install user service template:
   - Copy `resources/smoothy.service` to `~/.config/systemd/user/smoothy.service`
   - Update `ExecStart=` path to your Smoothy binary
   - Enable + start:

     `systemctl --user daemon-reload`

     `systemctl --user enable --now smoothy.service`

Resources included:

- `resources/99-smoothy.rules`
- `resources/install-linux-permissions.sh`
- `resources/smoothy.service`

## Linux Packaging (`.deb` / `AppImage`)

Packaging script:

- `scripts/build-linux-packages.sh`

NPM command:

- `npm run package:linux`

Direct Tauri bundle command:

- `npm run tauri:bundle:linux`

This project sets `NO_STRIP=1` for AppImage bundling to work around linuxdeploy
strip failures on RELR-enabled system libraries.

Bundle output path:

- `src-tauri/target/release/bundle/`

Before packaging on Linux, install Tauri/WebKit/GTK build dependencies for your distro.
If these packages are missing, `cargo check` and `tauri build` will fail before bundle generation.
