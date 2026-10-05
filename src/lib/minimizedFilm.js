// Küçültülmüş odanın filmi.
// Oda küçültüldüğünde film arka planda oynamaya devam eder; sağ alttaki balondan
// odaya dönüldüğünde küçük oynatıcı kapanır ve film odadaki yerinden sürer.
let current = null;
const listeners = new Set();

function emit() {
  listeners.forEach((listener) => listener(current));
}

export function subscribeMinimizedFilm(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getMinimizedFilm() {
  return current;
}

export function setMinimizedFilm(film) {
  current = film || null;
  emit();
}

/** roomId verilirse yalnızca o odanın kaydı silinir. */
export function clearMinimizedFilm(roomId) {
  if (roomId && current && current.roomId !== roomId) return;
  current = null;
  emit();
}