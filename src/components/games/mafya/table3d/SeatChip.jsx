import React from 'react';
import { Skull } from 'lucide-react';
import { Image } from '@/components/ui/image';

/** Masadaki bir oyuncunun gerçek yüzü. Fotoğrafa dokununca o kişi hedef seçilir. */
export default function SeatChip({ chipRef, player, isMe, isHost, selected, tappable, onPick }) {
  const dead = player.alive === false;
  const tag = dead
    ? { text: 'ÖLDÜ', tone: 'red' }
    : selected
      ? { text: 'SEÇİLİ', tone: 'gold' }
      : player.voted
        ? { text: 'OY VERDİ', tone: 'green' }
        : player.ready
          ? { text: 'HAZIR', tone: 'green' }
          : isHost
            ? { text: 'SAHİP', tone: 'gold' }
            : null;

  return (
    <div
      ref={chipRef}
      className={`mf-chair${selected ? ' mf-chair-on' : ''}${dead ? ' mf-chair-dead' : ''}${isMe ? ' mf-chair-me' : ''}${tappable ? ' mf-chair-pick' : ''}`}
    >
      <button
        type="button"
        className="mf-chair-hit"
        disabled={!tappable}
        onClick={() => onPick(player.user_id)}
        aria-label={tappable ? `${player.name} kişisini seç` : player.name}
      >
        <span className="mf-chair-face">
          {player.avatar ? (
            <Image src={player.avatar} alt="" className="mf-chair-photo" fittingType="fill" quality={75} />
          ) : (
            <span className="mf-chair-initial">{(player.name || 'O').slice(0, 1).toUpperCase()}</span>
          )}
          {dead ? (
            <span className="mf-chair-veil">
              <Skull className="h-4 w-4" />
            </span>
          ) : null}
          {isMe ? <span className="mf-chair-you">SEN</span> : null}
        </span>
        <span className="mf-chair-name">{player.name}</span>
        {tag ? <span className="mf-chair-tag" data-tone={tag.tone}>{tag.text}</span> : null}
      </button>
    </div>
  );
}