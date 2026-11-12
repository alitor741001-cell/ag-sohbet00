// Havuz ayar alanları: etiket, birim ve açıklama.
export const GAME_NAMES = { dede: 'Dede', elimin: 'Elimin Slot', fruit: 'Meyve', sekerli: 'Şekerli Meyve' };

export const POOL_FIELDS = [
  { key: 'cut_pct', label: 'Havuz kesintisi', unit: '%' },
  { key: 'rtp_pct', label: 'RTP (oyuncuya geri dönüş)', unit: '%' },
  { key: 'small_max', label: 'Küçük kazanç üst sınırı', unit: 'x bahis' },
  { key: 'medium_max', label: 'Orta kazanç üst sınırı', unit: 'x bahis' },
  { key: 'big_max', label: 'Büyük kazanç üst sınırı', unit: 'x bahis' },
  { key: 'max_win', label: 'Maksimum kazanç (tur)', unit: 'x bahis' },
  { key: 'free_limit', label: 'Free Spins ödeme limiti (seri)', unit: 'x tur değeri' },
  { key: 'min_stake', label: 'Minimum toplam bahis', unit: 'coin' },
  { key: 'max_stake', label: 'Maksimum toplam bahis', unit: 'coin' },
  { key: 'balance', label: 'Havuz bakiyesi', unit: 'coin' },
];

export const formatNumber = (value) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(Number(value) || 0);