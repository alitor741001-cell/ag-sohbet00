/** Sesli oda arka planları: oda türüne göre filtrelenir, seçilen zemin odaya işlenir. */
export const ROOM_TYPES = [
  { key: 'all', label: 'Tümü' },
  { key: 'cift', label: 'Çift' },
  { key: 'arkadas', label: 'Arkadaş' },
  { key: 'sohbet', label: 'Sohbet' },
];

export const ROOM_BACKGROUNDS = [
  {
    key: 'ask-bahcesi',
    label: 'Aşk Bahçesi',
    type: 'cift',
    accent: '#ff8fb3',
    background:
      'radial-gradient(120% 80% at 50% 0%, #7a1f45 0%, #3d0f2b 48%, #140513 100%)',
  },
  {
    key: 'kalp-isigi',
    label: 'Kalp Işığı',
    type: 'cift',
    accent: '#ff5d8f',
    background:
      'radial-gradient(90% 70% at 50% 100%, #ff3f6e 0%, #7b1140 42%, #1b0413 100%)',
  },
  {
    key: 'gun-batimi',
    label: 'Gün Batımı',
    type: 'cift',
    accent: '#ffb27a',
    background:
      'radial-gradient(100% 70% at 70% 0%, #ff9a62 0%, #a83f5e 45%, #240a22 100%)',
  },
  {
    key: 'yildiz-yolu',
    label: 'Yıldız Yolu',
    type: 'arkadas',
    accent: '#8fd8ff',
    background:
      'radial-gradient(110% 80% at 50% 0%, #1b3a80 0%, #0d1b45 52%, #03061a 100%)',
  },
  {
    key: 'sahil-atesi',
    label: 'Sahil Ateşi',
    type: 'arkadas',
    accent: '#6fe6dc',
    background:
      'radial-gradient(90% 80% at 20% 100%, #0f6f6a 0%, #123a55 48%, #04101c 100%)',
  },
  {
    key: 'kuzey-isiklari',
    label: 'Kuzey Işıkları',
    type: 'arkadas',
    accent: '#9dffd0',
    background:
      'radial-gradient(120% 70% at 50% 0%, #1f7a6a 0%, #22255c 50%, #06061c 100%)',
  },
  {
    key: 'neon-sehir',
    label: 'Neon Şehir',
    type: 'sohbet',
    accent: '#ff7ae0',
    background:
      'radial-gradient(100% 80% at 80% 10%, #7a2bd6 0%, #29104f 48%, #06020f 100%)',
  },
  {
    key: 'galaksi',
    label: 'Galaksi',
    type: 'sohbet',
    accent: '#b79bff',
    background:
      'radial-gradient(120% 90% at 30% 0%, #4b2f9e 0%, #180f3d 48%, #04020e 100%)',
  },
  {
    key: 'orman-gecesi',
    label: 'Orman Gecesi',
    type: 'sohbet',
    accent: '#8ef0b0',
    background:
      'radial-gradient(110% 80% at 40% 0%, #14563a 0%, #0a2a28 50%, #030b0a 100%)',
  },
  {
    key: 'altin-saray',
    label: 'Altın Saray',
    type: 'sohbet',
    accent: '#f0c469',
    background:
      'radial-gradient(110% 80% at 50% 0%, #6b4a12 0%, #2c1c08 50%, #0b0603 100%)',
  },
];

export const backgroundOf = (key) => ROOM_BACKGROUNDS.find((item) => item.key === key) || null;

/** Odanın zemini: seçim yoksa uygulamanın varsayılan gece mavisi. */
export const backgroundCss = (key) =>
  backgroundOf(key)?.background ||
  'radial-gradient(120% 80% at 50% 0%, #123062 0%, #081a3a 46%, #04081a 100%)';