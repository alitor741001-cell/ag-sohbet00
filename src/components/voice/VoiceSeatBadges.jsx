import RoomLevelBadge from '@/components/levels/RoomLevelBadge';
import UserStatusBadges from '@/components/status/UserStatusBadges';

/**
 * Koltuk altı rozet şeridi: film odasındaki LVL rozeti + N, VIP, yıldız ve kalp rozetleri.
 * Rozetler koltuk genişliğine sığmadığında alt alta sarılır, ızgara kaymaz.
 */
export default function VoiceSeatBadges({ level, profile }) {
  const hasGiftBadges = Number(profile?.n_level) > 0
    || Number(profile?.vip_level) > 0
    || Number(profile?.gift_sent_level) > 0
    || Number(profile?.gift_received_level) > 0;

  return (
    <span className="flex max-w-[72px] flex-wrap items-center justify-center gap-x-1 gap-y-0.5">
      <RoomLevelBadge level={level} />
      {hasGiftBadges && (
        <UserStatusBadges
          showUserIcon
          n_level={profile?.n_level || 0}
          vip_level={profile?.vip_level || 0}
          vip_days_left={profile?.vip_days_left || 0}
          gift_sent_level={profile?.gift_sent_level || 0}
          gift_sent_tier={profile?.gift_sent_tier || 'green'}
          gift_received_level={profile?.gift_received_level || 0}
          gift_received_tier={profile?.gift_received_tier || 'green'}
        />
      )}
    </span>
  );
}