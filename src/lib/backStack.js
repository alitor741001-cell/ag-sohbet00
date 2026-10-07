// Birleşik geri yığını: açık kalan katmanların (alt panel, tam ekran profil kartı, oyun,
// görsel büyütme) tek sırası. Cihazın geri tuşu ya da kenardan kaydırma-geri hareketi önce
// en üstteki katmanı kapatır.
//
// Katman açılırken adres geçmişine aynı adresle bir adım eklenir: geri tuşu bu adımı geri
// alır, yani sayfa/rota değişmez — yalnızca katman kapanır. Böylece katmanlar, sohbet ve
// sayfa geçişleri tek bir sırada birbirini bekleterek ilerler.

const layers = []; // [{ token, onClose }] — en sondaki en üstteki katmandır
let armed = false; // geri dinleyicisi bir kez bağlanır
let pendingOwnBacks = 0; // uygulama içinden kapatılan katmanların kendi geri adımları
let counter = 0;

function pushStep(token) {
  // Adım, yönlendiricinin beklediği biçimde (usr/key/idx) yazılır: adres değişmez,
  // yalnızca geri tuşunun kapatacağı yeni bir kayıt eklenir.
  const current = window.history.state || {};
  window.history.pushState(
    { usr: current.usr ?? null, key: `fb-${token}`, idx: (current.idx ?? 0) + 1, fbLayer: token },
    '',
    window.location.href,
  );
}

function handlePop() {
  // Uygulama içinden kapatılan katmanın adımı geri alınıyorsa tüketici sıra dışı bırakılır.
  if (pendingOwnBacks > 0) {
    pendingOwnBacks -= 1;
    return;
  }
  const top = layers.pop();
  // Katman yoksa kararı yönlendirici verir (sohbet geri dönüşü, sayfa geçişi).
  if (!top) return;
  top.onClose();
  // Altta başka katman kaldıysa geri tuşu yine katmanlara çalışsın diye adım yeniden kurulur.
  if (layers.length) pushStep(layers[layers.length - 1].token);
}

/** Açılan katmanı geri yığınına kaydeder; dönen değer kaydı silmek için kullanılır. */
export function addLayer(onClose) {
  if (typeof window === 'undefined' || !window.history) return null;
  if (!armed) {
    window.addEventListener('popstate', handlePop);
    armed = true;
  }
  counter += 1;
  const token = `fb-layer-${counter}`;
  layers.push({ token, onClose });
  pushStep(token);
  return token;
}

/** Katman uygulama içinden kapatıldığında kaydı ve adres adımı temizlenir. */
export function removeLayer(token) {
  const index = layers.findIndex((layer) => layer.token === token);
  if (index === -1) return; // geri tuşuyla kapandıysa kaydı zaten düştü
  layers.splice(index, 1);
  // Yalnızca kendi adımımız hâlâ en üstteyse geri alınır: arada kullanıcı başka bir
  // sayfaya geçtiyse onun adımı geri alınmaz, artık adım kendiliğinden boşa düşer.
  if (window.history.state?.fbLayer === token) {
    pendingOwnBacks += 1;
    window.history.back();
  }
}