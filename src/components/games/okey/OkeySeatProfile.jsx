import XpAvatar from '@/components/xp/XpAvatar';
import { formatBet } from './okeyConfig';

/** Masa kenarındaki oyuncu kartı: avatar, seviye, isim ve bahsi. Dokununca profil kartı açılır. */
export default function OkeySeatProfile({ seat, slot, active, onOpen }) {
  if (!seat?.user_id) {
    return (
      <div className={`okey-seat okey-seat-${slot} okey-seat-empty`}>
        <span className="okey-avatar" />
        <span className="okey-seat-card" data-tone="dark">
          <span className="okey-seat-name">BOŞ</span>
          <span className="okey-seat-tiles">oyuncu bekleniyor</span>
        </span>
      </div>
    );
  }
  const tone = slot === 'left' ? 'magenta' : slot === 'right' ? 'blue' : 'dark';
  return (
    <button
      type="button"
      className={`okey-seat okey-seat-${slot}`}
      onClick={() => onOpen?.(seat)}
      aria-label={`${seat.name || 'Oyuncu'} profilini aç`}
    >
      <span className="okey-avatar">
        <XpAvatar avatar={seat.avatar} name={seat.name} className="h-full w-full" />
        {Number(seat.level) > 0 && <span className="okey-level">{seat.level}</span>}
      </span>
      <span className="okey-seat-card" data-tone={tone} data-active={active ? '1' : '0'}>
        <span className="okey-seat-name">{seat.name || 'Oyuncu'}</span>
        <span className="okey-seat-coins">{formatBet(seat.stake)} coin</span>
        <span className="okey-seat-tiles">{seat.left ? 'ayrıldı' : `${seat.tiles || 0} taş`}</span>
      </span>
    </button>
  );
}