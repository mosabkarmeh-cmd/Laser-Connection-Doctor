import React from 'react';
import { Cpu, Usb, ShieldCheck, Languages, Download, HelpCircle, Terminal, Calendar } from 'lucide-react';
import { ConnectionMode, LaserPortInfo } from '../types';

interface HeaderProps {
  lang: 'ar' | 'en';
  setLang: (l: 'ar' | 'en') => void;
  mode: ConnectionMode;
  setMode: (m: ConnectionMode) => void;
  isWebSerialSupported: boolean;
  portInfo: LaserPortInfo | null;
  onOpenFixes: () => void;
  onOpenTerminal: () => void;
  onDownloadPython: () => void;
  onOpenAiAssistant: () => void;
  onOpenTaskScheduler?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  lang,
  setLang,
  mode,
  setMode,
  isWebSerialSupported,
  portInfo,
  onOpenFixes,
  onOpenTerminal,
  onDownloadPython,
  onOpenAiAssistant,
  onOpenTaskScheduler,
}) => {
  const isAr = lang === 'ar';

  return (
    <header className="border-b border-slate-800 bg-[#0f172a]/95 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-3.5 shadow-md">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Logo and Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
            <Cpu className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                Laser Connection Doctor
              </h1>
              <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                100% Offline
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {isAr ? "أداة الربط التشخيصية التلقائية لماكينات الليزر" : "Automated Diagnostic & USB Connection Tool for Laser Cutters"}
            </p>
          </div>
        </div>

        {/* Action Controls & Badges */}
        <div className="flex items-center flex-wrap gap-2">
          {/* Hardware / Simulation Mode Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-medium">
            <button
              onClick={() => setMode('webserial')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                mode === 'webserial'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title={isWebSerialSupported ? "Web Serial API (Chrome/Edge)" : "غير مدعوم في هذا المتصفح"}
            >
              <Usb className="w-3.5 h-3.5" />
              <span>{isAr ? "منفذ USB حقيقي" : "Direct USB Port"}</span>
            </button>
            <button
              onClick={() => setMode('simulation')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                mode === 'simulation'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>{isAr ? "محاكاة تشخيصية" : "Diagnostic Sim"}</span>
            </button>
          </div>

          {/* Connection status indicator */}
          {portInfo && portInfo.status === 'connected' && (
            <button
              onClick={onOpenTerminal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>{portInfo.portName} @ {portInfo.baudRate}</span>
              <Terminal className="w-3.5 h-3.5 ml-1" />
            </button>
          )}

          {/* AI Assistant Button */}
          <button
            onClick={onOpenAiAssistant}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 rounded-lg shadow-sm shadow-blue-500/20 transition-all border border-cyan-400/30"
            title={isAr ? "مساعد الذكاء الاصطناعي لحلول النواة والتعريفات" : "AI Kernel & Driver Diagnostics Specialist"}
          >
            <span className="w-2 h-2 rounded-full bg-cyan-300 animate-pulse"></span>
            <span>{isAr ? "المساعد الذكي (AI)" : "AI Assistant"}</span>
          </button>

          {/* Task Scheduler Setup Button */}
          {onOpenTaskScheduler && (
            <button
              onClick={onOpenTaskScheduler}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 rounded-lg transition-all"
              title={isAr ? "توليد سكريبت PowerShell لتسجيل مهمة مجدول المهام عند الإقلاع" : "Generate PowerShell script for Task Scheduler startup monitor"}
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">{isAr ? "مجدول المهام (Startup)" : "Task Scheduler"}</span>
            </button>
          )}

          {/* Windows Fixes / Troubleshooting Guide */}
          <button
            onClick={onOpenFixes}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 rounded-lg transition-all"
            title={isAr ? "إرشادات وحلول الويندوز (PowerShell & Memory Integrity)" : "Windows Diagnostic Guides"}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">{isAr ? "أدلة حل المشاكل" : "Windows Guides"}</span>
          </button>

          {/* Download Offline Package */}
          <button
            onClick={onDownloadPython}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 rounded-lg transition-all"
            title={isAr ? "تحميل حزمة التطبيق والتعريفات الكاملة للأجهزة غير المتصلة بالإنترنت (Offline ZIP)" : "Download Complete Offline Package (.ZIP + Drivers + Build Scripts)"}
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden md:inline">{isAr ? "تحميل حزمة أوفلاين (ZIP)" : "Offline Package (.ZIP)"}</span>
          </button>

          {/* Language Switch */}
          <button
            onClick={() => setLang(isAr ? 'en' : 'ar')}
            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 border border-slate-700 rounded-lg transition-all"
          >
            <Languages className="w-3.5 h-3.5" />
            <span>{isAr ? "English" : "العربية"}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
