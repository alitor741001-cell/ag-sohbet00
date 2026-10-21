import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

const LIMIT = 200;
// Aynı kişi kısa sürede tekrar bakarsa yeni ziyaret kaydı açılmaz: kayıt tazelenir.
const VISIT_WINDOW_MS = 30 * 60 * 1000;

const clean = (user) => ({
  id: user.id,
  name: user.username || user.full_name || 'Kullanıcı',
  avatar: user.avatar || '',
  member_id: user.member_id || ''
});

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const me = await base44.auth.me();
    if (!me) return Response.json({ error: 'Oturum gerekli' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');
    const db = base44.asServiceRole.entities;

    if (action === 'follow' || action === 'unfollow') {
      const targetId = String(body.user_id || '');
      if (!targetId || targetId === me.id) return Response.json({ error: 'Geçersiz kullanıcı' }, { status: 400 });
      if (action === 'follow') {
        const existing = await db.Follow.filter({ follower_id: me.id, following_id: targetId }, '-created_date', 1);
        if (!existing.length) await db.Follow.create({ follower_id: me.id, following_id: targetId });
        return Response.json({ ok: true, following: true });
      }
      await db.Follow.deleteMany({ follower_id: me.id, following_id: targetId });
      return Response.json({ ok: true, following: false });
    }

    if (action === 'state') {
      const targetId = String(body.user_id || '');
      if (!targetId) return Response.json({ error: 'Kullanıcı gerekli' }, { status: 400 });
      const [mine, followers, following] = await Promise.all([
        db.Follow.filter({ follower_id: me.id, following_id: targetId }, '-created_date', 1),
        db.Follow.filter({ following_id: targetId }, '-created_date', LIMIT),
        db.Follow.filter({ follower_id: targetId }, '-created_date', LIMIT)
      ]);
      return Response.json({
        following: mine.length > 0,
        followers: followers.length,
        following_count: following.length
      });
    }

    if (action === 'list') {
      const targetId = String(body.user_id || me.id);
      const kind = body.kind === 'following' ? 'following' : 'followers';
      const rows = await db.Follow.filter(
        kind === 'following' ? { follower_id: targetId } : { following_id: targetId },
        '-created_date',
        LIMIT
      );
      const ids = [...new Set(rows.map((row) => (kind === 'following' ? row.following_id : row.follower_id)).filter(Boolean))];
      const users = ids.length ? await db.User.filter({ id: { $in: ids } }, '-created_date', LIMIT) : [];
      const byId = new Map(users.map((user) => [user.id, clean(user)]));
      return Response.json({ items: ids.map((id) => byId.get(id)).filter(Boolean) });
    }

    if (action === 'visit') {
      const profileId = String(body.profile_id || '');
      if (!profileId || profileId === me.id) return Response.json({ ok: true });
      const recent = await db.ProfileVisit.filter({ profile_id: profileId, visitor_id: me.id }, '-visited_at', 1);
      const last = recent[0];
      const now = Date.now();
      const stamp = last ? new Date(last.visited_at || last.updated_date || last.created_date).getTime() : 0;
      if (last && now - stamp < VISIT_WINDOW_MS) return Response.json({ ok: true, throttled: true });
      const visitedAt = new Date(now).toISOString();
      if (last) await db.ProfileVisit.update(last.id, { visited_at: visitedAt });
      else await db.ProfileVisit.create({ profile_id: profileId, visitor_id: me.id, visited_at: visitedAt });
      return Response.json({ ok: true });
    }

    if (action === 'visitors') {
      const rows = await db.ProfileVisit.filter({ profile_id: me.id }, '-visited_at', 60);
      const seen = new Set();
      const ordered = [];
      rows.forEach((row) => {
        if (!row.visitor_id || seen.has(row.visitor_id)) return;
        seen.add(row.visitor_id);
        ordered.push(row);
      });
      const ids = ordered.map((row) => row.visitor_id);
      const users = ids.length ? await db.User.filter({ id: { $in: ids } }, '-created_date', LIMIT) : [];
      const byId = new Map(users.map((user) => [user.id, clean(user)]));
      return Response.json({
        items: ordered
          .map((row) => {
            const person = byId.get(row.visitor_id);
            return person ? { ...person, visited_at: row.visited_at || '' } : null;
          })
          .filter(Boolean)
      });
    }

    if (action === 'stats') {
      const targetId = String(body.user_id || me.id);
      const [following, followers, visitors] = await Promise.all([
        db.Follow.filter({ follower_id: targetId }, '-created_date', LIMIT),
        db.Follow.filter({ following_id: targetId }, '-created_date', LIMIT),
        db.ProfileVisit.filter({ profile_id: targetId }, '-visited_at', LIMIT)
      ]);
      return Response.json({
        following: following.length,
        followers: followers.length,
        visitors: visitors.length
      });
    }

    return Response.json({ error: 'Geçersiz işlem' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || 'İşlem başarısız' }, { status: 500 });
  }
}