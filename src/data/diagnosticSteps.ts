import { StepStatus } from '../types';

export const INITIAL_STEPS: StepStatus[] = [
  {
    step: 1,
    titleAr: "إنهاء العمليات المعارضة وإعادة ضبط المنافذ (Process Cleanup & PnP Reset)",
    titleEn: "Process Cleanup & Deep Port Reset (Kill LightBurn/RDWorks & PnP Cycle)",
    status: 'pending',
    detailsAr: "إنهاء أي برامج تحجز منفذ COM بالخلفية (LightBurn, RDWorks, LaserGRBL)، وإعادة تشغيل أجهزة الـ PnP المعطوبة مع إلغاء توفير الطاقة.",
    detailsEn: "Kills background processes holding COM locks and deep cycles PnP USB devices/ports with power suspend disabled."
  },
  {
    step: 2,
    titleAr: "فحص أمان النواة (Core Isolation / HVCI) وتطهير التعاريف",
    titleEn: "Core Isolation (HVCI) Registry Check & DriverStore Purge",
    status: 'pending',
    detailsAr: "فحص قيود سلامة الذاكرة في ويندوز 11 (DeviceGuard) لمنع حظر تعاريف CH340/PL2303، وتطهير التعاريف المعطوبة وتثبيت drivers/laser_driver.inf.",
    detailsEn: "Checks Windows 11 HVCI Memory Integrity blocking legacy unsigned drivers, purges broken INF packages, and injects local drivers."
  },
  {
    step: 3,
    titleAr: "المسح الشامل والكسر البرمجي للمصفوفة (Extended Baud & DTR/RTS)",
    titleEn: "Exhaustive Serial Matrix Probe (250000-9600 Baud & DTR/RTS States)",
    status: 'pending',
    detailsAr: "اختبار سرعات 250000, 115200, 74880, 57600, 38400, 19200, 9600 وتجربة 4 تباديل لخطوط التحكم بالهاردوير (DTR/RTS) لإيقاظ اللوحة.",
    detailsEn: "Brute-forces baud rates (250000 to 9600) across all DTR/RTS hardware flow control states to wake sleepy or reset-held controllers."
  },
  {
    step: 4,
    titleAr: "إرسال حزم التنبيه المتعددة (GRBL / Ruida / Generic Multi-Protocol Ping)",
    titleEn: "Multi-Protocol Wakeup Pings (GRBL '?' & Ruida Hex Sync & Generic Break)",
    status: 'pending',
    detailsAr: "إرسال حزم الإيقاظ GRBL (?), Soft Reset (0x18), Ruida Frame Header (D5 5A), وحزم Nulls لاكتشاف رد الماكينة.",
    detailsEn: "Dispatches protocol-specific probe packets (GRBL query, soft reset, Ruida DSP sync frames, break nulls) with 0.5s buffer latch."
  },
  {
    step: 5,
    titleAr: "إطلاق برنامج الليزر وتصدير التقرير التشخيصي للديسكتوب",
    titleEn: "Software Launch & Desktop Diagnostic Log Export (laser_diagnostic_log.txt)",
    status: 'pending',
    detailsAr: "تشغيل LightBurn أو RDWorks تلقائياً وتوليد تقرير تفصيلي كامل على سطح المكتب للمراجعة الفنية.",
    detailsEn: "Launches official laser software and writes full hardware IDs, VID/PID, and telemetry trace to Desktop diagnostic log."
  }
];

export const COMMON_LASER_CHIPS = [
  {
    name: "CH340 / CH341 (QinHeng)",
    descriptionAr: "الشريحة الأكثر شيوعاً في ماكينات الليزر الصينية والدايود (Sculpfun, xTool, Atomstack, Ortur).",
    descriptionEn: "Most common USB-to-UART chip on diode lasers (Sculpfun, xTool, Atomstack, Ortur).",
    vid: "1A86",
    pid: "7523",
    defaultBaud: 115200,
    noteAr: "غالباً ما تتطلب إيقاف Memory Integrity في ويندوز 11 لتشغيل النسخ القديمة من التعريف."
  },
  {
    name: "CP2102 / CP210x (Silicon Labs)",
    descriptionAr: "شريحة عالية الاستقرار تستخدم في ماكينات Neje, Two Trees, والماكينات المتقدمة.",
    descriptionEn: "High stability chip used in Neje, TwoTrees, and modern controller boards.",
    vid: "10C4",
    pid: "EA60",
    defaultBaud: 115200,
    noteAr: "تعريفاتها مدمجة غالباً في ويندوز 10 و 11 الحديث."
  },
  {
    name: "FT232R / FTDI",
    descriptionAr: "شريحة صناعية دقيقة تستخدم في وحدات تحكم ليزر CO2 والماكينات المتقدمة.",
    descriptionEn: "Industrial grade USB bridge often on CO2 lasers and high-end controllers.",
    vid: "0403",
    pid: "6001",
    defaultBaud: 115200,
    noteAr: "قد تحتاج لتعريف FTDI الأصلي لتفادي مشاكل البورتات الوهمية."
  },
  {
    name: "Ruida Controller (RDWorks)",
    descriptionAr: "وحدة التحكم القياسية لماكينات ليزر ثاني أكسيد الكربون CO2 (RDC6442, RDC6445).",
    descriptionEn: "Standard DSP controller for CO2 glass tube laser cutters.",
    vid: "0483",
    pid: "5750",
    defaultBaud: 57600,
    noteAr: "تتصل أحياناً عبر تعريف USB خاص (FTDI أو بروتوكول USB مخصص) أو عبر كابل إيثرنت LAN."
  },
  {
    name: "Prolific PL2303 (Legacy Win7)",
    descriptionAr: "شريحة تسلسلية كلاسيكية شهيرة في الماكينات القديمة؛ تحظرها نواة ويندوز 11 برمز Code 39 أو Code 52.",
    descriptionEn: "Classic legacy serial bridge blocked by Windows 11 HVCI / driver signature enforcement (Code 39/52).",
    vid: "067B",
    pid: "2303",
    defaultBaud: 9600,
    noteAr: "تتطلب تفعيل وضع الاختبار (Test Mode bcdedit) أو إيقاف Memory Integrity واستخدام تعريف v3.3.2 القديم."
  },
  {
    name: "Leetro MPC6515 / MPC6525 (LaserCut)",
    descriptionAr: "متحكم ليزر صناعي قديم يعمل ببرنامج LaserCut 5.3؛ يعتمد على وسيط USB مخصص.",
    descriptionEn: "Industrial DSP controller for LaserCut 5.3 relying on custom USB endpoints.",
    vid: "0471",
    pid: "0001",
    defaultBaud: 115200,
    noteAr: "يتطلب حقن طبقة توافق Windows 7 (AppCompatFlags) أو استخدام وسيط Raw USB المباشر."
  }
];
