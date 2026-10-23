import { memo } from 'react';

const BANNER = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/e38cf867a_IMG_0151.jpg';

/** Profil üst görseli: eski neon başlık yerine tasarım banner'ı. */
function ProfileBanner() {
  return (
    <div className="sticky top-0 z-30 w-full">
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '1024 / 342' }}>
        <img src={BANNER} alt="Profil" className="absolute inset-0 h-full w-full object-cover" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 w-[8%]" style={{ background: 'linear-gradient(90deg, rgba(7,6,11,1) 0%, rgba(7,6,11,0) 100%)' }} />
        <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-[8%]" style={{ background: 'linear-gradient(270deg, rgba(7,6,11,1) 0%, rgba(7,6,11,0) 100%)' }} />
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[10%]" style={{ background: 'linear-gradient(180deg, rgba(7,6,11,0) 0%, rgba(7,6,11,1) 100%)' }} />
      </div>
    </div>
  );
}

export default memo(ProfileBanner);