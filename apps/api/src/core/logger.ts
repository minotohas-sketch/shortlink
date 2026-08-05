export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private name: string;
  private minLevel: LogLevel;

  constructor(name: string) {
    this.name = name;
    this.minLevel = LogLevel.INFO;
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>): void {
    if (level < this.minLevel) return;

    const entry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level].toLowerCase(),
      message: `[${this.name}] ${message}`,
      ...data,
    };

    if (level >= LogLevel.ERROR) console.error(JSON.stringify(entry));
    else if (level === LogLevel.WARN) console.warn(JSON.stringify(entry));
    else console.log(JSON.stringify(entry));
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

  error(message: string, error?: unknown, data?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, { ...data, error: error instanceof Error ? error.message : String(error) });
  }

  child(name: string): Logger {
    return new Logger(`${this.name}:${name}`);
  }
}
