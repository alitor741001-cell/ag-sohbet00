// ÇEYREK MAFYA: roller, aşamalar ve anlatım metinleri.
// Sunucudaki motorla aynı değerler: süre, oyuncu sayısı ve rol dağılımı.

export const MAFYA_MIN_PLAYERS = 4;
export const MAFYA_MAX_PLAYERS = 8;

export const PHASE_MS = {
  reveal: 18000,
  night: 35000,
  day: 30000,
  vote: 25000,
};

export const PHASE_LABEL = {
  waiting: 'ODA BEKLİYOR',
  reveal: 'ROL DAĞITIMI',
  night: 'GECE',
  day: 'GÜNDÜZ',
  vote: 'OYLAMA',
  finished: 'OYUN BİTTİ',
};

// Roller: renk, simge ve görev açıklaması.
export const ROLES = [
  {
    id: 'mafya',
    name: 'MAFYA',
    side: 'karanlik',
    icon: 'mafya',
    tone: '#e02b2b',
    glow: 'rgba(224, 43, 43, 0.55)',
    duty: 'Gece bir kişiyi vurursun.',
    action: 'VUR',
  },
  {
    id: 'seytan',
    name: 'ŞEYTAN',
    side: 'karanlik',
    icon: 'seytan',
    tone: '#ff7a1a',
    glow: 'rgba(255, 122, 26, 0.55)',
    duty: 'Gece bir kişinin gücünü bloke edersin.',
    action: 'BLOKE ET',
  },
  {
    id: 'terorist',
    name: 'TERÖRİST',
    side: 'karanlik',
    icon: 'terorist',
    tone: '#b30000',
    glow: 'rgba(179, 0, 0, 0.6)',
    duty: 'Gece bir kişiye bomba yerleştirirsin.',
    action: 'BOMBA',
  },
  {
    id: 'polis',
    name: 'POLİS',
    side: 'sehir',
    icon: 'polis',
    tone: '#2f7fe0',
    glow: 'rgba(47, 127, 224, 0.55)',
    duty: 'Sorguladığın kişi karanlık tarafta mı, öğrenirsin.',
    action: 'SORGULA',
  },
  {
    id: 'doktor',
    name: 'DOKTOR',
    side: 'sehir',
    icon: 'doktor',
    tone: '#2f9fe0',
    glow: 'rgba(47, 159, 224, 0.55)',
    duty: 'Gece bir kişiyi korursun; kendini de koruyabilirsin.',
    action: 'KORU',
  },
  {
    id: 'komiser',
    name: 'KOMİSER',
    side: 'sehir',
    icon: 'komiser',
    tone: '#3f6fe8',
    glow: 'rgba(63, 111, 232, 0.55)',
    duty: 'Gücün tek kullanımlık: bir kişinin rolünü tam öğrenirsin.',
    action: 'ROLÜNÜ ÖĞREN',
  },
  {
    id: 'gozcu',
    name: 'GÖZCÜ',
    side: 'sehir',
    icon: 'gozcu',
    tone: '#33aa33',
    glow: 'rgba(51, 170, 51, 0.55)',
    duty: 'Gözettiğin kişiyi bu gece kimlerin ziyaret ettiğini görürsün.',
    action: 'GÖZETLE',
  },
  {
    id: 'vatandas',
    name: 'VATANDAŞ',
    side: 'sehir',
    icon: 'vatandas',
    tone: '#9aa4b2',
    glow: 'rgba(154, 164, 178, 0.45)',
    duty: 'Gece gücün yok; gündüz tartışıp doğru kişiyi oylamalısın.',
    action: '',
  },
];

export const ROLE_MAP = ROLES.reduce((map, role) => ({ ...map, [role.id]: role }), {});

export const KARANLIK_IDS = ['mafya', 'seytan', 'terorist'];

export const sideLabel = (side) => (side === 'karanlik' ? 'KARANLIK TARAF' : 'ŞEHİR');

export const roleOf = (roleId) => ROLE_MAP[roleId] || null;

// Referans tasarımdaki dört adımlı anlatım.
export const INTRO_STEPS = [
  { icon: 'katil', title: 'KATIL', text: 'Oda oluştur ya da açık bir odaya gir. Oyun başlasın.' },
  { icon: 'rol', title: 'ROLÜNÜ SEÇ', text: 'Mafya, Polis, Doktor... Rolün gizli kalır.' },
  { icon: 'strateji', title: 'STRATEJİNİ KUR', text: 'Kime güveneceksin? Kimi sorgulayacaksın?' },
  { icon: 'kal', title: 'HAYATTA KAL', text: 'Son çeyreğe sen kal!' },
];

// Beş adımlı oyun akışı.
export const FLOW_STEPS = [
  { no: 1, title: 'OYUNA KATIL', text: 'Oda kur veya mevcut bir odaya katıl.' },
  { no: 2, title: 'ROLÜNÜ AL', text: 'Her oyuncuya gizli bir rol dağıtılır.' },
  { no: 3, title: 'GECE AKSİYONU', text: 'Rolüne göre vur, sorgula, koru ya da bloke et.' },
  { no: 4, title: 'GÜNDÜZ TARTIŞ', text: 'Şüphelileri konuş, tartış ve oylama yap.' },
  { no: 5, title: 'SON ÇEYREK', text: 'Son 4 kişi kaldığında gerilim dorukta!' },
];