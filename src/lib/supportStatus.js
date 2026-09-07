export function statusLabel(status) {
  const map = { new: 'Yeni', reviewing: 'İnceleniyor', answered: 'Cevaplandı', closed: 'Kapandı' };
  return map[status] || status;
}