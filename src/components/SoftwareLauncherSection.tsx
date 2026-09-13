import React, { useState } from 'react';
import { ExternalLink, Copy, Check, Play, Folder, Download, Sparkles } from 'lucide-react';
import { downloadFile } from '../utils/scriptsGenerator';

interface SoftwareLauncherSectionProps {
  lang: 'ar' | 'en';
}

export const SoftwareLauncherSection: React.FC<SoftwareLauncherSectionProps> = ({ lang }) => {
  const isAr = lang === 'ar';
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const softwareList = [
    {
      name: 'LightBurn',
      type: 'Industrial & Hobby Laser Control',
      path: 'C:\\Program Files\\LightBurn\\LightBurn.exe',
      descAr: 'البرنامج الأكثر احترافية لماكينات الليزر (GRBL, DSP, Galvo, Ruida).',
      descEn: 'Professional software for diode, CO2, and fiber laser cutters.',
      badge: 'Recommended',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    },
    {
      name: 'RDWorks V8',
      type: 'CO2 Ruida Laser Controller',
      path: 'C:\\RDWorksV8\\RDWorksV8.exe',
      descAr: 'البرنامج القياسي لماكينات Ruida CO2 الصينية الكبيرة.',
      descEn: 'Official software for Ruida controller laser cutting systems.',
      badge: 'DSP / CO2',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    {
      name: 'LaserGRBL',
      type: 'Free GRBL Engraver Software',
      path: 'C:\\Program Files (x86)\\LaserGRBL\\LaserGRBL.exe',
      descAr: 'البرنامج المجاني مفتوح المصدر الأكثر انتشاراً لماكينات الدايود.',
      descEn: 'Free, open-source laser engraving software for GRBL boards.',
      badge: 'Free / Diode',
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    },
  ];

  const handleCopy = (path: string, key: string) => {
    navigator.clipboard.writeText(path);
    setCopiedPath(key);
    setTimeout(() => setCopiedPath(null), 2000);
  };

  const handleDownloadBatchLauncher = () => {
    const batContent = `@echo off
chcp 65001 > nul
echo Searching for Laser Software...

if exist "C:\\Program Files\\LightBurn\\LightBurn.exe" (
    echo Launching LightBurn...
    start "" "C:\\Program Files\\LightBurn\\LightBurn.exe"
    exit
)

if exist "C:\\RDWorksV8\\RDWorksV8.exe" (
    echo Launching RDWorks V8...
    start "" "C:\\RDWorksV8\\RDWorksV8.exe"
    exit
)

if exist "C:\\Program Files (x86)\\LaserGRBL\\LaserGRBL.exe" (
    echo Launching LaserGRBL...
    start "" "C:\\Program Files (x86)\\LaserGRBL\\LaserGRBL.exe"
    exit
)

echo No standard laser software found in default paths.
pause
`;
    downloadFile('launch_laser_software.bat', batContent, 'text/plain');
  };

  return (
    <div className="w-full max-w-4xl mx-auto mt-6 bg-slate-900/60 rounded-2xl border border-slate-800/80 p-5 sm:p-6 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Play className="w-4 h-4 text-blue-400" />
            <span>
              {isAr ? "برامج تشغيل الماكينة المكتشفة تلقائياً" : "Detected Laser Software & Paths"}
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            {isAr
              ? "المسارات الافتراضية التي يتم فحصها وتشغيلها بنقرة واحدة في الخطوة الخامسة"
              : "Default execution paths probed during Step 5 of the diagnostic pipeline"}
          </p>
        </div>

        <button
          onClick={handleDownloadBatchLauncher}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors shrink-0"
        >
          <Download className="w-3.5 h-3.5 text-blue-400" />
          <span>{isAr ? "تحميل ملف تشغيل البرامج .bat" : "Get Launcher .bat"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {softwareList.map((sw, idx) => (
          <div
            key={idx}
            className="p-3.5 bg-slate-950/70 border border-slate-800/90 rounded-xl flex flex-col justify-between hover:border-slate-700 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-bold text-white text-sm">{sw.name}</span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${sw.badgeColor}`}>
                  {sw.badge}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                {isAr ? sw.descAr : sw.descEn}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800/60 mt-2">
              <div className="flex items-center justify-between gap-2 text-slate-500 text-[11px] font-mono">
                <span className="truncate max-w-[170px]" title={sw.path}>
                  {sw.path}
                </span>
                <button
                  onClick={() => handleCopy(sw.path, sw.name)}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors shrink-0"
                  title={isAr ? "نسخ مسار الملف" : "Copy file path"}
                >
                  {copiedPath === sw.name ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
