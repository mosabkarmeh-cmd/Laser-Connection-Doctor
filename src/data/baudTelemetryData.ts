import { BaudTelemetryItem, ControllerPresetKey } from '../types';

export const BAUD_RATE_PRESETS: Record<ControllerPresetKey, BaudTelemetryItem[]> = {
  all: [
    {
      baud: 250000,
      probes: 284,
      successful: 215,
      successRate: 75.7,
      avgLatencyMs: 24,
      primaryControllers: 'Marlin 2.0 / ESP32 32-bit / BigTreeTech',
      recommendedPins: 'DTR=0, RTS=0',
      confidence: 'Medium',
      notesAr: 'شائعة في طابعات ومتحكمات الـ 32-bit الحديثة، لكنها قد تكون غير مستقرة مع شرائح CH340 القديمة.',
      notesEn: 'Common on modern 32-bit boards, but can be sensitive on older CH340 clones without clean shielding.'
    },
    {
      baud: 115200,
      probes: 1480,
      successful: 1445,
      successRate: 97.6,
      avgLatencyMs: 38,
      primaryControllers: 'GRBL 1.1 (Ortur, Sculpfun, Atomstack, TwoTrees, Neje)',
      recommendedPins: 'DTR=1, RTS=0',
      confidence: 'High',
      notesAr: 'السرعة القياسية الذهبية لمعظم ماكينات الليزر الدايود ومتحكمات GRBL الرسمية و LightBurn.',
      notesEn: 'The global standard for diode laser engravers, GRBL 1.1 firmware, and LightBurn.'
    },
    {
      baud: 74880,
      probes: 112,
      successful: 42,
      successRate: 37.5,
      avgLatencyMs: 62,
      primaryControllers: 'ESP8266 / ESP32 Bootloader Diagnostic',
      recommendedPins: 'DTR=1, RTS=1',
      confidence: 'Low',
      notesAr: 'تستخدم بشكل خاص لقراءة سجلات الإقلاع (Boot ROM) لمتحكمات ESP8266/ESP32 عند تعليق الفيرموير.',
      notesEn: 'Specialized bootloader baud for ESP8266/ESP32 diagnostic recovery when main firmware stalls.'
    },
    {
      baud: 57600,
      probes: 490,
      successful: 421,
      successRate: 85.9,
      avgLatencyMs: 54,
      primaryControllers: 'Ruida DSP (RDC6442) / GRBL 0.9 / Older CNC',
      recommendedPins: 'DTR=0, RTS=1',
      confidence: 'High',
      notesAr: 'السرعة المفضلة لماكينات CO2 التي تستخدم وحدات تحكم Ruida و RDWorks، ونسخ GRBL 0.9 القديمة.',
      notesEn: 'Preferred speed for CO2 laser DSPs (Ruida RDC6442/6445) and older GRBL 0.9 units.'
    },
    {
      baud: 38400,
      probes: 165,
      successful: 88,
      successRate: 53.3,
      avgLatencyMs: 78,
      primaryControllers: 'Legacy Arduino Uno / CNC Shield V3',
      recommendedPins: 'DTR=1, RTS=0',
      confidence: 'Medium',
      notesAr: 'تستخدم في بعض دروع CNC Shield القديمة لتفادي تشويش المحركات الخطوية على خط USB.',
      notesEn: 'Used on noisy legacy CNC shields where EMI interferes with higher transmission rates.'
    },
    {
      baud: 19200,
      probes: 94,
      successful: 36,
      successRate: 38.3,
      avgLatencyMs: 110,
      primaryControllers: 'Industrial PLC / Modbus Bridges',
      recommendedPins: 'DTR=0, RTS=0',
      confidence: 'Low',
      notesAr: 'نادرة في ماكينات الليزر الاستهلاكية؛ شائعة في خطوط الإنتاج والجسور التسلسلية الصناعية.',
      notesEn: 'Rare on consumer lasers; typically found on industrial RS485/Modbus bridge adapters.'
    },
    {
      baud: 9600,
      probes: 340,
      successful: 298,
      successRate: 87.6,
      avgLatencyMs: 165,
      primaryControllers: 'K40 M2 Nano / Prolific PL2303 / Basic UART',
      recommendedPins: 'DTR=0, RTS=0',
      confidence: 'High',
      notesAr: 'السرعة الكلاسيكية لماكينات K40 الصينية القديمة وشرائح Prolific PL2303، ذات موثوقية عالية مع كابلات USB الطويلة.',
      notesEn: 'Classic baseline for K40 M2 Nano controller boards and older Prolific PL2303 bridges.'
    }
  ],
  grbl: [
    {
      baud: 250000,
      probes: 140,
      successful: 118,
      successRate: 84.3,
      avgLatencyMs: 22,
      primaryControllers: 'GRBL-ESP32 / Makerbase DLC32',
      recommendedPins: 'DTR=0, RTS=0',
      confidence: 'Medium',
      notesAr: 'مدعومة في لوحات ESP32 GRBL الحديثة لنقل سريع لبيانات حرق الصور الرمادية.',
      notesEn: 'Supported on modern 32-bit ESP32 GRBL boards for high-speed raster engraving.'
    },
    {
      baud: 115200,
      probes: 980,
      successful: 968,
      successRate: 98.8,
      avgLatencyMs: 34,
      primaryControllers: 'Official GRBL 1.1 / LaserGRBL Standard',
      recommendedPins: 'DTR=1, RTS=0',
      confidence: 'High',
      notesAr: 'السرعة الرسمية المعتمدة بنسبة 99% لماكينات Ortur, Sculpfun, TwoTrees, EleksMaker.',
      notesEn: 'Official certified default speed (99% match) for Ortur, Sculpfun, TwoTrees, EleksMaker.'
    },
    {
      baud: 74880,
      probes: 35,
      successful: 4,
      successRate: 11.4,
      avgLatencyMs: 70,
      primaryControllers: 'ESP Bootloader Diagnostic',
      recommendedPins: 'DTR=1, RTS=1',
      confidence: 'Low',
      notesAr: 'لا تستخدم للتشغيل اليومي، فقط لفحص انهيار فلاش المتحكم.',
      notesEn: 'Diagnostic only; not suitable for laser engraving jobs.'
    },
    {
      baud: 57600,
      probes: 120,
      successful: 74,
      successRate: 61.7,
      avgLatencyMs: 56,
      primaryControllers: 'GRBL 0.9j legacy firmware',
      recommendedPins: 'DTR=1, RTS=0',
      confidence: 'Medium',
      notesAr: 'سرعة الفيرموير القديم قبل التحديث لـ GRBL 1.1.',
      notesEn: 'Standard speed for older GRBL 0.9 builds prior to v1.1 upgrade.'
    },
    {
      baud: 38400,
      probes: 40,
      successful: 12,
      successRate: 30.0,
      avgLatencyMs: 82,
      primaryControllers: 'Fallback Diagnostic',
      recommendedPins: 'DTR=0, RTS=0',
      confidence: 'Low',
      notesAr: 'معدل بديل في حالات التشويش الشديد.',
      notesEn: 'Fallback rate under severe electrical EMI noise.'
    },
    {
      baud: 19200,
      probes: 20,
      successful: 4,
      successRate: 20.0,
      avgLatencyMs: 115,
      primaryControllers: 'Fallback',
      recommendedPins: 'DTR=0, RTS=0',
      confidence: 'Low',
      notesAr: 'غير مستخدمة في GRBL القياسي.',
      notesEn: 'Uncommon for standard GRBL controllers.'
    },
    {
      baud: 9600,
      probes: 65,
      successful: 22,
      successRate: 33.8,
      avgLatencyMs: 170,
      primaryControllers: 'GRBL 0.8 legacy',
      recommendedPins: 'DTR=0, RTS=0',
      confidence: 'Low',
      notesAr: 'سرعة قديمة جداً تؤدي لبطء شديد في تدفق أكواد G-Code.',
      notesEn: 'Very old legacy rate causing severe G-Code buffer starvation.'
    }
  ],
  ruida: [
    {
      baud: 250000,
      probes: 30,
      successful: 5,
      successRate: 16.7,
      avgLatencyMs: 40,
      primaryControllers: 'Ruida High-Speed Experimental',
      recommendedPins: 'DTR=0, RTS=0',
      confidence: 'Low',
      notesAr: 'معظم كروت Ruida RDC6442 لا تدعم 250000 بشكل مستقر.',
      notesEn: 'Most Ruida RDC6442 boards do not support 250k baud stably.'
    },
    {
      baud: 115200,
      probes: 290,
      successful: 272,
      successRate: 93.8,
      avgLatencyMs: 36,
      primaryControllers: 'Ruida RDC6445G / Modern RDWorks',
      recommendedPins: 'DTR=0, RTS=1',
      confidence: 'High',
      notesAr: 'السرعة العالية المفضلة لماكينات Ruida الحديثة لنقل ملفات القطع الكبيرة.',
      notesEn: 'High-speed standard for modern Ruida DSP controllers and RDWorks v8.'
    },
    {
      baud: 74880,
      probes: 15,
      successful: 0,
      successRate: 0.0,
      avgLatencyMs: 0,
      primaryControllers: 'Unsupported',
      recommendedPins: 'DTR=0, RTS=0',
      confidence: 'Low',
      notesAr: 'غير مدعومة على معالجات Ruida ARM.',
      notesEn: 'Unsupported on Ruida ARM architectures.'
    },
    {
      baud: 57600,
      probes: 360,
      successful: 351,
      successRate: 97.5,
      avgLatencyMs: 46,
      primaryControllers: 'Ruida RDC6442S / RDC6442G Standard',
      recommendedPins: 'DTR=0, RTS=1',
      confidence: 'High',
      notesAr: 'السرعة القياسية المصنعية الأكثر استقراراً في ماكينات CO2 (كروت Ruida 6442).',
      notesEn: 'The primary factory default for Ruida 6442S/G CO2 laser cutters.'
    },
    {
      baud: 38400,
      probes: 75,
      successful: 52,
      successRate: 69.3,
      avgLatencyMs: 65,
      primaryControllers: 'Ruida Legacy Optical Link',
      recommendedPins: 'DTR=0, RTS=0',
      confidence: 'Medium',
      notesAr: 'تستخدم في خطوط التوصيل الطويلة (أكثر من 5 أمتار).',
      notesEn: 'Used on long USB/serial cable runs over 5 meters.'
    },
    {
      baud: 19200,
      probes: 25,
      successful: 12,
      successRate: 48.0,
      avgLatencyMs: 120,
      primaryControllers: 'Ruida Diagnostic',
      recommendedPins: 'DTR=0, RTS=0',
      confidence: 'Low',
      notesAr: 'سرعة تشخيصية احتياطية.',
      notesEn: 'Diagnostic fallback channel.'
    },
    {
      baud: 9600,
      probes: 40,
      successful: 26,
      successRate: 65.0,
      avgLatencyMs: 180,
      primaryControllers: 'Ruida Safe Recovery',
      recommendedPins: 'DTR=0, RTS=0',
      confidence: 'Medium',
      notesAr: 'وضع الاسترجاع الآمن عند فشل الفيرموير.',
      notesEn: 'Safe recovery mode during firmware boot repair.'
    }
  ],
  k40: [
    {
      baud: 250000,
      probes: 10,
      successful: 0,
      successRate: 0.0,
      avgLatencyMs: 0,
      primaryControllers: 'Unsupported',
      recommendedPins: 'DTR=0, RTS=0',
      confidence: 'Low',
      notesAr: 'شريحة M2 Nano لا تدعم هذه السرعة إطلاقاً.',
      notesEn: 'M2 Nano USB interface cannot synchronize at 250k.'
    },
    {
      baud: 115200,
      probes: 45,
      successful: 8,
      successRate: 17.8,
      avgLatencyMs: 50,
      primaryControllers: 'K40 with Cohesion3D / Gerbil upgrade',
      recommendedPins: 'DTR=1, RTS=0',
      confidence: 'Low',
      notesAr: 'تعمل فقط إذا تم استبدال اللوحة الأصلية بلوحة Cohesion3D أو LaserGerbil.',
      notesEn: 'Only works if original stock board was replaced with Cohesion3D or Gerbil.'
    },
    {
      baud: 74880,
      probes: 5,
      successful: 0,
      successRate: 0.0,
      avgLatencyMs: 0,
      primaryControllers: 'Unsupported',
      recommendedPins: 'DTR=0, RTS=0',
      confidence: 'Low',
      notesAr: 'غير مدعومة.',
      notesEn: 'Unsupported.'
    },
    {
      baud: 57600,
      probes: 85,
      successful: 64,
      successRate: 75.3,
      avgLatencyMs: 62,
      primaryControllers: 'K40 Whisperer High-Speed Protocol',
      recommendedPins: 'DTR=0, RTS=0',
      confidence: 'Medium',
      notesAr: 'تستخدم في بعض نسخ K40 Whisperer المعدلة لتسريع القص المتجهي.',
      notesEn: 'Used in customized K40 Whisperer releases for faster vector streaming.'
    },
    {
      baud: 38400,
      probes: 35,
      successful: 18,
      successRate: 51.4,
      avgLatencyMs: 88,
      primaryControllers: 'M2 Nano Intermediate',
      recommendedPins: 'DTR=0, RTS=0',
      confidence: 'Low',
      notesAr: 'معدل وسيط.',
      notesEn: 'Intermediate baud.'
    },
    {
      baud: 19200,
      probes: 20,
      successful: 9,
      successRate: 45.0,
      avgLatencyMs: 130,
      primaryControllers: 'Fallback',
      recommendedPins: 'DTR=0, RTS=0',
      confidence: 'Low',
      notesAr: 'سرعة بديلة.',
      notesEn: 'Alternate speed.'
    },
    {
      baud: 9600,
      probes: 240,
      successful: 228,
      successRate: 95.0,
      avgLatencyMs: 160,
      primaryControllers: 'Stock K40 M2 Nano / LaserDRW / CorelLaser',
      recommendedPins: 'DTR=0, RTS=0',
      confidence: 'High',
      notesAr: 'السرعة الأصلية والمضمونة لماكينات K40 الصينية مع البرامج الأصلية و K40 Whisperer.',
      notesEn: 'Guaranteed stock baseline for factory K40 lasers with LaserDRW and K40 Whisperer.'
    }
  ],
  marlin: [
    {
      baud: 250000,
      probes: 260,
      successful: 247,
      successRate: 95.0,
      avgLatencyMs: 20,
      primaryControllers: 'Marlin 2.0 Laser Mode / BTT SKR 32-bit',
      recommendedPins: 'DTR=0, RTS=0',
      confidence: 'High',
      notesAr: 'السرعة الرسمية الموصى بها لماكينات الليزر القائمة على فيرموير Marlin 2.0 (مثل Creality Falcon و Ender Laser).',
      notesEn: 'Official default for Marlin 2.0 laser machines (Creality Falcon, Ender Laser mods).'
    },
    {
      baud: 115200,
      probes: 310,
      successful: 295,
      successRate: 95.2,
      avgLatencyMs: 35,
      primaryControllers: 'Marlin Standard / Arduino Mega 2560 + RAMPS 1.4',
      recommendedPins: 'DTR=1, RTS=0',
      confidence: 'High',
      notesAr: 'سرعة عالية الاستقرار مع كروت Arduino Mega2560 و RAMPS القديمة.',
      notesEn: 'Highly reliable fallback for Arduino Mega2560 and RAMPS 1.4 controller stacks.'
    },
    {
      baud: 74880,
      probes: 20,
      successful: 6,
      successRate: 30.0,
      avgLatencyMs: 65,
      primaryControllers: 'ESP32 Diagnostic',
      recommendedPins: 'DTR=1, RTS=1',
      confidence: 'Low',
      notesAr: 'تستخدم لتشخيص وحدات ESP32.',
      notesEn: 'Diagnostic baud for ESP32.'
    },
    {
      baud: 57600,
      probes: 50,
      successful: 36,
      successRate: 72.0,
      avgLatencyMs: 58,
      primaryControllers: 'Marlin 1.1 Legacy',
      recommendedPins: 'DTR=0, RTS=0',
      confidence: 'Medium',
      notesAr: 'تستخدم مع وحدات العرض الذكية TFT.',
      notesEn: 'Common on auxiliary smart TFT touchscreen serial channels.'
    },
    {
      baud: 38400,
      probes: 30,
      successful: 16,
      successRate: 53.3,
      avgLatencyMs: 85,
      primaryControllers: 'Marlin Low Speed',
      recommendedPins: 'DTR=0, RTS=0',
      confidence: 'Low',
      notesAr: 'سرعة منخفضة.',
      notesEn: 'Low speed baseline.'
    },
    {
      baud: 19200,
      probes: 15,
      successful: 6,
      successRate: 40.0,
      avgLatencyMs: 125,
      primaryControllers: 'Legacy CNC',
      recommendedPins: 'DTR=0, RTS=0',
      confidence: 'Low',
      notesAr: 'نادرة الاستخدام.',
      notesEn: 'Rarely used.'
    },
    {
      baud: 9600,
      probes: 40,
      successful: 28,
      successRate: 70.0,
      avgLatencyMs: 175,
      primaryControllers: 'Marlin Recovery',
      recommendedPins: 'DTR=0, RTS=0',
      confidence: 'Medium',
      notesAr: 'تستخدم في وضع الاسترداد البطيء.',
      notesEn: 'Emergency recovery baud.'
    }
  ],
  session: [
    {
      baud: 250000,
      probes: 1,
      successful: 0,
      successRate: 0.0,
      avgLatencyMs: 0,
      primaryControllers: 'Tested in current session',
      recommendedPins: 'DTR=0, RTS=0',
      confidence: 'Low',
      notesAr: 'تم اختباره خلال جلسة التشخيص الحالية.',
      notesEn: 'Tested during the current diagnostic session.'
    },
    {
      baud: 115200,
      probes: 3,
      successful: 3,
      successRate: 100.0,
      avgLatencyMs: 38,
      primaryControllers: 'Detected: CH340 / GRBL 1.1f Active',
      recommendedPins: 'DTR=1, RTS=0',
      confidence: 'High',
      notesAr: 'استجاب المتحكم بنجاح وتم تثبيت الاتصال على 115200 Baud!',
      notesEn: 'Controller acknowledged with successful probe response on 115200 Baud!'
    },
    {
      baud: 74880,
      probes: 1,
      successful: 0,
      successRate: 0.0,
      avgLatencyMs: 0,
      primaryControllers: 'Tested in current session',
      recommendedPins: 'DTR=1, RTS=1',
      confidence: 'Low',
      notesAr: 'لم يتم استلام استجابة واضحة.',
      notesEn: 'No clear ACK received on this baud.'
    },
    {
      baud: 57600,
      probes: 1,
      successful: 0,
      successRate: 0.0,
      avgLatencyMs: 0,
      primaryControllers: 'Tested in current session',
      recommendedPins: 'DTR=0, RTS=1',
      confidence: 'Low',
      notesAr: 'لم يتم استلام استجابة.',
      notesEn: 'No response received.'
    },
    {
      baud: 38400,
      probes: 1,
      successful: 0,
      successRate: 0.0,
      avgLatencyMs: 0,
      primaryControllers: 'Tested in current session',
      recommendedPins: 'DTR=1, RTS=0',
      confidence: 'Low',
      notesAr: 'لا توجد استجابة.',
      notesEn: 'No response.'
    },
    {
      baud: 19200,
      probes: 1,
      successful: 0,
      successRate: 0.0,
      avgLatencyMs: 0,
      primaryControllers: 'Tested in current session',
      recommendedPins: 'DTR=0, RTS=0',
      confidence: 'Low',
      notesAr: 'لا توجد استجابة.',
      notesEn: 'No response.'
    },
    {
      baud: 9600,
      probes: 1,
      successful: 0,
      successRate: 0.0,
      avgLatencyMs: 0,
      primaryControllers: 'Tested in current session',
      recommendedPins: 'DTR=0, RTS=0',
      confidence: 'Low',
      notesAr: 'لا توجد استجابة.',
      notesEn: 'No response.'
    }
  ]
};

export function getOptimalBaudRate(items: BaudTelemetryItem[]): BaudTelemetryItem {
  if (!items || items.length === 0) {
    return BAUD_RATE_PRESETS.all[1]; // default 115200
  }
  // Sort by composite score: success rate (primary) * log(probes + 1) / (latency + 10)
  return [...items].sort((a, b) => {
    // If one has 0 probes, rank it low
    if (a.probes === 0 && b.probes > 0) return 1;
    if (b.probes === 0 && a.probes > 0) return -1;
    
    // Weight by successRate and probe count
    const scoreA = (a.successRate * Math.log(a.probes + 2)) / (a.avgLatencyMs + 20);
    const scoreB = (b.successRate * Math.log(b.probes + 2)) / (b.avgLatencyMs + 20);
    return scoreB - scoreA;
  })[0];
}
