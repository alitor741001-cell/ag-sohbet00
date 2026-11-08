/** Uygulamanın hafif zemini: görsel indirmeden, yalnızca CSS ile çizilen neon ışıklar.
    Ana sayfa, özel sohbet ve profil bu zemini paylaşır; hiçbir görsel işlenmez. */
export default function NeonBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[#07070c]">
      <div className="absolute -top-24 left-1/2 h-[46vh] w-[46vh] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(239,68,68,0.32),transparent_70%)] blur-2xl" />
      <div className="absolute -left-24 top-1/3 h-[38vh] w-[38vh] rounded-full bg-[radial-gradient(circle,rgba(168,85,247,0.20),transparent_70%)] blur-2xl" />
      <div className="absolute -right-24 bottom-8 h-[40vh] w-[40vh] rounded-full bg-[radial-gradient(circle,rgba(56,189,248,0.16),transparent_70%)] blur-2xl" />
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/70 to-transparent" />
    </div>
  );
}