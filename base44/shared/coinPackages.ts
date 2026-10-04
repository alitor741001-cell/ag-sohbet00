/**
 * Coin paketleri: coin miktarı ve TL fiyatı tek yerden yönetilir.
 * Uygulamadaki "Coins Yükle" paneli ve admin paneli bu listeyi okur.
 */
export const COIN_PACKAGES = [
  { id: 'p1', name: 'Başlangıç', coins: 100000, price: 100 },
  { id: 'p2', name: 'Standart', coins: 250000, price: 200 },
  { id: 'p3', name: 'Avantaj', coins: 500000, price: 350 },
  { id: 'p4', name: 'Premium', coins: 1000000, price: 600 },
  { id: 'p5', name: 'Efsane', coins: 2500000, price: 1250 },
];

/** Paket kimliğinden paketi bulur (geçersiz kimlikte null döner). */
export function findCoinPackage(id: any) {
  const key = String(id || '');
  return COIN_PACKAGES.find((pack) => pack.id === key) || null;
}