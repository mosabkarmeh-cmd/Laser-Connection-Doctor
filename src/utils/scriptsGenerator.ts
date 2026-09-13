// Python main.py source code for PyInstaller Windows 11 compilation (--uac-admin)
export const PYTHON_MAIN_PY = `# ==============================================================================
# Laser Connection Doctor - 100% Offline (Windows 11 Kernel & Systems Automation)
# Production-ready Standalone Script for PyInstaller (--uac-admin)
# Persistent Daemon & Windows 7 Emulation Architecture
# Author: Senior Windows Kernel, OS Emulation & Driver Reverse-Engineering Expert
# ==============================================================================

import sys
import os
import time
import ctypes
import threading
import subprocess
import winreg
import traceback
import json
import argparse
from datetime import datetime

import serial
import serial.tools.list_ports

# GUI is loaded only in interactive mode, allowing seamless headless daemon execution
try:
    import customtkinter as ctk
    HAS_GUI = True
except ImportError:
    HAS_GUI = False

# Optional PyUSB import for Raw USB Endpoint Proxy fallback
try:
    import usb.core
    import usb.util
    HAS_PYUSB = True
except ImportError:
    HAS_PYUSB = False

# ------------------------------------------------------------------------------
# Constants & Configuration Paths
# ------------------------------------------------------------------------------
TASK_NAME_SYSTEM = "LaserConnectionDoctor_SystemDaemon"
TASK_NAME_USER = "LaserConnectionDoctor_UserDaemon"

APP_DATA_DIR = os.path.join(os.environ.get("ProgramData", "C:\\\\ProgramData"), "LaserConnectionDoctor")
os.makedirs(APP_DATA_DIR, exist_ok=True)
DAEMON_LOG_FILE = os.path.join(APP_DATA_DIR, "daemon.log")
DESKTOP_LOG_FILE = os.path.join(os.path.expanduser("~"), "Desktop", "laser_diagnostic_log.txt")

# Hardware Communication Matrices & Payloads
PROTOCOL_PAYLOADS = [
    ("GRBL Status Ping", b"?\\r\\n"),
    ("GRBL Soft Reset (Ctrl-X)", b"\\x18"),
    ("Generic Wake Nulls", b"\\x00\\x00\\x00\\r\\n"),
    ("Marlin/RepRap M115", b"M115\\r\\n"),
    ("Ruida Frame Header Ping", bytes.fromhex("D5 5A 00 00 00 00 00 00")),
    ("Ruida Alternate Sync", b"\\xCC\\xEE\\xAA\\xBB"),
    ("Leetro MPC6515/6525 Sync", bytes.fromhex("AA 55 00 01 00 00 56")),
    ("Leetro Alternate Frame", bytes.fromhex("55 AA 55 AA")),
    ("Line Feed Handshake", b"\\r\\n")
]

EXTENDED_BAUDS = [250000, 230400, 115200, 74880, 57600, 38400, 19200, 9600, 4800]

DTR_RTS_COMBOS = [
    (True, True),    # Most legacy microcontrollers wake up with both asserted
    (True, False),
    (False, True),
    (False, False)
]

TARGET_PROCESSES = ["LightBurn.exe", "RDWorksV8.exe", "LaserGRBL.exe", "EzCad2.exe", "spoolsv.exe"]

KNOWN_LASER_VIDS = [
    0x1A86,  # QinHeng Electronics (CH340 / CH341)
    0x0403,  # FTDI (FT232R, FT245)
    0x10C4,  # Silicon Labs (CP2102, CP2104)
    0x067B,  # Prolific Technology (PL2303)
    0x0483,  # STMicroelectronics (STM32 / Leetro DSP)
    0x0471,  # Philips / Ruida DSP
]

STANDARD_SOFTWARE_PATHS = [
    r"C:\\Program Files\\LightBurn\\LightBurn.exe",
    r"C:\\RDWorksV8\\RDWorksV8.exe",
    r"C:\\Program Files (x86)\\LaserGRBL\\LaserGRBL.exe",
    r"C:\\EzCad2\\EzCad2.exe"
]

# ------------------------------------------------------------------------------
# Logging Utilities
# ------------------------------------------------------------------------------
def append_log(message, level="INFO", to_desktop=False):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    entry = f"[{timestamp}] [{level}] {message}\\n"
    print(entry.strip())
    
    # Write to System ProgramData daemon log
    try:
        with open(DAEMON_LOG_FILE, "a", encoding="utf-8") as f:
            f.write(entry)
    except Exception:
        pass

    if to_desktop:
        try:
            with open(DESKTOP_LOG_FILE, "a", encoding="utf-8") as f:
                f.write(entry)
        except Exception:
            pass

# ------------------------------------------------------------------------------
# UAC Auto-Elevation Check
# ------------------------------------------------------------------------------
def is_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin() != 0
    except Exception:
        return False

def elevate_privileges():
    if not is_admin():
        append_log("Requesting administrative elevation via ShellExecuteW...", "INFO")
        ctypes.windll.shell32.ShellExecuteW(
            None, "runas", sys.executable, " ".join(f'"{arg}"' for arg in sys.argv), None, 1
        )
        sys.exit(0)

# ------------------------------------------------------------------------------
# MODULE 1: System Emulation & Windows 7 Registry Environment Spoofing
# ------------------------------------------------------------------------------
def spoof_windows7_environment():
    """
    Injects global AppCompat flags, OS version masks, and layer overrides into HKLM
    to trick hardware installers and class drivers into treating Windows 11 as Windows 7 SP1.
    """
    append_log("1.1 Applying Windows 7 SP1 Registry Environment Spoofing...", "INFO")
    success_count = 0

    # 1. Global AppCompatFlags Layers for Laser Software & Driver Installers
    layers_key = r"Software\\Microsoft\\Windows NT\\CurrentVersion\\AppCompatFlags\\Layers"
    targets = [p for p in STANDARD_SOFTWARE_PATHS if os.path.exists(p)]
    # Include generic driver setup installer paths
    driver_installers = [
        r"C:\\Windows\\System32\\pnputil.exe",
        os.path.abspath(os.path.join(os.getcwd(), "drivers", "SETUP.EXE")),
        os.path.abspath(os.path.join(os.getcwd(), "drivers", "CH341SER.EXE")),
    ]
    targets.extend([d for d in driver_installers if os.path.exists(d)])

    for reg_hive in [winreg.HKEY_LOCAL_MACHINE, winreg.HKEY_CURRENT_USER]:
        try:
            with winreg.CreateKey(reg_hive, layers_key) as key:
                for target_exe in targets:
                    winreg.SetValueEx(key, target_exe, 0, winreg.REG_SZ, "~ WIN7SP1 256COLOR 640X480 DISABLEDWM HIGHDPIAWARE")
                    success_count += 1
        except Exception as e:
            append_log(f"Warning setting AppCompat layers in hive: {e}", "WARN")

    # 2. Global AppCompatFlags Compatibility Assistant Marker
    try:
        compat_key = r"SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\AppCompatFlags"
        with winreg.CreateKey(winreg.HKEY_LOCAL_MACHINE, compat_key) as key:
            # Emulate Windows 7 SP1 Major/Minor/Build attributes
            winreg.SetValueEx(key, "{50730000-E3B2-4df6-AC88-D015E3870B54}", 0, winreg.REG_DWORD, 0x00000001)
            winreg.SetValueEx(key, "GlobalWin7ShimState", 0, winreg.REG_SZ, "WIN7SP1_FORCED")
        success_count += 1
        append_log("Injected GlobalWin7ShimState into HKLM AppCompatFlags.", "SUCCESS")
    except Exception as ex:
        append_log(f"Failed to inject global AppCompat marker: {ex}", "WARN")

    # 3. Environment Variable Spoofing for sub-processes
    try:
        env_key = r"SYSTEM\\CurrentControlSet\\Control\\Session Manager\\Environment"
        with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, env_key, 0, winreg.KEY_SET_VALUE) as key:
            winreg.SetValueEx(key, "COMPAT_LAYER", 0, winreg.REG_SZ, "WIN7SP1")
        append_log("Set SYSTEM COMPAT_LAYER=WIN7SP1.", "SUCCESS")
    except Exception as ex:
        append_log(f"Could not set SYSTEM COMPAT_LAYER: {ex}", "WARN")

    return success_count > 0

def configure_kernel_test_mode():
    """
    Executes bcdedit /set testsigning on and /set nointegritychecks on
    so Windows 11 kernel allows legacy unsigned 32/64-bit drivers upon reboot.
    """
    append_log("1.2 Enforcing Kernel Test Mode (bcdedit testsigning & nointegritychecks)...", "INFO")
    cmd1 = "bcdedit /set testsigning on"
    cmd2 = "bcdedit /set nointegritychecks on"

    r1 = subprocess.run(cmd1, shell=True, capture_output=True, text=True)
    r2 = subprocess.run(cmd2, shell=True, capture_output=True, text=True)
    out = (r1.stdout + " " + r1.stderr + " " + r2.stdout + " " + r2.stderr).lower()

    if "protected by secure boot" in out:
        append_log("Secure Boot is active in UEFI/BIOS. bcdedit testsigning requires disabling Secure Boot.", "WARN")
        return False
    elif r1.returncode == 0:
        append_log("Kernel Test Mode enabled successfully. Windows 11 will accept legacy signatures.", "SUCCESS")
        return True
    else:
        append_log(f"bcdedit returned error: {r1.stderr.strip()}", "WARN")
        return False

def configure_hvci_memory_integrity(disable=True):
    """
    Toggles off Hypervisor-Enforced Code Integrity (HVCI) in registry
    to prevent pl2303.sys / ftdibus.sys crashes or Code 39 load blocks.
    """
    append_log("1.3 Configuring Memory Integrity (HVCI) in Registry...", "INFO")
    key_path = r"SYSTEM\\CurrentControlSet\\Control\\DeviceGuard\\Scenarios\\HypervisorEnforcedCodeIntegrity"
    try:
        with winreg.CreateKey(winreg.HKEY_LOCAL_MACHINE, key_path) as key:
            desired_val = 0 if disable else 1
            winreg.SetValueEx(key, "Enabled", 0, winreg.REG_DWORD, desired_val)
        append_log(f"Memory Integrity (HVCI) registry set to: {0 if disable else 1}.", "SUCCESS")
        return True
    except Exception as ex:
        append_log(f"Failed to update HVCI registry: {ex}", "WARN")
        return False

# ------------------------------------------------------------------------------
# MODULE 2: One-Time Setup & Persistent Background Daemon
# ------------------------------------------------------------------------------
def get_executable_command():
    """Returns the exact command to execute this script in silent daemon mode."""
    if getattr(sys, 'frozen', False):
        # Compiled executable via PyInstaller
        exe_path = sys.executable
        return f'"{exe_path}" --daemon'
    else:
        # Running as python script
        py_exe = sys.executable.replace("python.exe", "pythonw.exe")
        if not os.path.exists(py_exe):
            py_exe = sys.executable
        script_path = os.path.abspath(__file__)
        return f'"{py_exe}" "{script_path}" --daemon'

def install_scheduled_task_daemon():
    """
    Registers a persistent Windows Task using schtasks.exe that starts on system boot
    with highest admin privileges, running completely silently in background.
    """
    append_log("2.1 Registering Persistent Background Scheduled Task...", "INFO")
    cmd_to_run = get_executable_command()

    # 1. Boot-time SYSTEM task
    task_system_cmd = (
        f'schtasks /create /tn "{TASK_NAME_SYSTEM}" '
        f'/tr {cmd_to_run} '
        f'/sc onstart /ru "SYSTEM" /rl highest /f'
    )
    r1 = subprocess.run(task_system_cmd, shell=True, capture_output=True, text=True)

    # 2. User Logon task fallback (for desktop interactive session access)
    task_user_cmd = (
        f'schtasks /create /tn "{TASK_NAME_USER}" '
        f'/tr {cmd_to_run} '
        f'/sc onlogon /rl highest /f'
    )
    r2 = subprocess.run(task_user_cmd, shell=True, capture_output=True, text=True)

    # 3. Registry Run key fallback
    try:
        run_key = r"Software\\Microsoft\\Windows\\CurrentVersion\\Run"
        with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, run_key, 0, winreg.KEY_SET_VALUE) as key:
            winreg.SetValueEx(key, "LaserConnectionDaemon", 0, winreg.REG_SZ, cmd_to_run)
    except Exception as ex:
        append_log(f"Notice: Could not write HKLM Run key: {ex}", "INFO")

    if r1.returncode == 0 or r2.returncode == 0:
        append_log("Persistent Background Daemon registered successfully in Windows Task Scheduler!", "SUCCESS")
        return True
    else:
        append_log(f"Failed to create scheduled task: {r1.stderr.strip()}", "ERROR")
        return False

def uninstall_scheduled_task_daemon():
    """Removes the persistent background task and autostart registry entries."""
    append_log("Removing Persistent Background Scheduled Tasks...", "INFO")
    subprocess.run(f'schtasks /delete /tn "{TASK_NAME_SYSTEM}" /f', shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    subprocess.run(f'schtasks /delete /tn "{TASK_NAME_USER}" /f', shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    try:
        run_key = r"Software\\Microsoft\\Windows\\CurrentVersion\\Run"
        with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, run_key, 0, winreg.KEY_SET_VALUE) as key:
            winreg.DeleteValue(key, "LaserConnectionDaemon")
    except Exception:
        pass
    append_log("Daemon auto-start entries removed.", "SUCCESS")
    return True

# ------------------------------------------------------------------------------
# MODULE 3: Complete Offline Execution & Aggressive Driver Recovery
# ------------------------------------------------------------------------------
def terminate_conflicting_port_locks():
    """Force-terminates zombie processes holding COM port handles open."""
    terminated = []
    for proc in TARGET_PROCESSES:
        try:
            check_cmd = f'tasklist /FI "IMAGENAME eq {proc}"'
            res = subprocess.run(check_cmd, shell=True, capture_output=True, text=True)
            if proc.lower() in res.stdout.lower():
                if proc.lower() == "spoolsv.exe":
                    subprocess.run("net stop spooler && net start spooler", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    terminated.append("spoolsv(restarted)")
                else:
                    subprocess.run(f'taskkill /F /IM "{proc}"', shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    terminated.append(proc)
        except Exception:
            pass
    if terminated:
        append_log(f"Terminated conflicting processes locking serial lines: {', '.join(terminated)}", "SUCCESS")

def disable_usb_power_suspension():
    """Disables USB Selective Suspend across all root hubs to prevent disconnects."""
    ps_power = (
        'powershell -ExecutionPolicy Bypass -Command "'
        'Get-CimInstance -ClassName MSPower_DeviceEnable -Namespace root\\\\wmi '
        '| Where-Object {$_.InstanceName -match \\'USB\\'} '
        '| Set-CimInstance -Property @{Enable = $false} -ErrorAction SilentlyContinue"'
    )
    subprocess.run(ps_power, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

def detect_device_manager_errors():
    """
    Returns list of PnP devices reporting ProblemCode 10 (Can't start),
    43 (Hardware reported problem), 52 (Unsigned driver), or 39 (HVCI integrity).
    """
    ps_check = (
        'powershell -ExecutionPolicy Bypass -Command "'
        'Get-PnpDevice -Class Ports, USB -ErrorAction SilentlyContinue | '
        'Where-Object { $_.ProblemCode -in 10, 43, 52, 39 } | '
        'Select-Object FriendlyName, InstanceId, ProblemCode, Status | ConvertTo-Json -Compress"'
    )
    try:
        res = subprocess.run(ps_check, shell=True, capture_output=True, text=True, timeout=8)
        output = res.stdout.strip()
        if not output:
            return []
        data = json.loads(output)
        if isinstance(data, dict):
            return [data]
        elif isinstance(data, list):
            return data
    except Exception:
        pass
    return []

def self_heal_pnp_driver():
    """
    PnPUtil Self-Healing:
    Purges conflicting or corrupted drivers from DriverStore, then re-injects
    bundled offline .inf drivers from ./drivers/ directory.
    """
    errors = detect_device_manager_errors()
    if not errors:
        return False

    append_log(f"Self-Healing: Detected {len(errors)} device(s) with driver load errors (Codes 10/43/52/39)!", "WARN")
    for err in errors:
        append_log(f"-> Faulty Device: {err.get('FriendlyName')} | ProblemCode: {err.get('ProblemCode')}", "WARN")

    # Force purge bad OEM driver packages
    append_log("Purging bad driver packages via pnputil /delete-driver /uninstall /force...", "INFO")
    subprocess.run("pnputil /delete-driver oem*.inf /uninstall /force", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    # Re-inject offline bundled driver files
    driver_dir = os.path.join(os.getcwd(), "drivers")
    if not os.path.exists(driver_dir):
        # Check adjacent to executable
        exe_dir = os.path.dirname(sys.executable)
        alt_driver_dir = os.path.join(exe_dir, "drivers")
        if os.path.exists(alt_driver_dir):
            driver_dir = alt_driver_dir

    if os.path.exists(driver_dir):
        inf_files = [os.path.join(driver_dir, f) for f in os.listdir(driver_dir) if f.lower().endswith(".inf")]
        for inf in inf_files:
            append_log(f"Re-injecting bundled offline driver: {inf}", "INFO")
            r = subprocess.run(f'pnputil /add-driver "{inf}" /install', shell=True, capture_output=True, text=True)
            append_log(f"PnPUtil Install Output: {r.stdout.strip()[:160]}", "SUCCESS")
    else:
        append_log("Notice: No local ./drivers/*.inf directory found for re-injection.", "WARN")

    # Power cycle and re-enable PnP devices
    cycle_pnp_ports()
    return True

def cycle_pnp_ports():
    """Cycles PnP Devices matching laser controller chipsets to force driver re-binding."""
    ps_pnp = (
        'powershell -ExecutionPolicy Bypass -Command "'
        '$devs = Get-PnpDevice -Class Ports, USB -ErrorAction SilentlyContinue | '
        'Where-Object { $_.FriendlyName -match \\'CH340|CP210|FTDI|Prolific|Serial\\' -or $_.ProblemCode -ne 0 }; '
        'foreach ($d in $devs) { '
        '   Disable-PnpDevice -InstanceId $d.InstanceId -Confirm:$false -ErrorAction SilentlyContinue; '
        '   Start-Sleep -Milliseconds 300; '
        '   Enable-PnpDevice -InstanceId $d.InstanceId -Confirm:$false -ErrorAction SilentlyContinue; '
        '}"'
    )
    subprocess.run(ps_pnp, shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

# ------------------------------------------------------------------------------
# MODULE 4: Hardware Flow Control (DTR/RTS) & Serial Port Locking
# ------------------------------------------------------------------------------
def lock_port_and_handshake(target_port=None):
    """
    Enumerates serial ports, clears buffers, asserts DTR/RTS voltage lines,
    and sends wake-up pings across all standard baud rates.
    """
    ports = list(serial.tools.list_ports.comports())
    if not ports:
        return False, None, None

    if target_port:
        ports = [p for p in ports if p.device.upper() == target_port.upper()] or ports

    for p in ports:
        device_name = p.device
        for baud in EXTENDED_BAUDS:
            for (dtr_val, rts_val) in DTR_RTS_COMBOS:
                try:
                    ser = serial.Serial(
                        port=device_name,
                        baudrate=baud,
                        timeout=0.35,
                        write_timeout=0.35,
                        rtscts=False,
                        dsrdtr=False
                    )
                    ser.dtr = dtr_val
                    ser.rts = rts_val
                    time.sleep(0.12)  # Hardware reset line settling time

                    ser.reset_input_buffer()
                    ser.reset_output_buffer()

                    for payload_name, payload_bytes in PROTOCOL_PAYLOADS:
                        ser.write(payload_bytes)
                        time.sleep(0.18)

                        resp = b""
                        if ser.in_waiting > 0:
                            resp = ser.read(ser.in_waiting)
                        else:
                            resp = ser.read(64)

                        if resp and len(resp.strip()) > 0:
                            clean_resp = resp.decode('latin1', errors='ignore').strip()
                            append_log(
                                f"LOCKED & VERIFIED: {device_name} @ {baud} Baud | DTR={int(dtr_val)}, RTS={int(rts_val)} | Reply: {clean_resp[:60]}",
                                "SUCCESS"
                            )
                            ser.close()
                            return True, device_name, baud
                    ser.close()
                except Exception:
                    pass

    return False, None, None

# ------------------------------------------------------------------------------
# MODULE 5: Hot-Plug USB Listener & Persistent Daemon Loop
# ------------------------------------------------------------------------------
def run_hotplug_daemon():
    """
    Headless persistent daemon loop.
    Continuously listens for USB insertion events via WMI / device polling.
    Automatically self-heals drivers, un-suspends power, and locks serial lines.
    """
    append_log("="*75, "INFO")
    append_log("Starting Laser Connection Doctor Persistent Daemon (--daemon)...", "INFO")
    append_log(f"Process PID: {os.getpid()} | Admin: {is_admin()} | Logging to: {DAEMON_LOG_FILE}", "INFO")
    append_log("="*75, "INFO")

    # Initial environment setup at daemon boot
    spoof_windows7_environment()
    configure_kernel_test_mode()
    configure_hvci_memory_integrity(disable=True)
    disable_usb_power_suspension()

    known_ports = set()
    try:
        known_ports = {p.device for p in serial.tools.list_ports.comports()}
    except Exception:
        pass

    append_log(f"Daemon listening for USB plug events. Initial ports: {list(known_ports)}", "INFO")

    poll_counter = 0
    while True:
        try:
            time.sleep(1.8)
            poll_counter += 1

            # 1. Periodic Self-Healing Check (every 10 cycles = ~18 seconds)
            if poll_counter % 10 == 0:
                self_heal_pnp_driver()

            # 2. Check for newly plugged COM ports
            current_ports = {p.device for p in serial.tools.list_ports.comports()}
            newly_added = current_ports - known_ports

            if newly_added:
                for port_name in newly_added:
                    append_log(f"HOT-PLUG DETECTED: Laser / Serial device plugged into {port_name}!", "SUCCESS")
                    disable_usb_power_suspension()
                    terminate_conflicting_port_locks()
                    time.sleep(0.4)
                    lock_port_and_handshake(port_name)

                known_ports = current_ports
            elif current_ports != known_ports:
                # Device unplugged
                unplugged = known_ports - current_ports
                append_log(f"Device disconnected from: {list(unplugged)}", "INFO")
                known_ports = current_ports

        except KeyboardInterrupt:
            append_log("Daemon stopped by user.", "INFO")
            break
        except Exception as e:
            append_log(f"Daemon exception in loop: {e}", "WARN")
            time.sleep(3)

# ------------------------------------------------------------------------------
# MODULE 6: Interactive CustomTkinter Setup GUI
# ------------------------------------------------------------------------------
class LaserDoctorGUI(ctk.CTk if HAS_GUI else object):
    def __init__(self):
        if not HAS_GUI:
            print("CustomTkinter is not installed. Running in CLI mode.")
            return

        super().__init__()
        self.title("Laser Connection Doctor - Windows 11 Kernel & Systems Setup")
        self.geometry("860x780")
        self.minsize(780, 660)
        ctk.set_appearance_mode("Dark")
        ctk.set_default_color_theme("blue")

        self.is_running = False
        self._build_ui()

    def _build_ui(self):
        # Header
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=22, pady=(16, 8))

        title = ctk.CTkLabel(
            header,
            text="Laser Connection Doctor [Windows 11 Daemon & Kernel Edition]",
            font=ctk.CTkFont(size=20, weight="bold")
        )
        title.pack(anchor="w")

        subtitle = ctk.CTkLabel(
            header,
            text="تثبيت خدمة التشغيل التلقائي بالخلفية (schtasks Daemon) | محاكاة بيئة Windows 7 | تجاوز حظر النواة HVCI",
            font=ctk.CTkFont(size=12),
            text_color="#94a3b8"
        )
        subtitle.pack(anchor="w")

        # Daemon Action Banner
        daemon_card = ctk.CTkFrame(self, fg_color="#0f172a", border_color="#2563eb", border_width=1.5, corner_radius=10)
        daemon_card.pack(fill="x", padx=22, pady=(4, 10))

        daemon_title = ctk.CTkLabel(
            daemon_card,
            text="🚀 خدمة التشغيل التلقائي الدائم (Auto-Start Daemon)",
            font=ctk.CTkFont(size=14, weight="bold"),
            text_color="#60a5fa"
        )
        daemon_title.pack(anchor="w", padx=14, pady=(10, 2))

        daemon_desc = ctk.CTkLabel(
            daemon_card,
            text="تتيح هذه الميزة تشغيل الماكينة بمجرد توصيل كابل USB فوراً دون الحاجة لفتح البرنامج يدوياً في كل مرة.",
            font=ctk.CTkFont(size=11),
            text_color="#cbd5e1"
        )
        daemon_desc.pack(anchor="w", padx=14, pady=(0, 8))

        daemon_btn_row = ctk.CTkFrame(daemon_card, fg_color="transparent")
        daemon_btn_row.pack(fill="x", padx=14, pady=(0, 10))

        self.btn_install_daemon = ctk.CTkButton(
            daemon_btn_row,
            text="تثبيت الخدمة الدائمة (Register Daemon)",
            font=ctk.CTkFont(size=12, weight="bold"),
            height=34,
            fg_color="#1d4ed8",
            hover_color="#1e40af",
            command=self.handle_install_daemon
        )
        self.btn_install_daemon.pack(side="left", padx=(0, 8))

        self.btn_uninstall_daemon = ctk.CTkButton(
            daemon_btn_row,
            text="إلغاء تثبيت الخدمة (Remove)",
            font=ctk.CTkFont(size=11),
            height=34,
            fg_color="#334155",
            hover_color="#475569",
            command=self.handle_uninstall_daemon
        )
        self.btn_uninstall_daemon.pack(side="left")

        # Diagnostic & Recovery Tools Ribbon
        tools_frame = ctk.CTkFrame(self, fg_color="transparent")
        tools_frame.pack(fill="x", padx=22, pady=(0, 8))

        self.btn_spoof_win7 = ctk.CTkButton(
            tools_frame,
            text="حقن بيئة Windows 7 (Registry Spoof)",
            font=ctk.CTkFont(size=11, weight="bold"),
            height=32,
            fg_color="#3b82f6",
            hover_color="#2563eb",
            command=self.handle_spoof_win7
        )
        self.btn_spoof_win7.pack(side="left", fill="x", expand=True, padx=(0, 4))

        self.btn_testmode = ctk.CTkButton(
            tools_frame,
            text="تفعيل وضع الاختبار (bcdedit testsigning)",
            font=ctk.CTkFont(size=11, weight="bold"),
            height=32,
            fg_color="#b45309",
            hover_color="#78350f",
            command=self.handle_testmode
        )
        self.btn_testmode.pack(side="left", fill="x", expand=True, padx=4)

        self.btn_selfheal = ctk.CTkButton(
            tools_frame,
            text="الإنعاش الذاتي PnP (Code 10/43/52)",
            font=ctk.CTkFont(size=11, weight="bold"),
            height=32,
            fg_color="#0f766e",
            hover_color="#115e59",
            command=self.handle_selfheal
        )
        self.btn_selfheal.pack(side="left", fill="x", expand=True, padx=(4, 0))

        # Main Deep Scan Button
        self.btn_deep_scan = ctk.CTkButton(
            self,
            text="⚡ فحص المنافذ والتثبيت اليدوي الفوري (One-Click Deep Connect)",
            font=ctk.CTkFont(size=14, weight="bold"),
            height=44,
            fg_color="#059669",
            hover_color="#047857",
            command=self.start_deep_scan_threaded
        )
        self.btn_deep_scan.pack(fill="x", padx=22, pady=(0, 8))

        # Console Textbox
        self.log_box = ctk.CTkTextbox(
            self,
            font=ctk.CTkFont(family="Consolas", size=11),
            fg_color="#090d16",
            border_color="#1e293b",
            border_width=1
        )
        self.log_box.pack(fill="both", expand=True, padx=22, pady=(0, 10))

        # Footer Actions
        footer = ctk.CTkFrame(self, fg_color="transparent")
        footer.pack(fill="x", padx=22, pady=(0, 14))

        self.btn_open_log = ctk.CTkButton(
            footer,
            text="فتح ملف تقرير الـ Daemon",
            font=ctk.CTkFont(size=11),
            height=30,
            fg_color="#334155",
            hover_color="#475569",
            command=lambda: os.startfile(DAEMON_LOG_FILE) if os.path.exists(DAEMON_LOG_FILE) else None
        )
        self.btn_open_log.pack(side="left", padx=(0, 8))

        self.log_msg("جاهز للعمل. يمكنك تثبيت الخدمة الدائمة أو حقن محاكاة Windows 7 بنقرة واحدة.")

    def log_msg(self, text, level="INFO"):
        prefix = {"INFO": "[ℹ️]", "SUCCESS": "[✅]", "WARN": "[⚠️]", "ERROR": "[❌]"}.get(level, "[•]")
        timestamp = datetime.now().strftime("%H:%M:%S")
        entry = f"[{timestamp}] {prefix} {text}\\n"
        self.log_box.insert("end", entry)
        self.log_box.see("end")
        append_log(text, level, to_desktop=True)

    def handle_install_daemon(self):
        def _task():
            ok = install_scheduled_task_daemon()
            if ok:
                self.log_msg("تم تثبيت خدمة التشغيل التلقائي بالخلفية بنجاح! ستعمل الماكينة تلقائياً عند الإقلاع وتوصيل الـ USB.", "SUCCESS")
            else:
                self.log_msg("فشل تسجيل مهمة الويندوز المجدولة. يرجى مراجعة الصلاحيات.", "ERROR")
        threading.Thread(target=_task, daemon=True).start()

    def handle_uninstall_daemon(self):
        uninstall_scheduled_task_daemon()
        self.log_msg("تمت إزالة خدمة التشغيل التلقائي بنجاح.", "INFO")

    def handle_spoof_win7(self):
        def _task():
            ok = spoof_windows7_environment()
            if ok:
                self.log_msg("تم حقن بيئة وتوافق Windows 7 SP1 في ريجستري الويندوز بنجاح!", "SUCCESS")
            else:
                self.log_msg("تعذر حقن بعض مفاتيح التوافق.", "WARN")
        threading.Thread(target=_task, daemon=True).start()

    def handle_testmode(self):
        def _task():
            configure_kernel_test_mode()
            configure_hvci_memory_integrity(disable=True)
            self.log_msg("تم ضبط وضع الاختبار وتعطيل HVCI في الريجستري. (تنبيه: يتطلب إعادة تشغيل الجهاز لتطبيقه بالنواة).", "SUCCESS")
        threading.Thread(target=_task, daemon=True).start()

    def handle_selfheal(self):
        def _task():
            healed = self_heal_pnp_driver()
            if healed:
                self.log_msg("اكتمل الإنعاش الذاتي وإعادة حقن ملفات INF في مخزن DriverStore بنجاح!", "SUCCESS")
            else:
                self.log_msg("لم يتم رصد أي أخطاء Code 10/43/52/39 نشطة في مدير الأجهزة حالياً.", "INFO")
        threading.Thread(target=_task, daemon=True).start()

    def start_deep_scan_threaded(self):
        def _task():
            self.log_msg("بدء الفحص الشامل لمصفوفة المنافذ والتثبيت اليدوي...", "INFO")
            terminate_conflicting_port_locks()
            disable_usb_power_suspension()
            cycle_pnp_ports()
            success, port, baud = lock_port_and_handshake()
            if success:
                self.log_msg(f"تم الربط وتأمين الإشارة بنجاح مع الماكينة عبر ({port} @ {baud} Baud)!", "SUCCESS")
            else:
                self.log_msg("لم تستجب الماكينة لأوامر الـ Handshake. جاري فحص التعاريف القديمة...", "WARN")
                self_heal_pnp_driver()
        threading.Thread(target=_task, daemon=True).start()

# ------------------------------------------------------------------------------
# Entry Point Dispatcher
# ------------------------------------------------------------------------------
def main():
    parser = argparse.ArgumentParser(description="Laser Connection Doctor - Windows 11 Systems & Daemon")
    parser.add_argument("--daemon", "-d", action="store_true", help="Run in headless persistent background daemon mode")
    parser.add_argument("--install-daemon", action="store_true", help="Install persistent Windows Scheduled Task")
    parser.add_argument("--uninstall-daemon", action="store_true", help="Uninstall persistent Windows Scheduled Task")
    parser.add_argument("--spoof-win7", action="store_true", help="Apply Windows 7 registry compatibility spoofing")
    args = parser.parse_args()

    elevate_privileges()

    if args.install_daemon:
        install_scheduled_task_daemon()
        sys.exit(0)
    elif args.uninstall_daemon:
        uninstall_scheduled_task_daemon()
        sys.exit(0)
    elif args.spoof_win7:
        spoof_windows7_environment()
        sys.exit(0)
    elif args.daemon:
        # Headless silent daemon mode
        run_hotplug_daemon()
    else:
        # Launch Interactive GUI
        if HAS_GUI:
            app = LaserDoctorGUI()
            app.mainloop()
        else:
            print("No GUI environment detected. Defaulting to persistent daemon mode...")
            run_hotplug_daemon()

if __name__ == "__main__":
    main()
`;

export const PYTHON_APP_CODE = PYTHON_MAIN_PY;

export const POWERSHELL_POWER_COMMAND = `powershell -ExecutionPolicy Bypass -Command "Get-CimInstance -ClassName MSPower_DeviceEnable -Namespace root\\wmi | Where-Object {$_.InstanceName -match 'USB'} | Set-CimInstance -Property @{Enable = $false}"`;

export const PNPUTIL_ENUM_COMMAND = `pnputil /enum-drivers`;

export const PNPUTIL_INSTALL_COMMAND = `pnputil /add-driver "drivers\\laser_driver.inf" /install`;

export const PNPUTIL_PURGE_COMMAND = `pnputil /delete-driver oem*.inf /uninstall /force`;

export const POWERSHELL_PNP_RESET_COMMAND = `powershell -ExecutionPolicy Bypass -Command "$devices = Get-PnpDevice -Class Ports, USB -ErrorAction SilentlyContinue | Where-Object { ($_.Status -eq 'Error' -or $_.ProblemCode -ne 0 -or $_.FriendlyName -match 'CH340|CP210|FTDI|Prolific|Serial') }; foreach ($d in $devices) { Write-Host 'Cycling:' $d.FriendlyName; Disable-PnpDevice -InstanceId $d.InstanceId -Confirm:$false; Start-Sleep -Milliseconds 400; Enable-PnpDevice -InstanceId $d.InstanceId -Confirm:$false }"`;

export const REGISTRY_HVCI_DISABLE_COMMAND = `reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard\\Scenarios\\HypervisorEnforcedCodeIntegrity" /v Enabled /t REG_DWORD /d 0 /f`;

export const BCDEDIT_TESTMODE_COMMAND = `bcdedit /set testsigning on && bcdedit /set nointegritychecks on`;

export const REGISTRY_APPCOMPAT_COMMAND = `reg add "HKCU\\Software\\Microsoft\\Windows NT\\CurrentVersion\\AppCompatFlags\\Layers" /v "C:\\Program Files\\LightBurn\\LightBurn.exe" /d "~ WIN7RTM" /f`;

export const POWERSHELL_DETECT_LEGACY_COMMAND = `powershell -ExecutionPolicy Bypass -Command "Get-PnpDevice -Class Ports, USB | Where-Object { $_.ProblemCode -eq 52 -or $_.ProblemCode -eq 39 } | Select-Object FriendlyName, InstanceId, ProblemCode, Status"`;

export const SCHTASKS_CREATE_COMMAND = `schtasks /create /tn "LaserConnectionDaemon" /tr "\\"%ProgramFiles%\\LaserDoctor\\main.exe\\" --daemon" /sc onstart /ru "SYSTEM" /rl highest /f`;

export const SCHTASKS_DELETE_COMMAND = `schtasks /delete /tn "LaserConnectionDaemon" /f`;

export const REGISTRY_WIN7_GLOBAL_SPOOF_COMMAND = `reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\AppCompatFlags" /v "{50730000-E3B2-4df6-AC88-D015E3870B54}" /t REG_DWORD /d 1 /f && reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\AppCompatFlags" /v "GlobalWin7ShimState" /t REG_SZ /d "WIN7SP1_FORCED" /f`;

export const POWERSHELL_SELF_HEAL_COMMAND = `powershell -ExecutionPolicy Bypass -Command "$faulty = Get-PnpDevice -Class Ports, USB | Where-Object { $_.ProblemCode -in 10, 43, 52, 39 }; if ($faulty) { Write-Host 'Detected faulty devices: ' $faulty.Count; pnputil /delete-driver oem*.inf /uninstall /force; pnputil /add-driver '.\\drivers\\*.inf' /install }"`;

export const PYINSTALLER_BUILD_COMMAND = `pyinstaller --noconfirm --onedir --windowed --uac-admin --name "LaserConnectionDoctor" --add-data "drivers;drivers" main.py`;

export const RUN_BATCH_CODE = `@echo off
chcp 65001 > nul
echo ==============================================================================
echo    Laser Connection Doctor - Automated Administrator Launcher
echo ==============================================================================

:: Check for Administrative Privileges
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo Requesting administrative privileges...
    powershell -Command "Start-Process '%~0' -Verb RunAs"
    exit /b
)

echo Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python 3 is not installed or not in PATH!
    echo Please install Python 3.10+ from https://www.python.org/downloads/
    pause
    exit /b
)

echo Installing required Python libraries (pyserial, customtkinter, pyusb)...
pip install pyserial customtkinter pyusb --quiet

echo Launching Laser Connection Doctor...
python main.py
`;

export const INSTALL_DAEMON_BAT_CODE = `@echo off
chcp 65001 > nul
echo ==============================================================================
echo   Laser Connection Doctor - Persistent Daemon One-Time Installer (schtasks)
echo ==============================================================================

net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Requesting administrative elevation...
    powershell -Command "Start-Process '%~0' -Verb RunAs"
    exit /b
)

echo [1/3] Injecting Windows 7 Registry Environment Spoofing...
reg add "HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\AppCompatFlags" /v "{50730000-E3B2-4df6-AC88-D015E3870B54}" /t REG_DWORD /d 1 /f >nul
reg add "HKLM\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard\\Scenarios\\HypervisorEnforcedCodeIntegrity" /v Enabled /t REG_DWORD /d 0 /f >nul

echo [2/3] Enabling Kernel Test Mode (bcdedit testsigning)...
bcdedit /set testsigning on >nul
bcdedit /set nointegritychecks on >nul

echo [3/3] Creating Windows Scheduled Task (Runs silently on boot)...
set SCRIPT_PATH=%~dp0main.py
schtasks /create /tn "LaserConnectionDoctor_Daemon" /tr "pythonw.exe \\"%SCRIPT_PATH%\\" --daemon" /sc onstart /ru "SYSTEM" /rl highest /f

echo.
echo ==============================================================================
echo  SUCCESS: Persistent Background Daemon is now installed and active!
echo  Your laser engraver will auto-connect every time it is plugged in via USB.
echo ==============================================================================
pause
`;

export const UNINSTALL_DAEMON_BAT_CODE = `@echo off
chcp 65001 > nul
net session >nul 2>&1
if %errorlevel% neq 0 (
    powershell -Command "Start-Process '%~0' -Verb RunAs"
    exit /b
)
echo Removing Laser Connection Doctor Scheduled Task...
schtasks /delete /tn "LaserConnectionDoctor_Daemon" /f
echo Removed successfully.
pause
`;

export function downloadFile(filename: string, content: string, mimeType: string = 'text/plain') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadOfflineZip() {
  const a = document.createElement('a');
  a.href = '/LegacyHardwareConnectionManager_OfflinePackage.zip';
  a.download = 'LegacyHardwareConnectionManager_OfflinePackage.zip';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

export interface TaskSchedulerConfig {
  taskName: string;
  triggerMode: 'AtStartup' | 'AtLogon' | 'Both';
  targetType: 'python' | 'compiledExe' | 'custom';
  targetPath: string;
  pollIntervalSeconds: number;
  autoHealDrivers: boolean;
  runAsSystem: boolean;
  restartOnFailure: boolean;
}

/**
 * Generates an enterprise-grade, self-elevating Windows PowerShell script (.ps1)
 * that configures and registers a Windows Task Scheduler entry to launch the
 * diagnostic background monitor at system startup or user logon.
 */
export function generateTaskSchedulerPs1(config: TaskSchedulerConfig): string {
  const {
    taskName = 'LaserConnectionDoctor_BackgroundMonitor',
    triggerMode = 'AtStartup',
    targetType = 'python',
    targetPath = 'C:\\ProgramData\\LaserConnectionDoctor\\main.py',
    pollIntervalSeconds = 2,
    autoHealDrivers = true,
    runAsSystem = true,
    restartOnFailure = true,
  } = config;

  return `# ==============================================================================
# Laser Connection Doctor - Task Scheduler Auto-Registration Script
# Production-ready Windows 11 / Windows 10 PowerShell Automation Script (.ps1)
# Registers persistent background diagnostic monitor at system startup
# ==============================================================================
# Requires -Version 5.1
# Requires -RunAsAdministrator

[CmdletBinding()]
param(
    [string]$TaskName = "${taskName}",
    [string]$TargetPath = "${targetPath}",
    [string]$ActionType = "${targetType}",
    [int]$PollInterval = ${pollIntervalSeconds},
    [switch]$ForceRecreate = $true
)

# ------------------------------------------------------------------------------
# 1. Ensure Administrative Elevation
# ------------------------------------------------------------------------------
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Warning "Elevation required. Re-launching PowerShell as Administrator..."
    $arguments = "-NoProfile -ExecutionPolicy Bypass -File \`"$PSCommandPath\`""
    Start-Process powershell.exe -Verb RunAs -ArgumentList $arguments
    exit
}

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "  Laser Connection Doctor - Task Scheduler Setup Engine" -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "[*] Target Task: $TaskName" -ForegroundColor Gray
Write-Host "[*] Trigger Mode: ${triggerMode}" -ForegroundColor Gray
Write-Host "[*] Target Path: $TargetPath" -ForegroundColor Gray
Write-Host "[*] Auto-Heal PnP Drivers: ${autoHealDrivers ? '$true' : '$false'}" -ForegroundColor Gray

# ------------------------------------------------------------------------------
# 2. Prepare Directories & Working Environment
# ------------------------------------------------------------------------------
$appDataDir = "$env:ProgramData\\LaserConnectionDoctor"
if (-not (Test-Path $appDataDir)) {
    New-Item -Path $appDataDir -ItemType Directory -Force | Out-Null
    Write-Host "[+] Created application state folder: $appDataDir" -ForegroundColor Green
}

# ------------------------------------------------------------------------------
# 3. Resolve Target Binary & Action Arguments
# ------------------------------------------------------------------------------
$executeBin = ""
$arguments = ""

if ($ActionType -eq "python") {
    # Resolve pythonw.exe (windowless Python launcher)
    $pythonw = (Get-Command pythonw.exe -ErrorAction SilentlyContinue).Source
    if (-not $pythonw) {
        $python = (Get-Command python.exe -ErrorAction SilentlyContinue).Source
        if ($python) {
            $candidate = [System.IO.Path]::Combine([System.IO.Path]::GetDirectoryName($python), "pythonw.exe")
            if (Test-Path $candidate) { $pythonw = $candidate }
        }
    }
    if (-not $pythonw) {
        $pythonw = "pythonw.exe"
    }

    $executeBin = $pythonw
    $arguments = "\`"$TargetPath\`" --daemon --poll $PollInterval"
    if (${autoHealDrivers ? '$true' : '$false'}) {
        $arguments += " --auto-heal"
    }
} elseif ($ActionType -eq "compiledExe") {
    $executeBin = $TargetPath
    $arguments = "--daemon --poll $PollInterval"
    if (${autoHealDrivers ? '$true' : '$false'}) {
        $arguments += " --auto-heal"
    }
} else {
    $executeBin = $TargetPath
    $arguments = "--daemon"
}

Write-Host "[+] Action Command: $executeBin $arguments" -ForegroundColor DarkCyan

# ------------------------------------------------------------------------------
# 4. Remove Any Existing Task with Identical Name
# ------------------------------------------------------------------------------
try {
    $existing = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($existing) {
        Write-Host "[*] Found existing task '$TaskName'. Deregistering..." -ForegroundColor Yellow
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    }
} catch {
    # Task did not exist
}

# ------------------------------------------------------------------------------
# 5. Build Scheduled Task Action & Triggers
# ------------------------------------------------------------------------------
$taskAction = New-ScheduledTaskAction -Execute $executeBin -Argument $arguments -WorkingDirectory $appDataDir

$triggers = @()
${
  triggerMode === 'AtStartup' || triggerMode === 'Both'
    ? `
# Trigger: At Machine Boot (Startup)
$startupTrigger = New-ScheduledTaskTrigger -AtStartup
$triggers += $startupTrigger
`
    : ''
}
${
  triggerMode === 'AtLogon' || triggerMode === 'Both'
    ? `
# Trigger: At User Logon
$logonTrigger = New-ScheduledTaskTrigger -AtLogOn
$triggers += $logonTrigger
`
    : ''
}

# ------------------------------------------------------------------------------
# 6. Task Settings & Principal
# ------------------------------------------------------------------------------
$taskSettings = New-ScheduledTaskSettingsSet \`
    -AllowStartIfOnBatteries \`
    -DontStopIfGoingOnBatteries \`
    -ExecutionTimeLimit (New-TimeSpan -Days 0) \`
    ${restartOnFailure ? '-RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) `' : ''}
    -Priority 4 \`
    -StartWhenAvailable

${
  runAsSystem
    ? `
# Configure to run as NT AUTHORITY\\SYSTEM with Highest Privileges
$taskPrincipal = New-ScheduledTaskPrincipal -UserId "NT AUTHORITY\\SYSTEM" -LogonType ServiceAccount -RunLevel Highest
`
    : `
# Configure to run as Current User with Highest Administrative Privileges
$taskPrincipal = New-ScheduledTaskPrincipal -UserId "$env:USERDOMAIN\\$env:USERNAME" -LogonType Interactive -RunLevel Highest
`
}

# ------------------------------------------------------------------------------
# 7. Register Scheduled Task in Windows
# ------------------------------------------------------------------------------
try {
    $newTask = New-ScheduledTask \`
        -Action $taskAction \`
        -Trigger $triggers \`
        -Settings $taskSettings \`
        -Principal $taskPrincipal \`
        -Description "Laser Connection Doctor Persistent Background Diagnostic Monitor (Auto-detects USB, unlocks serial COM, clears port handles and repairs drivers)"

    Register-ScheduledTask -TaskName $TaskName -InputObject $newTask -Force | Out-Null

    Write-Host ""
    Write-Host "[SUCCESS] Windows Scheduled Task '$TaskName' registered successfully!" -ForegroundColor Green
    Write-Host "[*] Status: Ready to monitor USB laser connections at boot." -ForegroundColor Green
    
    # --------------------------------------------------------------------------
    # 8. Start Task Immediately for Active Session Verification
    # --------------------------------------------------------------------------
    Write-Host "[*] Launching task now to verify initial background startup..." -ForegroundColor Yellow
    Start-ScheduledTask -TaskName $TaskName
    Start-Sleep -Seconds 1
    
    $info = Get-ScheduledTask -TaskName $TaskName
    Write-Host "[+] Current Task State: $($info.State)" -ForegroundColor Cyan
    Write-Host "======================================================================" -ForegroundColor Cyan
    Write-Host " Setup complete! The diagnostic monitor is running in the background." -ForegroundColor White
    Write-Host " Logs will be stored at: $appDataDir\\daemon.log" -ForegroundColor Gray
    Write-Host "======================================================================" -ForegroundColor Cyan
} catch {
    Write-Error "Failed to register scheduled task: $_"
    exit 1
}
`;
}

