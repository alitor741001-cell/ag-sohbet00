export function hasActiveMembership(user) {
  // Abonelik/paket sistemi kaldırıldı: hesabı olan herkes erişebilir.
  // Ban ve askıya alma kontrolleri ayrı yapılır.
  return !!user;
}