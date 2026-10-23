import FantasyProfileShell from '@/components/profile/FantasyProfileShell';
import VoiceFantasyActions from '@/components/profile/VoiceFantasyActions';
import ProfileStatsRow from '@/components/profile/ProfileStatsRow';
import ProfileIdentityBlock from '@/components/profile/ProfileIdentityBlock';
import ProfileAgencyBadges from '@/components/profile/ProfileAgencyBadges';
import useRoomLevels from '@/hooks/useRoomLevels';

export default function VoiceFantasyCard({ profile, hidden, name, avatar, role, palette, room, userId, isSelf, onClose, onMessage, statusContent, memberId, genderLabel, age, badge, joinDate, copied, onCopyId }) {
  const roomLevels = useRoomLevels([userId]);
  const female = profile?.gender === 'kadın';
  const agency = profile?.owned_agency_name || profile?.agency_name;
  const agencyCode = profile?.owned_agency_code || profile?.agency_code;
  return (
    <FantasyProfileShell profile={profile} female={female} hidden={hidden} name={name} avatar={avatar} role={role} onClose={onClose}>
          {statusContent || <div className="space-y-3 px-4 pt-1">
            {!hidden && <>
              <ProfileStatsRow
                level={roomLevels[userId] || 0}
                sentLevel={profile?.gift_sent_level || 0}
                sentTier={profile?.gift_sent_tier || 'green'}
                receivedLevel={profile?.gift_received_level || 0}
                receivedTier={profile?.gift_received_tier || 'green'}
                nLevel={profile?.n_level || 0}
              />
              <ProfileAgencyBadges profile={profile || {}} />
              <ProfileIdentityBlock palette={palette} genderLabel={genderLabel} age={age} country={badge.country} flag={badge.flag} memberId={memberId} joinDate={joinDate} copied={copied} onCopyId={onCopyId} />
            </>}
            {hidden && <p className="text-center text-xs text-fantasy-text/70">Gizli Kullanıcı: kimlik bilgileri gizli kalır.</p>}
            <VoiceFantasyActions room={room} userId={userId} name={name} isSelf={isSelf} hidden={hidden} onClose={onClose} onMessage={onMessage} />
          </div>}
    </FantasyProfileShell>
  );
}