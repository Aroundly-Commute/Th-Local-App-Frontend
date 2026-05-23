import { Platform } from 'react-native';

export type LogLevel = 'info' | 'warn' | 'error';

export type LogEntry = {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
};

type LogListener = (logs: LogEntry[]) => void;

class InAppLogger {
  private logs: LogEntry[] = [];
  private listeners: Set<LogListener> = new Set();
  private maxLogs = 500;

  private originalLog = console.log;
  private originalWarn = console.warn;
  private originalError = console.error;

  init() {
    // Prevent double initialization
    if ((console as any).__inAppLoggerActive) return;
    (console as any).__inAppLoggerActive = true;

    console.log = (...args: any[]) => {
      this.originalLog.apply(console, args);
      this.addEntry('info', args);
    };

    console.warn = (...args: any[]) => {
      this.originalWarn.apply(console, args);
      this.addEntry('warn', args);
    };

    console.error = (...args: any[]) => {
      this.originalError.apply(console, args);
      this.addEntry('error', args);
    };

    this.logSystemInfo();
  }

  private logSystemInfo() {
    console.log(`[SYSTEM] OS: ${Platform.OS} (v${Platform.Version})`);
    console.log(`[SYSTEM] EXPO_PUBLIC_BACKEND_URL: ${process.env.EXPO_PUBLIC_BACKEND_URL}`);
  }

  private addEntry(level: LogLevel, args: any[]) {
    const message = args
      .map((arg) => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch {
            return String(arg);
          }
        }
        return String(arg);
      })
      .join(' ');

    const entry: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      level,
      message,
    };

    this.logs.unshift(entry); // Newest first

    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    this.notify();
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clear() {
    this.logs = [];
    this.logSystemInfo();
    this.notify();
  }

  subscribe(listener: LogListener): () => void {
    this.listeners.add(listener);
    listener([...this.logs]);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener([...this.logs]));
  }
}

export const inAppLogger = new InAppLogger();
inAppLogger.init();
