class Logger {
  constructor() {
    this.levels = {
      ERROR: 0,
      WARN: 1,
      INFO: 2,
      DEBUG: 3
    };
    
    this.currentLevel = process.env.LOG_LEVEL || 'INFO';
  }
  
  log(level, message, ...args) {
    if (this.levels[level] <= this.levels[this.currentLevel]) {
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] [${level}] ${message}`, ...args);
    }
  }
  
  error(message, ...args) {
    this.log('ERROR', message, ...args);
  }
  
  warn(message, ...args) {
    this.log('WARN', message, ...args);
  }
  
  info(message, ...args) {
    this.log('INFO', message, ...args);
  }
  
  debug(message, ...args) {
    this.log('DEBUG', message, ...args);
  }
}

export const logger = new Logger();