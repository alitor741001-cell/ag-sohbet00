import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { LEADER_GAMES, loadLeaders } from '../../shared/gameLeaders.ts';

// Oyun kazananları: günlük, haftalık ve toplam ilk 50 kişi.
export default async function (req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me().catch(() => null);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  if (!LEADER_GAMES.includes(body.game)) return Response.json({ error: 'Geçersiz oyun.' }, { status: 400 });
  return Response.json(await loadLeaders(base44, body.game));
}