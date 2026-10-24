import React from 'react';
import { spot } from '@/components/voice/refScene';

export default function VoiceRefHeader({ room, viewerCount, score, onProfile, onViewers, onMenu, onExit, onGift, onScore }) {
  const roomId = room?.room_number || room?.personal_room_code || '';
  return (
    <>
      <button type="button" aria-label="Oda profili" onClick={onProfile} style={spot(55, 65, 84)} className="rounded-full" />
      <button type="button" onClick={onProfile} style={spot(185, 66, 160, 50)} className="flex flex-col justify-center rounded-md bg-black px-1 text-left">
        <span className="truncate text-[13px] font-bold leading-tight text-white">{room?.name}</span>
        <span className="truncate text-[10px] leading-tight text-white/80">ID:{roomId}</span>
      </button>
      <button type="button" aria-label="Kişiler" onClick={onViewers} style={spot(336, 68, 64)} className="rounded-full">
        <span className="absolute right-[18%] top-1/2 -translate-y-1/2 rounded bg-[#1b1430] px-0.5 text-[12px] font-bold text-white">{viewerCount}</span>
      </button>
      <button type="button" aria-label="Ayarlar" onClick={onMenu} style={spot(398, 68, 56)} className="rounded-full" />
      <button type="button" aria-label="Çıkış" onClick={onExit} style={spot(460, 68, 56)} className="rounded-full" />
      <button type="button" aria-label="Hediyeler" onClick={onGift} style={spot(30, 123, 34)} />
      <button type="button" aria-label="Puan" onClick={onScore} style={spot(80, 123, 46, 26)} className="flex items-center justify-center rounded bg-blue-600 text-[12px] font-bold text-white">
        {score}
      </button>
    </>
  );
}