import { VIP_LEVELS } from './vipCatalog.ts';
const cosmeticFeatures = (catalog) => catalog.features.filter((feature) => feature.supported && feature.cosmetic !== false);

/**
 * Aynı kozmetikten mükerrer kayıt oluşursa tek kayda iner: önce envanteri dolu olan,
 * sonra en yeni kayıt geçerlidir. Böylece "Çıkar" dendikten sonra eski kayıt VIP'i geri getirmez.
 */
const rowScore = (row) => ((row?.owned_levels || []).length > 0 ? 1e15 : 0) + (Date.parse(row?.created_date || '') || 0);

export function canonicalVipRows(rows) {
  const byKind = new Map();
  (rows || []).forEach((row) => {
    if (!row?.kind) return;
    const current = byKind.get(row.kind);
    if (!current || rowScore(row) > rowScore(current)) byKind.set(row.kind, row);
  });
  return [...byKind.values()];
}

export async function syncVipInventory(base44, user, level, catalog) {
  const db = base44.asServiceRole.entities;
  // Mükerrer kayıtlar tekilleştirilir; yoksa çıkarılan kozmetik eski kayıttan geri gelir.
  const rows = await db.VipCosmetic.filter({ owner_id: user.id }, '-created_date', 500);
  const canonical = canonicalVipRows(rows);
  const byKind = new Map(canonical.map((row) => [row.kind, row]));
  const duplicates = (rows || []).filter((row) => row?.kind && byKind.get(row.kind)?.id !== row.id).map((row) => row.id);
  if (duplicates.length) await db.VipCosmetic.deleteMany({ id: { $in: duplicates } }).catch(() => {});
  const missing = [], patches = [];
  for (const feature of cosmeticFeatures(catalog)) {
    const granted = VIP_LEVELS.filter((value) => value >= feature.minLevel && value <= level);
    const row = byKind.get(feature.key);
    if (!row && granted.length) missing.push({ owner_id: user.id, kind: feature.key, level, owned_levels: granted, active: true });
    else if (row) {
      const owned = [...new Set([...(row.owned_levels || []), row.level, ...granted])].filter((value) => VIP_LEVELS.includes(value)).sort((a, b) => a - b);
      if (JSON.stringify(owned) !== JSON.stringify(row.owned_levels || [])) patches.push({ id: row.id, owned_levels: owned });
    }
  }
  if (missing.length) {
    const created = await db.VipCosmetic.bulkCreate(missing);
    created.forEach((row) => byKind.set(row.kind, row));
  }
  if (patches.length) {
    await db.VipCosmetic.bulkUpdate(patches);
    patches.forEach((patch) => { for (const [kind, row] of byKind) if (row.id === patch.id) byKind.set(kind, { ...row, ...patch }); });
  }
  return [...byKind.values()];
}
export async function publishVipAppearance(base44, user, level, rows, catalog) {
  const selections = {};
  for (const feature of cosmeticFeatures(catalog)) {
    const row = rows.find((item) => item.kind === feature.key);
    if (row?.active && VIP_LEVELS.includes(row.level) && (row.owned_levels || [row.level]).includes(row.level)) selections[feature.key] = row.level;
  }
  const value = { owner_id: user.id, level, expires_at: user.vip_expires_at || '', selections };
  const existing = await base44.asServiceRole.entities.VipAppearance.filter({ owner_id: user.id }, '-created_date', 1);
  const previous = existing[0];
  if (!previous) await base44.asServiceRole.entities.VipAppearance.create(value);
  else if (previous.level !== level || previous.expires_at !== value.expires_at || JSON.stringify(previous.selections) !== JSON.stringify(selections)) await base44.asServiceRole.entities.VipAppearance.update(previous.id, value);
}
export function inventoryView(rows, level, catalog) {
  return cosmeticFeatures(catalog).flatMap((feature) => {
    const row = rows.find((item) => item.kind === feature.key);
    return (row?.owned_levels || (row ? [row.level] : [])).filter((value) => VIP_LEVELS.includes(value) && value >= feature.minLevel).map((value) => ({
      kind: feature.key, level: value, theme: { ...catalog.levels.find((theme) => theme.level === value), ...(feature.key === 'frame' ? { frame_seed: row.owner_id, frame_level: level } : {}) },
      usable: level >= value && level >= feature.minLevel,
      equipped: row.active !== false && row.level === value,
      active: level >= value && level >= feature.minLevel && row.active !== false && row.level === value,
    }));
  });
}
export async function publicVipLooks(base44, records, catalog) {
  const ids = [...new Set(records.map((record) => record.id))].slice(0, 100);
  if (!ids.length) return {};
  const authoritative = await base44.asServiceRole.entities.User.filter({ id: { $in: ids } }, '-created_date', ids.length);
  const active = authoritative.filter((user) => {
    const expiry = Date.parse(user.vip_expires_at || '');
    return VIP_LEVELS.includes(user.vip_level) && (Number.isNaN(expiry) || expiry > Date.now());
  });
  const stored = [];
  if (active.length) {
    let cursor;
    for (let pageNumber = 0; pageNumber < 6; pageNumber += 1) {
      const page = await base44.asServiceRole.entities.VipCosmetic.filter({ owner_id: { $in: active.map((user) => user.id) }, kind: { $in: cosmeticFeatures(catalog).map((feature) => feature.key) } }, { sort: '-created_date', limit: 500, ...(cursor ? { cursor } : {}) });
      stored.push(...page.items);
      if (!page.has_more) break;
      cursor = page.next_cursor;
    }
  }
  // Kişi + kozmetik başına tek kayıt okunur: mükerrer satırlar görünümü geri getirmez.
  const canonical = new Map();
  stored.forEach((row) => {
    const key = `${row.owner_id}|${row.kind}`;
    const current = canonical.get(key);
    if (!current || rowScore(row) > rowScore(current)) canonical.set(key, row);
  });
  const result = {};
  for (const user of authoritative) {
    const level = active.some((row) => row.id === user.id) ? user.vip_level : 0;
    const look = {};
    if (level) for (const feature of cosmeticFeatures(catalog)) {
      const row = canonical.get(`${user.id}|${feature.key}`);
      const selected = row ? row.active !== false ? row.level : 0 : level;
      const owned = !row || (row.owned_levels || [row.level]).includes(selected);
      if (owned && selected >= feature.minLevel && selected <= level) {
        const theme = catalog.levels.find((value) => value.level === selected);
        if (theme) look[feature.key] = feature.key === 'frame' ? { ...theme, frame_seed: user.id, frame_level: level } : theme;
      }
    }
    const expiry = Date.parse(user.vip_expires_at || '');
    result[user.id] = { vip_level: level, vip_days_left: level && Number.isFinite(expiry) ? Math.max(0, Math.ceil((expiry - Date.now()) / 86400000)) : 0, vip_expires_at: user.vip_expires_at || '', vip_look: look, vip_look_initialized: true };
  }
  return result;
}