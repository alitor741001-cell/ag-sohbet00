/* global process, module, require, Buffer */
'use strict';
/**
 * index.js — Bonto giriş dosyası (Aşama 1).
 *
 * ÖNEMLİ: Bu dosyayı koymadan önce mevcut index.js içeriğini `index.yedek.js`
 * olarak kaydedin. Geri dönüş için o yedeği geri koymak yeterlidir.
 *
 * • Uygulamanın ana sayfası aynen korunur ("Hello from Bonto!" sayfası).
 * • Eklenen tek şey Aşama 1 API'sidir: /health, /health/ready, /v1/* ve /test.
 * • Harici paket gerekmez; yalnızca Node.js'in kendi modülleri kullanılır.
 * • Canlı veriye bağlanılmaz; hiçbir sır bu dosyada tutulmaz.
 */

const http = require('node:http');
const api = require('./api-uclar');
const { settings } = require('./api-ayar');

/** Ana sayfa: mevcut Bonto sayfasının birebir kopyası (görünüm değişmesin diye). */
const ANA_SAYFA = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>My Bonto App</title>
      <style>
        body { font-family: system-ui, sans-serif; max-width: 600px; margin: 80px auto; padding: 0 20px; color: #e0e0e0; background: #1a1a2e; }
        h1 { color: #00d4ff; }
        code { background: #16213e; padding: 2px 6px; border-radius: 4px; }
        a { color: #00d4ff; }
      </style>
    </head>
    <body>
      <h1>Hello from Bonto!</h1>
      <p>Edit <code>index.js</code> in the editor to change this page.</p>
      <p>Your changes will appear here automatically.</p>
      <p style="margin-top: 2rem; font-size: 0.75rem; opacity: 0.4;">Hosted on <a href="https://bonto.dev" style="color: inherit;">Bonto</a></p>
    </body>
    </html>
  `;

/** Express'in varsayılan 404 gövdesiyle aynı biçim: eski davranış korunur. */
const sayfaBulunamadi = (method, path) =>
  `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Error</title>\n</head>\n<body>\n<pre>Cannot ${method} ${path}</pre>\n</body>\n</html>\n`;

const server = http.createServer((req, res) => {
  if (api.handle(req, res)) return;

  const raw = req.url || '/';
  const queryIndex = raw.indexOf('?');
  const path = decodeURIComponent(queryIndex === -1 ? raw : raw.slice(0, queryIndex));

  if (path === '/') {
    res.statusCode = 200;
    res.setHeader('content-type', 'text/html; charset=utf-8');
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    res.end(ANA_SAYFA);
    return;
  }

  const govde = sayfaBulunamadi(req.method, path);
  res.statusCode = 404;
  res.setHeader('content-type', 'text/html; charset=utf-8');
  res.setHeader('content-length', Buffer.byteLength(govde));
  res.end(req.method === 'HEAD' ? undefined : govde);
});

server.listen(settings.port, settings.host, () => {
  process.stdout.write(
    `${JSON.stringify({
      severity: 'INFO',
      message: 'ag-backend Aşama 1 API dinliyor',
      service: settings.serviceName,
      contractVersion: settings.contractVersion,
      port: settings.port,
      environment: settings.environment,
      authMode: settings.authMode,
      testPage: settings.enableTestPage,
      time: new Date().toISOString(),
    })}\n`
  );
});

const kapat = (signal) => {
  process.stdout.write(`${JSON.stringify({ severity: 'INFO', message: 'kapatma sinyali', signal })}\n`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 8000).unref();
};

process.on('SIGTERM', () => kapat('SIGTERM'));
process.on('SIGINT', () => kapat('SIGINT'));

module.exports = { server };