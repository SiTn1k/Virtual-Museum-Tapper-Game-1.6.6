/**
 * Supabase Edge Functions — Structured Logger
 * Production-ready logging for Deno edge functions
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

interface LoggerConfig {
  minLevel: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  remoteEndpoint?: string;
  functionName: string;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LOG_PREFIXES: Record<LogLevel, string> = {
  debug: '[DEBUG]',
  info: '[INFO]',
  warn: '[WARN]',
  error: '[ERROR]',
};

const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: 'info',
  enableConsole: true,
  enableRemote: false, // Disabled by default, enable via env var
  functionName: 'unknown',
};

class EdgeLogger {
  private config: LoggerConfig;
  private remoteQueue: LogEntry[] = [];

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private createEntry(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): LogEntry {
    return {
      timestamp: this.formatTimestamp(),
      level,
      message: `[${this.config.functionName}] ${message}`,
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    };
  }

  private output(entry: LogEntry): void {
    if (!this.config.enableConsole) return;

    const prefix = LOG_PREFIXES[entry.level];
    const timestamp = entry.timestamp;
    
    const parts = [`${timestamp} ${prefix} ${entry.message}`];
    
    if (entry.context && Object.keys(entry.context).length > 0) {
      parts.push(JSON.stringify(entry.context, null, 2));
    }
    
    if (entry.error) {
      parts.push(`Error: ${entry.error.name}: ${entry.error.message}`);
      if (entry.error.stack) {
        parts.push(entry.error.stack);
      }
    }

    const output = parts.join('\n');
    
    switch (entry.level) {
      case 'debug':
        console.debug(output);
        break;
      case 'info':
        console.info(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'error':
        console.error(output);
        break;
    }
  }

  private async sendRemote(entries: LogEntry[]): Promise<void> {
    if (!this.config.enableRemote || !this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: entries }),
      });
    } catch (err) {
      console.error('Failed to send logs to remote:', err);
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog('debug')) return;
    const entry = this.createEntry('debug', message, context);
    this.output(entry);
  }

  info(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog('info')) return;
    const entry = this.createEntry('info', message, context);
    this.output(entry);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    if (!this.shouldLog('warn')) return;
    const entry = this.createEntry('warn', message, context);
    this.output(entry);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    if (!this.shouldLog('error')) return;
    const entry = this.createEntry('error', message, context, error);
    this.output(entry);
  }

  async flush(): Promise<void> {
    if (this.remoteQueue.length > 0) {
      const entries = [...this.remoteQueue];
      this.remoteQueue = [];
      await this.sendRemote(entries);
    }
  }

  setLevel(level: LogLevel): void {
    this.config.minLevel = level;
  }
}

// Factory function to create a logger for a specific function
export function createLogger(functionName: string, config?: Partial<LoggerConfig>): EdgeLogger {
  return new EdgeLogger({
    ...config,
    functionName,
  });
}

// Pre-configured loggers for common functions
export const loggers = {
  openChest: createLogger('open-chest'),
  saveGame: createLogger('save-game-state'),
  loadGame: createLogger('load-game-state'),
  analytics: createLogger('track-analytics'),
  prestige: createLogger('perform-prestige'),
  claimReward: createLogger('claim-offline-income'),
};

// Default logger
export const logger = createLogger('edge-function');

// Convenience functions
export const log = {
  debug: (msg: string, ctx?: Record<string, unknown>) => logger.debug(msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => logger.info(msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => logger.warn(msg, ctx),
  error: (msg: string, err?: Error, ctx?: Record<string, unknown>) => logger.error(msg, err, ctx),
};
