/**
 * Tam ekran profil kartının cinsiyete göre renk paleti.
 * Kadın → görseldeki pembe/altın ton, Erkek → mavi/kırmızı ton, Gizli kullanıcı → maskeli altın-gri.
 */
const FEMALE = {
  bg: 'radial-gradient(circle at 50% 0%, rgba(255,0,110,0.22), transparent 62%), #050305',
  accent: '#FF006E',
  accent2: '#FFD700',
  danger: '#FF3D71',
  soft: 'rgba(255,0,110,0.22)',
  glow: 'rgba(255,0,110,0.55)',
  symbol: '♀',
};

const MALE = {
  bg: 'radial-gradient(circle at 50% 0%, rgba(46,125,255,0.26), transparent 62%), #03050C',
  accent: '#2E7DFF',
  accent2: '#FFD700',
  danger: '#FF2D2D',
  soft: 'rgba(46,125,255,0.24)',
  glow: 'rgba(46,125,255,0.55)',
  symbol: '♂',
};

const MASKED = {
  bg: 'radial-gradient(circle at 50% 0%, rgba(242,206,107,0.18), transparent 62%), #0A0806',
  accent: '#F2CE6B',
  accent2: '#F2CE6B',
  danger: '#D66868',
  soft: 'rgba(242,206,107,0.22)',
  glow: 'rgba(242,206,107,0.45)',
  symbol: '?',
};

export function genderPalette(gender, hidden = false) {
  if (hidden) return MASKED;
  return gender === 'erkek' ? MALE : FEMALE;
}

/** Doğum tarihinden yaş; boş/geçersiz tarihte null. */
export function ageFromBirthDate(birthDate) {
  const time = Date.parse(String(birthDate || ''));
  if (Number.isNaN(time)) return null;
  const birth = new Date(time);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const beforeBirthday = now.getMonth() < birth.getMonth()
    || (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate());
  if (beforeBirthday) age -= 1;
  return age >= 0 && age < 130 ? age : null;
}

/** Tarih (kayıt/doğum) → 3.10.2026 biçimi. */
export function formatDate(value) {
  const time = Date.parse(String(value || ''));
  if (Number.isNaN(time)) return '-';
  return new Date(time).toLocaleDateString('tr-TR');
}