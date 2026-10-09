import { createServer } from 'node:http';

const SHUTDOWN_TIMEOUT_MS = 10000;

/**
 * Cloud Run konteyneri 0.0.0.0 üzerinde $PORT dinlemelidir.
 * Yapılandırma hataları burada yakalanır: eksik/geçersiz ortam değişkeniyle
 * süreç hiç başlamaz, sorun günlüğe tek satır olarak yazılır.
 */
async function main() {
  const { config } = await import('./config.js');
  const { logger } = await import('./logger.js');
  const { createApp } = await import('./app.js');

  const server = createServer(createApp());

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(config.PORT, '0.0.0.0', () => {
      server.off('error', reject);
      resolve();
    });
  });

  logger.info('oyun API dinliyor', {
    port: config.PORT,
    environment: config.NODE_ENV,
    authMode: config.AUTH_MODE,
    financialOperations: config.financialOperationsEnabled,
  });

  let closing = false;
  const shutdown = (signal) => {
    if (closing) return;
    closing = true;
    logger.info('kapatma sinyali alındı', { signal });

    server.close(() => {
      logger.info('sunucu kapandı');
      process.exit(0);
    });

    setTimeout(() => {
      logger.warn('kapatma zaman aşımı, süreç zorla kapatılıyor');
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS).unref();
  };

  ['SIGTERM', 'SIGINT'].forEach((signal) => process.on(signal, () => shutdown(signal)));

  process.on('unhandledRejection', (reason) => {
    logger.error('yakalanmayan promise hatası', {
      detail: reason instanceof Error ? reason.message : String(reason),
    });
  });

  process.on('uncaughtException', (error) => {
    logger.error('yakalanmayan hata', { detail: error.message, stack: error.stack });
    process.exit(1);
  });
}

main().catch((error) => {
  const details = Array.isArray(error?.details) ? error.details : [error?.message ?? String(error)];
  process.stderr.write(
    `${JSON.stringify({ severity: 'ERROR', message: 'oyun API başlatılamadı', details })}\n`
  );
  process.exit(1);
});