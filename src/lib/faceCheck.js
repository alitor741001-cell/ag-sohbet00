import { base44 } from '@/api/base44Client';

/**
 * Yüz doğrulama yardımcıları.
 *
 * Doğrulama bir kez yapılır: sonuç hesapta saklanır, güncellemelerden sonra da
 * yeniden sorulmaz. Fotoğraf özel alana yüklenir: yalnız sunucu, karşılaştırma
 * anında geçici imzalı bağlantı üretir.
 */
const DEVICE_PREFIX = 'filmkeyfi_device_';

export function deviceId(userId) {
  const key = DEVICE_PREFIX + (userId || 'misafir');
  let id = '';
  try { id = localStorage.getItem(key) || ''; } catch { id = ''; }
  if (!id) {
    id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `d${Date.now()}${Math.random().toString(36).slice(2)}`;
    try { localStorage.setItem(key, id); } catch { /* cihaza yazılamazsa doğrulama her açılışta sorulur */ }
  }
  return id;
}

export async function faceStatus(userId) {
  const res = await base44.functions.invoke('face-verify', { action: 'status', device_id: deviceId(userId) });
  return res?.data || { enabled: true, enrolled: false, trusted: false, balance: false };
}

export async function setFaceEnabled(enabled) {
  const res = await base44.functions.invoke('face-verify', { action: 'toggle', enabled });
  return res?.data || { ok: false };
}

async function uploadSelfie(file) {
  const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
  return file_uri;
}

export async function enrollFace(userId, photos) {
  // Referans yüz düz bakan fotoğraftan alınır.
  const face_uri = await uploadSelfie(photos.front);
  const res = await base44.functions.invoke('face-verify', {
    action: 'enroll', device_id: deviceId(userId), face_uri,
  });
  return res?.data || {};
}

export async function verifyFace(userId, photos, scope = 'device') {
  const face_uri = await uploadSelfie(photos.front);
  const res = await base44.functions.invoke('face-verify', {
    action: 'verify', device_id: deviceId(userId), face_uri, scope,
  });
  return res?.data || {};
}