import { useEffect } from 'react';
import { useFrameCatalog } from '@/lib/FrameCatalogContext';
import RoomEdgeParticles from '@/components/player/RoomEdgeParticles';

const FALLBACK_COLORS = { queenAdmin: '#ff1493', admin: '#ff4500', canAblam: '#ff1744', canAbim: '#3b82f6' };

export default function RoomFrameWelcome({ type, frame, onDone }) {
  const { frames } = useFrameCatalog();
  const info = frames[frame];
  const color = info?.theme_color || info?.glow_color || FALLBACK_COLORS[type] || '#ef4444';
  const signature = `${frame || ''} ${info?.label || ''} ${info?.image_url || ''}`.toLocaleLowerCase('tr-TR');
  const mode = /kalp|heart|queen|kraliçe|ablam/.test(signature) || ['queenAdmin', 'canAblam'].includes(type)
    ? 'heart'
    : /ateş|alev|fire|flame|yanan|admin/.test(signature) || type === 'admin' ? 'fire' : 'none';

  useEffect(() => {
    const timer = setTimeout(() => onDone?.(), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="room-frame-welcome" style={{ '--edge-color': color }}>
      <div className="room-frame-edge room-frame-edge-top" />
      <div className="room-frame-edge room-frame-edge-right" />
      <div className="room-frame-edge room-frame-edge-bottom" />
      <div className="room-frame-edge room-frame-edge-left" />
      <RoomEdgeParticles mode={mode} color={color} />
    </div>
  );
}