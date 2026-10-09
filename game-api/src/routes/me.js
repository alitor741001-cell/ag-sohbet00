import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/** /v1/me — tokenın kime ait olduğunu ve sunucunun çözdüğü rolü döndürür. */
router.get('/v1/me', authenticate(), (req, res) => {
  const principal = req.principal;
  res.json({
    user: { id: principal.userId, email: principal.email, role: principal.role },
    auth: { kind: principal.kind },
    features: { financialOperations: false },
  });
});

export default router;