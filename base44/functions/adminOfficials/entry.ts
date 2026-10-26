import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Giriş gerekli' }, { status: 401 });
    if (user.role !== 'admin' || user.is_banned) return Response.json({ error: 'Yalnızca admin görebilir' }, { status: 403 });
    const body = await req.json().catch(() => ({}));
    const page = await base44.asServiceRole.entities.AgOfficial.filter({ active: true }, { sort: '-created_date', limit: 30, ...(typeof body.cursor === 'string' ? { cursor: body.cursor } : {}) });
    const ids = [...new Set(page.items.map(row => row.user_id))];
    const users = ids.length ? await base44.asServiceRole.entities.User.filter({ id: { $in: ids } }, '-created_date', ids.length) : [];
    const byId = new Map(users.map(item => [item.id, item]));
    return Response.json({ ...page, items: page.items.map(row => {
      const member = byId.get(row.user_id);
      return { id: row.id, user_id: row.user_id, assigned_at: row.created_date, profile: member ? { id: member.id, username: member.username, full_name: member.full_name, avatar: member.avatar, member_id: member.member_id, profile_frame: member.profile_frame, profile_frame_scale: member.profile_frame_scale, is_banned: member.is_banned } : null };
    }) });
  } catch (error) { return Response.json({ error: error.message }, { status: 500 }); }
}