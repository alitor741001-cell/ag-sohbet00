/**
 * Görünür e-posta: yönetici (admin) hesabının e-postası arayüzde hiçbir yerde gösterilmez.
 * Diğer hesapların e-postası normal şekilde döner.
 */
export function visibleEmail(user) {
  if (!user || user.role === 'admin') return '';
  return user.email || '';
}