import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { rateLimit, safeErrorResponse } from '../../shared/security.ts';
import { effectiveVipLevel } from '../../shared/vip.ts';
import { getVipCatalog, validateVipCatalog, VIP_LEVELS } from '../../shared/vipCatalog.ts';
import { syncVipInventory, publishVipAppearance, inventoryView } from '../../shared/vipInventory.ts';
import { handleVipSettings } from '../../shared/vipSettings.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const authenticated = await base44.auth.me();
    if (!authenticated) return Response.json({ error: 'Oturum gerekli.' }, { status: 401 });
    const me = await base44.asServiceRole.entities.User.get(authenticated.id);
    if (me.is_banned || me.role === 'banned') return Response.json({ error: 'İşlem yapılamıyor.' }, { status: 403 });
    const body = await req.json();
    const action = body.action || 'list';
    if (!['list', 'toggle', 'catalog', 'saveCatalog', 'settings', 'setSetting'].includes(action)) return Response.json({ error: 'Geçersiz işlem.' }, { status: 400 });
    if (action === 'saveCatalog') {
      if (me.role !== 'admin') return Response.json({ error: 'Yetkisiz.' }, { status: 403 });
      if (JSON.stringify(body.catalog || {}).length > 24000) return Response.json({ error: 'Ayarlar çok büyük.' }, { status: 400 });
      let value;
      try { value = validateVipCatalog(body.catalog); } catch (error) { return Response.json({ error: error.message }, { status: 400 }); }
      const rows = await base44.asServiceRole.entities.AppConfig.filter({ key: 'vip-system-v2' }, '-created_date', 1);
      if (rows[0]) await base44.asServiceRole.entities.AppConfig.update(rows[0].id, { value: JSON.stringify(value) });
      else await base44.asServiceRole.entities.AppConfig.create({ key: 'vip-system-v2', value: JSON.stringify(value) });
      return Response.json({ ok: true, catalog: await getVipCatalog(base44) });
    }
    const catalog = await getVipCatalog(base44);
    if (action === 'catalog') return Response.json({ ok: true, catalog });
    if (action === 'settings' || action === 'setSetting') return await handleVipSettings(base44, me, { ...body, action }, catalog);
    const level = effectiveVipLevel(me);
    if (action === 'toggle' && (typeof body.active !== 'boolean' || (body.level !== undefined && !VIP_LEVELS.includes(body.level)))) return Response.json({ error: 'Geçersiz kozmetik seçimi.' }, { status: 400 });
    const rows = await syncVipInventory(base44, me, level, catalog);
    if (action === 'toggle') {
      const limit = await rateLimit(base44, 'vip-cosmetics:' + me.id, me.id, 30, 60000);
      if (!limit.allowed) return Response.json({ error: 'Biraz bekleyip tekrar deneyin.' }, { status: 429 });
      const feature = catalog.features.find((item) => item.key === body.kind && item.supported && item.cosmetic !== false);
      if (!feature || typeof body.active !== 'boolean') return Response.json({ error: 'Geçersiz ürün.' }, { status: 400 });
      const row = rows.find((item) => item.kind === feature.key);
      const selected = body.level === undefined ? row?.level : body.level;
      if (!row || !VIP_LEVELS.includes(selected) || !(row.owned_levels || []).includes(selected)) return Response.json({ error: 'Bu kozmetiğe sahip değilsin.' }, { status: 403 });
      if (body.active && (selected > level || level < feature.minLevel || selected < feature.minLevel)) return Response.json({ error: 'Bu kozmetik için geçerli VIP üyeliği gerekli.' }, { status: 403 });
      // VIP12 üyeleri yalnızca VIP12 kozmetiklerini takabilir: diğer seviyeler kilitlenir.
      if (body.active && level === 12 && selected !== 12) return Response.json({ error: 'VIP12 üyeliğinde yalnızca VIP12 kozmetikleri kullanılabilir.' }, { status: 403 });
      await base44.asServiceRole.entities.VipCosmetic.update(row.id, { active: body.active, level: selected });
      Object.assign(row, { active: body.active, level: selected });
    }
    await publishVipAppearance(base44, me, level, rows, catalog);
    const items = inventoryView(rows, level, catalog);
    const groups = catalog.features.filter((feature) => feature.cosmetic !== false && (feature.supported || feature.key === 'avatar')).map((feature) => ({ kind: feature.key, label: feature.label, items: items.filter((item) => item.kind === feature.key) }));
    return Response.json({ ok: true, owner_id: me.id, level, expires_at: me.vip_expires_at || '', catalog, items, groups });
  } catch (error) {
    return safeErrorResponse(error, 'VIP ürünleri yüklenemedi.');
  }
}