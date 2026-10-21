/**
 * Kompakt profil kartındaki oda işlemleri (mikrofon, koltuk, davet, yöneticilik, kilit):
 * yer kaplamasın diye yalnızca ikon şeridi olarak gösterilir.
 */
export default function CompactRoomActions({ tiles = [], palette }) {
  if (!tiles.length) return null;

  return (
    <div
      className="mt-2 flex flex-wrap items-center justify-center gap-1.5 rounded-xl border px-2 py-1.5"
      style={{ borderColor: 'rgba(127,182,221,0.45)', background: 'rgba(13,43,69,0.62)' }}
    >
      {tiles.map((item) => (
        <button
          key={item.key}
          type="button"
          disabled={item.disabled}
          onClick={item.onClick}
          title={item.label}
          aria-label={item.label}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border active:scale-95 disabled:opacity-30"
          style={{ borderColor: 'rgba(168,216,245,0.55)', background: 'linear-gradient(180deg, rgba(30,68,102,0.9), rgba(8,20,33,0.95))', color: '#d9f2ff', boxShadow: 'inset 0 0 8px -4px #bfe9ff' }}
        >
          <item.icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
        </button>
      ))}
    </div>
  );
}