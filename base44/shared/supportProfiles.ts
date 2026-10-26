export async function supportProfiles(entities, messages) {
  const ids = [...new Set(messages.map(message => message.user_id || message.owner_id).filter(Boolean))];
  const users = ids.length ? await entities.User.filter({ id: { $in: ids } }, '-created_date', ids.length) : [];
  const profiles = new Map(users.map(user => [user.id, user]));
  return messages.map(message => supportMessageProfile(message, profiles.get(message.user_id || message.owner_id)));
}

export function supportMessageProfile(message, user) {
  return { ...message, sender_gender: user?.gender || '', sender_name: user?.username || user?.full_name || '', sender_avatar: user?.avatar || '' };
}