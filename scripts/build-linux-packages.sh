#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

echo "[smoothy] Building frontend..."
npm run build

echo "[smoothy] Building Linux packages (deb, appimage)..."
export NO_STRIP=1
npm run tauri:bundle:linux

echo "[smoothy] Done. Output is under src-tauri/target/release/bundle/"
