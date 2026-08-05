import { Environment } from './env';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4,
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: Record<string, unknown>;
  requestId?: string;
  userId?: string;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

export class Logger {
  private name: string;
  private minLevel: LogLevel;
  private requestContext?: Record<string, unknown>;
  
  constructor(name: string, requestContext?: Record<string, unknown>) {
    this.name = name;
    const levelMap: Record<string, LogLevel> = {
      debug: LogLevel.DEBUG,
      info: LogLevel.INFO,
      warn: LogLevel.WARN,
      error: LogLevel.ERROR,
      fatal: LogLevel.FATAL,
    };
    this.minLevel = levelMap[Environment.get().LOG_LEVEL] ?? LogLevel.INFO;
    this.requestContext = requestContext;
  }
  
  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (level < this.minLevel) return;
    
    const levelName = LogLevel[level].toLowerCase();
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: levelName,
      message: `[${this.name}] ${message}`,
      context: { ...this.requestContext, ...data },
    };
    
    if (data?.error instanceof Error) {
      const err = data.error as Error;
      entry.error = {
        name: err.name,
        message: err.message,
        stack: err.stack,
        code: (err as any).code,
      };
      delete entry.context?.error;
    }
    
    const jsonEntry = JSON.stringify(entry);
    
    switch (level) {
      case LogLevel.DEBUG: console.debug(jsonEntry); break;
      case LogLevel.INFO: console.info(jsonEntry); break;
      case LogLevel.WARN: console.warn(jsonEntry); break;
      case LogLevel.ERROR:
      case LogLevel.FATAL: console.error(jsonEntry); break;
    }
  }
  
  debug(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, data);
  }
  
  info(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, data);
  }
  
  warn(message: string, data?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, data);
  }
  
  error(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    const errData = { ...data };
    if (error instanceof Error) {
      errData.error = error;
    } else if (error) {
      errData.error = new Error(String(error));
    }
    this.log(LogLevel.ERROR, message, errData);
  }
  
  fatal(message: string, error?: Error | unknown, data?: Record<string, unknown>): void {
    const errData = { ...data };
    if (error instanceof Error) {
      errData.error = error;
    } else if (error) {
      errData.error = new Error(String(error));
    }
    this.log(LogLevel.FATAL, message, errData);
  }
  
  child(name: string): Logger {
    return new Logger(`${this.name}:${name}`, this.requestContext);
  }
}
