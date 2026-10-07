import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { rateLimit, safeErrorResponse } from '../../shared/security.ts';
import { badgeLevels } from '../../shared/userLevels.ts';
import { readRows } from '../../shared/supabaseMirror.ts';

// Ağır profil okuması Supabase aynasından gelir; aynada olmayan kayıt kaynaktan tamamlanır.
const MIRROR_TABLE = 'app_users';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json();
    // Rate limit: 60 istek / dakika
    const rl = await rateLimit(base44, 'user-profile:' + user.id, user.id, 60, 60000);
    if (!rl.allowed) return Response.json({ error: 'çok fazla istek' }, { status: 429 });

    const accountStatus = (u) => u?.is_banned || u?.role === 'banned' || u?.membership_status === 'blocked'
      ? 'banned'
      : 'active';

    const toProfile = (u) => ({
      username: u.username || '', full_name: u.full_name || '', avatar: u.avatar || '',
      member_id: u.member_id || '-', role: u.role || '', display_role: u.display_role || '',
      custom_role: u.custom_role || null, profile_frame: u.profile_frame || '',
      profile_frame_scale: u.profile_frame_scale || 100,
      profile_frame_entrance_enabled: !!u.profile_frame_entrance_enabled,
      special_frame_id: u.special_frame_id || '', special_frame_title: u.special_frame_title || '',
      special_frame_entry: u.special_frame_entry !== false, special_frame_exit: u.special_frame_exit !== false,
      title: u.title || '', created_date: u.created_date || null,
      gender: u.gender || '', birth_date: u.birth_date || '',
      account_status: accountStatus(u),
      agency_role: u.agency_role || '', agency_name: u.agency_name || '', agency_code: u.agency_code || '',
      agency_record_id: u.agency_record_id || '', broadcaster_status: u.broadcaster_status || '',
      owned_agency_id: u.owned_agency_id || '', owned_agency_name: u.owned_agency_name || '', owned_agency_code: u.owned_agency_code || '',
      ...badgeLevels(u),
    });

    // Aynadan okuma: kayıtlar `payload` içinde tam profil olarak durur.
    const readMirror = async (ids) => {
      const query = ids.length === 1
        ? `select=payload&id=eq.${encodeURIComponent(ids[0])}&limit=1`
        : `select=payload&id=in.(${ids.map((id) => `"${id}"`).join(',')})`;
      const rows = await readRows(base44, MIRROR_TABLE, query);
      const found = new Map();
      (Array.isArray(rows) ? rows : []).forEach((row) => {
        const record = row?.payload;
        if (record?.id) found.set(record.id, record);
      });
      return found;
    };

    // Batch modu: birden fazla kullanıcı profilini tek sorguda getir (N+1 önleme)
    const { user_id, user_ids } = body || {};
    if (Array.isArray(user_ids) && user_ids.length > 0) {
      const ids = [...new Set(user_ids.filter((id) => typeof id === 'string' && id))].slice(0, 100);
      const found = ids.length ? await readMirror(ids) : new Map();
      const missing = ids.filter((id) => !found.has(id));
      if (missing.length) {
        const users = await base44.asServiceRole.entities.User.filter({ id: { $in: missing } }, '-created_date', missing.length).catch(() => []);
        (users || []).forEach((u) => { if (u) found.set(u.id, u); });
      }
      const profiles = {};
      ids.forEach((id) => { const record = found.get(id); if (record) profiles[id] = toProfile(record); });
      return Response.json({ data: profiles });
    }

    if (!user_id) return Response.json({ error: 'user_id gerekli' }, { status: 400 });
    const found = await readMirror([user_id]);
    const u = found.get(user_id) || await base44.asServiceRole.entities.User.get(user_id).catch(() => null);
    if (!u) return Response.json({ error: 'kullanıcı bulunamadı' }, { status: 404 });
    return Response.json(toProfile(u));
  } catch (e) {
    return safeErrorResponse(e);
  }
}