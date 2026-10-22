export async function getCosmeticSelection(base44, ownerId) {
  const found = await base44.asServiceRole.entities.CosmeticSelection.filter({ owner_id: ownerId }, '-created_date', 1);
  return found[0] || { owner_id: ownerId, entrance_mode: 'random', show_entrances: true, reduce_motion: false, seat_product_id: '' };
}
export async function saveCosmeticSelection(base44, ownerId, patch) {
  const current = await getCosmeticSelection(base44, ownerId);
  return current.id ? base44.asServiceRole.entities.CosmeticSelection.update(current.id, patch) : base44.asServiceRole.entities.CosmeticSelection.create({ ...current, ...patch });
}