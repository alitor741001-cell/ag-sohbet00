import { useEffect, useState } from 'react';

export default function Watermark({ user }) {
  const [pos, setPos] = useState({ top: '15%', left: '10%' });
  const label = `FilmKeyfi · ${user?.username || user?.full_name || 'Anonim'} · ID:${(user?.id || '??????').slice(-6)}`;

  useEffect(() => {
    const move = () => {
      setPos({ top: (5 + Math.random() * 75) + '%', left: (5 + Math.random() * 70) + '%' });
    };
    move();
    const t = setInterval(move, 4000);
    return () => clearInterval(t);
  }, [user?.id]);

  return (
    <div style={{
      position: 'absolute', top: pos.top, left: pos.left, zIndex: 5,
      pointerEvents: 'none', opacity: 0.55, mixBlendMode: 'difference',
      fontSize: '11px', color: 'rgba(255,255,255,0.85)', whiteSpace: 'nowrap',
      textShadow: '0 1px 3px rgba(0,0,0,0.9)', userSelect: 'none',
      transition: 'top 1.2s ease, left 1.2s ease', fontWeight: 600, letterSpacing: '0.02em'
    }}>
      {label}
    </div>
  );
}