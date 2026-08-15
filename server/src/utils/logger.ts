import winston from 'winston';
import fs from 'fs';
import path from 'path';

const consoleFormat = process.env.NODE_ENV === 'production'
  ? winston.format.json()
  : winston.format.combine(winston.format.colorize(), winston.format.simple());

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(winston.format.timestamp(), consoleFormat),
  }),
];

if (process.env.LOG_TO_FILE === 'true') {
  const logsDir = path.resolve(process.cwd(), 'logs');
  try {
    fs.mkdirSync(logsDir, { recursive: true });
    transports.push(
      new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
      new winston.transports.File({ filename: path.join(logsDir, 'combined.log') }),
    );
  } catch (error) {
    console.warn('[LOGGER] File logging disabled because the logs directory is not writable.', error);
  }
}

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  defaultMeta: { service: 'optibizgym-api' },
  transports,
});

export default logger;
