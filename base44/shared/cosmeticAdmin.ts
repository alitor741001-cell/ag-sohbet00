const categories = ['seat-frame', 'vip-frame', 'entrance'];
export function validCosmeticMedia(value) {
  return typeof value === 'string' && value.length < 1800 && (/^mp\/private\//.test(value) || /^https:\/\/(media\.base44\.com|static\.wixstatic\.com)\//.test(value));
}
export async function saveCosmeticProduct(base44, body) {
  const p = body.product || {};
  if (!String(p.name || '').trim() || !categories.includes(p.category) || !validCosmeticMedia(p.image_url)) throw new Error('Ad, kategori ve geçerli yüklenmiş görsel gerekli.');
  const price = Number(p.price); const vip = Number(p.min_vip || 0);
  if (!Number.isSafeInteger(price) || price < (p.category === 'entrance' ? 0 : 1) || price > 1000000000 || ![0,5,6,7,8,9,10,11,12].includes(vip)) throw new Error('Coins fiyatı veya VIP seviyesi geçersiz.');
  if (p.video_url && !validCosmeticMedia(p.video_url)) throw new Error('Yüklenmiş MP4/WebM bağlantısı kullan.');
  const patch = { name: p.name.trim().slice(0,80), category: p.category, image_url: p.image_url, price, min_vip: vip, video_url: p.video_url || '', published: p.published === true, remove_white: p.remove_white === true, sort_order: Math.max(0, Math.min(9999, Number(p.sort_order) || 0)) };
  if (p.crop?.w && p.crop?.h) {
    const values = ['x','y','w','h'].map(k => Number(p.crop[k]));
    if (values.some(n => !Number.isFinite(n) || n < 0 || n > 1) || values[0]+values[2] > 1.001 || values[1]+values[3] > 1.001) throw new Error('Kırpma alanı geçersiz.');
    patch.crop = Object.fromEntries(['x','y','w','h'].map((k,i) => [k,values[i]]));
  } else patch.crop = {};
  const sr = base44.asServiceRole.entities;
  if (body.id) {
    const old = await sr.CosmeticProduct.get(body.id);
    if (old.category !== patch.category) throw new Error('Mevcut ürünün kategorisini değiştirme; yeni ürün ekle.');
    return sr.CosmeticProduct.update(old.id, patch);
  }
  return sr.CosmeticProduct.create(patch);
}