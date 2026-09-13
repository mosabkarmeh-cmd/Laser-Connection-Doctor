@echo off
setlocal enabledelayedexpansion
title Build Standalone Executable - Legacy Hardware Connection Manager
color 0b

echo ==============================================================================
echo  Building Legacy Hardware Connection Manager (Standalone Windows 11 EXE)
echo  Strict Offline PyInstaller Compilation (--uac-admin --windowed)
echo ==============================================================================
echo.

:: 1. Check for Python
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python was not found in PATH! Please install Python 3.10+ and retry.
    pause
    exit /b 1
)

:: 2. Ensure Required Libraries
echo [*] Verifying build dependencies (pyserial, customtkinter, pywin32, wmi, pyinstaller)...
pip install --quiet --upgrade pyinstaller pyserial customtkinter pywin32 wmi

:: 3. Run PyInstaller
echo.
echo [*] Compiling main.py into standalone single-file binary...
echo [*] Command: pyinstaller --noconfirm --clean --onefile --windowed --uac-admin --name "LegacyHardwareConnectionManager" --add-data "drivers;drivers" main.py
echo.

pyinstaller --noconfirm --clean --onefile --windowed --uac-admin ^
    --name "LegacyHardwareConnectionManager" ^
    --add-data "drivers;drivers" ^
    --hidden-import "serial" ^
    --hidden-import "serial.tools.list_ports" ^
    --hidden-import "customtkinter" ^
    --hidden-import "wmi" ^
    --hidden-import "win32api" ^
    --hidden-import "win32con" ^
    --hidden-import "pythoncom" ^
    main.py

if %errorlevel% equ 0 (
    echo.
    echo ==============================================================================
    echo [SUCCESS] Build Complete!
    echo Standalone executable created at: dist\LegacyHardwareConnectionManager.exe
    echo ==============================================================================
    
    :: Copy drivers next to dist executable as backup
    if exist dist\ (
        if not exist dist\drivers\ mkdir dist\drivers\
        xcopy /s /y /q drivers\* dist\drivers\ >nul 2>nul
    )
) else (
    echo.
    echo [ERROR] Compilation failed. See logs above.
)

pause
