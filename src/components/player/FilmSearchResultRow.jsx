/** Film arama sonucu satırı: kapak görseli, video başlığı, kanal ve süre bilgisi. */
export default function FilmSearchResultRow({ item, canMod, onPick }) {
  const meta = [item.channel || 'YouTube', item.length].filter(Boolean).join(' · ');
  return (
    <button
      type="button"
      onClick={() => onPick?.(item.video_id)}
      disabled={!canMod}
      className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-2 text-left transition active:scale-[0.99] disabled:opacity-70"
    >
      <span className="relative shrink-0">
        <img
          src={`https://i.ytimg.com/vi/${item.video_id}/mqdefault.jpg`}
          alt=""
          loading="lazy"
          className="h-12 w-20 rounded-lg object-cover"
        />
        {item.length && (
          <span className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 text-[10px] font-bold text-white">{item.length}</span>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-white">{item.title}</span>
        <span className="block truncate text-[11px] text-white/50">{meta}</span>
      </span>
    </button>
  );
}