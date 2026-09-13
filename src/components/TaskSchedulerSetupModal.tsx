import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  FileCode2, 
  Cpu, 
  Layers, 
  Settings2, 
  Play,
  RotateCcw,
  Sparkles
} from 'lucide-react';
import { 
  generateTaskSchedulerPs1, 
  TaskSchedulerConfig, 
  downloadFile 
} from '../utils/scriptsGenerator';

interface TaskSchedulerSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
}

export const TaskSchedulerSetupModal: React.FC<TaskSchedulerSetupModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const isAr = lang === 'ar';

  const [taskName, setTaskName] = useState('LaserConnectionDoctor_BackgroundMonitor');
  const [triggerMode, setTriggerMode] = useState<'AtStartup' | 'AtLogon' | 'Both'>('AtStartup');
  const [targetType, setTargetType] = useState<'python' | 'compiledExe' | 'custom'>('python');
  const [targetPath, setTargetPath] = useState('C:\\ProgramData\\LaserConnectionDoctor\\main.py');
  const [pollIntervalSeconds, setPollIntervalSeconds] = useState(2);
  const [autoHealDrivers, setAutoHealDrivers] = useState(true);
  const [runAsSystem, setRunAsSystem] = useState(true);
  const [restartOnFailure, setRestartOnFailure] = useState(true);
  const [activeTab, setActiveTab] = useState<'config' | 'preview'>('config');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentConfig: TaskSchedulerConfig = {
    taskName,
    triggerMode,
    targetType,
    targetPath,
    pollIntervalSeconds,
    autoHealDrivers,
    runAsSystem,
    restartOnFailure,
  };

  const generatedPs1 = generateTaskSchedulerPs1(currentConfig);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPs1);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    downloadFile('Register-LaserDoctorTask.ps1', generatedPs1, 'text/plain');
  };

  const handleTargetTypeChange = (type: 'python' | 'compiledExe' | 'custom') => {
    setTargetType(type);
    if (type === 'python') {
      setTargetPath('C:\\ProgramData\\LaserConnectionDoctor\\main.py');
    } else if (type === 'compiledExe') {
      setTargetPath('C:\\Program Files\\LaserConnectionDoctor\\LaserConnectionDoctor.exe');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0c1222]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  {isAr 
                    ? "إعداد سكريبت PowerShell لمجدول المهام (Task Scheduler Setup)" 
                    : "PowerShell Task Scheduler Generator"}
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md">
                  Windows 11 Daemon
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isAr 
                  ? "توليد سكريبت .ps1 متقدم يسجل مراقب التشخيص في خلفية النظام عند إقلاع الويندوز" 
                  : "Generate a standalone .ps1 script registering the diagnostic background monitor at system boot"}
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

        {/* View Switcher Tabs */}
        <div className="flex items-center justify-between px-6 pt-3 pb-2 border-b border-slate-800 bg-slate-950/60 text-xs font-medium">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('config')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'config'
                  ? 'bg-blue-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>{isAr ? "خيارات التكوين" : "Task Options"}</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeTab === 'preview'
                  ? 'bg-blue-600 text-white font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <FileCode2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{isAr ? "معاينة كود PowerShell" : "PowerShell Code Preview"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ السكريبت" : "Copy Script")}</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAr ? "تحميل Register-Task.ps1" : "Download .ps1"}</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 text-sm">
          {activeTab === 'config' ? (
            <div className="space-y-4">
              {/* Highlight summary card */}
              <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 border border-blue-800/40 text-xs">
                <div className="flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white block mb-0.5">
                      {isAr 
                        ? "تشغيل تلقائي غير مرئي مع صلاحيات النظام العالية (Highest Elevation)" 
                        : "Seamless Silent Background Execution with Highest Privileges"}
                    </span>
                    <span className="text-slate-400 leading-relaxed block">
                      {isAr
                        ? "هذا السكريبت يستخدم وحدات Windows ScheduledTasks لبرمجة مهمة تعمل بدون نافذة سوداء مع إقلاع النظام، وتستمع فوراً لتوصيل كابلات USB لماكينات الليزر وإصلاح التعريفات وحظر منافذ COM العالقة."
                        : "Generates a complete PowerShell module utilizing `New-ScheduledTask` and `Register-ScheduledTask` to silently orchestrate the diagnostic monitor on startup."}
                    </span>
                  </div>
                </div>
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Task Name */}
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    {isAr ? "اسم المهمة المجدولة (Task Name):" : "Scheduled Task Name:"}
                  </label>
                  <input
                    type="text"
                    value={taskName}
                    onChange={(e) => setTaskName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-blue-300 focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-[11px] text-slate-500">
                    {isAr ? "يظهر داخل Task Scheduler (taskschd.msc)" : "Identifier inside taskschd.msc"}
                  </p>
                </div>

                {/* Trigger Mode */}
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    {isAr ? "وقت إطلاق المهمة (Trigger):" : "Task Launch Trigger:"}
                  </label>
                  <select
                    value={triggerMode}
                    onChange={(e) => setTriggerMode(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    <option value="AtStartup">
                      {isAr ? "عند إقلاع الجهاز مباشرة (At System Boot - Startup)" : "At System Startup (Boot)"}
                    </option>
                    <option value="AtLogon">
                      {isAr ? "عند تسجيل دخول المستخدم (At User Logon)" : "At User Logon"}
                    </option>
                    <option value="Both">
                      {isAr ? "كلاهما معاً (إقلاع النظام + تسجيل الدخول)" : "Both (System Boot & User Logon)"}
                    </option>
                  </select>
                  <p className="text-[11px] text-slate-500">
                    {isAr ? "يعمل حتى قبل تسجيل دخول المستخدم للماكينات المخصصة" : "Starts before user login for dedicated CNC workstations"}
                  </p>
                </div>

                {/* Target Type */}
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    {isAr ? "نوع الملف المشغّل (Target Executable):" : "Target Executable Type:"}
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleTargetTypeChange('python')}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        targetType === 'python'
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Python (.py)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTargetTypeChange('compiledExe')}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        targetType === 'compiledExe'
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Binary (.exe)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleTargetTypeChange('custom')}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        targetType === 'custom'
                          ? 'bg-blue-600 text-white font-bold'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {isAr ? "مخصص" : "Custom"}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {targetType === 'python'
                      ? (isAr ? "يستخدم pythonw.exe لتشغيل السكريبت بدون شاشة نافذة سوداء" : "Invokes pythonw.exe to run headless")
                      : (isAr ? "يشغل ملف .exe المترجم مع المعامل --daemon" : "Executes standalone binary with --daemon argument")}
                  </p>
                </div>

                {/* Poll Interval */}
                <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">
                    {isAr ? "فترة استطلاع منافذ USB (Poll Interval):" : "Hot-Plug Polling Rate:"}
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="range"
                      min={1}
                      max={10}
                      step={1}
                      value={pollIntervalSeconds}
                      onChange={(e) => setPollIntervalSeconds(Number(e.target.value))}
                      className="flex-1 accent-blue-500 cursor-pointer"
                    />
                    <span className="font-mono text-xs text-emerald-400 font-bold px-2 py-1 bg-slate-900 border border-slate-700 rounded-md">
                      {pollIntervalSeconds} {isAr ? "ثواني" : "sec"}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {isAr ? "زمن استجابة مراقب الخلفية فور إدخال الكابل" : "Reaction time when laser USB cable is plugged in"}
                  </p>
                </div>
              </div>

              {/* Target File Path input */}
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  {isAr ? "المسار الكامل للملف على القرص (Target Path):" : "Full Target File Path:"}
                </label>
                <input
                  type="text"
                  value={targetPath}
                  onChange={(e) => setTargetPath(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs font-mono text-emerald-300 focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2 cursor-pointer hover:border-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={runAsSystem}
                    onChange={(e) => setRunAsSystem(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-semibold text-xs text-white block">
                      {isAr ? "صلاحيات SYSTEM الكاملة" : "NT AUTHORITY\\SYSTEM"}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {isAr ? "أعلى امتيازات نواتية" : "Highest privilege level"}
                    </span>
                  </div>
                </label>

                <label className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2 cursor-pointer hover:border-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={autoHealDrivers}
                    onChange={(e) => setAutoHealDrivers(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-semibold text-xs text-white block">
                      {isAr ? "الإنعاش التلقائي للتعاريف" : "Auto-Heal PnP Drivers"}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {isAr ? "حل تلقائي لرمز 10 و 43 و 52" : "PnPUtil purge on error"}
                    </span>
                  </div>
                </label>

                <label className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-start gap-2 cursor-pointer hover:border-slate-700 transition-colors">
                  <input
                    type="checkbox"
                    checked={restartOnFailure}
                    onChange={(e) => setRestartOnFailure(e.target.checked)}
                    className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <span className="font-semibold text-xs text-white block">
                      {isAr ? "إعادة التشغيل عند التوقف" : "Auto-Restart on Fail"}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {isAr ? "إعادة محاولة بعد دقيقة" : "Retry after 1 min"}
                    </span>
                  </div>
                </label>
              </div>

              {/* Instructions banner */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
                <span className="font-semibold text-slate-200 block">
                  {isAr ? "طريقة التنفيذ في Windows 11:" : "How to execute in Windows 11:"}
                </span>
                <p className="leading-relaxed">
                  {isAr 
                    ? "1. اضغط زر «تحميل Register-Task.ps1» لحفظ السكريبت. 2. انقر بالزر الأيمن على الملف واختر «Run with PowerShell» بصلاحيات المسؤول، أو افتح PowerShell (Admin) ونفّذ الأمر أدناه:"
                    : "1. Download the script. 2. Right-click and choose 'Run with PowerShell' as Administrator, or paste the command in an elevated PowerShell terminal:"}
                </p>
                <div className="mt-1 bg-slate-900 p-2 rounded font-mono text-[11px] text-blue-300 border border-slate-800 select-all">
                  powershell -ExecutionPolicy Bypass -File ".\Register-LaserDoctorTask.ps1"
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono">Register-LaserDoctorTask.ps1</span>
                <span>{generatedPs1.split('\n').length} lines | PowerShell 5.1 & 7+</span>
              </div>
              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 overflow-x-auto max-h-[460px] leading-relaxed select-all">
                {generatedPs1}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#0c1222] flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            {isAr 
              ? "مهمة دائمة في Task Scheduler | تعمل تلقائياً عند الإقلاع" 
              : "Windows Task Scheduler (schtasks.exe / PowerShell API)"}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              {isAr ? "إغلاق" : "Close"}
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center gap-1.5 shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAr ? "تحميل سكريبت PowerShell" : "Download .ps1"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
