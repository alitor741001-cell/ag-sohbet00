// Alt menüde hafızada tutulan sekmeler (sıra: Ana Sayfa, Sohbet, Profil).
// "Oda Kur" bir işlem ekranıdır: her açılışta taze başlar, hafızada tutulmaz.
export const TAB_PATHS = ['/', '/arkadaslar', '/profil'];

/** Verilen yol bir sekme içindeyse sekmenin kök yolunu döndürür, aksi halde null. */
export function matchTabPath(pathname) {
  return TAB_PATHS.find((path) =>
    path === '/' ? pathname === '/' : pathname === path || pathname.startsWith(`${path}/`)
  ) || null;
}