# Phase 13: Logging Infrastructure - Implementation Report

## Overview
Created structured logging systems for both client-side (React) and edge functions (Deno) with consistent API, multiple log levels, and optional remote transport.

## Files Created

### 1. Client Logger (`src/lib/logger.ts`)

A comprehensive structured logger for the React frontend with:

#### Features
- **Log Levels**: debug, info, warn, error with configurable minimum level
- **Structured Context**: Attach key-value context objects to logs
- **Color-coded Output**: Different colors for each log level
- **Timestamp**: ISO 8601 timestamps with emoji indicators
- **Remote Transport**: Optional remote logging endpoint
- **Singleton Pattern**: Export default instance for easy use
- **Custom Instances**: Export class for custom logger instances

#### Configuration Options
```typescript
interface LoggerConfig {
  minLevel: 'debug' | 'info' | 'warn' | 'error';
  enableRemote: boolean;
  remoteEndpoint?: string;
  enableColors: boolean;
  enableTimestamp: boolean;
  enableEmoji: boolean;
}
```

#### Usage Examples
```typescript
import { logger, log } from './lib/logger';

// Using singleton
logger.info('User action', { userId: 123, action: 'click' });
logger.warn('Rate limit approaching', { current: 95, max: 100 });
logger.error('API failed', error, { endpoint: '/api/data' });

// Using convenience functions
log.debug('Debug info', { value: 42 });
log.info('User logged in', { telegramId: 123 });
log.error('Something went wrong', new Error('details'));

// Creating custom logger
const customLogger = new Logger({ minLevel: 'warn' });
customLogger.warn('Only warnings and errors');
```

#### Automatic Behavior
- **Development**: Defaults to `debug` level, no remote logging
- **Production**: Defaults to `info` level, enables remote logging
- **Remote Flushing**: Automatic batch flush every 10 seconds

### 2. Edge Function Logger (`supabase/functions/_shared/logger.ts`)

A Deno-compatible logger for Supabase edge functions with:

#### Features
- **Log Levels**: debug, info, warn, error
- **Function Context**: Automatic function name prefixing
- **Error Serialization**: Proper error object serialization for JSON
- **Remote Transport**: Optional remote logging endpoint
- **Factory Pattern**: Create loggers for specific functions
- **Pre-configured Loggers**: Ready-to-use loggers for common functions

#### Usage Examples
```typescript
import { createLogger, logger, log } from './_shared/logger';

// Using factory to create function-specific logger
const myLogger = createLogger('my-function-name');
myLogger.info('Processing request');
myLogger.error('Failed', error, { requestId: '123' });

// Using pre-configured loggers
import { loggers } from './_shared/logger';
loggers.openChest.info('Opening chest', { telegramId: 123 });
loggers.analytics.error('Failed to track', error);

// Using convenience functions
log.info('General info', { key: 'value' });
log.error('Error occurred', new Error('test'), { context: 'value' });
```

#### Pre-configured Loggers
```typescript
export const loggers = {
  openChest: createLogger('open-chest'),
  saveGame: createLogger('save-game-state'),
  loadGame: createLogger('load-game-state'),
  analytics: createLogger('track-analytics'),
  prestige: createLogger('perform-prestige'),
  claimReward: createLogger('claim-offline-income'),
};
```

## Architecture Comparison

### Client Logger (Browser)
```
┌─────────────────────────────────────────────────────┐
│                    Logger Instance                   │
├─────────────────────────────────────────────────────┤
│  log() ──▶ Entry Queue ──▶ Console Output          │
│                    │                               │
│                    └──▶ Remote Endpoint (optional)  │
│                         (batched every 10s)         │
└─────────────────────────────────────────────────────┘
```

### Edge Function Logger (Deno)
```
┌─────────────────────────────────────────────────────┐
│                 EdgeLogger Instance                  │
├─────────────────────────────────────────────────────┤
│  log() ──▶ Console Output (always)                │
│                    │                               │
│                    └──▶ Remote Endpoint (optional)  │
└─────────────────────────────────────────────────────┘
```

## Key Differences

| Feature | Client Logger | Edge Logger |
|---------|---------------|-------------|
| Environment | Browser (window) | Deno |
| Timestamp | ISO 8601 | ISO 8601 |
| Colors | Yes (CSS) | No (plain text) |
| Emoji | Yes | No (plain text) |
| Error Stack | Native | Serialized |
| Auto-flush | 10s interval | Manual flush() |
| Global State | Singleton | Factory |

## Environment Variables

### Client (Vite)
- `VITE_LOG_LEVEL` - Override minimum log level
- `VITE_LOG_ENDPOINT` - Remote logging endpoint URL

### Edge (Deno/Supabase)
- `LOG_LEVEL` - Override minimum log level  
- `LOG_ENDPOINT` - Remote logging endpoint URL

## Best Practices

1. **Use Context**: Always include relevant context data
2. **Choose Level**: Use appropriate log levels
   - `debug`: Verbose info for debugging
   - `info`: General operational info
   - `warn`: Recoverable issues
   - `error`: Failures requiring attention
3. **Structured Data**: Use objects, not string interpolation
4. **Error Handling**: Always pass Error objects to error()

## Files Created

- `src/lib/logger.ts` - Client-side structured logger
- `supabase/functions/_shared/logger.ts` - Edge function logger
- `PHASE13_REPORT.md` - This documentation

## Next Steps

1. Set up remote logging endpoint (e.g., LogRocket, Datadog, custom)
2. Add log sampling for high-volume events
3. Create log aggregation dashboards
4. Set up alerts for error rate thresholds
5. Add request/response logging middleware
