/** Kota ajansı: onaylı kendi ajansı üyelikten önce gelir; geçmiş ödüller değişmez. */
export async function quotaAgency(base44, account) {
  const entities = base44.asServiceRole.entities;
  const ownId = account.owned_agency_id || (account.agency_role === 'owner' ? account.agency_record_id : '');
  const owned = ownId ? await entities.Agency.get(ownId) : null;
  if (owned?.owner_id === account.id && owned.active !== false && owned.status === 'active') return owned;
  if (!account.agency_record_id) return null;
  const member = ownId === account.agency_record_id ? owned : await entities.Agency.get(account.agency_record_id);
  return member && member.active !== false && member.status !== 'pending' && member.status !== 'rejected' ? member : null;
}

/** Ajansın yayıncı listesine kendi kotasını kazanan sahibi de dahildir. */
export const agencyMemberQuery = (agency) => ({
  $or: [
    { id: agency.owner_id },
    { agency_record_id: agency.id, $or: [
      { owned_agency_id: agency.id },
      { owned_agency_id: { $in: ['', null] } },
      { owned_agency_id: { $exists: false } },
      { owned_agency_status: { $ne: 'active' } },
    ] },
  ],
});