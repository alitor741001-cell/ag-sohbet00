import { createClientFromRequest } from 'npm:@base44/sdk@0.8.56';
import { effectiveVipLevel } from '../../shared/vip.ts';
import { rateLimit } from '../../shared/security.ts';
import { getCosmeticSelection, saveCosmeticSelection } from '../../shared/cosmeticSelection.ts';
import { buyCosmetic } from '../../shared/cosmeticPurchase.ts';
import { saveCosmeticProduct } from '../../shared/cosmeticAdmin.ts';
import { giftLock } from '../../shared/supabaseMirror.ts';
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req); const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Oturum gerekli.' }, { status: 401 });
    const body = await req.json(); const action = body.action;
    const sr = base44.asServiceRole.entities;
    if (['admin-list','admin-save'].includes(action)) {
      if (user.role !== 'admin') return Response.json({ error: 'Yalnızca yöneticiler mağazayı yönetebilir.' }, { status: 403 });
      if (action === 'admin-save') return Response.json({ ok: true, product: await saveCosmeticProduct(base44, body) });
      return Response.json(await sr.CosmeticProduct.list({ sort: 'sort_order', limit: 30, cursor: body.cursor || undefined }));
    }
    if (action === 'buy') {
      const rl = await rateLimit(base44, 'cosmetic-buy:' + user.id, user.id, 12, 60000);
      if (!rl.allowed) return Response.json({ error: 'Çok fazla istek. Biraz bekle.' }, { status: 429 });
      const result = await buyCosmetic(base44, user, body.product_id, body.request_id);
      return Response.json(result, { status: result.status || 200 });
    }
    if (action === 'equip' || action === 'preferences') {
      const token = crypto.randomUUID();
      if (!await giftLock(base44, [`cosmetics:${user.id}`], token)) return Response.json({ error: 'İşlemin sürüyor. Tekrar dene.' }, { status: 409 });
      try {
        let patch = {};
        if (action === 'equip') {
          if (!body.product_id) patch = { seat_product_id: '', seat_image_url: '', seat_crop: {}, seat_remove_white: false };
          else {
            const found = await sr.OwnedCosmetic.filter({ owner_id: user.id, product_id: body.product_id, status: 'owned' }, '-created_date', 1);
            if (!found[0]) return Response.json({ error: 'Bu çerçeveye sahip değilsin.' }, { status: 403 });
            const item = found[0];
            patch = { seat_product_id: item.product_id, seat_image_url: item.image_url, seat_crop: item.crop || {}, seat_remove_white: !!item.remove_white };
          }
        } else {
          if ('show_entrances' in body) patch.show_entrances = body.show_entrances === true;
          if ('reduce_motion' in body) patch.reduce_motion = body.reduce_motion === true;
          if ('entrance_mode' in body) {
            if (!['random','fixed','off'].includes(body.entrance_mode)) throw new Error('Geçersiz giriş modu.');
            patch.entrance_mode = body.entrance_mode;
            if (body.entrance_mode === 'fixed') {
              const p = await sr.CosmeticProduct.get(String(body.entrance_id || '')).catch(() => null);
              if (!p?.published || p.category !== 'entrance' || effectiveVipLevel(user) < 5) return Response.json({ error: 'Aktif VIP 5–12 üyeliği ve geçerli efekt gerekli.' }, { status: 403 });
              patch.entrance_id = p.id;
            }
          }
        }
        return Response.json({ ok: true, selection: await saveCosmeticSelection(base44, user.id, patch) });
      } finally { await giftLock(base44, [], token, true); }
    }
    const selection = await getCosmeticSelection(base44, user.id);
    if (action === 'inventory') {
      const query = { owner_id: user.id, status: 'owned' };
      const page = await sr.OwnedCosmetic.filter(query, { sort: '-created_date', limit: 24, cursor: body.cursor || undefined });
      return Response.json({ ...page, selection });
    }
    if (action === 'catalog') {
      const category = ['seat-frame','vip-frame','entrance'].includes(body.category) ? body.category : 'seat-frame';
      const [page, wallets] = await Promise.all([sr.CosmeticProduct.filter({ published: true, category }, { sort: 'sort_order', limit: 24, cursor: body.cursor || undefined }), sr.GameWallet.filter({ user_id: user.id }, '-created_date', 1)]);
      const owned = page.items.length ? await sr.OwnedCosmetic.filter({ owner_id: user.id, status: 'owned', product_id: { $in: page.items.map(p => p.id) } }, '-created_date', 24) : [];
      return Response.json({ ...page, owned_ids: owned.map(p => p.product_id), selection, coins: wallets[0]?.coins ?? null, vip_level: effectiveVipLevel(user) });
    }
    return Response.json({ error: 'Geçersiz işlem.' }, { status: 400 });
  } catch (error) { return Response.json({ error: error.message || 'İşlem tamamlanamadı.' }, { status: 500 }); }
}