import { base44 } from '@/api/base44Client';

// Oda kurulumunda girilen bilgiler hatırlanır: bir sonraki açılışta hiçbir şey sorulmaz,
// oda kayıtlı bilgilerle doğrudan açılır. Bilgiler hesaba yazılır (telefon değişse de kalır),
// aynı cihazda anında erişilebilsin diye cihaza da kopyalanır; en yeni kayıt geçerli olur.
const FIELDS = { voice: 'room_preset_voice', film: 'room_preset_film' };
const DEVICE_PREFIX = 'filmkeyfi_room_preset_';

const readDevicePreset = (kind) => {
  try { return JSON.parse(localStorage.getItem(DEVICE_PREFIX + kind) || 'null'); } catch { return null; }
};

const newerOf = (a, b) => (Number(a?.saved_at || 0) >= Number(b?.saved_at || 0) ? a : b);

/** Kayıtlı oda bilgisi; hiç kurulmadıysa null döner. */
export function readRoomPreset(user, kind) {
  const onAccount = user?.[FIELDS[kind]];
  const account = onAccount && typeof onAccount === 'object' ? onAccount : null;
  const onDevice = readDevicePreset(kind);
  const preset = account && onDevice ? newerOf(account, onDevice) : (account || onDevice);
  return preset && typeof preset === 'object' ? preset : null;
}

/** Girilen bilgileri kaydeder ve ekrandaki kullanıcıyı anında günceller. */
export async function saveRoomPreset(kind, preset, setUser) {
  const saved = { ...preset, saved_at: Date.now() };
  setUser?.((current) => (current ? { ...current, [FIELDS[kind]]: saved } : current));
  try { localStorage.setItem(DEVICE_PREFIX + kind, JSON.stringify(saved)); } catch { /* cihaza yazılamazsa hesap kaydı yeterli */ }
  try { await base44.auth.updateMe({ [FIELDS[kind]]: saved }); } catch { /* kayıt başarısızsa oda açılışı bundan etkilenmez */ }
  return saved;
}