import React, { useState } from 'react';
import { 
  X, 
  Terminal, 
  Send, 
  Trash2, 
  Zap, 
  Home, 
  Compass, 
  HelpCircle, 
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { LaserPortInfo } from '../types';

interface SerialTerminalModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
  portInfo: LaserPortInfo | null;
}

export const SerialTerminalModal: React.FC<SerialTerminalModalProps> = ({
  isOpen,
  onClose,
  lang,
  portInfo,
}) => {
  const isAr = lang === 'ar';
  const [command, setCommand] = useState('');
  const [terminalHistory, setTerminalHistory] = useState<Array<{ text: string; type: 'tx' | 'rx' | 'sys' }>>([
    { text: 'Laser Serial Terminal Ready.', type: 'sys' },
    { text: portInfo ? `Connected to ${portInfo.portName} @ ${portInfo.baudRate} baud` : 'Port: Simulated GRBL Port (115200)', type: 'sys' },
    { text: 'Type G-code or quick query like "?" or "$$".', type: 'sys' },
    { text: '<Idle|MPos:0.000,0.000,0.000|FS:0,0|WCO:0.000,0.000,0.000>', type: 'rx' }
  ]);

  if (!isOpen) return null;

  const handleSendCommand = (cmdToSend?: string) => {
    const toSend = (cmdToSend || command).trim();
    if (!toSend) return;

    // Append TX to history
    setTerminalHistory((prev) => [...prev, { text: `> ${toSend}`, type: 'tx' }]);

    // Simulated / interactive laser response
    setTimeout(() => {
      let resp = 'ok';
      if (toSend === '?') {
        resp = '<Idle|MPos:15.200,42.000,0.000|FS:0,0|Pn:P|WCO:0.000,0.000,0.000>';
      } else if (toSend === '$$') {
        resp = '$0=10 (Step pulse time)\n$1=25 (Step idle delay)\n$100=80.000 (x:step/mm)\n$101=80.000 (y:step/mm)\n$110=5000.000 (x:max rate)\n$120=500.000 (x:accel)\n$130=400.000 (x:max travel)\n$32=1 (Laser-mode enable)';
      } else if (toSend === '$I') {
        resp = '[VER:1.1f.20230815:GRBL-Laser-Pro]\n[OPT:V,15,128]';
      } else if (toSend.startsWith('$H')) {
        resp = '[MSG:Homing cycle started...]\nok';
      } else if (toSend.includes('M3') || toSend.includes('M4')) {
        resp = '[MSG:Laser armed (Low power test fire)]\nok';
      }

      setTerminalHistory((prev) => [...prev, { text: resp, type: 'rx' }]);
    }, 150);

    if (!cmdToSend) setCommand('');
  };

  const clearHistory = () => {
    setTerminalHistory([{ text: 'Console cleared.', type: 'sys' }]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>{isAr ? "الطرفية التفاعلية للماكينة (G-code Terminal)" : "Interactive Laser Terminal"}</span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 font-mono border border-emerald-800/40">
                  {portInfo?.baudRate || 115200} Baud
                </span>
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Command Toolbar */}
        <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-slate-500 font-medium mr-1">
            {isAr ? "أوامر سريعة:" : "Quick Commands:"}
          </span>
          <button
            onClick={() => handleSendCommand('?')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-300 font-mono border border-slate-700 transition-colors"
            title={isAr ? "استعلام الحالة الآنية" : "Real-time Status Query"}
          >
            ? (Status)
          </button>
          <button
            onClick={() => handleSendCommand('$$')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-purple-300 font-mono border border-slate-700 transition-colors"
            title={isAr ? "عرض إعدادات GRBL كاملة" : "View GRBL Settings"}
          >
            $$ (Settings)
          </button>
          <button
            onClick={() => handleSendCommand('$I')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono border border-slate-700 transition-colors"
            title={isAr ? "معلومات إصدار الفيرموير" : "Build Info"}
          >
            $I (Info)
          </button>
          <button
            onClick={() => handleSendCommand('$H')}
            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono border border-slate-700 transition-colors flex items-center gap-1"
            title={isAr ? "إعادة الماكينة لنقطة الصفر" : "Home Machine"}
          >
            <Home className="w-3 h-3" />
            <span>$H (Home)</span>
          </button>
          <button
            onClick={() => handleSendCommand('M3 S1\nG4 P0.1\nM5')}
            className="px-2.5 py-1 rounded bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 font-mono border border-rose-800/40 transition-colors flex items-center gap-1"
            title={isAr ? "نبضة ليزر تجريبية خفيفة للتركيز" : "Focus Test Fire (1% pulse)"}
          >
            <Zap className="w-3 h-3 text-rose-400" />
            <span>Laser Pulse</span>
          </button>
          <button
            onClick={clearHistory}
            className="ml-auto p-1 text-slate-500 hover:text-slate-300 transition-colors"
            title="Clear Terminal"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Terminal Output Area */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-950 font-mono text-xs space-y-1 min-h-[260px] max-h-[360px] selection:bg-blue-800">
          {terminalHistory.map((item, index) => {
            let textColor = 'text-slate-300';
            if (item.type === 'tx') textColor = 'text-blue-400 font-semibold';
            if (item.type === 'rx') textColor = 'text-emerald-400';
            if (item.type === 'sys') textColor = 'text-slate-500 italic';

            return (
              <div key={index} className={`whitespace-pre-wrap ${textColor}`}>
                {item.text}
              </div>
            );
          })}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendCommand()}
            placeholder={isAr ? "اكتب أمر G-Code (مثال: G0 X10 Y10 أو ?) واضغط Enter..." : "Type G-Code command (e.g. G0 X0 Y0 or ?) and hit Enter..."}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => handleSendCommand()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isAr ? "إرسال" : "Send"}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
