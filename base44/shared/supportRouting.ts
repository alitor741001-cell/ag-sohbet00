import { giftLock } from './supabaseMirror.ts';

/** Persistent least-loaded routing. Existing conversations keep their official. */
export async function routeSupport(base44) {
  const e = base44.asServiceRole.entities;
  const officialIds = new Set();
  let cursor;
  do {
    const page = await e.AgOfficial.filter({ active: true }, { limit: 100, cursor });
    const ids = [...new Set(page.items.map(row => row.user_id).filter(Boolean))];
    const users = ids.length ? await e.User.filter({ id: { $in: ids } }, '-created_date', ids.length) : [];
    users.filter(user => user.role !== 'admin' && user.role !== 'banned' && !user.is_banned).forEach(user => officialIds.add(user.id));
    cursor = page.has_more ? page.next_cursor : undefined;
  } while (cursor);
  const roster = [...officialIds].sort();
  if (!roster.length) return;
  const pending = { status: { $ne: 'closed' }, assigned_official_id: { $nin: roster } };
  if (!await e.SupportTicket.count(pending)) return;
  const token = crypto.randomUUID();
  if (!await giftLock(base44, ['support-routing'], token)) return;
  try {
    const totals = await e.SupportTicket.aggregate({ query: { status: { $ne: 'closed' } }, groupBy: 'assigned_official_id' });
    const loads = new Map(roster.map(id => [id, totals.rows.find(row => row.assigned_official_id === id)?.count || 0]));
    while (true) {
      const page = await e.SupportTicket.filter(pending, { sort: 'created_date', limit: 100 });
      if (!page.items.length) break;
      const updates = page.items.map(ticket => {
        const id = roster.reduce((best, candidate) => loads.get(candidate) < loads.get(best) ? candidate : best);
        loads.set(id, loads.get(id) + 1);
        return { id: ticket.id, assigned_official_id: id };
      });
      await e.SupportTicket.bulkUpdate(updates);
      if (!page.has_more) break;
    }
  } finally { await giftLock(base44, ['support-routing'], token, true); }
}

export function supportPayload(body) {
  const text = typeof body.text === 'string' ? body.text.trim() : '';
  const file = typeof body.file_url === 'string' ? body.file_url : '';
  if (text.length > 2000 || file.length > 2048 || (!text && !file) || (file && !/^https:\/\//i.test(file))) return null;
  return { text, ...(file ? { file_url: file, media_type: body.media_type === 'video' ? 'video' : 'image' } : {}) };
}