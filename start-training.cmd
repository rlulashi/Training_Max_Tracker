@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if errorlevel 1 (
  python server.py
) else (
  py -3 server.py
)
if errorlevel 1 (
  echo Python 3.10 or newer is required. Check that port 4176 is available.
  pause
)
