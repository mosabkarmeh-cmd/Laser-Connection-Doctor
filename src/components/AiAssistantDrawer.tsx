import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  RotateCcw, 
  ExternalLink, 
  Search, 
  Copy, 
  Check, 
  Loader2,
  Terminal,
  ShieldAlert,
  Cpu
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  grounding?: {
    webSearchQueries?: string[];
    groundingChunks?: Array<{
      web?: {
        uri: string;
        title: string;
      };
    }>;
  };
  timestamp: string;
}

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  lang: 'ar' | 'en';
}

const QUICK_PROMPTS_AR = [
  "كيف أفعّل الـ Persistent Daemon ليعمل الليزر تلقائياً؟",
  "حل حظر تعريفات ويندوز 7 برمز Code 52 و Code 39",
  "طريقة تخطي حظر تعريف CH340 / PL2303 في Win11 24H2",
  "كيف أحرر منفذ الـ COM العالق في LightBurn و RDWorks؟",
];

const QUICK_PROMPTS_EN = [
  "How does the Persistent Daemon auto-connect on USB plug?",
  "Fix Windows 7 driver blocks (Code 52 & Code 39) in Win11",
  "Bypass HVCI Memory Integrity for PL2303 / CH340",
  "Release COM port locked by zombie LightBurn process",
];

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const isAr = lang === 'ar';
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: isAr
        ? "مرحباً بك! أنا مساعد الذكاء الاصطناعي المتخصص في نواة ويندوز 11، تجاوز حظر التعريفات القديمة (Code 10/43/52/39)، وإعداد الـ Persistent Daemon لماكينات الليزر. كيف يمكنني مساعدتك؟"
        : "Welcome! I am your AI Kernel & Driver Diagnostics Specialist for Windows 11, legacy driver recovery (Code 10/43/52/39), and Persistent Auto-Start Daemons for laser engravers. How can I assist you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const prompt = (textToSend || input).trim();
    if (!prompt || loading) return;

    const userMsg: Message = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user',
      text: prompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            text: m.text,
          })),
          userMessage: prompt,
        }),
      });

      const data = await response.json();

      const assistantMsg: Message = {
        id: Math.random().toString(36).substring(2, 9),
        role: 'assistant',
        text: data.reply || (isAr ? "لم يتم استلام رد." : "No response received."),
        grounding: data.grounding,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substring(2, 9),
          role: 'assistant',
          text: isAr
            ? `حدث خطأ أثناء الاتصال بالمساعد: ${err.message || 'خطأ غير معروف'}`
            : `Error contacting assistant: ${err.message || 'Unknown error'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    setMessages([
      {
        id: 'reset',
        role: 'assistant',
        text: isAr
          ? "تمت إعادة تعيين المحادثة. تفضل بطرح أي سؤال حول النواة، التعريفات، أو أوامر الـ Daemon."
          : "Conversation reset. Feel free to ask any question regarding Windows kernel, legacy drivers, or daemon setup.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div 
        className="w-full max-w-xl h-full bg-[#0b1120] border-l border-slate-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-800 bg-[#0f172a] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">
                  {isAr ? "مساعد الذكاء الاصطناعي للنواة والتعريفات" : "AI Kernel & Driver Specialist"}
                </h3>
                <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <Sparkles className="w-2.5 h-2.5" />
                  Gemini 3.5 + Search
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {isAr ? "دعم حي مباشر لمشاكل Windows 11 وتعاريف Win7 القديمة" : "Live diagnostic support for Windows 11 kernel & Win7 drivers"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleClear}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title={isAr ? "إعادة ضبط المحادثة" : "Reset Chat"}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-3 bg-slate-900/80 border-b border-slate-800/80 flex gap-2 overflow-x-auto no-scrollbar">
          {(isAr ? QUICK_PROMPTS_AR : QUICK_PROMPTS_EN).map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              disabled={loading}
              className="text-xs whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-800 hover:bg-blue-600/30 text-slate-300 hover:text-blue-300 border border-slate-700/60 transition-all flex items-center gap-1"
            >
              <span>{chip}</span>
            </button>
          ))}
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? (isAr ? 'flex-row-reverse' : 'flex-row-reverse') : ''}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-900/90 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans break-words">
                    {msg.text}
                  </div>

                  {/* Google Search Grounding Sources */}
                  {msg.grounding && msg.grounding.webSearchQueries && msg.grounding.webSearchQueries.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5 text-blue-400 font-semibold mb-1">
                        <Search className="w-3 h-3" />
                        <span>{isAr ? "مصادر وبيانات بحث Google المباشرة:" : "Live Google Search Grounding:"}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.grounding.webSearchQueries.map((q, i) => (
                          <span
                            key={i}
                            className="bg-slate-800 px-2 py-0.5 rounded text-[11px] text-slate-300 border border-slate-700"
                          >
                            {q}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions & Timestamp */}
                  <div className="mt-2 pt-1 flex items-center justify-between text-[11px] opacity-70">
                    <span>{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        onClick={() => copyMessage(msg.id, msg.text)}
                        className="hover:opacity-100 flex items-center gap-1 transition-opacity text-slate-400 hover:text-slate-200"
                        title={isAr ? "نسخ الرد" : "Copy"}
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedId === msg.id ? (isAr ? "تم" : "Copied") : (isAr ? "نسخ" : "Copy")}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-900/90 border border-slate-800 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-2 text-slate-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span>{isAr ? "جاري تحليل المشكلة والبحث في سجلات النواة..." : "Analyzing kernel rules & searching live data..."}</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-[#0f172a] border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                isAr
                  ? "اسأل عن رمز خطأ (Code 52, 43, 10)، إعداد الـ Daemon، أو أوامر PowerShell..."
                  : "Ask about error codes (Code 52, 43, 10), daemon setup, or commands..."
              }
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-40 disabled:hover:bg-blue-600 transition-colors shadow-lg shadow-blue-600/20"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
