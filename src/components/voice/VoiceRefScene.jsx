import React from 'react';
import { REF_SCENE_URL } from '@/components/voice/refScene';

// Gönderilen tasarım görseli tam ekran serilir; dokunulabilir alanlar üzerine yüzdelik konumla yerleşir.
export default function VoiceRefScene({ children }) {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden">
      <img src={REF_SCENE_URL} alt="" draggable={false} className="pointer-events-none absolute inset-0 h-full w-full select-none" />
      {children}
    </div>
  );
}