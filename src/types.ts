export type LogLevel = 'INFO' | 'SUCCESS' | 'WARN' | 'ERROR';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  step?: number;
}

export type ConnectionMode = 'webserial' | 'simulation';

export interface LaserPortInfo {
  portName: string;
  baudRate: number;
  usbVendorId?: number;
  usbProductId?: number;
  manufacturer?: string;
  status: 'disconnected' | 'probing' | 'connected' | 'error';
  firmware?: string;
  state?: string;
}

export interface StepStatus {
  step: number;
  titleAr: string;
  titleEn: string;
  status: 'pending' | 'running' | 'completed' | 'warning' | 'error';
  detailsAr?: string;
  detailsEn?: string;
}

export interface BaudTelemetryItem {
  baud: number;
  probes: number;
  successful: number;
  successRate: number; // 0 - 100
  avgLatencyMs: number;
  primaryControllers: string;
  recommendedPins: string;
  confidence: 'High' | 'Medium' | 'Low';
  notesAr: string;
  notesEn: string;
}

export type ControllerPresetKey = 'all' | 'grbl' | 'ruida' | 'k40' | 'marlin' | 'session';

