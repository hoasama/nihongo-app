@echo off
REM ============================================================
REM  Sync code tu Windows (D:) sang ban chay trong WSL2, build
REM  lai UI va mo app. Bam dup sau moi lan sua code tren Windows.
REM ============================================================
echo [1/3] Dang sync code sang WSL...
wsl -d Ubuntu-24.04 -- rsync -a --exclude node_modules --exclude .git --exclude dist /mnt/d/Stack/project/japanese-app/ ~/japanese-app/
echo [2/3] Dang build lai UI...
wsl -d Ubuntu-24.04 -- bash -c "cd ~/japanese-app && npm run build"
echo [3/3] Dang mo app...
wsl -d Ubuntu-24.04 -- pkill -x electron
wsl -d Ubuntu-24.04 -- bash ~/japanese-app/start.sh
