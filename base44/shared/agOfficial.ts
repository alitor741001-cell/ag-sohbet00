export async function isAgOfficial(base44, user) {
  if (!user || user.is_banned || user.role === 'banned') return false;
  const rows = await base44.asServiceRole.entities.AgOfficial.filter({ user_id: user.id, active: true }, '-created_date', 1);
  return rows.length > 0;
}