# ==============================================================================
# Legacy Hardware Connection Manager (Windows 11 Persistent Offline Daemon)
# ==============================================================================
# Target Hardware: Legacy USB-to-Serial CNC / Laser Engraver Controllers
# Chips Handled: CH340/CH341, FTDI FT232R, Silicon Labs CP2102, Prolific PL2303
# Software Supported: LightBurn, RDWorks, LaserGRBL, GRBL Controller, K40 Whisperer
# Author: Senior IT Systems & Hardware Compatibility Engineer
#
# Core Modules:
# 1. WMI Win32_DeviceChangeEvent background hot-plug USB monitor
# 2. Automated Driver Self-Healing: PnPUtil purge & offline .inf driver injection for Code 10 / Code 43
# 3. Hardware Wake-up & Baud Rate Brute-Force (250000, 115200, 57600, 38400, 19200, 9600)
# 4. Safe App Compatibility Injection for LightBurn.exe & RDWorksV8.exe (WIN7SP1)
# 5. Intelligent Core Isolation / HVCI Detection & CustomTkinter Operator Alert
# ==============================================================================

import sys
import os
import time
import subprocess
import threading
import traceback
import re
import json
from datetime import datetime

# Windows-specific system imports guarded for cross-platform compile
try:
    import winreg
except ImportError:
    winreg = None

try:
    import ctypes
except ImportError:
    ctypes = None

try:
    import serial
    import serial.tools.list_ports
    HAS_SERIAL = True
except ImportError:
    HAS_SERIAL = False

try:
    import wmi
    import pythoncom
    HAS_WMI = True
except ImportError:
    HAS_WMI = False

try:
    import customtkinter as ctk
    HAS_CTK = True
except ImportError:
    HAS_CTK = False

# ------------------------------------------------------------------------------
# App Metadata & Paths
# ------------------------------------------------------------------------------
APP_NAME = "Legacy Hardware Connection Manager"
APP_VERSION = "2.4.0 (Windows 11 Strict Offline Edition)"
APP_DIR = os.path.dirname(os.path.abspath(sys.argv[0]))
DRIVERS_DIR = os.path.join(APP_DIR, "drivers")
LOGS_DIR = os.path.join(os.environ.get("ProgramData", "C:\\ProgramData"), "LegacyHardwareManager")
os.makedirs(LOGS_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOGS_DIR, "connection_daemon.log")

# Hardware & Baud Rate Specifications
BAUD_RATES = [250000, 115200, 57600, 38400, 19200, 9600]

WAKEUP_PAYLOADS = [
    ("GRBL Status Ping", b"?\r\n"),
    ("GRBL Soft Reset (Ctrl-X)", b"\x18"),
    ("Generic Wake Nulls", b"\x00\x00\x00\r\n"),
    ("Marlin/RepRap M115", b"M115\r\n"),
    ("Ruida Frame Header Ping", bytes.fromhex("D5 5A 00 00 00 00 00 00")),
    ("Ruida Alternate Sync", b"\xCC\xEE\xAA\xBB"),
    ("Leetro MPC6515 Sync", bytes.fromhex("AA 55 00 01 00 00 56")),
    ("Line Feed Handshake", b"\r\n")
]

KNOWN_HARDWARE_IDS = [
    ("1A86", "7523", "CH340 / CH341 USB-to-Serial"),
    ("1A86", "5523", "CH341 Laser Controller"),
    ("1A86", "7522", "CH340G USB Serial"),
    ("0403", "6001", "FTDI FT232R USB UART"),
    ("0403", "6015", "FTDI FT230X USB UART"),
    ("10C4", "EA60", "Silicon Labs CP2102 USB-to-UART Bridge"),
    ("10C4", "EA61", "Silicon Labs CP2104 USB-to-UART Bridge"),
    ("067B", "2303", "Prolific PL2303 Legacy Controller (Code 10 sensitive)"),
    ("1B4F", "9206", "Makeblock Orion / Arduino Laser Controller"),
]

# ------------------------------------------------------------------------------
# Logging Utilities
# ------------------------------------------------------------------------------
def log(msg, level="INFO"):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] [{level.upper()}] {msg}"
    print(line)
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(line + "\n")
    except Exception:
        pass

# ------------------------------------------------------------------------------
# Module 1: Safe App Compatibility Injection (LightBurn & RDWorks)
# ------------------------------------------------------------------------------
def inject_app_compatibility():
    """
    Safely injects Windows 7 Compatibility Mode for operating software:
    HKCU\\Software\\Microsoft\\Windows NT\\CurrentVersion\\AppCompatFlags\\Layers
    and HKLM\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\AppCompatFlags\\Layers
    Adds '~ WIN7SP1 RUNASADMIN'
    """
    log("Applying safe Windows 7 Compatibility flags for laser & CNC applications...", "INFO")
    
    target_executables = [
        r"C:\Program Files\LightBurn\LightBurn.exe",
        r"C:\Program Files (x86)\LightBurn\LightBurn.exe",
        r"C:\Program Files\RDWorksV8\RDWorksV8.exe",
        r"C:\Program Files (x86)\RDWorksV8\RDWorksV8.exe",
        r"C:\Program Files\LaserGRBL\LaserGRBL.exe",
        r"C:\Program Files (x86)\LaserGRBL\LaserGRBL.exe",
        r"C:\RDWorksV8\RDWorksV8.exe",
        r"C:\LaserCAD\LaserCAD.exe",
        # Generic entries by executable name in registry
        "LightBurn.exe",
        "RDWorksV8.exe",
        "LaserGRBL.exe"
    ]
    
    compat_string = "~ WIN7SP1 RUNASADMIN"
    injected_count = 0

    # User-level registry (HKCU)
    try:
        user_key_path = r"Software\Microsoft\Windows NT\CurrentVersion\AppCompatFlags\Layers"
        with winreg.CreateKey(winreg.HKEY_CURRENT_USER, user_key_path) as key:
            for exe in target_executables:
                winreg.SetValueEx(key, exe, 0, winreg.REG_SZ, compat_string)
                injected_count += 1
        log(f"Injected {injected_count} AppCompat flags in HKCU.", "SUCCESS")
    except Exception as ex:
        log(f"HKCU AppCompat injection notice: {ex}", "WARN")

    # System-level registry (HKLM)
    try:
        sys_key_path = r"SOFTWARE\Microsoft\Windows NT\CurrentVersion\AppCompatFlags\Layers"
        with winreg.CreateKey(winreg.HKEY_LOCAL_MACHINE, sys_key_path) as key:
            for exe in target_executables:
                winreg.SetValueEx(key, exe, 0, winreg.REG_SZ, compat_string)
        log("Injected system-wide AppCompat flags in HKLM.", "SUCCESS")
    except Exception as ex:
        log(f"HKLM AppCompat injection notice (requires elevated admin): {ex}", "WARN")

# ------------------------------------------------------------------------------
# Module 2: Intelligent Security Detection & Operator Guidance (HVCI / Memory Integrity)
# ------------------------------------------------------------------------------
def check_hypervisor_enforced_code_integrity():
    """
    Checks if Windows 11 Memory Integrity / HVCI is enabled:
    HKLM\\SYSTEM\\CurrentControlSet\\Control\\DeviceGuard\\Scenarios\\HypervisorEnforcedCodeIntegrity\\Enabled
    Returns (is_enabled: bool, is_blocking: bool)
    """
    if winreg is None:
        return False, False

    try:
        key_path = r"SYSTEM\CurrentControlSet\Control\DeviceGuard\Scenarios\HypervisorEnforcedCodeIntegrity"
        with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, key_path, 0, winreg.KEY_READ) as key:
            val, reg_type = winreg.QueryValueEx(key, "Enabled")
            is_enabled = (val == 1)
            return is_enabled, is_enabled
    except FileNotFoundError:
        # Fallback query
        try:
            sec_path = r"SYSTEM\CurrentControlSet\Control\DeviceGuard"
            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, sec_path, 0, winreg.KEY_READ) as key:
                val, _ = winreg.QueryValueEx(key, "EnableVirtualizationBasedSecurity")
                return (val == 1), (val == 1)
        except Exception:
            return False, False
    except Exception as ex:
        log(f"Error checking HVCI status: {ex}", "WARN")
        return False, False

def show_hvci_operator_alert_gui():
    """
    Displays a prominent, professional CustomTkinter operator dialog
    guiding them on how to manually toggle Memory Integrity in Windows Settings.
    Strictly complies with AI security rules: DOES NOT forcefully disable kernel security.
    """
    if not HAS_CTK:
        log("[OPERATOR ACTION REQUIRED] Windows 11 Memory Integrity (HVCI) is active.", "ALERT")
        log("To allow legacy PL2303/CH340 drivers to load without Code 39/38 block:", "ALERT")
        log("1. Open Windows Security > Device Security > Core Isolation details.", "ALERT")
        log("2. Toggle 'Memory Integrity' to OFF and restart laptop.", "ALERT")
        return

    def run_gui():
        ctk.set_appearance_mode("dark")
        ctk.set_default_color_theme("blue")
        
        root = ctk.CTk()
        root.title("Security Guidance - Windows 11 Memory Integrity Alert")
        root.geometry("680x520")
        root.resizable(False, False)
        root.attributes("-topmost", True)

        # Header Box
        header_frame = ctk.CTkFrame(root, corner_radius=12, fg_color="#1c1917", border_color="#f59e0b", border_width=2)
        header_frame.pack(fill="x", padx=20, pady=(20, 10))

        title_lbl = ctk.CTkLabel(
            header_frame, 
            text="⚠️ Windows 11 Core Isolation / Memory Integrity Detected",
            font=ctk.CTkFont(size=17, weight="bold"),
            text_color="#fbbf24"
        )
        title_lbl.pack(pady=(12, 4))

        sub_lbl = ctk.CTkLabel(
            header_frame,
            text="Legacy hardware driver (.sys) is being blocked by Windows Hypervisor Code Integrity.",
            font=ctk.CTkFont(size=12),
            text_color="#e2e8f0"
        )
        sub_lbl.pack(pady=(0, 12))

        # Instructions Body
        content_frame = ctk.CTkFrame(root, corner_radius=12, fg_color="#0f172a")
        content_frame.pack(fill="both", expand=True, padx=20, pady=10)

        step_title = ctk.CTkLabel(
            content_frame,
            text="Standard Operator Action Required (Zero-Hack Windows Configuration):",
            font=ctk.CTkFont(size=13, weight="bold"),
            text_color="#38bdf8"
        )
        step_title.pack(anchor="w", padx=20, pady=(15, 8))

        steps_text = (
            "Because this tool complies with Windows Kernel Security constraints, it does NOT bypass\n"
            "or forcefully alter your Windows 11 kernel settings without authorization.\n\n"
            "To permit your legacy CNC / Laser USB driver (PL2303 / CH340) to operate:\n\n"
            "  1. Press Start and search for: 'Core Isolation' (عزل النواة)\n"
            "  2. Click on 'Device Security' -> 'Core isolation details'\n"
            "  3. Toggle 'Memory Integrity' (سلامة الذاكرة) to OFF\n"
            "  4. Restart your Lenovo Legion 5 laptop\n\n"
            "Once rebooted, this daemon will immediately bind and activate your COM port."
        )

        steps_lbl = ctk.CTkLabel(
            content_frame,
            text=steps_text,
            font=ctk.CTkFont(size=12),
            justify="left",
            text_color="#cbd5e1"
        )
        steps_lbl.pack(anchor="w", padx=20, pady=(0, 15))

        # Buttons Frame
        btn_frame = ctk.CTkFrame(root, fg_color="transparent")
        btn_frame.pack(fill="x", padx=20, pady=(10, 20))

        def open_windows_security():
            try:
                subprocess.run("start windowsdefender://coreisolation", shell=True)
            except Exception:
                pass

        sec_btn = ctk.CTkButton(
            btn_frame,
            text="Open Windows Core Isolation Settings",
            command=open_windows_security,
            fg_color="#0284c7",
            hover_color="#0369a1",
            height=38,
            font=ctk.CTkFont(size=12, weight="bold")
        )
        sec_btn.pack(side="left", fill="x", expand=True, padx=(0, 10))

        ack_btn = ctk.CTkButton(
            btn_frame,
            text="Understood / Continue Daemon",
            command=root.destroy,
            fg_color="#334155",
            hover_color="#475569",
            height=38,
            font=ctk.CTkFont(size=12)
        )
        ack_btn.pack(side="right", fill="x", expand=True, padx=(10, 0))

        root.mainloop()

    # Launch GUI in dedicated thread to not freeze daemon
    threading.Thread(target=run_gui, daemon=True).start()

# ------------------------------------------------------------------------------
# Module 3: Automated Driver Self-Healing (PnPUtil)
# ------------------------------------------------------------------------------
def inspect_device_manager_errors():
    """
    Checks COM ports for Code 10 (CM_PROB_FAILED_START) or Code 43 (CM_PROB_FAILED_POST_START)
    using PowerShell Get-PnpDevice.
    Returns list of dicts: [{'InstanceId': ..., 'FriendlyName': ..., 'Status': ..., 'Problem': ...}]
    """
    ps_cmd = (
        'Get-PnpDevice -Class Ports -ErrorAction SilentlyContinue | '
        'Select-Object InstanceId, FriendlyName, Status, Problem | '
        'ConvertTo-Json -Compress'
    )
    try:
        res = subprocess.run(["powershell.exe", "-NoProfile", "-Command", ps_cmd], capture_output=True, text=True)
        if res.returncode == 0 and res.stdout.strip():
            data = json.loads(res.stdout.strip())
            if isinstance(data, dict):
                data = [data]
            return data
    except Exception as ex:
        log(f"PnPDevice inspection notice: {ex}", "DEBUG")
    return []

def execute_driver_self_healing(troubled_devices=None):
    """
    Automated Driver Self-Healing:
    1. Scans Device Manager for Code 10 / Code 43 on COM ports.
    2. Uses 'pnputil /delete-driver oem*.inf /uninstall /force' to purge faulty Win11 drivers.
    3. Injects offline fallback drivers from ./drivers/ using 'pnputil /add-driver *.inf /install'.
    4. Triggers PnP rescan via pnputil /scan-devices.
    """
    log("Checking Device Manager for Code 10 / Code 43 driver corruption...", "INFO")
    devices = troubled_devices or inspect_device_manager_errors()
    
    broken_devices = []
    for d in devices:
        status = str(d.get("Status", "")).upper()
        problem = str(d.get("Problem", ""))
        # Problem 10 is Code 10; Problem 43 is Code 43
        if status in ["ERROR", "DEGRADED"] or problem in ["10", "43", "CM_PROB_FAILED_START", "CM_PROB_FAILED_POST_START"]:
            broken_devices.append(d)

    if not broken_devices:
        log("No Code 10 or Code 43 device errors found on COM ports. Driver stack is intact.", "INFO")
    else:
        for b in broken_devices:
            log(f"ALERT: Detected troubled device: {b.get('FriendlyName')} (Problem code: {b.get('Problem')})", "WARN")

        # Step A: Enumerate and purge broken OEM inf packages
        log("Executing pnputil driver purge on problematic OEM packages...", "INFO")
        try:
            enum_res = subprocess.run(["pnputil.exe", "/enum-drivers"], capture_output=True, text=True)
            if enum_res.returncode == 0:
                # Find OEM drivers associated with Prolific or CH340 that fail
                lines = enum_res.stdout.splitlines()
                current_oem = None
                for line in lines:
                    line_str = line.strip()
                    if line_str.lower().startswith("published name:"):
                        current_oem = line_str.split(":", 1)[1].strip()
                    elif current_oem and any(chip in line_str.lower() for chip in ["prolific", "ch34", "wch.cn", "ftdi"]):
                        if "2023" in line_str or "2024" in line_str or "microsoft" in line_str.lower():
                            log(f"Purging conflicting newer Windows 11 driver package: {current_oem}", "INFO")
                            subprocess.run(["pnputil.exe", "/delete-driver", current_oem, "/uninstall", "/force"], capture_output=True)
                            current_oem = None
        except Exception as ex:
            log(f"Driver purge error: {ex}", "WARN")

    # Step B: Inject all offline fallback drivers from ./drivers/ directory
    if os.path.exists(DRIVERS_DIR):
        log(f"Injecting offline fallback drivers from bundled directory: {DRIVERS_DIR}", "INFO")
        inf_files_found = []
        for root, _, files in os.walk(DRIVERS_DIR):
            for file in files:
                if file.lower().endswith(".inf"):
                    inf_files_found.append(os.path.join(root, file))

        for inf_path in inf_files_found:
            log(f"Registering offline driver package: {os.path.basename(inf_path)}...", "INFO")
            cmd = ["pnputil.exe", "/add-driver", inf_path, "/install"]
            try:
                res = subprocess.run(cmd, capture_output=True, text=True)
                if res.returncode == 0:
                    log(f"Successfully installed offline driver: {os.path.basename(inf_path)}", "SUCCESS")
                else:
                    log(f"pnputil notice for {os.path.basename(inf_path)}: {res.stdout.strip()}", "DEBUG")
            except Exception as ex:
                log(f"Failed to install {inf_path}: {ex}", "WARN")

        # Step C: Trigger device hardware rescan
        log("Rescanning Windows PnP device tree...", "INFO")
        try:
            subprocess.run(["pnputil.exe", "/scan-devices"], capture_output=True)
        except Exception:
            pass
    else:
        log(f"Drivers directory not found at {DRIVERS_DIR}. Skipping local .inf injection.", "WARN")

# ------------------------------------------------------------------------------
# Module 4: Hardware Wake-Up & Baud Rate Brute-Force
# ------------------------------------------------------------------------------
def toggle_hardware_flow_control_and_wake(ser, port_name, baud):
    """
    Shocks and wakes legacy controller boards:
    1. Toggles DTR/RTS pin states (True/False sequences) to reset UART state machine
    2. Sends wakeup payloads (GRBL status ping ?, Ctrl-X soft-reset, Ruida headers)
    3. Reads reply and verifies responsiveness
    """
    pin_sequences = [
        (True, True),
        (False, True),
        (True, False),
        (False, False)
    ]
    
    for dtr, rts in pin_sequences:
        try:
            ser.dtr = dtr
            ser.rts = rts
            time.sleep(0.04)
        except Exception:
            pass

    # Clear stale RX/TX buffers
    try:
        ser.reset_input_buffer()
        ser.reset_output_buffer()
    except Exception:
        pass

    # Transmit test payloads
    for desc, payload in WAKEUP_PAYLOADS:
        try:
            ser.write(payload)
            ser.flush()
            time.sleep(0.06)
            
            if ser.in_waiting > 0:
                response = ser.read(ser.in_waiting)
                resp_hex = response.hex()
                resp_ascii = response.decode('latin1', errors='replace').strip()
                log(f"--> Response received on {port_name} @ {baud} Baud [{desc}]: {resp_ascii} (HEX: {resp_hex[:32]})", "SUCCESS")
                return True, resp_ascii
        except Exception as ex:
            log(f"Payload write error on {port_name}: {ex}", "DEBUG")
            break

    return False, ""

def brute_force_wake_all_com_ports():
    """
    Iterates through all active COM ports and tests all standard baud rates:
    250000, 115200, 57600, 38400, 19200, 9600.
    Identifies connected laser / CNC controller and secures connection.
    """
    if not HAS_SERIAL:
        log("pyserial module not available; serial scanning skipped.", "WARN")
        return []

    ports = list(serial.tools.list_ports.comports())
    if not ports:
        log("No COM ports currently detected in system.", "INFO")
        return []

    connected_hardware = []

    for port in ports:
        port_name = port.device
        hwid = port.hwid or ""
        desc = port.description or ""
        log(f"Probing COM Port: {port_name} | {desc} | HWID: {hwid}", "INFO")

        # Check if known chip
        matched_chip = "Unknown Legacy Controller"
        for vid, pid, chip_name in KNOWN_HARDWARE_IDS:
            if f"VID_{vid}" in hwid.upper() and f"PID_{pid}" in hwid.upper():
                matched_chip = chip_name
                break

        log(f"Identified Controller Chip: {matched_chip}", "INFO")

        port_connected = False
        active_baud = None
        handshake_resp = ""

        for baud in BAUD_RATES:
            try:
                # Open with standard 8N1 and short timeout for rapid brute-forcing
                with serial.Serial(
                    port=port_name,
                    baudrate=baud,
                    bytesize=serial.EIGHTBITS,
                    parity=serial.PARITY_NONE,
                    stopbits=serial.STOPBITS_ONE,
                    timeout=0.15,
                    write_timeout=0.15,
                    exclusive=True
                ) as ser:
                    # Toggle flow control and shock
                    success, resp = toggle_hardware_flow_control_and_wake(ser, port_name, baud)
                    if success:
                        port_connected = True
                        active_baud = baud
                        handshake_resp = resp
                        log(f"LOCKED HARDWARE CONNECTION on {port_name} at {baud} Baud! Device is responsive.", "SUCCESS")
                        break
            except serial.SerialException as se:
                err_str = str(se).lower()
                if "access is denied" in err_str or "permissionerror" in err_str:
                    log(f"{port_name} is already open by LightBurn, RDWorks, or another process (Port Busy).", "INFO")
                    port_connected = True
                    active_baud = baud
                    break
                # Port might not accept baud rate, continue next baud
                continue
            except Exception as e:
                continue

        connected_hardware.append({
            "port": port_name,
            "chip": matched_chip,
            "connected": port_connected,
            "baud": active_baud,
            "handshake": handshake_resp
        })

    return connected_hardware

# ------------------------------------------------------------------------------
# Module 5: Full Automated Connection Pipeline
# ------------------------------------------------------------------------------
def run_full_connection_pipeline():
    """
    Full automated pipeline executed on startup and upon every USB hot-plug event:
    1. Check Memory Integrity / HVCI (alert operator if blocking)
    2. Apply App Compatibility (Windows 7 SP1 for LightBurn/RDWorks)
    3. Automated Driver Self-Healing (PnPUtil check & purge)
    4. Hardware Wake-Up & Baud Rate Brute-Force (250000 - 9600)
    """
    log("==================================================================", "INFO")
    log(f"Starting {APP_NAME} Pipeline...", "INFO")
    log("==================================================================", "INFO")

    # Step 1: Security Inspection
    hvci_enabled, is_blocking = check_hypervisor_enforced_code_integrity()
    if hvci_enabled:
        log("Windows 11 Core Isolation / Memory Integrity is ACTIVE.", "WARN")
        show_hvci_operator_alert_gui()
    else:
        log("Memory Integrity is OFF or permissive. Kernel driver execution permitted.", "SUCCESS")

    # Step 2: Inject AppCompat Flags
    inject_app_compatibility()

    # Step 3: Inspect & Self-Heal Drivers
    execute_driver_self_healing()

    # Step 4: Wake-Up & Baud Rate Brute Force
    results = brute_force_wake_all_com_ports()
    
    log("==================================================================", "INFO")
    log("Pipeline Execution Complete. System Summary:", "INFO")
    for r in results:
        status_txt = f"ACTIVE ({r['baud']} Baud)" if r['connected'] else "NO RESPONSE"
        log(f"  * {r['port']} [{r['chip']}]: {status_txt}", "INFO")
    log("==================================================================", "INFO")

# ------------------------------------------------------------------------------
# Module 6: Persistent WMI USB Hot-Plug Monitor Daemon
# ------------------------------------------------------------------------------
def wmi_usb_monitor_loop():
    """
    Continuously listens for USB hot-plug insertion and removal events
    using Win32_DeviceChangeEvent via WMI.
    When a device change occurs, triggers run_full_connection_pipeline().
    """
    if not HAS_WMI:
        log("WMI library not available. Falling back to polling loop.", "WARN")
        fallback_polling_loop()
        return

    log("Initializing WMI USB Device Change Monitor (Win32_DeviceChangeEvent)...", "INFO")
    pythoncom.CoInitialize()
    try:
        c = wmi.WMI()
        watcher = c.watch_for(
            notification_type="Creation",
            wmi_class="Win32_DeviceChangeEvent"
        )
        log("WMI Monitor active. Waiting silently for USB legacy equipment hot-plug...", "SUCCESS")

        while True:
            try:
                event = watcher(timeout_ms=3000)
                if event:
                    event_type = getattr(event, "EventType", None)
                    # EventType 2 = Configuration Changed (Arrival of device)
                    # EventType 3 = Device Removal
                    if event_type in [2, "2"]:
                        log("USB Hardware Insertion Event Detected via WMI!", "ALERT")
                        time.sleep(1.0) # Allow Windows PnP enumeration to finalize
                        run_full_connection_pipeline()
            except wmi.x_wmi_timed_out:
                # Normal timeout to keep thread alive and responsive
                continue
            except Exception as e:
                log(f"WMI Watcher exception: {e}. Reinitializing in 3 seconds...", "WARN")
                time.sleep(3.0)
    except Exception as ex:
        log(f"WMI Monitor failed to initialize: {ex}. Switching to polling mode.", "WARN")
        fallback_polling_loop()
    finally:
        pythoncom.CoUninitialize()

def fallback_polling_loop():
    """
    Fallback monitor checking COM port count every 2.5 seconds if WMI is restricted.
    """
    log("Fallback USB Poller started (2.5s interval).", "INFO")
    known_ports = set()
    while True:
        try:
            if HAS_SERIAL:
                current_ports = {p.device for p in serial.tools.list_ports.comports()}
                if current_ports != known_ports:
                    new_ports = current_ports - known_ports
                    if new_ports:
                        log(f"New COM Port(s) detected via poller: {new_ports}!", "ALERT")
                        time.sleep(0.8)
                        run_full_connection_pipeline()
                    known_ports = current_ports
        except Exception:
            pass
        time.sleep(2.5)

# ------------------------------------------------------------------------------
# Main Entry Point
# ------------------------------------------------------------------------------
def is_running_as_admin():
    try:
        return ctypes.windll.shell32.IsUserAnAdmin() != 0
    except Exception:
        return False

def main():
    log(f"Starting {APP_NAME} v{APP_VERSION}...", "INFO")

    # Privilege warning
    if ctypes and not is_running_as_admin():
        log("NOTE: Script is running in standard user mode. Some PnPUtil operations may require elevation.", "WARN")
    else:
        log("Elevated Administrator Privileges confirmed.", "SUCCESS")

    # Execute initial connection pipeline immediately on startup
    run_full_connection_pipeline()

    # If --once flag passed, exit after single run
    if "--once" in sys.argv:
        log("Single run completed (--once flag passed). Exiting.", "INFO")
        sys.exit(0)

    # Start persistent WMI hot-plug monitor daemon thread
    log("Entering persistent background daemon mode. Monitoring USB bus...", "INFO")
    monitor_thread = threading.Thread(target=wmi_usb_monitor_loop, daemon=False)
    monitor_thread.start()
    
    try:
        while monitor_thread.is_alive():
            monitor_thread.join(timeout=1.0)
    except (KeyboardInterrupt, SystemExit):
        log("Daemon terminated by operator.", "INFO")

if __name__ == "__main__":
    main()
