import { Heart, Shield, Star, User } from 'lucide-react';
import { N_BADGE_STYLE, receivedColor, sentColor, vipStyle } from '@/lib/userLevels';

/**
 * Profil rozet satırı: N seviyesi, VIP, hediye gönderme seviyesi (yıldız) ve
 * hediye alış seviyesi (kalp). Görseldeki gibi tek satırda, yan yana durur.
 */
export default function UserStatusBadges({
  n_level = 0,
  vip_level = 0,
  gift_sent_level = 0,
  gift_sent_tier = 'green',
  gift_received_level = 0,
  gift_received_tier = 'green',
  showUserIcon = false,
  className = '',
}) {
  const hasAny = showUserIcon || n_level > 0 || vip_level > 0 || gift_sent_level > 0 || gift_received_level > 0;
  if (!hasAny) return null;

  const vip = vipStyle(vip_level);

  return (
    <div className={`flex flex-wrap items-center justify-center gap-1.5 ${className}`}>
      {showUserIcon && (
        <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ background: '#66ff99' }}>
          <User className="h-3 w-3 text-white" strokeWidth={2.6} />
        </span>
      )}

      {n_level > 0 && (
        <span
          className="flex items-center gap-1 rounded-full border pl-0.5 pr-2 py-0.5"
          style={{ background: N_BADGE_STYLE.background, borderColor: N_BADGE_STYLE.border }}
        >
          <span className="flex h-4 w-4 items-center justify-center rounded-full bg-black/30">
            <Shield className="h-2.5 w-2.5 text-white" strokeWidth={2.4} />
          </span>
          <span className="text-[10px] font-extrabold tabular-nums text-white">N{n_level}</span>
        </span>
      )}

      {vip_level > 0 && (
        <span
          className="rounded-full border px-2 py-0.5 text-[10px] font-extrabold tabular-nums"
          style={{ background: vip.background, borderColor: vip.border, color: vip.color }}
        >
          VIP{vip_level}
        </span>
      )}

      {/* Atış ve alış seviyeleri her zaman yan yana durur; dar alanda ikisi birlikte alt satıra iner. */}
      {(gift_sent_level > 0 || gift_received_level > 0) && (
        <span className="flex shrink-0 items-center gap-1.5">
          {gift_sent_level > 0 && (
            <span
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold tabular-nums text-white"
              style={{ background: sentColor(gift_sent_tier), textShadow: '0 1px 2px rgba(0,0,0,0.45)' }}
            >
              <Star className="h-3 w-3" fill="currentColor" /> {gift_sent_level}
            </span>
          )}

          {gift_received_level > 0 && (
            <span
              className="flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold tabular-nums text-white"
              style={{ background: receivedColor(gift_received_tier), textShadow: '0 1px 2px rgba(0,0,0,0.45)' }}
            >
              <Heart className="h-3 w-3" fill="currentColor" /> {gift_received_level}
            </span>
          )}
        </span>
      )}
    </div>
  );
}