/**
 * Structured Logging Setup
 * Provides debug, info, warn, error logging with context
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  userId?: string;
  tenantId?: string;
  correlationId?: string;
  endpoint?: string;
  method?: string;
  duration?: number;
}

class Logger {
  private isDevelopment: boolean;
  private logLevel: LogLevel;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: Record<LogLevel, number> = {
      debug: 0,
      info: 1,
      warn: 2,
      error: 3,
    };
    return levels[level] >= levels[this.logLevel];
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context
      ? ` [${[
          context.correlationId && `id:${context.correlationId}`,
          context.userId && `user:${context.userId}`,
          context.tenantId && `tenant:${context.tenantId}`,
          context.method && context.endpoint && `${context.method} ${context.endpoint}`,
        ]
          .filter(Boolean)
          .join(' ')}]`
      : '';

    return `${timestamp} [${level.toUpperCase()}]${contextStr} ${message}`;
  }

  debug(message: string, context?: LogContext) {
    if (!this.shouldLog('debug')) return;
    console.debug(this.formatMessage('debug', message, context));
  }

  info(message: string, context?: LogContext) {
    if (!this.shouldLog('info')) return;
    console.log(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext) {
    if (!this.shouldLog('warn')) return;
    console.warn(this.formatMessage('warn', message, context));
  }

  error(message: string, error?: Error | unknown, context?: LogContext) {
    if (!this.shouldLog('error')) return;
    const stack = error instanceof Error ? error.stack : '';
    console.error(this.formatMessage('error', message, context), stack);
  }

  /**
   * Log API request
   */
  logRequest(method: string, endpoint: string, correlationId: string, context?: LogContext) {
    this.info(`→ ${method} ${endpoint}`, {
      ...context,
      correlationId,
      method,
      endpoint,
    });
  }

  /**
   * Log API response
   */
  logResponse(method: string, endpoint: string, statusCode: number, duration: number, correlationId: string, context?: LogContext) {
    const level = statusCode >= 400 ? 'warn' : 'info';
    const logFn = level === 'warn' ? this.warn.bind(this) : this.info.bind(this);

    logFn(`← ${method} ${endpoint} ${statusCode} (+${duration}ms)`, {
      ...context,
      correlationId,
      method,
      endpoint,
      duration,
    });
  }

  /**
   * Log database query
   */
  logQuery(query: string, duration: number, rows?: number, error?: Error) {
    if (this.isDevelopment) {
      const level = error ? 'error' : 'debug';
      const logFn = level === 'error' ? this.error.bind(this) : this.debug.bind(this);
      logFn(`SQL (+${duration}ms) [${rows || 0} rows]`, error);
    }
  }

  /**
   * Log permission check
   */
  logPermission(userId: string, resource: string, action: string, granted: boolean, context?: LogContext) {
    const level = granted ? 'debug' : 'warn';
    const logFn = level === 'warn' ? this.warn.bind(this) : this.debug.bind(this);
    logFn(`Permission ${granted ? '✓' : '✗'}: ${resource}:${action}`, {
      ...context,
      userId,
    });
  }
}

export const logger = new Logger();
