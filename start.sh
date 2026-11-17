#!/bin/bash
# Mở app Nihongo (Electron) qua WSLg. Dùng: wsl -d Ubuntu-24.04 -- bash ~/japanese-app/start.sh
export DISPLAY=:0
export WAYLAND_DISPLAY=wayland-0
export XDG_RUNTIME_DIR=/mnt/wslg/runtime-dir
export PULSE_SERVER=unix:/mnt/wslg/PulseServer
cd ~/japanese-app || exit 1
exec npm start
