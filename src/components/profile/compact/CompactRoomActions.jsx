/**
 * Kompakt profil kartındaki oda işlemleri (mikrofon, koltuk, davet, yöneticilik, kilit):
 * yer kaplamasın diye yalnızca ikon şeridi olarak gösterilir.
 */
export default function CompactRoomActions({ tiles = [], palette }) {
  if (!tiles.length) return null;

  return (
    <div
      className="mt-2 flex flex-wrap items-center justify-center gap-1.5 rounded-xl border px-2 py-1.5"
      style={{ borderColor: palette.soft, background: 'rgba(0,0,0,0.42)' }}
    >
      {tiles.map((item) => (
        <button
          key={item.key}
          type="button"
          disabled={item.disabled}
          onClick={item.onClick}
          title={item.label}
          aria-label={item.label}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-white/85 active:scale-95 disabled:opacity-30"
          style={{ borderColor: palette.soft }}
        >
          <item.icon className="h-4 w-4" strokeWidth={1.8} />
        </button>
      ))}
    </div>
  );
}