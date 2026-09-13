import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { Activity, ArrowDownLeft, ArrowUpRight, Cpu, Radio, Zap, Sparkles } from 'lucide-react';
import { LogEntry } from '../types';

interface SignalActivityIndicatorProps {
  isRunning: boolean;
  currentStep: number;
  logs: LogEntry[];
  baudRate?: number;
  portName?: string | null;
  lang: 'ar' | 'en';
}

interface WavePoint {
  time: number;
  txLevel: number; // 0 or 1
  rxLevel: number; // 0 or 1
}

interface PacketEvent {
  id: string;
  type: 'TX' | 'RX';
  label: string;
  payload: string;
  timestamp: number;
  baud: number;
}

export const SerialSignalActivityIndicator: React.FC<SignalActivityIndicatorProps> = ({
  isRunning,
  currentStep,
  logs,
  baudRate = 115200,
  portName,
  lang
}) => {
  const isAr = lang === 'ar';
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [activeTab, setActiveTab] = useState<'logic' | 'packets'>('logic');
  const [txActive, setTxActive] = useState(false);
  const [rxActive, setRxActive] = useState(false);
  const [txCount, setTxCount] = useState(0);
  const [rxCount, setRxCount] = useState(0);
  const [dtrState, setDtrState] = useState(true);
  const [rtsState, setRtsState] = useState(false);
  const [currentPayload, setCurrentPayload] = useState<string>('IDLE');
  const [lastRxSample, setLastRxSample] = useState<string>('No data latched');
  const [activeBaud, setActiveBaud] = useState<number>(baudRate);

  // Buffer of wave points for D3 timeline
  const waveDataRef = useRef<WavePoint[]>([]);
  const packetEventsRef = useRef<PacketEvent[]>([]);
  const [packetEvents, setPacketEvents] = useState<PacketEvent[]>([]);

  // Initialize waveform buffer with 80 baseline idle points
  useEffect(() => {
    const initial: WavePoint[] = [];
    const now = Date.now();
    for (let i = 80; i >= 0; i--) {
      initial.push({
        time: now - i * 50,
        txLevel: 1, // Standard TTL idle is HIGH (Mark state)
        rxLevel: 1,
      });
    }
    waveDataRef.current = initial;
  }, []);

  // Monitor logs to detect live TX / RX and baud changes
  useEffect(() => {
    if (logs.length === 0) return;
    const lastLog = logs[logs.length - 1];
    const text = lastLog.message;

    // Detect Baud Rate mentions
    const baudMatch = text.match(/(\b250000\b|\b115200\b|\b74880\b|\b57600\b|\b38400\b|\b19200\b|\b9600\b)/);
    if (baudMatch) {
      setActiveBaud(parseInt(baudMatch[0], 10));
    }

    // Detect DTR / RTS state shifts
    if (text.includes('DTR=1')) setDtrState(true);
    if (text.includes('DTR=0')) setDtrState(false);
    if (text.includes('RTS=1')) setRtsState(true);
    if (text.includes('RTS=0')) setRtsState(false);

    // Detect TX events (dispatched payloads)
    if (
      text.includes('?') ||
      text.includes('0x18') ||
      text.includes('D5 5A') ||
      text.includes('M115') ||
      text.includes('حزم التنبيه') ||
      text.includes('payload') ||
      text.includes('ping') ||
      text.includes('Dispatched')
    ) {
      setTxActive(true);
      setTxCount((prev) => prev + 1);
      
      let payloadLabel = 'CMD: ?\\r\\n';
      if (text.includes('0x18') || text.includes('Soft Reset')) payloadLabel = 'HEX: 0x18 (Ctrl-X)';
      else if (text.includes('D5 5A')) payloadLabel = 'HEX: D5 5A (Ruida)';
      else if (text.includes('M115')) payloadLabel = 'ASCII: M115';
      else if (text.includes('Nulls')) payloadLabel = 'HEX: 00 00 00';
      setCurrentPayload(payloadLabel);

      // Add to packet history
      const newPkt: PacketEvent = {
        id: Math.random().toString(),
        type: 'TX',
        label: payloadLabel,
        payload: payloadLabel,
        timestamp: Date.now(),
        baud: activeBaud,
      };
      packetEventsRef.current = [newPkt, ...packetEventsRef.current.slice(0, 14)];
      setPacketEvents([...packetEventsRef.current]);

      setTimeout(() => setTxActive(false), 260);
    }

    // Detect RX events (received data from machine)
    if (
      text.includes('استجابة') ||
      text.includes('response') ||
      text.includes('Idle') ||
      text.includes('latched') ||
      text.includes('اختراق') ||
      text.includes('ok') ||
      text.includes('Grbl')
    ) {
      setRxActive(true);
      setRxCount((prev) => prev + 1);

      const preview = text.slice(0, 45);
      setLastRxSample(preview);

      const newPkt: PacketEvent = {
        id: Math.random().toString(),
        type: 'RX',
        label: 'RESPONSE',
        payload: preview,
        timestamp: Date.now(),
        baud: activeBaud,
      };
      packetEventsRef.current = [newPkt, ...packetEventsRef.current.slice(0, 14)];
      setPacketEvents([...packetEventsRef.current]);

      setTimeout(() => setRxActive(false), 300);
    }
  }, [logs, activeBaud]);

  // Real-time animation loop feeding waveform data during execution
  useEffect(() => {
    let animationFrameId: number;
    let lastTick = Date.now();

    const updateWaveform = () => {
      const now = Date.now();
      if (now - lastTick > 40) {
        lastTick = now;

        // In standard UART, idle line state is MARK (Logic 1, 3.3V/5V)
        // Data bits pulse down to SPACE (Logic 0)
        let txVal = 1;
        let rxVal = 1;

        if (isRunning || txActive || rxActive) {
          if (txActive || (isRunning && (currentStep === 3 || currentStep === 4) && Math.random() > 0.45)) {
            txVal = Math.random() > 0.4 ? 0 : 1;
          }
          if (rxActive || (isRunning && currentStep === 4 && Math.random() > 0.6)) {
            rxVal = Math.random() > 0.35 ? 0 : 1;
          }
        }

        waveDataRef.current.push({
          time: now,
          txLevel: txVal,
          rxLevel: rxVal,
        });

        if (waveDataRef.current.length > 70) {
          waveDataRef.current.shift();
        }

        renderD3Waveform();
      }

      animationFrameId = requestAnimationFrame(updateWaveform);
    };

    animationFrameId = requestAnimationFrame(updateWaveform);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isRunning, currentStep, txActive, rxActive]);

  // Main D3 Rendering Function
  const renderD3Waveform = () => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    const width = containerRef.current.clientWidth || 640;
    const height = 110;

    svg.attr('width', width).attr('height', height);

    const margin = { top: 12, right: 18, bottom: 22, left: 44 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg.selectAll('*').remove();

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const data = waveDataRef.current;
    if (data.length < 2) return;

    const minTime = data[0]?.time ?? 0;
    const maxTime = data[data.length - 1]?.time ?? 1;

    // X Scale: Time window
    const xScale = d3
      .scaleLinear()
      .domain([minTime, maxTime])
      .range([0, innerWidth]);

    // Split vertical space for TX (top track) and RX (bottom track)
    const trackHeight = innerHeight / 2 - 6;

    // Y Scales for logic levels (0 = Low, 1 = High Mark)
    const yTx = d3
      .scaleLinear()
      .domain([0, 1])
      .range([trackHeight, 4]);

    const yRx = d3
      .scaleLinear()
      .domain([0, 1])
      .range([innerHeight, trackHeight + 12]);

    // Grid lines
    const xTicks = xScale.ticks(6);
    g.selectAll('.grid-line-x')
      .data(xTicks)
      .enter()
      .append('line')
      .attr('x1', (d) => xScale(d))
      .attr('x2', (d) => xScale(d))
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '2,4')
      .attr('stroke-width', 1);

    // Channel baseline divider
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', innerHeight / 2)
      .attr('y2', innerHeight / 2)
      .attr('stroke', '#334155')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '4,4');

    // D3 Line Generator with Step-After curve (Classic Logic Analyzer look)
    const txLine = d3
      .line<WavePoint>()
      .x((d) => xScale(d.time))
      .y((d) => yTx(d.txLevel))
      .curve(d3.curveStepAfter);

    const rxLine = d3
      .line<WavePoint>()
      .x((d) => xScale(d.time))
      .y((d) => yRx(d.rxLevel))
      .curve(d3.curveStepAfter);

    // TX Area glow
    const txArea = d3
      .area<WavePoint>()
      .x((d) => xScale(d.time))
      .y0(trackHeight)
      .y1((d) => yTx(d.txLevel))
      .curve(d3.curveStepAfter);

    // RX Area glow
    const rxArea = d3
      .area<WavePoint>()
      .x((d) => xScale(d.time))
      .y0(innerHeight)
      .y1((d) => yRx(d.rxLevel))
      .curve(d3.curveStepAfter);

    // Add TX glow area
    g.append('path')
      .datum(data)
      .attr('d', txArea)
      .attr('fill', 'rgba(56, 189, 248, 0.08)');

    // Add TX line
    g.append('path')
      .datum(data)
      .attr('d', txLine)
      .attr('fill', 'none')
      .attr('stroke', txActive ? '#38bdf8' : '#0284c7')
      .attr('stroke-width', txActive ? 2.5 : 1.75)
      .attr('stroke-linecap', 'square')
      .style('filter', txActive ? 'drop-shadow(0 0 5px rgba(56, 189, 248, 0.8))' : 'none');

    // Add RX glow area
    g.append('path')
      .datum(data)
      .attr('d', rxArea)
      .attr('fill', 'rgba(52, 211, 153, 0.08)');

    // Add RX line
    g.append('path')
      .datum(data)
      .attr('d', rxLine)
      .attr('fill', 'none')
      .attr('stroke', rxActive ? '#34d399' : '#059669')
      .attr('stroke-width', rxActive ? 2.5 : 1.75)
      .attr('stroke-linecap', 'square')
      .style('filter', rxActive ? 'drop-shadow(0 0 5px rgba(52, 211, 153, 0.8))' : 'none');

    // Active cursor line on right edge
    g.append('line')
      .attr('x1', innerWidth)
      .attr('x2', innerWidth)
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .attr('stroke', isRunning ? '#60a5fa' : '#475569')
      .attr('stroke-width', 2);

    // Pulse dot at TX head
    const lastPt = data[data.length - 1];
    if (lastPt) {
      g.append('circle')
        .attr('cx', xScale(lastPt.time))
        .attr('cy', yTx(lastPt.txLevel))
        .attr('r', txActive ? 4 : 2.5)
        .attr('fill', '#38bdf8')
        .style('filter', 'drop-shadow(0 0 6px #38bdf8)');

      g.append('circle')
        .attr('cx', xScale(lastPt.time))
        .attr('cy', yRx(lastPt.rxLevel))
        .attr('r', rxActive ? 4 : 2.5)
        .attr('fill', '#34d399')
        .style('filter', 'drop-shadow(0 0 6px #34d399)');
    }

    // Channel Y-Axis Labels
    svg
      .append('text')
      .attr('x', 6)
      .attr('y', margin.top + 10)
      .attr('fill', '#38bdf8')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .text('TX');

    svg
      .append('text')
      .attr('x', 6)
      .attr('y', margin.top + innerHeight - 6)
      .attr('fill', '#34d399')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('font-family', 'monospace')
      .text('RX');
  };

  return (
    <div
      ref={containerRef}
      id="serial-signal-activity-indicator"
      className="w-full bg-slate-950/90 rounded-xl border border-slate-800/90 p-3 sm:p-4 mb-4 shadow-xl backdrop-blur-md overflow-hidden"
    >
      {/* Top Telemetry Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Radio className={`w-4 h-4 ${isRunning ? 'animate-pulse text-cyan-400' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-200">
                {isAr ? "محلل الإشارة التسلسلية الحية (Serial Logic D3)" : "Real-Time Serial Signal Analyzer"}
              </span>
              <span className="px-1.5 py-0.2 font-mono text-[10px] bg-slate-800 text-cyan-300 rounded border border-slate-700">
                UART TTL
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              {portName ? `${portName} @ ` : ''}{activeBaud} Baud | 8-N-1
            </p>
          </div>
        </div>

        {/* Pin States and LED Indicators */}
        <div className="flex items-center gap-3">
          {/* Hardware Flow Control Pins */}
          <div className="flex items-center gap-1 font-mono text-[11px] bg-slate-900 px-2 py-1 rounded-md border border-slate-800">
            <span className="text-slate-400 text-[10px]">PINS:</span>
            <span
              className={`px-1.5 py-0.5 rounded font-bold ${
                dtrState ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' : 'bg-slate-800 text-slate-500'
              }`}
            >
              DTR:{dtrState ? '1' : '0'}
            </span>
            <span
              className={`px-1.5 py-0.5 rounded font-bold ${
                rtsState ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'
              }`}
            >
              RTS:{rtsState ? '1' : '0'}
            </span>
          </div>

          {/* TX LED */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800">
            <span
              className={`w-2.5 h-2.5 rounded-full transition-all duration-150 ${
                txActive
                  ? 'bg-cyan-400 shadow-[0_0_10px_#38bdf8] scale-125'
                  : isRunning
                  ? 'bg-cyan-900'
                  : 'bg-slate-700'
              }`}
            />
            <span className="font-mono text-cyan-400 font-semibold">TX</span>
            <span className="font-mono text-[10px] text-slate-400">({txCount})</span>
          </div>

          {/* RX LED */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-md border border-slate-800">
            <span
              className={`w-2.5 h-2.5 rounded-full transition-all duration-150 ${
                rxActive
                  ? 'bg-emerald-400 shadow-[0_0_10px_#34d399] scale-125'
                  : isRunning
                  ? 'bg-emerald-950'
                  : 'bg-slate-700'
              }`}
            />
            <span className="font-mono text-emerald-400 font-semibold">RX</span>
            <span className="font-mono text-[10px] text-slate-400">({rxCount})</span>
          </div>

          {/* View Tab Switcher */}
          <div className="flex rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-[11px]">
            <button
              onClick={() => setActiveTab('logic')}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                activeTab === 'logic' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isAr ? "رسم النبضات" : "Waveform"}
            </button>
            <button
              onClick={() => setActiveTab('packets')}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                activeTab === 'packets' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {isAr ? "حزم البيانات" : "Packets"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Display Body */}
      {activeTab === 'logic' ? (
        <div className="relative rounded-lg bg-slate-950 border border-slate-800/80 overflow-hidden">
          {/* D3 SVG Canvas */}
          <svg ref={svgRef} className="w-full block" />

          {/* Floating Live Signal Info */}
          <div className="absolute bottom-1 right-2 flex items-center gap-3 text-[10px] font-mono text-slate-400 pointer-events-none bg-slate-950/70 px-2 py-0.5 rounded backdrop-blur-sm border border-slate-800/40">
            <span className="flex items-center gap-1 text-cyan-300">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
              {currentPayload}
            </span>
            <span className="text-slate-600">|</span>
            <span className="flex items-center gap-1 text-emerald-300 truncate max-w-[200px]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              {lastRxSample}
            </span>
          </div>
        </div>
      ) : (
        /* Packet Stream View */
        <div className="rounded-lg bg-slate-950 border border-slate-800/80 p-2 max-h-[110px] overflow-y-auto space-y-1 font-mono text-[11px]">
          {packetEvents.length === 0 ? (
            <div className="text-center py-4 text-slate-500 text-xs">
              {isAr ? "في انتظار بدء دورة فحص ومصافحة الليزر..." : "Awaiting serial handshake cycle..."}
            </div>
          ) : (
            packetEvents.map((pkt) => (
              <div
                key={pkt.id}
                className={`flex items-center justify-between px-2 py-1 rounded border ${
                  pkt.type === 'TX'
                    ? 'bg-cyan-950/20 border-cyan-800/40 text-cyan-300'
                    : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                      pkt.type === 'TX' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-emerald-500/20 text-emerald-400'
                    }`}
                  >
                    {pkt.type}
                  </span>
                  <span className="font-semibold text-slate-200">{pkt.label}</span>
                  <span className="text-slate-400 text-[10px] truncate max-w-[260px]">{pkt.payload}</span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-slate-500 shrink-0">
                  <span>{pkt.baud} baud</span>
                  <span>{new Date(pkt.timestamp).toLocaleTimeString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Footer Details */}
      <div className="flex items-center justify-between pt-2 text-[10px] font-mono text-slate-500">
        <span className="flex items-center gap-1">
          <Zap className="w-3 h-3 text-amber-400" />
          <span>{isAr ? "مستوى الفولتية المنطقية: 3.3V / 5.0V TTL Logic" : "Signal Standard: 3.3V / 5.0V TTL (Mark/Space)"}</span>
        </span>
        <span>
          {isAr
            ? "اختبار المصفوفة: 250000 / 115200 / 74880 / 57600 / 38400 / 19200 / 9600"
            : "Baud Matrix: 250K / 115.2K / 74.8K / 57.6K / 38.4K / 19.2K / 9.6K"}
        </span>
      </div>
    </div>
  );
};
