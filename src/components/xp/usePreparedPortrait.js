import { useEffect, useState } from 'react';
import { getPreparedPortrait, makePreparedTransparent } from '@/components/xp/frameTransparency';

export default function usePreparedPortrait(src, opening) {
  const key = `${src}|${opening?.join(',')}`;
  const [ready, setReady] = useState(null);
  const cached = getPreparedPortrait(src, opening);
  useEffect(() => {
    let active = true;
    if (src && opening) makePreparedTransparent(src, opening).then(() => {
      if (active) setReady({ key, result: getPreparedPortrait(src, opening) });
    });
    return () => { active = false; };
  }, [key]);
  return cached || (ready?.key === key ? ready.result : null);
}