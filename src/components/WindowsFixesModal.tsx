import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  ShieldAlert, 
  Zap, 
  HardDrive, 
  Cpu, 
  Terminal,
  FileCode,
  RotateCw,
  Trash2,
  FileText,
  Activity,
  Layers,
  Wrench,
  Power,
  Play,
  Settings,
  Flame,
  CheckCircle2,
  Calendar,
  Clock
} from 'lucide-react';
import { 
  POWERSHELL_POWER_COMMAND, 
  POWERSHELL_PNP_RESET_COMMAND,
  PNPUTIL_ENUM_COMMAND, 
  PNPUTIL_INSTALL_COMMAND,
  PNPUTIL_PURGE_COMMAND,
  REGISTRY_HVCI_DISABLE_COMMAND,
  BCDEDIT_TESTMODE_COMMAND,
  REGISTRY_APPCOMPAT_COMMAND,
  POWERSHELL_DETECT_LEGACY_COMMAND,
  SCHTASKS_CREATE_COMMAND,
  SCHTASKS_DELETE_COMMAND,
  REGISTRY_WIN7_GLOBAL_SPOOF_COMMAND,
  POWERSHELL_SELF_HEAL_COMMAND,
  PYINSTALLER_BUILD_COMMAND,
  PYTHON_MAIN_PY,
  RUN_BATCH_CODE,
  INSTALL_DAEMON_BAT_CODE,
  UNINSTALL_DAEMON_BAT_CODE,
  generateTaskSchedulerPs1,
  downloadFile,
  downloadOfflineZip
} from '../utils/scriptsGenerator';
import { COMMON_LASER_CHIPS } from '../data/diagnosticSteps';

interface WindowsFixesModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  onOpenTaskScheduler?: () => void;
}

export const WindowsFixesModal: React.FC<WindowsFixesModalProps> = ({ isOpen, onClose, lang, onOpenTaskScheduler }) => {
  const isAr = lang === 'ar';
  const [activeTab, setActiveTab] = useState<'daemon' | 'guides' | 'python_code' | 'chips'>('daemon');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-inner">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {isAr ? "دليل حلول النواة وتفريغ المنافذ (Windows 11 Kernel & Systems)" : "Windows 11 Kernel & Port Recovery Diagnostic Hub"}
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-md">
                  PyInstaller --uac-admin
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isAr ? "خدمة التشغيل التلقائي الدائم (Daemon)، محاكاة بيئة Windows 7، تجاوز حظر HVCI، والإنعاش الذاتي" : "Persistent Background Daemon, Win7 Environment Spoofing, HVCI bypass, and self-healing PnP drivers"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 pb-2 border-b border-slate-800 bg-slate-950/60 text-xs font-medium overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('daemon')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'daemon'
                ? 'bg-blue-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Play className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? "خدمة التشغيل التلقائي (Daemon)" : "Auto-Start Daemon"}</span>
          </button>
          <button
            onClick={() => setActiveTab('guides')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'guides'
                ? 'bg-blue-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>{isAr ? "حلول النواة و PowerShell" : "Kernel Fixes & PowerShell"}</span>
          </button>
          <button
            onClick={() => setActiveTab('python_code')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'python_code'
                ? 'bg-blue-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileCode className="w-4 h-4 text-indigo-400" />
            <span>{isAr ? "كود بايثون المستقل (main.py)" : "Production main.py Code"}</span>
          </button>
          <button
            onClick={() => setActiveTab('chips')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-all ${
              activeTab === 'chips'
                ? 'bg-blue-600 text-white font-bold shadow'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>{isAr ? "شرائح ومصفوفة الليزر" : "Laser Chips & Matrix"}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-sm flex-1">
          {/* TAB 1: PERSISTENT DAEMON & AUTOMATION */}
          {activeTab === 'daemon' && (
            <div className="space-y-5">
              {/* Architecture Hero Banner */}
              <div className="bg-gradient-to-br from-blue-950/60 to-emerald-950/40 p-4 rounded-xl border border-blue-800/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">
                        {isAr ? "بنية خدمة التشغيل التلقائي الدائم (100% Offline Daemon)" : "Persistent Auto-Start Background Daemon"}
                      </h4>
                      <p className="text-xs text-slate-300">
                        {isAr ? "ربط تلقائي بالخلفية بدون فتح التطبيق يدوياً عند كل استخدام" : "Seamless auto-connection via Windows Task Scheduler at boot"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={downloadOfflineZip}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow transition-all border border-indigo-400/30"
                      title={isAr ? "تحميل الحزمة الكاملة أوفلاين مع التعريفات وملفات البناء" : "Download complete offline package with drivers & build scripts"}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isAr ? "حزمة أوفلاين كاملة (.ZIP)" : "Get Offline ZIP"}</span>
                    </button>
                    {onOpenTaskScheduler && (
                      <button
                        onClick={onOpenTaskScheduler}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow transition-all"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{isAr ? "إعداد سكريبت PowerShell" : "PowerShell Task Setup"}</span>
                      </button>
                    )}
                    <button
                      onClick={() => downloadFile('install_daemon.bat', INSTALL_DAEMON_BAT_CODE, 'text/plain')}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>{isAr ? "تحميل install_daemon.bat" : "Get install_daemon.bat"}</span>
                    </button>
                    <button
                      onClick={() => downloadFile('uninstall_daemon.bat', UNINSTALL_DAEMON_BAT_CODE, 'text/plain')}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>{isAr ? "إزالة" : "Uninstall"}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 mt-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-200 block">{isAr ? "1. بدء الإقلاع عبر schtasks" : "1. Boot via schtasks"}</span>
                      <span className="text-slate-400 text-[11px]">{isAr ? "تسجيل مهمة نظام تعمل بصمت بأعلى صلاحيات Admin." : "Silent SYSTEM task on machine boot."}</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-200 block">{isAr ? "2. مراقب التوصيل WMI" : "2. Hot-Plug WMI Listener"}</span>
                      <span className="text-slate-400 text-[11px]">{isAr ? "رصد لحظي لتوصيل كابل USB وماكينة الليزر." : "Real-time USB insertion event detection."}</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-slate-200 block">{isAr ? "3. تثبيت الفولتية والإنعاش" : "3. Power & Baud Locking"}</span>
                      <span className="text-slate-400 text-[11px]">{isAr ? "ضبط DTR/RTS، إلغاء توفير الطاقة، وإيقاف تعليق المنفذ." : "Locks DTR/RTS, un-suspends USB, unlocks COM."}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 1. Scheduled Task Creation Command */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-blue-400" />
                    <h4 className="font-bold text-white text-sm">
                      {isAr ? "1. أمر إنشاء مهمة الويندوز المجدولة (schtasks Permanent Daemon)" : "1. Register Persistent Scheduled Task"}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    {onOpenTaskScheduler && (
                      <button
                        onClick={onOpenTaskScheduler}
                        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-blue-600/90 hover:bg-blue-500 text-white font-medium shadow-sm transition-colors"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{isAr ? "توليد سكريبت PowerShell" : "PowerShell Generator"}</span>
                      </button>
                    )}
                    <button
                      onClick={() => copyText('schtasks_cmd', SCHTASKS_CREATE_COMMAND)}
                      className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                    >
                      {copiedKey === 'schtasks_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'schtasks_cmd' ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ الأمر" : "Copy")}</span>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                  {isAr
                    ? "يقوم بتسجيل البرنامج في Windows Task Scheduler ليعمل عند إقلاع النظام بدون شاشة كونسول (--noconsole / --daemon) وبأعلى صلاحيات:"
                    : "Registers main.exe in Windows Task Scheduler to execute silently at boot with highest administrator privileges:"}
                </p>
                <div className="bg-slate-900 p-2.5 rounded-lg font-mono text-xs text-blue-300 border border-slate-800 break-all select-all">
                  {SCHTASKS_CREATE_COMMAND}
                </div>
              </div>

              {/* 2. Global Windows 7 Registry Environment Spoofing */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    <h4 className="font-bold text-white text-sm">
                      {isAr ? "2. حقن محاكاة بيئة Windows 7 SP1 الشاملة في الريجستري (Global Spoofing)" : "2. Global Windows 7 SP1 Registry Environment Spoofing"}
                    </h4>
                  </div>
                  <button
                    onClick={() => copyText('win7_reg_spoof', REGISTRY_WIN7_GLOBAL_SPOOF_COMMAND)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  >
                    {copiedKey === 'win7_reg_spoof' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'win7_reg_spoof' ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ الأمر" : "Copy")}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                  {isAr
                    ? "يخدع مثبتات وبرمجيات التعريفات القديمة لتعامل استدعاءات نواة ويندوز 11 كأنها نظام Windows 7 Service Pack 1:"
                    : "Forces device installers and legacy drivers to treat Windows 11 calls as Windows 7 Service Pack 1:"}
                </p>
                <div className="bg-slate-900 p-2.5 rounded-lg font-mono text-xs text-indigo-300 border border-slate-800 break-all select-all">
                  {REGISTRY_WIN7_GLOBAL_SPOOF_COMMAND}
                </div>
              </div>

              {/* 3. PnPUtil Self-Healing Driver Command */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <RotateCw className="w-4 h-4 text-emerald-400" />
                    <h4 className="font-bold text-white text-sm">
                      {isAr ? "3. أمر الإنعاش الذاتي التلقائي (PnPUtil Self-Healing on Code 10/43/52)" : "3. PnPUtil Self-Healing on Driver Error Codes"}
                    </h4>
                  </div>
                  <button
                    onClick={() => copyText('self_heal_cmd', POWERSHELL_SELF_HEAL_COMMAND)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  >
                    {copiedKey === 'self_heal_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'self_heal_cmd' ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ الأمر" : "Copy")}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                  {isAr
                    ? "إذا استبدل ويندوز 11 التعريف بالخطأ وظهر رمز Code 10 أو 43 أو 52، يكتشف الـ Daemon ذلك فوراً ويقوم بمسح الحزمة الفاسدة وإعادة تثبيت ملف الـ INF الأصلي من مجلد drivers:"
                    : "Instantly purges corrupted OEM driver packages and re-injects bundled offline INF drivers when Code 10/43/52 occurs:"}
                </p>
                <div className="bg-slate-900 p-2.5 rounded-lg font-mono text-xs text-emerald-300 border border-slate-800 break-all select-all">
                  {POWERSHELL_SELF_HEAL_COMMAND}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GENERAL KERNEL & POWERSHELL GUIDES */}
          {activeTab === 'guides' && (
            <div className="space-y-5">
              {/* 1. Aggressive Environment & Port Reset */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <RotateCw className="w-4 h-4 text-cyan-400" />
                    <h4 className="font-bold text-white text-sm">
                      {isAr ? "1. إنهاء العمليات المحتجزة وتصفير منافذ الـ PnP في الويندوز" : "1. Process Cleanup & Deep PnP Port Cycling"}
                    </h4>
                  </div>
                  <button
                    onClick={() => copyText('pnp_cycle', POWERSHELL_PNP_RESET_COMMAND)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  >
                    {copiedKey === 'pnp_cycle' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'pnp_cycle' ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ الأمر" : "Copy")}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                  {isAr
                    ? "يقوم السكريبت تلقائياً بإنهاء أي نسخة خلفية من LightBurn.exe أو RDWorksV8.exe تحجز المنفذ، ثم ينفذ إعادة تشغيل فيزيائية عميقة (Disable-PnpDevice / Enable-PnpDevice) لجميع منافذ COM العالقة."
                    : "Terminates hidden background instances of LightBurn.exe or RDWorksV8.exe and cycles PnP device states to purge Windows COM port handle locks."}
                </p>
                <div className="bg-slate-900 p-2.5 rounded-lg font-mono text-xs text-cyan-300 border border-slate-800 break-all select-all">
                  {POWERSHELL_PNP_RESET_COMMAND}
                </div>
              </div>

              {/* 2. Core Isolation & Memory Integrity Fix */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-amber-900/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <h4 className="font-bold text-amber-200 text-sm">
                      {isAr ? "2. تجاوز حظر تعاريف ويندوز 11 (Memory Integrity / HVCI)" : "2. Windows 11 Memory Integrity (HVCI) Registry Intervention"}
                    </h4>
                  </div>
                  <button
                    onClick={() => copyText('hvci_reg', REGISTRY_HVCI_DISABLE_COMMAND)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border border-amber-800/60 transition-colors"
                  >
                    {copiedKey === 'hvci_reg' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'hvci_reg' ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ أمر الريجستري" : "Copy Reg")}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                  {isAr
                    ? "ميزة سلامة الذاكرة (Memory Integrity) في ويندوز 11 تحظر تعاريف شرائح PL2303 و FTDI و CH340 القديمة وتمنع تحميلها (Code 39). هذا الأمر يعطل الفحص بالريجستري مباشرة:"
                    : "Windows 11 Memory Integrity (HVCI) blocks legacy unsigned drivers (PL2303, older FTDI/CH340). This command writes to the registry to unblock driver loading:"}
                </p>
                <div className="bg-slate-900 p-2.5 rounded-lg font-mono text-xs text-amber-300 border border-slate-800 break-all select-all">
                  {REGISTRY_HVCI_DISABLE_COMMAND}
                </div>
              </div>

              {/* 3. DriverStore Purge & PnPUtil */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-rose-400" />
                    <h4 className="font-bold text-white text-sm">
                      {isAr ? "3. تطهير التعاريف المتعارضة من مخزن النظام (pnputil driver purge)" : "3. DriverStore Conflict Purge (pnputil)"}
                    </h4>
                  </div>
                  <button
                    onClick={() => copyText('pnputil_purge', PNPUTIL_PURGE_COMMAND)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  >
                    {copiedKey === 'pnputil_purge' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'pnputil_purge' ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ الأمر" : "Copy")}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                  {isAr
                    ? "يقوم بحذف وإلغاء تثبيت الحزم المتعارضة من مخزن الويندوز لإتاحة تثبيت التعريف النظيف المحلي:"
                    : "Purges corrupted third-party driver packages from the Windows DriverStore:"}
                </p>
                <div className="bg-slate-900 p-2.5 rounded-lg font-mono text-xs text-rose-300 border border-slate-800 break-all select-all">
                  {PNPUTIL_PURGE_COMMAND}
                </div>
              </div>

              {/* 4. USB Selective Suspend Fix */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Power className="w-4 h-4 text-emerald-400" />
                    <h4 className="font-bold text-white text-sm">
                      {isAr ? "4. إلغاء تعليق وتوفير الطاقة لمنافذ USB (Selective Suspend)" : "4. Disable USB Selective Suspend (Continuous Power)"}
                    </h4>
                  </div>
                  <button
                    onClick={() => copyText('power_suspend', POWERSHELL_POWER_COMMAND)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  >
                    {copiedKey === 'power_suspend' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'power_suspend' ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ الأمر" : "Copy")}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                  {isAr
                    ? "يمنع ويندوز من فصل تغذية الطاقة عن منفذ الـ USB أثناء تشغيل الليزر أو عند سكون النظام:"
                    : "Prevents Windows power manager from putting the laser serial bridge into deep sleep:"}
                </p>
                <div className="bg-slate-900 p-2.5 rounded-lg font-mono text-xs text-emerald-300 border border-slate-800 break-all select-all">
                  {POWERSHELL_POWER_COMMAND}
                </div>
              </div>

              {/* 5. Detect Legacy Win7 Drivers (Code 52 / Code 39) */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <h4 className="font-bold text-white text-sm">
                      {isAr ? "5. كشف تعاريف ويندوز 7 المحظورة برمز Code 52 و Code 39" : "5. Detect Win7 Drivers Blocked by Win11 Kernel (Code 52/39)"}
                    </h4>
                  </div>
                  <button
                    onClick={() => copyText('detect_legacy', POWERSHELL_DETECT_LEGACY_COMMAND)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  >
                    {copiedKey === 'detect_legacy' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'detect_legacy' ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ الأمر" : "Copy")}</span>
                  </button>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg font-mono text-xs text-rose-300 border border-slate-800 break-all select-all">
                  {POWERSHELL_DETECT_LEGACY_COMMAND}
                </div>
              </div>

              {/* 6. Win11 Kernel Test Mode (bcdedit testsigning) */}
              <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-amber-400" />
                    <h4 className="font-bold text-white text-sm">
                      {isAr ? "6. تفعيل وضع الاختبار لويندوز 11 (Kernel Test Mode & No Integrity Checks)" : "6. Windows 11 Kernel Test Mode (bcdedit testsigning)"}
                    </h4>
                  </div>
                  <button
                    onClick={() => copyText('bcdedit_cmd', BCDEDIT_TESTMODE_COMMAND)}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  >
                    {copiedKey === 'bcdedit_cmd' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'bcdedit_cmd' ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ الأمر" : "Copy")}</span>
                  </button>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg font-mono text-xs text-amber-300 border border-slate-800 break-all select-all">
                  {BCDEDIT_TESTMODE_COMMAND}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PYTHON SCRIPT & PYINSTALLER */}
          {activeTab === 'python_code' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-blue-950/50 to-indigo-950/50 p-4 rounded-xl border border-blue-800/40">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <h4 className="font-bold text-white flex items-center gap-2 text-sm">
                      <FileCode className="w-4 h-4 text-blue-400" />
                      <span>{isAr ? "كود بايثون الكامل المتوافق مع PyInstaller (--uac-admin)" : "Standalone main.py (PyInstaller Ready with UAC Admin Elevation)"}</span>
                    </h4>
                    <p className="text-xs text-slate-300 mt-1">
                      {isAr
                        ? "يحتوي على وضعين: واجهة تفاعلية (GUI Setup) أو خدمة خلفية دائمة (--daemon) مع مراقب WMI وتصفير منافذ PnP ومحاكاة بيئة Windows 7."
                        : "Includes dual modes: interactive CustomTkinter GUI setup or silent background daemon (--daemon) with WMI hot-plug detection."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => downloadFile('main.py', PYTHON_MAIN_PY, 'text/x-python')}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل main.py</span>
                    </button>
                    <button
                      onClick={() => downloadFile('run_laser_doctor.bat', RUN_BATCH_CODE, 'text/plain')}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>run.bat</span>
                    </button>
                  </div>
                </div>

                {/* PyInstaller Compilation Command */}
                <div className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-slate-400 font-medium">
                      {isAr ? "أمر التجميع إلى ملف تنفيذي مستقل (.exe):" : "Compile to standalone .exe command:"}
                    </span>
                    <button
                      onClick={() => copyText('pyinstaller_cmd', PYINSTALLER_BUILD_COMMAND)}
                      className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 font-mono"
                    >
                      {copiedKey === 'pyinstaller_cmd' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedKey === 'pyinstaller_cmd' ? "تم النسخ" : "نسخ الأمر"}</span>
                    </button>
                  </div>
                  <div className="font-mono text-xs text-indigo-300 break-all select-all">
                    {PYINSTALLER_BUILD_COMMAND}
                  </div>
                </div>
              </div>

              {/* Code Viewer */}
              <div className="relative rounded-xl overflow-hidden border border-slate-800">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-950 border-b border-slate-800 text-xs">
                  <span className="font-mono text-slate-400">main.py (Persistent Daemon & Windows 7 Emulation)</span>
                  <button
                    onClick={() => copyText('main_py_full', PYTHON_MAIN_PY)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                  >
                    {copiedKey === 'main_py_full' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'main_py_full' ? (isAr ? "تم النسخ بالكامل" : "Copied All") : (isAr ? "نسخ الكود كاملاً" : "Copy Full Code")}</span>
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto max-h-[380px] leading-relaxed select-all">
                  {PYTHON_MAIN_PY}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: CHIPS MATRIX */}
          {activeTab === 'chips' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-blue-400" />
                    <span>{isAr ? "قاعدة بيانات شرائح ومتحكمات الليزر" : "Laser Controllers & Bridge Chips Matrix"}</span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {isAr ? "السرعات القياسية ومعرفات الـ VID/PID وملاحظات التوافق مع ويندوز 11" : "Default baud rates, VID/PID identifiers, and Windows 11 driver compatibility notes"}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {COMMON_LASER_CHIPS.map((chip, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-xl text-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-bold text-slate-100">{chip.name}</span>
                        <span className="font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60 font-semibold">
                          {chip.defaultBaud} baud
                        </span>
                      </div>
                      <p className="text-slate-400 mb-2 leading-relaxed">
                        {isAr ? chip.descriptionAr : chip.descriptionEn}
                      </p>
                      {chip.noteAr && (
                        <div className="p-2 rounded bg-amber-950/20 border border-amber-800/30 text-amber-300/90 text-[11px] mb-2">
                          {chip.noteAr}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-900">
                      <span>VID: {chip.vid}</span>
                      <span>PID: {chip.pid}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            {isAr ? "تسجيل دائم في Task Scheduler | سجلات C:\\ProgramData\\LaserConnectionDoctor" : "Persistent Task Scheduler | Logs in ProgramData\\LaserConnectionDoctor"}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            {isAr ? "إغلاق النافذة" : "Close"}
          </button>
        </div>
      </div>
    </div>
  );
};
