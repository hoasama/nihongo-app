@echo off
REM ============================================================
REM  Mo app Nihongo NATIVE tren Windows (Smart App Control da tat).
REM  Bam dup de build + mo app. Dong cua so app la xong.
REM  (Chay qua WSL khong con can nua; xem start.sh neu muon ban WSL.)
REM ============================================================
cd /d "%~dp0"
call npm run app
