import { base44 } from '@/api/base44Client';

/** Ajans servisine kısa yol: tek çağrıda tüm ajans/yayıncı işlemleri. */
export async function agencyApi(action, payload = {}) {
  const response = await base44.functions.invoke('agency-service', { action, ...payload });
  return response?.data || {};
}

export const AGENCY_GOLD = '#F5C542';

/** Sohbetteki davet kartı işareti — kartı gösteren mesajlar bu işareti taşır. */
export function parseInviteMarker(text) {
  const match = /^\{\{AGENCY_INVITE\|([^}]+)\}\}$/.exec(String(text || '').trim());
  return match ? match[1] : null;
}

/** Bildirim kaydındaki davet referansından davet kimliğini çıkarır. */
export function parseInviteRef(refId) {
  const match = /^agency-invite:(.+)$/.exec(String(refId || '').trim());
  return match ? match[1] : '';
}

/** İçinde bulunulan ay anahtarı (YYYY-MM, Türkiye saatiyle) — kota tamamlanmaları ay bazlıdır. */
export const currentPeriod = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' }).slice(0, 7);

export const formatDiamonds = (value) => Number(value || 0).toLocaleString('tr-TR');

export const formatMoney = (value) => `$${Number(value || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

/** Elması kısa biçimde yazar: 250.000 → 250K, 12.500.000 → 12,5 M */
export function formatShortDiamonds(value) {
  const n = Math.max(0, Number(value) || 0);
  if (n >= 1000000000) return `${(n / 1000000000).toFixed(2).replace('.', ',')} Mr`;
  if (n >= 1000000) return `${(n / 1000000).toFixed(2).replace('.', ',')} M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return `${n}`;
}

/**
 * Kota ilerleme yüzdesi: hedefe gerçekten ulaşılmadan 100 gösterilmez.
 * (Örn. 299.000 / 300.000 yuvarlamayla 100'e çıkmaz, %99'da durur.)
 */
export function quotaPercent(current, target) {
  const value = Math.max(0, Number(current) || 0);
  const goal = Math.max(0, Number(target) || 0);
  if (goal <= 0 || value >= goal) return 100;
  return Math.min(99, Math.floor((value / goal) * 100));
}

/** Kota kademesi görünümü: elmas arttıkça kademe rengi yükselir. */
export function tierStyle(diamonds) {
  const n = Number(diamonds) || 0;
  if (n >= 50000000) return { label: 'EFSANE', text: 'text-[#FF8080]', border: 'border-[#FF8080]/45', bg: 'bg-gradient-to-br from-[#3a0d12] to-[#12070a]' };
  if (n >= 10000000) return { label: 'ELMAS', text: 'text-[#F5C542]', border: 'border-[#F5C542]/45', bg: 'bg-gradient-to-br from-[#2a1f06] to-[#100c04]' };
  if (n >= 2000000) return { label: 'ALTIN', text: 'text-[#C084FC]', border: 'border-[#C084FC]/45', bg: 'bg-gradient-to-br from-[#211238] to-[#0c0817]' };
  return { label: 'BAŞLANGIÇ', text: 'text-[#5AB8FF]', border: 'border-[#5AB8FF]/45', bg: 'bg-gradient-to-br from-[#0b1b2c] to-[#070c14]' };
}

export function dateText(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Istanbul' });
}

export const TRANSFER_LABELS = {
  pending: 'Onay bekliyor',
  completed: 'Tamamlandı',
  rejected: 'Reddedildi',
  cancelled: 'İptal edildi',
};