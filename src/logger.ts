import winston, { createLogger, transports, format, log } from 'winston';

export class Logger {
  private logger: winston.Logger;

  constructor(private context: string) {
    this.logger = createLogger({
      level: 'info',  // Set the default level
      levels: {
        error: 0,    // Define custom levels and their priorities
        warn: 1,
        info: 2,
        verbose: 3   // Define your custom "success" level
      },
      format: format.combine(
        format.timestamp(),
        format.printf(({ level, message, timestamp }) => {
          let colorFunc: (text: string) => string;
          switch (level) {
            case 'error':
              colorFunc = (text) => `\x1b[31m${text}\x1b[0m`; // Red
              break;
            case 'warn':
              colorFunc = (text) => `\x1b[33m${text}\x1b[0m`; // Yellow
              break;
            case 'info':
              colorFunc = (text) => `\x1b[34m${text}\x1b[0m`; // Blue
              break;
            case 'verbose':
              log('verbose', message);
              colorFunc = (text) => `\x1b[32m${text}\x1b[0m`; // Green
              break;
            default:
              colorFunc = (text) => text;
          }

          const toPrint = `${timestamp} [${level.toUpperCase()}][${this.context}]: ${message}`

          return `${colorFunc(toPrint)}`;
        })
      ),
      transports: [
        new transports.Console(),
        new transports.File({ filename: 'app.log' })
      ],
    });
  }

  // Define methods for each log level
  error(message: string): void {
    this.logger.error(message);
  }

  warn(message: string): void {
    this.logger.warn(message);
  }

  info(message: string): void {
    this.logger.info(message);
  }

  verbose(message: string): void {
    this.logger.verbose(message); // Use the custom "success" level
  }
}
