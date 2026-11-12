// Oyun dosyası indirilemezse (zayıf bağlantı, yeni yayından kalan eski dosya)
// birkaç kez yeniden denenir; yine olmazsa sayfa bir kez yenilenip güncel dosyalar alınır.
const RELOAD_KEY = 'game-chunk-reload';
const wait = (ms) => new Promise((resolve) => { window.setTimeout(resolve, ms); });

export default async function loadGameModule(importer) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const mod = await importer();
      sessionStorage.removeItem(RELOAD_KEY);
      return mod;
    } catch (error) {
      if (attempt === 2) {
        if (!sessionStorage.getItem(RELOAD_KEY)) {
          sessionStorage.setItem(RELOAD_KEY, '1');
          window.location.reload();
          return new Promise(() => {});
        }
        throw error;
      }
      await wait(600 * (attempt + 1));
    }
  }
  return importer();
}