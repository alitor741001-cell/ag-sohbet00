import React from 'react';
import { REF_SCENE_URL } from '@/components/voice/refScene';

const imgCls = 'pointer-events-none absolute inset-0 h-full w-full select-none';

// Tema tüm zemini kaplar; tasarım görselinden sadece üst bar ve alt buton şeridi kullanılır.
export default function VoiceRefScene({ themeImage, children }) {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-[#0b1733]">
      {themeImage && <img src={themeImage} alt="" draggable={false} className={`${imgCls} object-cover`} />}
      <img src={REF_SCENE_URL} alt="" draggable={false} className={imgCls} style={{ clipPath: 'inset(0 0 85.5% 0)' }} />
      <img src={REF_SCENE_URL} alt="" draggable={false} className={imgCls} style={{ clipPath: 'inset(89.5% 0 0 0)' }} />
      {children}
    </div>
  );
}