import { memo } from 'react';

/**
 * Sayfa üst başlığı: neon parlayan yazı, altında ince ışık çizgisi.
 * Ana sayfa dışındaki sekmelerde (profil, sohbet, oyunlar) kullanılır; tasarım
 * görselinin üst bandındaki hazır yazılar bu sayfalarda görünmez.
 */
function NeonPageHeader({ title, subtitle = '', right = null, sticky = true }) {
  return (
    <header
      className={`${sticky ? 'sticky top-0' : 'relative'} z-30 mb-3 px-4 pb-2 pt-3`}
      style={{
        background: 'linear-gradient(180deg, rgba(7,6,11,0.97) 0%, rgba(9,7,13,0.86) 62%, rgba(9,7,13,0) 100%)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h1
            className="truncate text-[22px] font-black uppercase tracking-[0.22em]"
            style={{
              color: '#ffeec2',
              textShadow: '0 0 6px rgba(255,214,120,0.95), 0 0 16px rgba(239,68,68,0.85), 0 0 34px rgba(239,68,68,0.55)',
            }}
          >
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 truncate text-[11px] font-semibold tracking-wide text-white/60">{subtitle}</p>
          ) : null}
        </div>
        {right ? <div className="flex shrink-0 items-center gap-1.5">{right}</div> : null}
      </div>
      {/* Neon ışık çizgisi: başlığın altında nefes alan parlak bir hat. */}
      <div aria-hidden="true" className="mt-2 h-px w-full overflow-hidden">
        <div
          className="h-px w-full animate-pulse"
          style={{ background: 'linear-gradient(90deg, rgba(239,68,68,0) 0%, rgba(255,214,120,0.95) 45%, rgba(239,68,68,0.9) 70%, rgba(239,68,68,0) 100%)' }}
        />
      </div>
    </header>
  );
}

export default memo(NeonPageHeader);