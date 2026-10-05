// Seviye atlama duyuruları: "X 24 lvl atladı" → atış (hediye gönderme) seviyesi,
// "X 24 hediye lvl atladı" → hediye alma seviyesi.
const RECEIVED = /(\d+)\s*hediye lvl atladı/i;
const SENT = /(\d+)\s*lvl atladı/i;

/** Duyuru metnini çözer: { kind: 'sent' | 'received', level } ya da null. */
export function parseLevelUpNotice(text) {
  if (!text) return null;
  const received = RECEIVED.exec(text);
  if (received) return { kind: 'received', level: Number(received[1]) };
  const sent = SENT.exec(text);
  if (sent) return { kind: 'sent', level: Number(sent[1]) };
  return null;
}

/** Duyurudaki isim: seviye kısmı ayıklanır. */
export const levelUpName = (text) => (text || '').replace(/(\d+)\s*(hediye )?lvl atladı.*/i, '').trim();

// Renkler: atış seviyesi kehribar, hediye alma seviyesi mavi — ikisi karışmaz.
export const LEVEL_UP_TONE = { sent: 'text-amber-400', received: 'text-sky-400' };