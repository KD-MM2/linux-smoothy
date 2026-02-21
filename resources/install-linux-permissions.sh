#!/usr/bin/env bash
set -euo pipefail

RULE_SRC="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/99-smoothy.rules"
RULE_DST="/etc/udev/rules.d/99-smoothy.rules"

if [[ "${EUID}" -ne 0 ]]; then
    echo "Run as root: sudo bash resources/install-linux-permissions.sh"
    exit 1
fi

if [[ ! -f "${RULE_SRC}" ]]; then
    echo "Missing rules file: ${RULE_SRC}"
    exit 1
fi

if ! getent group input >/dev/null; then
    echo "Group 'input' does not exist on this system. Create it first."
    exit 1
fi

install -m 0644 "${RULE_SRC}" "${RULE_DST}"
udevadm control --reload-rules
udevadm trigger

TARGET_USER="${SUDO_USER:-}"
if [[ -n "${TARGET_USER}" ]]; then
    usermod -aG input "${TARGET_USER}"
    echo "Added ${TARGET_USER} to 'input' group."
    echo "${TARGET_USER} must log out and back in for group changes to apply."
else
    echo "Could not detect non-root user (SUDO_USER empty)."
    echo "Manually add your user to input group: usermod -aG input <username>"
fi

echo "Installed udev rules to ${RULE_DST} and reloaded udev."
