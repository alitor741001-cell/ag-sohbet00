/**
 * Eski Supabase ayna katmanının yerini alan Base44 katmanı.
 * Supabase iptal edildi: tüm veri yalnızca Base44'te tutulur.
 * İşlem kilitleri AppLock kayıtlarıyla yapılır; ayna okumaları boş döner
 * ve çağıranlar doğrudan Base44'ten okur.
 */
const LOCK_TTL_MS = 30000;

export async function giftLock(base44, keys, token, release = false) {
  const locks = base44.asServiceRole.entities.AppLock;
  if (release) {
    await locks.deleteMany({ token }).catch(() => {});
    return true;
  }
  const now = new Date().toISOString();
  await locks.deleteMany({ key: { $in: keys }, expires_at: { $lt: now } }).catch(() => {});
  const busy = await locks.filter({ key: { $in: keys } }, '-created_date', 1);
  if (busy.length) return false;
  const expires_at = new Date(Date.now() + LOCK_TTL_MS).toISOString();
  await locks.bulkCreate(keys.map((key) => ({ key, token, expires_at })));
  // Aynı anda iki istek yazdıysa ilk yazan kazanır.
  const rows = await locks.filter({ key: { $in: keys } }, 'created_date', 500);
  const lost = keys.some((key) => rows.find((row) => row.key === key)?.token !== token);
  if (lost) { await locks.deleteMany({ token }).catch(() => {}); return false; }
  return true;
}

export async function readRows() { return null; }
export async function writeProfileSummary() { return false; }
export async function readProfileSummary() { return null; }
export async function mirrorPayload() { return null; }
export async function walletFromMirror() { return null; }
export async function mirrorRecord() { return false; }
export async function mirrorRoomDetail() { return false; }
export async function runSync() { return { disabled: true }; }