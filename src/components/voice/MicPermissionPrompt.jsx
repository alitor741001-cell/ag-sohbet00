/** Android: koltuğa oturunca çıkan mikrofon izni uyarısı — izin dokunuşla istenir. */
export default function MicPermissionPrompt({ open, requesting, onAllow, onDismiss }) {
  if (!open) return null;
  return (
    <div className="room-mic-prompt mx-3 mb-2 rounded-2xl border border-primary/40 bg-black/75 px-3 py-2.5 backdrop-blur">
      <p className="text-[12px] font-semibold leading-snug text-white">Mikrofon izni</p>
      <p className="mt-0.5 text-[11px] leading-snug text-white/55">
        Konuşmak için “İzin Ver”e dokun. Cihaz izin sorarsa onayla; önceden izin verdiysen tekrar sormayabilir.
      </p>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={onAllow}
          disabled={requesting}
          className="flex-1 rounded-full bg-primary px-3 py-2 text-[12px] font-bold text-primary-foreground disabled:opacity-60"
        >
          {requesting ? 'İsteniyor…' : 'İzin Ver'}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full border border-white/15 px-3 py-2 text-[12px] font-semibold text-white/70"
        >
          Reddet
        </button>
      </div>
    </div>
  );
}