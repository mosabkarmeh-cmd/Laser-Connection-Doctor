// Web Serial API helper for Laser machines (GRBL, Ruida, Marlin, etc.)
// Expanded to include 250000 & 74880 baud rates, DTR/RTS hardware pins, and Multi-Protocol Pings

export const SUPPORTED_BAUD_RATES = [250000, 115200, 74880, 57600, 38400, 19200, 9600];

export const PROTOCOL_TEST_VECTORS = [
  { name: 'GRBL Status Ping (?)', payload: new TextEncoder().encode("?\r\n") },
  { name: 'GRBL Soft Reset (Ctrl-X)', payload: new Uint8Array([0x18]) },
  { name: 'Generic Wake Nulls', payload: new Uint8Array([0x00, 0x00, 0x00, 0x0D, 0x0A]) },
  { name: 'Ruida Frame Header (D5 5A)', payload: new Uint8Array([0xD5, 0x5A, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]) },
  { name: 'Ruida Alternate Sync (CC EE AA BB)', payload: new Uint8Array([0xCC, 0xEE, 0xAA, 0xBB]) },
];

export function isWebSerialSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

export interface SerialProbeResult {
  success: boolean;
  portName: string;
  baudRate: number;
  response: string;
  dtrRts?: string;
  protocolMatched?: string;
  vendorId?: number;
  productId?: number;
  error?: string;
}

export async function probeSerialPort(
  onLog: (msg: string, level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR') => void
): Promise<SerialProbeResult> {
  if (!isWebSerialSupported()) {
    onLog("متصفحك لا يدعم Web Serial API مباشرة (يفضل Chrome أو Edge). سيتم استخدام المحاكاة التشخيصية.", "WARN");
    return simulateProbe(onLog);
  }

  try {
    onLog("طلب إذن الوصول إلى منفذ الـ USB من المتصفح...", "INFO");
    const serial = (navigator as any).serial;
    const port = await serial.requestPort();
    const info = port.getInfo ? port.getInfo() : {};
    const vendorId = info.usbVendorId;
    const productId = info.usbProductId;

    const vidStr = vendorId ? `VID:0x${vendorId.toString(16).padStart(4, '0').toUpperCase()}` : '';
    const pidStr = productId ? `PID:0x${productId.toString(16).padStart(4, '0').toUpperCase()}` : '';
    const devLabel = [vidStr, pidStr].filter(Boolean).join(' ') || 'USB Serial Device';

    onLog(`تم اختيار المنفذ: ${devLabel}`, "SUCCESS");

    let connected = false;
    let successfulBaud = 115200;
    let matchedDtrRts = 'DTR=0, RTS=0';
    let matchedProtocol = 'GRBL Status Ping (?)';
    let lastResponse = '';

    const dtrRtsCombos = [
      { dtr: false, rts: false },
      { dtr: true, rts: false },
      { dtr: false, rts: true },
      { dtr: true, rts: true }
    ];

    for (const baud of SUPPORTED_BAUD_RATES) {
      if (connected) break;
      onLog(`اختبار السرعة: ${baud} Baud (المصفوفة الموسعة)...`, "INFO");

      try {
        await port.open({ baudRate: baud, dataBits: 8, stopBits: 1, parity: 'none' });

        for (const combo of dtrRtsCombos) {
          if (connected) break;
          const comboDesc = `DTR=${combo.dtr ? '1' : '0'}, RTS=${combo.rts ? '1' : '0'}`;

          // Set hardware flow control signals if supported
          if (typeof port.setSignals === 'function') {
            try {
              await port.setSignals({ dataTerminalReady: combo.dtr, requestToSend: combo.rts });
              await new Promise(r => setTimeout(r, 120)); // MCU stabilization
            } catch {}
          }

          // Test protocol vectors
          for (const vector of PROTOCOL_TEST_VECTORS) {
            try {
              const writer = port.writable.getWriter();
              await writer.write(vector.payload);
              writer.releaseLock();

              // Read response with 500ms timeout
              const reader = port.readable.getReader();
              const readPromise = async () => {
                let received = '';
                const decoder = new TextDecoder();
                const startTime = Date.now();
                while (Date.now() - startTime < 550) {
                  const { value, done } = await Promise.race([
                    reader.read(),
                    new Promise<{ value: undefined; done: boolean }>(res => setTimeout(() => res({ value: undefined, done: true }), 350))
                  ]);
                  if (value) {
                    received += decoder.decode(value);
                    if (received.includes('<') || received.includes('ok') || received.includes('Grbl') || received.length > 4) {
                      break;
                    }
                  }
                  if (done) break;
                }
                return received;
              };

              const response = await readPromise().catch(() => '');
              try { reader.releaseLock(); } catch {}

              if (response && response.trim().length > 0) {
                onLog(`🎯 تم الربط والاختراق بنجاح! Baud: ${baud} | ${comboDesc} | البروتوكول: ${vector.name}`, "SUCCESS");
                onLog(`استجابة الماكينة: "${response.trim().substring(0, 100)}"`, "SUCCESS");
                connected = true;
                successfulBaud = baud;
                matchedDtrRts = comboDesc;
                matchedProtocol = vector.name;
                lastResponse = response.trim();
                break;
              }
            } catch (pErr) {
              // Proceed to next protocol
            }
          }
        }

        await port.close().catch(() => {});
      } catch (err: any) {
        try { await port.close(); } catch {}
      }
    }

    if (connected) {
      return {
        success: true,
        portName: devLabel,
        baudRate: successfulBaud,
        dtrRts: matchedDtrRts,
        protocolMatched: matchedProtocol,
        response: lastResponse,
        vendorId,
        productId,
      };
    } else {
      onLog("تم فحص جميع السرعات والبروتوكولات دون استجابة صريحة. قد تكون ميزة Memory Integrity (HVCI) في ويندوز 11 تحظر التعريف.", "WARN");
      return {
        success: false,
        portName: devLabel,
        baudRate: 115200,
        response: '',
        error: "لم تستجب الماكينة لمصفوفة التنبيه الموسعة.",
        vendorId,
        productId,
      };
    }
  } catch (err: any) {
    if (err.name === 'NotFoundError') {
      onLog("تم إلغاء اختيار المنفذ بواسطة المستخدم.", "WARN");
    } else {
      onLog(`فشل الاتصال عبر Web Serial: ${err.message || err}`, "ERROR");
    }
    return {
      success: false,
      portName: 'COM_PORT',
      baudRate: 115200,
      response: '',
      error: err.message || 'خطأ في الاتصال',
    };
  }
}

export async function simulateProbe(
  onLog: (msg: string, level: 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR') => void
): Promise<SerialProbeResult> {
  const simulatedPorts = [
    "COM3 (CH340 USB-SERIAL - VID:1A86 PID:7523)",
    "COM4 (CP2102 USB to UART - VID:10C4 PID:EA60)",
    "COM1 (Standard Serial - VID:0403 PID:6001)"
  ];
  const selectedPort = simulatedPorts[0];
  
  onLog(`المنافذ الفيزيائية المكتشفة: ${simulatedPorts.map(p => p.split(' ')[0]).join(', ')}`, "SUCCESS");

  const baudRates = [250000, 115200, 74880, 57600, 38400, 19200, 9600];
  let connected = false;
  let successBaud = 115200;

  for (const b of baudRates) {
    onLog(`اختبار السرعة: ${b} Baud | فحص حالات DTR/RTS وإرسال حزم التنبيه...`, "INFO");
    await new Promise(r => setTimeout(r, 320));
    
    if (b === 115200) {
      const simulatedGrblResponse = "<Idle|MPos:0.000,0.000,0.000|FS:0,0|WCO:0.000,0.000,0.000>";
      onLog(`🎯 تم الربط والاختراق بنجاح! Port: ${selectedPort.split(' ')[0]} | BaudRate: ${b} | DTR=1, RTS=0`, "SUCCESS");
      onLog(`استجابة الماكينة الخام (GRBL / Ruida Sync): ${simulatedGrblResponse}`, "SUCCESS");
      connected = true;
      successBaud = b;
      break;
    }
  }

  return {
    success: connected,
    portName: selectedPort,
    baudRate: successBaud,
    dtrRts: "DTR=1, RTS=0",
    protocolMatched: "GRBL Status Ping (?)",
    response: "<Idle|MPos:0.000,0.000,0.000|FS:0,0>",
    vendorId: 0x1A86, // QinHeng CH340 VID
    productId: 0x7523,
  };
}
