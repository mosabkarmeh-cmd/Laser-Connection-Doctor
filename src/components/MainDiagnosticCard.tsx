import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  RotateCw, 
  Terminal, 
  Copy, 
  Trash2, 
  Check, 
  AlertTriangle, 
  XCircle, 
  Info, 
  CheckCircle2, 
  Zap,
  Activity,
  Layers,
  Wrench,
  ExternalLink,
  Calendar,
  Clock
} from 'lucide-react';
import { LogEntry, StepStatus } from '../types';
import { SerialSignalActivityIndicator } from './SerialSignalActivityIndicator';

interface MainDiagnosticCardProps {
  lang: 'ar' | 'en';
  isRunning: boolean;
  onRunProcess: () => void;
  logs: LogEntry[];
  steps: StepStatus[];
  currentStep: number;
  onClearLogs: () => void;
  onOpenTerminal?: () => void;
  onOpenTaskScheduler?: () => void;
  connectedPort?: string | null;
  baudRate?: number;
}

export const MainDiagnosticCard: React.FC<MainDiagnosticCardProps> = ({
  lang,
  isRunning,
  onRunProcess,
  logs,
  steps,
  currentStep,
  onClearLogs,
  onOpenTerminal,
  onOpenTaskScheduler,
  connectedPort,
  baudRate,
}) => {
  const isAr = lang === 'ar';
  const logBoxRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  // Auto scroll to bottom of logs
  useEffect(() => {
    if (logBoxRef.current) {
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
    }
  }, [logs]);

  const handleCopyLogs = () => {
    const text = logs
      .map((l) => {
        const prefix = {
          INFO: '[ℹ️ INFO]',
          SUCCESS: '[✅ SUCCESS]',
          WARN: '[⚠️ WARN]',
          ERROR: '[❌ ERROR]',
        }[l.level];
        return `${prefix} ${l.message}`;
      })
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Calculate percentage complete
  const completedCount = steps.filter((s) => s.status === 'completed' || s.status === 'warning').length;
  let progressPercent = 0;
  if (completedCount === 5 && !isRunning) {
    progressPercent = 100;
  } else if (isRunning) {
    // Current step in progress gives base progress + partial for active step
    progressPercent = Math.min(
      96,
      Math.max(8, ((currentStep - 1) * 20) + 10)
    );
  } else if (completedCount > 0) {
    progressPercent = Math.round((completedCount / steps.length) * 100);
  }

  return (
    <div className="w-full max-w-4xl mx-auto bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden backdrop-blur-sm relative">
      {/* Top Diagnostic Progress Bar */}
      <div className="w-full bg-slate-950/90 h-2 sm:h-2.5 relative overflow-hidden border-b border-slate-800/80">
        <motion.div
          className={`h-full transition-all duration-300 ${
            progressPercent === 100
              ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400'
              : isRunning
              ? 'bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400'
              : 'bg-slate-700'
          }`}
          initial={{ width: '0%' }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ ease: "easeInOut", duration: 0.4 }}
        />
        {isRunning && (
          <motion.div
            className="absolute inset-0 bg-white/20"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
          />
        )}
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Title & Subtitle Matching Python Script with Progress Indicator */}
        <div className="text-center mb-6 relative">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide">
              Laser Connection Doctor
            </h2>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
              v1.0 Offline
            </span>
            {(isRunning || progressPercent > 0) && (
              <motion.span
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  progressPercent === 100
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                }`}
              >
                {progressPercent}%
              </motion.span>
            )}
          </div>
          <p className="text-sm sm:text-base text-slate-400 font-medium">
            {isAr
              ? "أداة الربط التشخيصية التلقائية لماكينات الليزر (أوفلاين)"
              : "Automated Diagnostic & One-Click USB Connection Doctor for Laser Cutters"}
          </p>
        </div>

      {/* The Signature One-Click Start Button */}
      <div className="mb-6">
        <button
          id="btn-start-process"
          disabled={isRunning}
          onClick={onRunProcess}
          className={`w-full py-3.5 px-6 rounded-xl font-bold text-base sm:text-lg flex items-center justify-center gap-3 transition-all duration-200 shadow-lg cursor-pointer ${
            isRunning
              ? 'bg-[#14375e] text-slate-300 opacity-80 cursor-not-allowed'
              : 'bg-[#1f538d] hover:bg-[#14375e] active:scale-[0.99] text-white shadow-blue-900/40 hover:shadow-blue-900/60 border border-blue-400/20'
          }`}
        >
          {isRunning ? (
            <>
              <RotateCw className="w-5 h-5 animate-spin text-blue-300" />
              <span>
                {isAr
                  ? "جاري الفحص والتشخيص الشامل..."
                  : "Running Full Diagnostic & Connection..."}
              </span>
            </>
          ) : (
            <>
              <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
              <span>
                {isAr
                  ? "بدء الفحص والربط التلقائي (One-Click Connect)"
                  : "Start Automated Diagnostic (One-Click Connect)"}
              </span>
            </>
          )}
        </button>

        {/* Setup Option: Task Scheduler Background Monitor */}
        <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/30">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-slate-200 block">
                {isAr ? "التشغيل التلقائي عند بدء الويندوز (Task Scheduler)" : "Auto-Start Monitor at Boot (Task Scheduler)"}
              </span>
              <span className="text-slate-400 text-[11px]">
                {isAr
                  ? "تشغيل مراقب الخلفية الصامت فور إقلاع النظام بدون فتح التطبيق"
                  : "Silent background daemon that probes USB laser connections on system boot"}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenTaskScheduler}
            className="w-full sm:w-auto px-3 py-1.5 rounded-lg bg-blue-600/90 hover:bg-blue-500 text-white font-semibold transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-sm"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{isAr ? "إعداد سكريبت PowerShell" : "Generate PowerShell Setup"}</span>
          </button>
        </div>

        <p className="text-center text-xs text-slate-500 mt-2">
          {isAr
            ? "يقوم بفحص توفير الطاقة، تعاريف DriverStore، مسح البورتات (115200-9600)، وتجهيز برنامج LightBurn/RDWorks."
            : "Executes USB power fix, DriverStore inspection, COM baud probe, and launches laser software."}
        </p>
      </div>

      {/* 5-Step Process Visualizer */}
      <div className="mb-6 bg-slate-950/60 rounded-xl p-3 sm:p-4 border border-slate-800/80">
        <div className="flex items-center justify-between mb-3 text-xs text-slate-400 font-semibold uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-blue-400" />
            {isAr ? "مراحل خطة التشخيص الأوفلاين" : "Offline Diagnostic Pipeline"}
          </span>
          <span>
            {currentStep > 0 ? `${currentStep}/5` : isAr ? "جاهز" : "Ready"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
          {steps.map((st) => {
            const isCurrent = currentStep === st.step && isRunning;
            const isDone = st.status === 'completed';
            const isWarn = st.status === 'warning';
            const isErr = st.status === 'error';

            return (
              <div
                key={st.step}
                className={`p-2.5 rounded-lg border text-xs transition-all relative ${
                  isCurrent
                    ? 'bg-blue-950/40 border-blue-500 text-white shadow-sm ring-1 ring-blue-500/40'
                    : isDone
                    ? 'bg-emerald-950/20 border-emerald-600/40 text-emerald-300'
                    : isWarn
                    ? 'bg-amber-950/20 border-amber-600/40 text-amber-300'
                    : isErr
                    ? 'bg-rose-950/20 border-rose-600/40 text-rose-300'
                    : 'bg-slate-900/50 border-slate-800 text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="font-mono text-[11px] font-bold text-slate-400">
                    0{st.step}
                  </span>
                  {isCurrent && <RotateCw className="w-3 h-3 animate-spin text-blue-400" />}
                  {isDone && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
                  {isWarn && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                  {isErr && <XCircle className="w-3 h-3 text-rose-400" />}
                  {!isCurrent && !isDone && !isWarn && !isErr && (
                    <span className="w-2 h-2 rounded-full bg-slate-700"></span>
                  )}
                </div>
                <p className="font-semibold line-clamp-2 leading-tight">
                  {isAr ? st.titleAr : st.titleEn}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Real-time D3 Serial Signal Indicator (TX / RX & Logic Analysis) */}
      <SerialSignalActivityIndicator
        isRunning={isRunning}
        currentStep={currentStep}
        logs={logs}
        baudRate={baudRate || 115200}
        portName={connectedPort}
        lang={lang}
      />

      {/* Live Log Console (CustomTkinter log_textbox clone) */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-inner">
        {/* Terminal Title Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block"></span>
            </div>
            <span className="font-mono font-semibold text-slate-300 ml-2 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              {isAr ? "سجل التشخيص المباشر (Consolas Log Box)" : "Live Diagnostic Log"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLogs}
              className="flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title={isAr ? "نسخ السجل" : "Copy logs"}
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ" : "Copy")}</span>
            </button>
            <button
              onClick={onClearLogs}
              className="flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded transition-colors"
              title={isAr ? "مسح السجل" : "Clear logs"}
            >
              <Trash2 className="w-3 h-3" />
              <span>{isAr ? "مسح" : "Clear"}</span>
            </button>
          </div>
        </div>

        {/* The Text Box */}
        <div
          ref={logBoxRef}
          id="log-textbox"
          className="h-[340px] overflow-y-auto p-4 font-mono text-[13px] leading-relaxed text-slate-200 selection:bg-blue-800 selection:text-white"
          style={{ fontFamily: "'JetBrains Mono', Consolas, 'Courier New', monospace" }}
        >
          {logs.length === 0 ? (
            <div className="text-slate-600 text-center py-16">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-40 animate-pulse" />
              <p>{isAr ? "جاهز للبدء. وصل الماكينة بالـ USB واضغط الزر أعلاه." : "Ready. Connect laser via USB and click the button above."}</p>
            </div>
          ) : (
            logs.map((entry) => {
              let badgeColor = 'text-blue-400';
              let badgeText = '[ℹ️ INFO]';
              let lineBg = 'hover:bg-slate-900/40';

              if (entry.level === 'SUCCESS') {
                badgeColor = 'text-emerald-400 font-bold';
                badgeText = '[✅ SUCCESS]';
                lineBg = 'bg-emerald-950/20 hover:bg-emerald-950/30';
              } else if (entry.level === 'WARN') {
                badgeColor = 'text-amber-400 font-bold';
                badgeText = '[⚠️ WARN]';
                lineBg = 'bg-amber-950/20 hover:bg-amber-950/30';
              } else if (entry.level === 'ERROR') {
                badgeColor = 'text-rose-400 font-bold';
                badgeText = '[❌ ERROR]';
                lineBg = 'bg-rose-950/20 hover:bg-rose-950/30';
              }

              return (
                <div
                  key={entry.id}
                  className={`py-0.5 px-1.5 rounded flex items-start gap-2 text-start transition-colors ${lineBg}`}
                >
                  <span className="text-slate-600 text-[11px] select-none shrink-0 pt-0.5">
                    {entry.timestamp}
                  </span>
                  <span className={`shrink-0 select-none ${badgeColor}`}>
                    {badgeText}
                  </span>
                  <span className="text-slate-200 break-all whitespace-pre-wrap">
                    {entry.message}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info inside terminal */}
        <div className="px-4 py-2 bg-slate-900/70 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-500">
          <span>
            {isAr
              ? "ملاحظة: السجلات تطابق مخرجات سكريبت بايثون الأصلي تماماً."
              : "Logs match the native Python applet output exactly."}
          </span>
          {connectedPort && (
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              {isAr ? `متصل: ${connectedPort}` : `Connected: ${connectedPort}`}
            </span>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};
