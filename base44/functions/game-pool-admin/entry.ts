import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { POOL_GAMES, loadPool, poolRules } from '../../shared/gamePool.ts';

// Yönetim: oyun havuzlarının ayarları ve muhasebe özeti (yalnız yönetici).
const EDITABLE = ['cut_pct', 'rtp_pct', 'small_max', 'medium_max', 'big_max', 'max_win', 'free_limit', 'min_stake', 'max_stake', 'balance'];

function view(pool) {
  const rules = poolRules(pool);
  return {
    ...pool,
    reserve_pct: rules.reserve,
    // Gerçekleşen geri dönüş: ödenen kazanç / alınan bahis.
    realized_rtp: pool.total_bet > 0 ? (pool.total_paid / pool.total_bet) * 100 : 0,
    k_base: rules.kBase,
    k_free: rules.kFree,
  };
}

function validate(next) {
  if (next.cut_pct < 0 || next.rtp_pct < 0 || next.cut_pct + next.rtp_pct > 100) return 'Kesinti + RTP en fazla %100 olabilir.';
  if (!(next.small_max > 0 && next.small_max < next.medium_max && next.medium_max < next.big_max)) return 'Kazanç seviyeleri küçükten büyüğe artmalı.';
  if (!(next.max_win > 0) || !(next.free_limit > 0)) return 'Maksimum kazanç ve Free Spins limiti sıfırdan büyük olmalı.';
  if (!(next.min_stake > 0) || next.min_stake > next.max_stake) return 'Minimum bahis maksimum bahisten büyük olamaz.';
  if (next.balance < 0) return 'Havuz bakiyesi negatif olamaz.';
  return '';
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch(() => null);
    if (user?.role !== 'admin') return Response.json({ error: 'Yetkisiz' }, { status: 403 });
    const body = await req.json().catch(() => ({}));

    if (body.action === 'update') {
      if (!POOL_GAMES.includes(body.game)) return Response.json({ error: 'Geçersiz oyun.' }, { status: 400 });
      const pool = await loadPool(base44, body.game);
      const next = {};
      EDITABLE.forEach((key) => {
        const value = Number(body.values?.[key]);
        next[key] = Number.isFinite(value) ? value : pool[key];
      });
      const error = validate(next);
      if (error) return Response.json({ error }, { status: 400 });
      const updated = await base44.asServiceRole.entities.GamePool.update(pool.id, next);
      return Response.json({ pool: view(updated) });
    }

    const pools = await Promise.all(POOL_GAMES.map((game) => loadPool(base44, game)));
    return Response.json({ pools: pools.map(view) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}