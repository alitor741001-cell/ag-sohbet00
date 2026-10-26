/**
 * Yayıncı durumu tek kaynaktan çözülür: kişi yayıncı olduğunda ya da bir ajansa
 * girdiğinde profil kartındaki ülke etiketi Almanya'ya döner ve oyun merkezi açılır.
 * Değerler kullanıcı kaydından okunur; oturumdaki kullanıcı canlı dinlendiği için
 * (useCurrentUser) değişiklik yoklama beklemeden ekrana düşer.
 */
const NEW_MEMBER_DAYS = 7;

/** Son bir hafta içinde kaydolan hesap "yeni üye" sayılır; yayıncıysa "yeni yayıncı" etiketi alır. */
export function isNewMember(profile) {
  const created = new Date(profile?.created_date || 0).getTime();
  return !!created && Date.now() - created < NEW_MEMBER_DAYS * 86400000;
}

export function broadcasterState(profile) {
  const source = profile || {};
  const active = source.broadcaster_status === 'active'
    || !!source.agency_record_id
    || !!source.agency_name
    || !!source.owned_agency_id
    || !!source.owned_agency_name
    || source.agency_role === 'owner'
    || source.agency_role === 'assistant';
  return {
    active,
    country: active ? 'Almanya' : 'Türkiye',
    flag: active ? '🇩🇪' : '🇹🇷',
    // Oyun merkezi yönetici hesabında da açıktır; ülke etiketi ve geri kalan her şey aynı kalır.
    games: active || source.role === 'admin',
  };
}