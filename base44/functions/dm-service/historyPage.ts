// Called only after the handler verifies conversation membership.
export default async function historyPage(base44, userId, conversationId, cursor) {
  if (cursor != null && (typeof cursor !== 'string' || cursor.length > 8192)) {
    return Response.json({ error: 'Geçersiz sayfa bilgisi' }, { status: 400 });
  }
  const page = await base44.entities.ChatMessage.filter(
    { conversation_id: conversationId, deleted_for: { $nin: [userId] } },
    { sort: '-created_date', limit: 50, ...(cursor ? { cursor } : {}) }
  );
  return Response.json({
    messages: page.items,
    next_cursor: page.next_cursor || null,
    has_more: Boolean(page.has_more),
  });
}