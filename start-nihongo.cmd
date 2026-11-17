@echo off
REM ============================================================
REM  Mo app Nihongo (Electron) chay trong WSL2 Ubuntu qua WSLg.
REM  Bam dup file nay de mo app. Cua so hien thang tren Windows.
REM ============================================================
wsl -d Ubuntu-24.04 -- pkill -x electron
wsl -d Ubuntu-24.04 -- bash ~/japanese-app/start.sh
