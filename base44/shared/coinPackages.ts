/**
 * Coin paketleri: coin miktarı ve TL fiyatı tek yerden yönetilir.
 * Uygulamadaki "Coins Yükle" paneli ve admin panelindeki başvuru listesi bu listeyi okur.
 * Fiyatlar 50.000 coin = 230 ₺ (1.000 coin = 4,60 ₺) sabit kuruyla ilerler.
 */
export const COIN_PACKAGES = Array.from({ length: 20 }, (_, index) => {
  const step = index + 1;
  const coins = step * 50000;
  return {
    id: `c${step}`,
    name: `${coins.toLocaleString('tr-TR')} Coins`,
    coins,
    price: step * 230,
  };
});

/** Paket kimliğinden paketi bulur (geçersiz kimlikte null döner). */
export function findCoinPackage(id: any) {
  const key = String(id || '');
  return COIN_PACKAGES.find((pack) => pack.id === key) || null;
}