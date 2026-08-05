/**
 * Logger minimaliste pour le Redirect Worker
 */

export class Logger {
  private name: string;
  
  constructor(name: string) {
    this.name = name;
  }
  
  private log(level: string, message: string, data?: Record<string, unknown>): void {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message: `[${this.name}] ${message}`,
      ...data,
    };
    
    const json = JSON.stringify(entry);
    
    if (level === 'error') {
      console.error(json);
    } else if (level === 'warn') {
      console.warn(json);
    } else {
      console.log(json);
    }
  }
  
  info(message: string, data?: Record<string, unknown>): void {
    this.log('info', message, data);
  }
  
  warn(message: string, data?: Record<string, unknown>): void {
    this.log('warn', message, data);
  }
  
  error(message: string, error?: unknown, data?: Record<string, unknown>): void {
    const errData = { ...data };
    if (error instanceof Error) {
      errData.error = { name: error.name, message: error.message };
    }
    this.log('error', message, errData);
  }
  
  debug(message: string, data?: Record<string, unknown>): void {
    this.log('debug', message, data);
  }
}
