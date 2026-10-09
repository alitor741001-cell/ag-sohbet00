import { Router } from 'express';
import { config } from '../config.js';
import { pingDatabase } from '../db/supabase.js';
import { asyncHandler } from '../errors.js';

const router = Router();
const TRUTHY = new Set(['1', 'true', 'yes', 'on']);

/**
 * /health — kimlik doğrulama istemez.
 *  • /health          : süreç ayakta mı (Cloud Run sağlık kontrolü)
 *  • /health?deep=1   : Supabase bağlantısı da kontrol edilir; kopuksa 503 döner
 */
router.get(
  '/health',
  asyncHandler(async (req, res) => {
    const deep = TRUTHY.has(String(req.query.deep ?? '').toLowerCase());

    const payload = {
      ok: true,
      service: config.SERVICE_NAME,
      version: config.SERVICE_VERSION,
      environment: config.NODE_ENV,
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      dependencies: { supabase: deep ? 'checking' : 'not_checked' },
      features: {
        authMode: config.AUTH_MODE,
        financialOperations: config.financialOperationsEnabled,
      },
    };

    if (deep) {
      try {
        payload.dependencies.supabaseLatencyMs = await pingDatabase();
        payload.dependencies.supabase = 'up';
      } catch {
        payload.dependencies.supabase = 'down';
        payload.ok = false;
      }
    }

    res.status(payload.ok ? 200 : 503).json(payload);
  })
);

export default router;