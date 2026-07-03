/**
 * Virtual Museum Tapper Game — Structured Logger
 * Production-ready logging with levels, formatting, and optional remote transport
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  error?: Error;
}

interface LoggerConfig {
  minLevel: LogLevel;
  enableRemote: boolean;
  remoteEndpoint?: string;
  enableColors: boolean;
  enableTimestamp: boolean;
  enableEmoji: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const LOG_EMOJIS: Record<LogLevel, string> = {
  debug: '🔍',
  info: 'ℹ️',
  warn: '⚠️',
  error: '❌',
};

const LOG_COLORS: Record<LogLevel, string> = {
  debug: '#6b7280', // gray
  info: '#3b82f6',  // blue
  warn: '#f59e0b',  // amber
  error: '#ef4444', // red
};

const DEFAULT_CONFIG: LoggerConfig = {
  minLevel: import.meta.env.DEV ? 'debug' : 'info',
  enableRemote: !import.meta.env.DEV,
  enableColors: true,
  enableTimestamp: true,
  enableEmoji: true,
};

class Logger {
  private config: LoggerConfig;
  private remoteQueue: LogEntry[] = [];
  private flushTimer: number | null = null;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // Start remote flush timer in production
    if (this.config.enableRemote && this.config.remoteEndpoint) {
      this.flushTimer = window.setInterval(() => this.flushRemote(), 10000);
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  private formatTimestamp(): string {
    const now = new Date();
    return now.toISOString();
  }

  private formatMessage(entry: LogEntry): string {
    const parts: string[] = [];
    
    if (this.config.enableTimestamp) {
      parts.push(`[${entry.timestamp}]`);
    }
    
    if (this.config.enableEmoji) {
      parts.push(LOG_EMOJIS[entry.level]);
    }
    
    parts.push(entry.message);
    
    return parts.join(' ');
  }

  private formatContext(context?: Record<string, unknown>): string {
    if (!context || Object.keys(context).length === 0) return '';
    return '\n' + JSON.stringify(context, null, 2);
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
      context,
      error,
    };

    // Console output
    const formattedMessage = this.formatMessage(entry);
    const contextStr = this.formatContext(context);

    if (this.config.enableColors && typeof window !== 'undefined') {
      const color = LOG_COLORS[level];
      console.log(
        `%c${formattedMessage}%c${contextStr}`,
        `color: ${color}; font-weight: bold;`,
        'color: #6b7280; font-size: 0.9em;'
      );
    } else {
      console.log(formattedMessage + contextStr);
    }

    if (error) {
      console.error(error);
    }

    // Queue for remote logging
    if (this.config.enableRemote) {
      this.remoteQueue.push(entry);
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log('error', message, context, error);
  }

  private async flushRemote(): Promise<void> {
    if (this.remoteQueue.length === 0 || !this.config.remoteEndpoint) return;

    const entries = [...this.remoteQueue];
    this.remoteQueue = [];

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logs: entries }),
      });
    } catch (err) {
      // Re-queue on failure
      this.remoteQueue = [...entries, ...this.remoteQueue];
      console.error('Failed to send logs to remote:', err);
    }
  }

  setLevel(level: LogLevel): void {
    this.config.minLevel = level;
  }

  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export class for custom instances
export { Logger };

// Convenience functions for quick logging
export const log = {
  debug: (msg: string, ctx?: Record<string, unknown>) => logger.debug(msg, ctx),
  info: (msg: string, ctx?: Record<string, unknown>) => logger.info(msg, ctx),
  warn: (msg: string, ctx?: Record<string, unknown>) => logger.warn(msg, ctx),
  error: (msg: string, err?: Error, ctx?: Record<string, unknown>) => logger.error(msg, err, ctx),
};
