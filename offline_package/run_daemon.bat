@echo off
setlocal
title Run Legacy Hardware Connection Manager
color 0a

echo Starting Legacy Hardware Connection Manager Daemon...
if exist dist\LegacyHardwareConnectionManager.exe (
    start "" "dist\LegacyHardwareConnectionManager.exe"
) else if exist LegacyHardwareConnectionManager.exe (
    start "" "LegacyHardwareConnectionManager.exe"
) else (
    echo [INFO] Standalone EXE not found, running directly with Python...
    start "" pythonw main.py
)
