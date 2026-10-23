import { memo } from 'react';

const BANNER = 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/e38cf867a_IMG_0151.jpg';

/** Profil üst görseli: koyu zemin "screen" karışımıyla kaybolur, yalnızca parlak yazılar ana temanın üstünde kalır. */
function ProfileBanner() {
  return (
    <div className="sticky top-0 z-30 w-full">
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '1024 / 342' }}>
        <img src={BANNER} alt="Profil" className="absolute inset-0 h-full w-full object-cover" style={{ mixBlendMode: 'screen' }} />
      </div>
    </div>
  );
}

export default memo(ProfileBanner);