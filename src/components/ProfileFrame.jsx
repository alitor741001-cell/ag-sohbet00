import { useEffect, useState } from 'react';
import { useFrameCatalog } from '@/lib/FrameCatalogContext';
import { makePreparedTransparent, getPreparedTransparent } from '@/components/xp/frameTransparency';

export default function ProfileFrame({ user, src, size = 80, className = '', showFrame = true }) {
  const { getFrame } = useFrameCatalog();
  const [frameUrl, setFrameUrl] = useState('');

  const frameKey = user?.frame || user?.special_frame || user?.xp_frame;
  const frame = frameKey ? getFrame(frameKey) : null;
  const avatarUrl = src || user?.avatar;

  useEffect(() => {
    if (!frame?.image_url) { setFrameUrl(''); return; }
    const cached = getPreparedTransparent(frame.image_url, frame.opening);
    if (cached) { setFrameUrl(cached); return; }
    let active = true;
    makePreparedTransparent(frame.image_url, frame.opening).then((url) => { if (active) setFrameUrl(url); }).catch(() => {});
    return () => { active = false; };
  }, [frame?.image_url, frame?.opening]);

  return (
    <div className={`relative inline-block ${className}`} style={{ width: size, height: size }}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={user?.full_name || ''} className="absolute rounded-full object-cover" style={{ width: '100%', height: '100%' }} />
      ) : (
        <div className="absolute rounded-full bg-muted flex items-center justify-center" style={{ width: '100%', height: '100%' }}>
          <span className="text-muted-foreground font-semibold" style={{ fontSize: size * 0.35 }}>
            {(user?.full_name || user?.username || '?').charAt(0).toUpperCase()}
          </span>
        </div>
      )}
      {showFrame && frameUrl && (
        <img src={frameUrl} alt="" className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }} />
      )}
    </div>
  );
}