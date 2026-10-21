import ProfileFrame from '@/components/ProfileFrame';

/** Kompakt kart başlığı: solda profil fotoğrafı, sağda isim ve rol — tek ekrana sığar. */
export default function ProfileHeroBlock({ name, avatar, palette, hidden, roleLabel, statusLabel }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative shrink-0" style={{ filter: `drop-shadow(0 0 12px ${palette.glow})` }}>
        <ProfileFrame avatar={avatar} name={name} size="md" />
        <span
          className="absolute -bottom-0.5 -right-0.5 z-[3] flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-black"
          style={{ borderColor: palette.accent2, background: '#07040a', color: palette.accent, boxShadow: `0 0 10px ${palette.glow}` }}
        >
          {hidden ? '?' : palette.symbol}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p
          className="break-words text-xl font-black leading-tight text-white"
          style={{ fontFamily: 'Georgia, "Times New Roman", serif', textShadow: `0 0 10px ${palette.glow}` }}
        >
          {name}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          {roleLabel && <span className="text-[10px] font-bold" style={{ color: palette.accent2 }}>{roleLabel}</span>}
          {statusLabel && <span className="text-[9px] font-black tracking-[0.2em] text-destructive">{statusLabel}</span>}
        </div>
      </div>
    </div>
  );
}