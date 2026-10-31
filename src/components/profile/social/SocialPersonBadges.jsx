import { Crown, Heart, Mic2, Shield, Star } from 'lucide-react';
import {
  N_BADGE_STYLE, SENT_BADGE_BACKGROUND, receivedColor,
  giftLevelOf, nLevelOf, tierOf, vipLevelOf,
} from '@/lib/userLevels';
import { broadcasterState } from '@/lib/broadcaster';

const pill = 'flex items-center gap-1 rounded-full border px-1.5 py-[1px] text-[9.5px] font-black tabular-nums';

/** Liste kartı rozetleri: N, VIP, Atış, Alış ve yayıncı rolü — kimlik numarasının altında. */
export default function SocialPersonBadges({ person }) {
  if (!person) return null;
  const n = nLevelOf(person.loaded_coins);
  const sent = giftLevelOf(person.gift_sent_k);
  const received = giftLevelOf(person.gift_received_k);
  const vip = vipLevelOf(person);
  const broadcaster = broadcasterState(person).active;

  return (
    <span className="mt-1 flex flex-wrap items-center gap-1">
      {n > 0 && (
        <span className={pill} style={{ background: N_BADGE_STYLE.background, borderColor: N_BADGE_STYLE.border, color: N_BADGE_STYLE.color }}>
          <Shield className="h-2.5 w-2.5" fill="currentColor" />N{n}
        </span>
      )}
      {vip > 0 && (
        <span className={`${pill} border-[#ffeab0]`} style={{ background: 'linear-gradient(135deg, #fff3c4, #ffd166 46%, #c9962a)', color: '#20160a' }}>
          <Crown className="h-2.5 w-2.5" fill="currentColor" />VIP{vip}
        </span>
      )}
      {sent > 0 && (
        <span className={`${pill} border-[#fde68a] text-white`} style={{ background: SENT_BADGE_BACKGROUND }}>
          <Star className="h-2.5 w-2.5" fill="currentColor" />Atış {sent}
        </span>
      )}
      {received > 0 && (
        <span className={`${pill} border-[#ffd9a8] text-white`} style={{ background: receivedColor(tierOf(received)) }}>
          <Heart className="h-2.5 w-2.5" fill="currentColor" />Alış {received}
        </span>
      )}
      {broadcaster && (
        <span className={`${pill} border-[#7dd3fc]/50 bg-[#0b2a52]/80 text-[#d6f7ff]`}>
          <Mic2 className="h-2.5 w-2.5" />Yayıncı
        </span>
      )}
    </span>
  );
}