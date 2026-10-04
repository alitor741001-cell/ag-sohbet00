import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { rateLimit, safeErrorResponse } from '../../shared/security.ts';
import { COIN_PACKAGES, findCoinPackage } from '../../shared/coinPackages.ts';

const ACTIONS = ['packages', 'create'];
const PENDING_LIMIT = 10;

/**
 * Kullanıcı tarafı coin başvurusu: paketleri listeler ve seçilen paket için
 * admin panelindeki "Coins Başvuru Listesi"ne düşen başvuruyu oluşturur.
 * Coin yüklemesi yalnızca admin onayından sonra yapılır.
 */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Oturum gerekli.' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = body?.action || 'packages';
    if (!ACTIONS.includes(action)) return Response.json({ error: 'geçersiz istek' }, { status: 400 });

    if (action === 'packages') {
      return Response.json({ ok: true, packages: COIN_PACKAGES });
    }

    const pack = findCoinPackage(body?.package_id);
    if (!pack) return Response.json({ error: 'Paket bulunamadı.' }, { status: 404 });

    const rl = await rateLimit(base44, 'coin-request:' + user.id, user.id, 5, 600000);
    if (!rl.allowed) return Response.json({ error: 'Çok fazla başvuru yaptın, biraz bekleyin.' }, { status: 429 });

    const pending = await base44.asServiceRole.entities.CoinRequest
      .filter({ user_id: user.id, status: 'pending', package_id: pack.id }, '-created_date', PENDING_LIMIT)
      .catch(() => []);
    if (pending.length) {
      return Response.json({ error: 'Bu paket için onay bekleyen bir başvurun var.' }, { status: 400 });
    }

    const me = await base44.asServiceRole.entities.User.get(user.id).catch(() => null);
    const request = await base44.asServiceRole.entities.CoinRequest.create({
      user_id: user.id,
      user_name: me?.username || me?.full_name || user.full_name || 'Kullanıcı',
      user_avatar: me?.avatar || '',
      member_id: me?.member_id || '',
      package_id: pack.id,
      package_name: pack.name,
      coins: pack.coins,
      price: pack.price,
      status: 'pending',
    });

    return Response.json({ ok: true, request });
  } catch (error) {
    return safeErrorResponse(error, 'Başvuru oluşturulamadı.');
  }
}