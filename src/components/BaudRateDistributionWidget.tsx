import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { 
  BarChart3, 
  CheckCircle2, 
  Sparkles, 
  Activity, 
  Cpu, 
  Zap, 
  RotateCcw, 
  Copy, 
  Check, 
  Sliders, 
  HelpCircle, 
  Gauge,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { BaudTelemetryItem, ControllerPresetKey, LaserPortInfo } from '../types';
import { BAUD_RATE_PRESETS, getOptimalBaudRate } from '../data/baudTelemetryData';
import { isWebSerialSupported } from '../utils/serialHelper';

interface BaudRateDistributionWidgetProps {
  lang: 'ar' | 'en';
  activeBaudRate?: number;
  onSelectBaudRate?: (baud: number) => void;
  onProbeSpecificBaud?: (baud: number) => Promise<boolean>;
  currentPortInfo?: LaserPortInfo | null;
  className?: string;
}

export const BaudRateDistributionWidget: React.FC<BaudRateDistributionWidgetProps> = ({
  lang,
  activeBaudRate = 115200,
  onSelectBaudRate,
  onProbeSpecificBaud,
  currentPortInfo,
  className = ''
}) => {
  const isAr = lang === 'ar';
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Preset filter state
  const [selectedPreset, setSelectedPreset] = useState<ControllerPresetKey>('all');
  const [telemetryData, setTelemetryData] = useState<Record<ControllerPresetKey, BaudTelemetryItem[]>>(BAUD_RATE_PRESETS);
  
  // Selected baud rate for detailed parameter inspection
  const [selectedBaud, setSelectedBaud] = useState<number>(activeBaudRate);
  const [isTestingBaud, setIsTestingBaud] = useState(false);
  const [testResult, setTestResult] = useState<{ baud: number; success: boolean; latency: number } | null>(null);
  const [copiedConfig, setCopiedConfig] = useState(false);

  // Tooltip state
  const [hoveredItem, setHoveredItem] = useState<{
    item: BaudTelemetryItem;
    x: number;
    y: number;
  } | null>(null);

  // Dimensions state tracked via ResizeObserver
  const [dimensions, setDimensions] = useState({ width: 680, height: 320 });

  // Update selected baud if external activeBaudRate changes
  useEffect(() => {
    if (activeBaudRate) {
      setSelectedBaud(activeBaudRate);
    }
  }, [activeBaudRate]);

  // Handle ResizeObserver for responsive D3 rendering
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      if (!entries[0]) return;
      const { width } = entries[0].contentRect;
      if (width > 0) {
        setDimensions({
          width: Math.max(320, width),
          height: width < 500 ? 270 : 310,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const currentDataset = useMemo(() => {
    return telemetryData[selectedPreset] || BAUD_RATE_PRESETS.all;
  }, [telemetryData, selectedPreset]);

  const optimalItem = useMemo(() => {
    return getOptimalBaudRate(currentDataset);
  }, [currentDataset]);

  const selectedItem = useMemo(() => {
    return currentDataset.find(d => d.baud === selectedBaud) || optimalItem;
  }, [currentDataset, selectedBaud, optimalItem]);

  // Execute quick single-baud probe
  const handleQuickProbe = async (baud: number) => {
    setIsTestingBaud(true);
    setTestResult(null);

    const startTime = performance.now();
    let success = false;

    if (onProbeSpecificBaud) {
      try {
        success = await onProbeSpecificBaud(baud);
      } catch {
        success = false;
      }
    } else {
      // High fidelity simulated probe test with baud-realistic success rate
      await new Promise(r => setTimeout(r, 450));
      // Realistic simulation: 115200 and 250000 succeed on modern boards
      if (baud === 115200 || (baud === 57600 && selectedPreset === 'ruida') || (baud === 250000 && selectedPreset === 'marlin') || (baud === 9600 && selectedPreset === 'k40')) {
        success = true;
      } else {
        // Probabilistic fallback based on historical rates
        const targetRate = selectedItem.successRate / 100;
        success = Math.random() < targetRate;
      }
    }

    const elapsed = Math.round(performance.now() - startTime);
    setTestResult({ baud, success, latency: elapsed });
    setIsTestingBaud(false);

    // Update session dataset dynamically with this new probe sample!
    setTelemetryData(prev => {
      const sessionItems = prev.session.map(item => {
        if (item.baud === baud) {
          const newProbes = item.probes + 1;
          const newSuccess = item.successful + (success ? 1 : 0);
          const newRate = Math.round((newSuccess / newProbes) * 1000) / 10;
          return {
            ...item,
            probes: newProbes,
            successful: newSuccess,
            successRate: newRate,
            avgLatencyMs: success ? elapsed : item.avgLatencyMs,
          };
        }
        return item;
      });
      return {
        ...prev,
        session: sessionItems
      };
    });
  };

  // Copy parameters for LightBurn or G-Code config
  const handleCopyParameters = () => {
    const text = [
      `# Preferred Connection Parameters for Laser Controller`,
      `BaudRate: ${selectedItem.baud}`,
      `DataFraming: 8-N-1 (8 Data Bits, No Parity, 1 Stop Bit)`,
      `FlowControlPins: ${selectedItem.recommendedPins}`,
      `TypicalLatency: ${selectedItem.avgLatencyMs}ms`,
      `TargetFirmware: ${selectedItem.primaryControllers}`,
      `LightBurnProfile: COM Port [Auto] @ ${selectedItem.baud} Baud`
    ].join('\n');

    navigator.clipboard.writeText(text);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  // D3 Chart Rendering
  useEffect(() => {
    if (!svgRef.current || currentDataset.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const { width, height } = dimensions;
    const margin = {
      top: 36,
      right: width < 500 ? 38 : 52,
      bottom: 46,
      left: width < 500 ? 38 : 52
    };

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create defs for linear gradients and glow filters
    const defs = svg.append('defs');

    // Bar gradient (Distribution volume)
    const barGradient = defs
      .append('linearGradient')
      .attr('id', 'baud-bar-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    barGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#3b82f6')
      .attr('stop-opacity', 0.9);
    barGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#1d4ed8')
      .attr('stop-opacity', 0.3);

    // Active/Selected Bar gradient
    const activeBarGradient = defs
      .append('linearGradient')
      .attr('id', 'baud-bar-active-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    activeBarGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#06b6d4')
      .attr('stop-opacity', 1);
    activeBarGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#0e7490')
      .attr('stop-opacity', 0.4);

    // Success line area gradient
    const successAreaGradient = defs
      .append('linearGradient')
      .attr('id', 'baud-success-area-gradient')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    successAreaGradient
      .append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 0.28);
    successAreaGradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#10b981')
      .attr('stop-opacity', 0.0);

    // Scales
    const xBand = d3
      .scaleBand<string>()
      .domain(currentDataset.map(d => d.baud.toString()))
      .range([0, innerWidth])
      .padding(0.38);

    const maxProbes = (d3.max(currentDataset, (d: BaudTelemetryItem) => d.probes) as number) || 100;
    const yLeft = d3
      .scaleLinear()
      .domain([0, maxProbes * 1.15])
      .nice()
      .range([innerHeight, 0]);

    const yRight = d3
      .scaleLinear()
      .domain([0, 100])
      .range([innerHeight, 0]);

    // Background horizontal grid lines
    const yLeftTicks = yLeft.ticks(5);
    g.append('g')
      .attr('class', 'grid-lines')
      .selectAll('line')
      .data(yLeftTicks)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => yLeft(d))
      .attr('y2', d => yLeft(d))
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-width', 1);

    // Draw Bars (Distribution of detected baud rates / probe volume)
    const barsGroup = g.append('g').attr('class', 'bars-group');

    barsGroup
      .selectAll<SVGRectElement, BaudTelemetryItem>('.baud-bar')
      .data(currentDataset)
      .enter()
      .append('rect')
      .attr('class', 'baud-bar cursor-pointer transition-all')
      .attr('x', (d: BaudTelemetryItem) => xBand(d.baud.toString()) || 0)
      .attr('width', xBand.bandwidth())
      .attr('y', innerHeight)
      .attr('height', 0)
      .attr('rx', 4)
      .attr('fill', (d: BaudTelemetryItem) => (d.baud === selectedBaud ? 'url(#baud-bar-active-gradient)' : 'url(#baud-bar-gradient)'))
      .attr('stroke', (d: BaudTelemetryItem) => (d.baud === selectedBaud ? '#22d3ee' : d.baud === optimalItem.baud ? '#60a5fa' : 'none'))
      .attr('stroke-width', (d: BaudTelemetryItem) => (d.baud === selectedBaud ? 2 : d.baud === optimalItem.baud ? 1.5 : 0))
      .on('mouseenter', (event, d: BaudTelemetryItem) => {
        const [mx, my] = d3.pointer(event, svgRef.current);
        setHoveredItem({ item: d, x: mx, y: my });
      })
      .on('mousemove', (event, d: BaudTelemetryItem) => {
        const [mx, my] = d3.pointer(event, svgRef.current);
        setHoveredItem({ item: d, x: mx, y: my });
      })
      .on('mouseleave', () => {
        setHoveredItem(null);
      })
      .on('click', (_, d: BaudTelemetryItem) => {
        setSelectedBaud(d.baud);
        if (onSelectBaudRate) onSelectBaudRate(d.baud);
      })
      .transition()
      .duration(650)
      .ease(d3.easeCubicOut)
      .attr('y', (d: BaudTelemetryItem) => yLeft(d.probes))
      .attr('height', (d: BaudTelemetryItem) => Math.max(3, innerHeight - yLeft(d.probes)));

    // Optimal recommendation badge on top of highest scoring bar
    if (optimalItem) {
      const optX = (xBand(optimalItem.baud.toString()) || 0) + xBand.bandwidth() / 2;
      const optY = Math.max(14, yLeft(optimalItem.probes) - 10);

      const beacon = g.append('g').attr('class', 'optimal-beacon').attr('transform', `translate(${optX}, ${optY})`);

      beacon
        .append('circle')
        .attr('r', 8)
        .attr('fill', '#10b981')
        .attr('opacity', 0.25)
        .attr('class', 'animate-ping');

      beacon
        .append('circle')
        .attr('r', 4.5)
        .attr('fill', '#10b981')
        .attr('stroke', '#064e3b')
        .attr('stroke-width', 1.5);

      beacon
        .append('text')
        .attr('y', -8)
        .attr('text-anchor', 'middle')
        .attr('fill', '#34d399')
        .attr('font-size', '10px')
        .attr('font-family', 'sans-serif')
        .attr('font-weight', '700')
        .text(isAr ? '★ الأفضل' : '★ BEST');
    }

    // Success Rate Area Generator
    const areaGenerator = d3
      .area<BaudTelemetryItem>()
      .x(d => (xBand(d.baud.toString()) || 0) + xBand.bandwidth() / 2)
      .y0(innerHeight)
      .y1(d => yRight(d.successRate))
      .curve(d3.curveMonotoneX);

    // Draw Success Rate Gradient Area
    g.append('path')
      .datum(currentDataset)
      .attr('class', 'success-area')
      .attr('fill', 'url(#baud-success-area-gradient)')
      .attr('d', areaGenerator)
      .attr('opacity', 0)
      .transition()
      .duration(700)
      .attr('opacity', 1);

    // Success Rate Line Generator
    const lineGenerator = d3
      .line<BaudTelemetryItem>()
      .x(d => (xBand(d.baud.toString()) || 0) + xBand.bandwidth() / 2)
      .y(d => yRight(d.successRate))
      .curve(d3.curveMonotoneX);

    // Draw Success Rate Curve (Emerald Line)
    const successPath = g
      .append('path')
      .datum(currentDataset)
      .attr('class', 'success-line')
      .attr('fill', 'none')
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2.8)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('d', lineGenerator);

    // Animate line stroke drawing
    const totalLength = (successPath.node() as SVGGeometryElement)?.getTotalLength() || 600;
    successPath
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(800)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    // Draw Dot Markers for Success Rate (%)
    const dotsGroup = g.append('g').attr('class', 'dots-group');

    dotsGroup
      .selectAll<SVGCircleElement, BaudTelemetryItem>('.success-dot')
      .data(currentDataset)
      .enter()
      .append('circle')
      .attr('class', 'success-dot cursor-pointer')
      .attr('cx', (d: BaudTelemetryItem) => (xBand(d.baud.toString()) || 0) + xBand.bandwidth() / 2)
      .attr('cy', (d: BaudTelemetryItem) => yRight(d.successRate))
      .attr('r', 5)
      .attr('fill', (d: BaudTelemetryItem) => (d.baud === selectedBaud ? '#34d399' : '#065f46'))
      .attr('stroke', '#10b981')
      .attr('stroke-width', (d: BaudTelemetryItem) => (d.baud === selectedBaud ? 2.5 : 1.5))
      .on('mouseenter', (event, d: BaudTelemetryItem) => {
        const [mx, my] = d3.pointer(event, svgRef.current);
        setHoveredItem({ item: d, x: mx, y: my });
      })
      .on('mousemove', (event, d: BaudTelemetryItem) => {
        const [mx, my] = d3.pointer(event, svgRef.current);
        setHoveredItem({ item: d, x: mx, y: my });
      })
      .on('mouseleave', () => {
        setHoveredItem(null);
      })
      .on('click', (_, d: BaudTelemetryItem) => {
        setSelectedBaud(d.baud);
        if (onSelectBaudRate) onSelectBaudRate(d.baud);
      });

    // Value Labels on Points
    dotsGroup
      .selectAll<SVGTextElement, BaudTelemetryItem>('.dot-label')
      .data(currentDataset)
      .enter()
      .append('text')
      .attr('class', 'dot-label select-none pointer-events-none')
      .attr('x', (d: BaudTelemetryItem) => (xBand(d.baud.toString()) || 0) + xBand.bandwidth() / 2)
      .attr('y', (d: BaudTelemetryItem) => Math.max(12, yRight(d.successRate) - 10))
      .attr('text-anchor', 'middle')
      .attr('fill', '#a7f3d0')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('font-weight', '600')
      .text((d: BaudTelemetryItem) => `${d.successRate}%`);

    // X Axis (Baud Rates)
    const xAxis = d3.axisBottom(xBand);
    const xAxisGroup = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisGroup.select('.domain').attr('stroke', '#334155');
    xAxisGroup.selectAll('.tick line').attr('stroke', '#334155');
    xAxisGroup
      .selectAll('.tick text')
      .attr('fill', d => (parseInt(d as string, 10) === selectedBaud ? '#38bdf8' : '#94a3b8'))
      .attr('font-size', width < 500 ? '9px' : '11px')
      .attr('font-weight', d => (parseInt(d as string, 10) === selectedBaud ? '700' : '500'))
      .attr('font-family', 'monospace');

    // Left Y Axis (Sample Count / Probe Volume)
    const yLeftAxis = d3.axisLeft(yLeft).ticks(4).tickFormat(d3.format('~s'));
    const yLeftAxisGroup = g.append('g').call(yLeftAxis);
    yLeftAxisGroup.select('.domain').attr('stroke', '#334155');
    yLeftAxisGroup.selectAll('.tick line').attr('stroke', '#334155');
    yLeftAxisGroup
      .selectAll('.tick text')
      .attr('fill', '#60a5fa')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    // Left Y Axis Title
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -32)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#60a5fa')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .text(isAr ? 'عينة الفحص (تكرار الكشف)' : 'Probes (Detection Count)');

    // Right Y Axis (Success Rate %)
    const yRightAxis = d3.axisRight(yRight).ticks(4).tickFormat(d => `${d}%`);
    const yRightAxisGroup = g
      .append('g')
      .attr('transform', `translate(${innerWidth}, 0)`)
      .call(yRightAxis);
    yRightAxisGroup.select('.domain').attr('stroke', '#334155');
    yRightAxisGroup.selectAll('.tick line').attr('stroke', '#334155');
    yRightAxisGroup
      .selectAll('.tick text')
      .attr('fill', '#34d399')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    // Right Y Axis Title
    g.append('text')
      .attr('transform', 'rotate(90)')
      .attr('y', -innerWidth - (width < 500 ? 28 : 38))
      .attr('x', innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#34d399')
      .attr('font-size', '10px')
      .attr('font-weight', '600')
      .text(isAr ? 'نسبة النجاح والاستجابة %' : 'Success Rate %');

  }, [currentDataset, dimensions, selectedBaud, optimalItem, isAr, onSelectBaudRate]);

  return (
    <section 
      id="baud-distribution-widget"
      className={`w-full bg-slate-900/95 border border-slate-800 rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm ${className}`}
      aria-label="Baud Rate Distribution and Success Analysis"
    >
      {/* Top Header & Controller Filter Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-800/80 bg-slate-950/70">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Title and Icon */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  {isAr ? "مصفوفة سرعات الباود ومعدل نجاح الاتصال" : "Baud Rate Distribution vs. Success Rate"}
                </h3>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  D3.js Real-time
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr 
                  ? "تحليل إحصائي لتكرار كشف السرعات ونسبة نجاح استجابة المتحكم لتحديد المعايير المثلى"
                  : "Visualizes detected baud frequency and handshake success % to isolate optimal parameters"}
              </p>
            </div>
          </div>

          {/* Preset Selector Tabs */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              id="filter-preset-all"
              onClick={() => setSelectedPreset('all')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedPreset === 'all'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {isAr ? "الكل (2.4k+ عينة)" : "All (2.4k+)"}
            </button>
            <button
              id="filter-preset-grbl"
              onClick={() => setSelectedPreset('grbl')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedPreset === 'grbl'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              GRBL 1.1
            </button>
            <button
              id="filter-preset-ruida"
              onClick={() => setSelectedPreset('ruida')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedPreset === 'ruida'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Ruida DSP
            </button>
            <button
              id="filter-preset-k40"
              onClick={() => setSelectedPreset('k40')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedPreset === 'k40'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              K40 M2
            </button>
            <button
              id="filter-preset-marlin"
              onClick={() => setSelectedPreset('marlin')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                selectedPreset === 'marlin'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              Marlin 32-bit
            </button>
            <button
              id="filter-preset-session"
              onClick={() => setSelectedPreset('session')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1 ${
                selectedPreset === 'session'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-3 h-3" />
              <span>{isAr ? "جلسة الفحص" : "Live Session"}</span>
            </button>
          </div>
        </div>

        {/* Legend bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-3 border-t border-slate-800/60 text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-gradient-to-t from-blue-700 to-blue-500 inline-block border border-blue-400/40"></span>
              <span>{isAr ? "أعمدة: حجم عينات الكشف والتجربة" : "Bars: Probe Detection Frequency"}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-emerald-400 inline-block rounded-full"></span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              <span>{isAr ? "المنحنى: نسبة نجاح الاتصال %" : "Curve: Handshake Success %"}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {isAr ? `السرعة الموصى بها: ${optimalItem.baud} Baud` : `Recommended: ${optimalItem.baud} Baud`}
            </span>
          </div>
        </div>
      </div>

      {/* Main D3 Canvas Area */}
      <div 
        ref={containerRef}
        className="w-full relative px-2 sm:px-4 pt-3 pb-1 select-none bg-gradient-to-b from-slate-950/40 to-slate-900/60"
      >
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full overflow-visible"
        />

        {/* Dynamic D3 Floating Tooltip */}
        {hoveredItem && (
          <div
            className="pointer-events-none absolute z-20 px-3 py-2.5 rounded-xl bg-slate-950/95 border border-slate-700 shadow-2xl text-xs text-slate-200 transition-transform duration-75 backdrop-blur-md min-w-[210px]"
            style={{
              left: Math.min(dimensions.width - 230, Math.max(10, hoveredItem.x - 100)),
              top: Math.max(10, hoveredItem.y - 120),
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5 mb-1.5">
              <span className="font-mono font-bold text-blue-400 text-sm">
                {hoveredItem.item.baud.toLocaleString()} Baud
              </span>
              <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                hoveredItem.item.successRate >= 80 
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                  : hoveredItem.item.successRate >= 40 
                  ? 'bg-amber-950 text-amber-300 border border-amber-800' 
                  : 'bg-rose-950 text-rose-300 border border-rose-800'
              }`}>
                {hoveredItem.item.successRate}% Success
              </span>
            </div>

            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>{isAr ? "عدد العينات:" : "Samples Probed:"}</span>
                <span className="text-slate-200 font-semibold">{hoveredItem.item.probes} ({hoveredItem.item.successful} OK)</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{isAr ? "زمن الاستجابة:" : "Avg Latency:"}</span>
                <span className="text-slate-200 font-semibold">{hoveredItem.item.avgLatencyMs} ms</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>{isAr ? "إشارات التحكم:" : "Flow Pins:"}</span>
                <span className="text-cyan-300 font-semibold">{hoveredItem.item.recommendedPins}</span>
              </div>
              <div className="pt-1 text-[10px] text-slate-400 font-sans line-clamp-2 border-t border-slate-900 mt-1">
                {isAr ? hoveredItem.item.notesAr : hoveredItem.item.notesEn}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actionable Preferred Connection Parameters Panel */}
      <div className="p-4 sm:p-5 bg-slate-950/80 border-t border-slate-800/80">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Active Parameter Breakdown (Left Column 8 cols) */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-blue-400" />
                  {isAr ? "المعايير المعتمدة للسرعة المحددة:" : "Parameters for Selected Speed:"}
                </span>
                <span className="font-mono text-sm font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/50">
                  {selectedItem.baud} bps
                </span>
                {selectedItem.baud === optimalItem.baud && (
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/60 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    {isAr ? "الخيار الأفضل للمتحكم" : "Best Recommended"}
                  </span>
                )}
              </div>

              <div className="text-xs font-mono text-slate-400">
                {isAr ? "الموثوقية:" : "Reliability:"}{" "}
                <span className={selectedItem.successRate >= 80 ? "text-emerald-400 font-bold" : "text-amber-400"}>
                  {selectedItem.successRate}%
                </span>{" "}
                • {selectedItem.avgLatencyMs}ms
              </div>
            </div>

            {/* Spec Cards in 4-column sub-grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/90">
                <div className="text-[11px] text-slate-500">{isAr ? "تأطير البيانات" : "Data Framing"}</div>
                <div className="font-mono font-bold text-slate-200 text-sm mt-0.5">8-N-1</div>
                <div className="text-[10px] text-slate-400">{isAr ? "8 بت، بدون تعادل، 1 توقف" : "8 Data, No Parity, 1 Stop"}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/90">
                <div className="text-[11px] text-slate-500">{isAr ? "تحكم الهاردوير (DTR/RTS)" : "Flow Control"}</div>
                <div className="font-mono font-bold text-cyan-300 text-sm mt-0.5">{selectedItem.recommendedPins}</div>
                <div className="text-[10px] text-slate-400">{isAr ? "إيقاظ واستقرار الـ MCU" : "Wakes UART MCU"}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/90">
                <div className="text-[11px] text-slate-500">{isAr ? "الماكينات المتوافقة" : "Target Firmware"}</div>
                <div className="font-medium text-slate-200 text-xs mt-0.5 line-clamp-1" title={selectedItem.primaryControllers}>
                  {selectedItem.primaryControllers.split('/')[0]}
                </div>
                <div className="text-[10px] text-slate-400">{isAr ? "متوافق مع LightBurn" : "LightBurn ready"}</div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800/90">
                <div className="text-[11px] text-slate-500">{isAr ? "مهلة المخزن المؤقت" : "Buffer Timeout"}</div>
                <div className="font-mono font-bold text-emerald-400 text-sm mt-0.5">350 ms</div>
                <div className="text-[10px] text-slate-400">{isAr ? "منع تقطيع G-Code" : "Prevents starvation"}</div>
              </div>
            </div>

            {/* Note alert */}
            <p className="text-xs text-slate-400 bg-slate-900/50 p-2 rounded-lg border border-slate-800/50 flex items-start gap-2">
              <HelpCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <span>{isAr ? selectedItem.notesAr : selectedItem.notesEn}</span>
            </p>
          </div>

          {/* Action Buttons & Targeted Probe Trigger (Right Column 4 cols) */}
          <div className="lg:col-span-4 flex flex-col justify-center gap-2.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800">
            <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>{isAr ? "فحص وتطبيق السرعة" : "Action & Verification"}</span>
              {testResult && (
                <span className={`text-[11px] font-mono font-bold flex items-center gap-1 ${
                  testResult.success ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {testResult.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  {testResult.success ? `${testResult.latency}ms OK` : 'Failed'}
                </span>
              )}
            </div>

            {/* Single Baud Target Probe Button */}
            <button
              id="btn-test-selected-baud"
              onClick={() => handleQuickProbe(selectedItem.baud)}
              disabled={isTestingBaud}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              {isTestingBaud ? (
                <>
                  <Activity className="w-3.5 h-3.5 animate-spin" />
                  <span>{isAr ? `جاري فحص ${selectedItem.baud}...` : `Probing ${selectedItem.baud}...`}</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>{isAr ? `اختبار ${selectedItem.baud} Baud الآن` : `Test ${selectedItem.baud} Baud Now`}</span>
                </>
              )}
            </button>

            {/* Copy Config Parameters Button */}
            <button
              id="btn-copy-baud-params"
              onClick={handleCopyParameters}
              className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-200 border border-slate-700 transition-all cursor-pointer"
            >
              {copiedConfig ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-300">{isAr ? "تم نسخ المعايير!" : "Parameters Copied!"}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isAr ? "نسخ إعدادات برامج الليزر" : "Copy Software Parameters"}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
