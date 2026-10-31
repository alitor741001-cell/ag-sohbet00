import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
export default function useProfileSocialRefresh(userId, refresh) {
  const callback = useRef(refresh);
  callback.current = refresh;
  useEffect(() => {
    if (!userId) return;
    let timer;
    const update = () => { clearTimeout(timer); timer = setTimeout(() => callback.current(), 200); };
    const stops = ['Follow', 'Friendship', 'ProfileVisit'].map(name => base44.entities[name].subscribe(update));
    window.addEventListener('visitors-read', update);
    window.addEventListener('social-badges-refresh', update);
    return () => { clearTimeout(timer); stops.forEach(stop => stop()); window.removeEventListener('visitors-read', update); window.removeEventListener('social-badges-refresh', update); };
  }, [userId]);
}