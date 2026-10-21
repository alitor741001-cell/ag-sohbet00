import VoiceFantasyHero from '@/components/profile/VoiceFantasyHero';
import VoiceFantasyActions from '@/components/profile/VoiceFantasyActions';
import ProfileStatsRow from '@/components/profile/ProfileStatsRow';
import ProfileIdentityBlock from '@/components/profile/ProfileIdentityBlock';

export default function VoiceFantasyCard({ profile, hidden, name, avatar, role, palette, room, userId, isSelf, onClose, onMessage, statusContent, memberId, genderLabel, age, badge, joinDate, copied, onCopyId }) {
  const female = profile?.gender === 'kadın';
  const agency = profile?.owned_agency_name || profile?.agency_name;
  const agencyCode = profile?.owned_agency_code || profile?.agency_code;
  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center" role="dialog" aria-modal="true" aria-label="Sesli oda profil kartı">
      <button type="button" onClick={onClose} aria-label="Profili kapat" className="voice-fantasy-backdrop absolute inset-0" />
      <section data-fantasy={hidden ? 'masked' : female ? 'princess' : 'dragon'} className="voice-fantasy-card relative flex max-h-[88dvh] w-full max-w-[430px] flex-col overflow-hidden rounded-t-[2rem] border border-fantasy-gold/60 text-fantasy-text shadow-2xl">
        <div className="overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]">
          <VoiceFantasyHero female={female} hidden={hidden} name={name} avatar={avatar} role={role} onClose={onClose} />
          {statusContent || <div className="space-y-3 px-4 pt-1">
            {!hidden && <>
              <ProfileStatsRow palette={palette} level={0} receivedLevel={profile?.gift_received_level || 0} receivedTier={profile?.gift_received_tier} nLevel={profile?.n_level || 0} vipLevel={profile?.vip_level || 0} />
              <div className="voice-fantasy-button flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-[11px]"><span className="text-fantasy-gold">Ajans</span><span className="text-right font-bold">{agency ? `${agency}${agencyCode ? ` · ${agencyCode}` : ''}` : 'Ajansı yok'}</span></div>
              <ProfileIdentityBlock palette={palette} genderLabel={genderLabel} age={age} country={badge.country} flag={badge.flag} memberId={memberId} joinDate={joinDate} copied={copied} onCopyId={onCopyId} />
            </>}
            {hidden && <p className="text-center text-xs text-fantasy-text/70">Gizli Kullanıcı: kimlik bilgileri gizli kalır.</p>}
            <VoiceFantasyActions room={room} userId={userId} name={name} isSelf={isSelf} hidden={hidden} onClose={onClose} onMessage={onMessage} />
          </div>}
        </div>
      </section>
    </div>
  );
}