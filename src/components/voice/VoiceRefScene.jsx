import React from 'react';
import { REF_SCENE_URL } from '@/components/voice/refScene';

// Tasarım görseli tam ekran serilir; tema seçiliyse koltuk alanı tema görseliyle kaplanır.
export default function VoiceRefScene({ themeImage, children }) {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <img src={REF_SCENE_URL} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none" />
      {themeImage && (
        <img
          src={themeImage}
          alt=""
          draggable={false}
          className="pointer-events-none absolute inset-x-0 h-[46%] w-full select-none object-cover"
          style={{ top: '16.5%' }}
        />
      )}
      {children}
    </div>
  );
}