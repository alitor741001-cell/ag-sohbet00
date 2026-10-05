/**
 * Ajans rolü çözümü: sahip olunan ajans (owned_agency_*) üyelikten (agency_record_id) önce gelir.
 * Başka bir ajanda yayıncı olan kişi böylece kendi ajansının panelini görür; hediye ve kota akışı
 * üye olduğu ilk ajansa işlemeye devam eder.
 */
export function resolveAgencyRole({ profile = {}, owned = null, membership = null, userId = '' } = {}) {
  const ownedId = profile?.owned_agency_id || owned?.id || '';
  if (ownedId) {
    const status = owned?.status || profile?.owned_agency_status || 'pending';
    if (status !== 'rejected') return status === 'pending' ? 'pending' : 'owner';
  }
  if (!profile?.agency_record_id) return '';
  if (profile?.agency_role === 'owner' || membership?.owner_id === userId) {
    return membership?.status === 'pending' ? 'pending' : 'owner';
  }
  return profile?.agency_role === 'assistant' ? 'assistant' : 'broadcaster';
}

/** Kart ve başlık etiketi: sahipse kendi ajansı, değilse üye olduğu ajans. */
export function agencyLabel({ profile = {}, owned = null, membership = null, role = '' } = {}) {
  if (role === 'owner' || role === 'pending') {
    return {
      name: owned?.name || profile?.owned_agency_name || '',
      code: owned?.agency_id || profile?.owned_agency_code || '',
    };
  }
  return {
    name: membership?.name || profile?.agency_name || '',
    code: membership?.agency_id || profile?.agency_code || '',
  };
}