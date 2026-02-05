import winston from 'winston';
import { config } from '../config';

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`;
  })
);

export const logger = winston.createLogger({
  level: config.nodeEnv === 'development' ? 'debug' : 'info',
  format,
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        format
      ),
    }),
  ],
});
