import UserStatusBadges from '@/components/status/UserStatusBadges';
import VipBadge from '@/components/vip/VipBadge';
import { vipLook } from '@/components/vip/vipTheme';

/** Seviye/VIP/hediye rozet şeridi — sesli oda ve film odası sohbetinde ortak kullanılır. */
export default function UserBadgeRow({ profile, compact = false }) {
  return (
    <><UserStatusBadges
      compact={compact}
      showUserIcon
      n_level={profile?.n_level || 0}
      vip_level={profile?.vip_look_initialized ? 0 : profile?.vip_level || 0}
      vip_days_left={profile?.vip_days_left || 0}
      gift_sent_level={profile?.gift_sent_level || 0}
      gift_sent_tier={profile?.gift_sent_tier || 'green'}
      gift_received_level={profile?.gift_received_level || 0}
      gift_received_tier={profile?.gift_received_tier || 'green'}
    /><VipBadge theme={vipLook(profile, 'badge')} /></>
  );
}