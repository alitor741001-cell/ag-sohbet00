/**
 * Yayıncı durumu tek kaynaktan çözülür: kişi yayıncı olduğunda ya da bir ajansa
 * girdiğinde profil kartındaki ülke etiketi Almanya'ya döner ve oyun merkezi açılır.
 * Değerler kullanıcı kaydından okunur; oturumdaki kullanıcı canlı dinlendiği için
 * (useCurrentUser) değişiklik yoklama beklemeden ekrana düşer.
 */
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