import { config } from './config.js';

const ORDER = { debug: 10, info: 20, warn: 30, error: 40 };

/** Cloud Run günlükleri JSON satırlarını `severity` alanına göre okur. */
const write = (level, message, fields) => {
  if (ORDER[level] < ORDER[config.LOG_LEVEL]) return;
  const entry = {
    severity: level.toUpperCase(),
    message,
    service: config.SERVICE_NAME,
    version: config.SERVICE_VERSION,
    time: new Date().toISOString(),
    ...(fields || {}),
  };
  let line;
  try {
    line = JSON.stringify(entry);
  } catch {
    line = JSON.stringify({
      severity: 'ERROR',
      message,
      time: entry.time,
      note: 'günlük alanları serileştirilemedi',
    });
  }
  const stream = level === 'error' || level === 'warn' ? process.stderr : process.stdout;
  stream.write(`${line}\n`);
};

export const logger = {
  debug: (message, fields) => write('debug', message, fields),
  info: (message, fields) => write('info', message, fields),
  warn: (message, fields) => write('warn', message, fields),
  error: (message, fields) => write('error', message, fields),
};