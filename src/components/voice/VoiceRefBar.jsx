import React from 'react';
import { spot } from '@/components/voice/refScene';

export default function VoiceRefBar({ micActive, deafened, onChat, onMic, onSpeaker, onGift, onPrivateChat, onGames, onSettings }) {
  return (
    <>
      <button type="button" aria-label="Sohbet" onClick={onChat} style={spot(57, 965, 56, 60)} />
      <button type="button" aria-label="Mikrofon" onClick={onMic} style={spot(123, 967, 44, 56)}>
        {micActive && <span className="absolute right-1 top-2 h-2 w-2 rounded-full bg-green-400" />}
      </button>
      <button type="button" aria-label="Hoparlör" onClick={onSpeaker} style={spot(177, 967, 44, 56)}>
        {deafened && <span className="absolute left-1/2 top-1/2 h-[2px] w-3/4 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-red-500" />}
      </button>
      <button type="button" aria-label="Hediye gönder" onClick={onGift} style={spot(247, 962, 80)} className="rounded-full" />
      <button type="button" aria-label="Özel sohbet" onClick={onPrivateChat} style={spot(322, 967, 48, 56)} />
      <button type="button" aria-label="Oyunlar" onClick={onGames} style={spot(382, 967, 48, 56)} />
      <button type="button" aria-label="Ayarlar" onClick={onSettings} style={spot(442, 967, 48, 56)} />
    </>
  );
}