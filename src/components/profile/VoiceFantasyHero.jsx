import { ArrowLeft } from 'lucide-react';
import { Image } from '@/components/ui/image';
import ProfileFrame from '@/components/ProfileFrame';
import VipAvatarFrame from '@/components/vip/VipAvatarFrame';
import VipShowcase from '@/components/profile/VipShowcase';
import { vipLook, vipVars } from '@/components/vip/vipTheme';
import ProfileMemberId from '@/components/profile/ProfileMemberId';

/** Sesli oda profil kartının üst bölümü: kart üstten profilin izasına kadar
    kırpılır, profil resmi isim yazısının hemen üstünde başlar. */
export default function VoiceFantasyHero({ female, hidden, name, avatar, role, onClose, profile, memberId, copied, onCopyId, onOpenFull, full = false, onBack, liveLink = null }) {
  const card = !hidden && vipLook(profile, 'card');
  const nameTheme = !hidden && vipLook(profile, 'name');
  const background = card?.image || (female ? 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/13118d5f1_generated_image.png' : 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/0079dc925_generated_image.png');
  return <header className="voice-fantasy-hero relative isolate flex flex-col overflow-hidden rounded-t-[2rem] px-5 pb-1 pt-0">
    {!hidden && <Image src={background} alt="" className="absolute inset-0 -z-20 h-full w-full" />}
    <div className="voice-fantasy-shade absolute inset-0 -z-10" />
    <button type="button" onClick={full ? onBack : onClose} aria-label="Geri" className="voice-fantasy-button absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold"><ArrowLeft className="h-4 w-4" />Geri</button>
    <button type="button" onClick={full ? undefined : onOpenFull} aria-label="Tam profili aç" className="mx-auto mt-1 block w-fit rounded-full border-2 border-fantasy-gold p-0.5 shadow-lg active:scale-95"><VipAvatarFrame theme={!hidden && vipLook(profile, 'frame')}><ProfileFrame avatar={avatar} name={name} size="md" /></VipAvatarFrame></button>
    <div className="pt-1">
      {!hidden && <VipShowcase profile={profile} />}
      {role && <p className="mt-1 text-center text-[10px] font-bold tracking-widest text-fantasy-gold">{role}</p>}
      <h2 style={vipVars(nameTheme)} className={`mt-1 break-words text-center font-serif text-2xl font-bold ${nameTheme ? 'vip-tint' : 'text-fantasy-text'} ${nameTheme?.nameAnimated ? 'vip-name-animated' : ''}`}>{name}</h2>
      {!hidden && (
        <div className="relative">
          <ProfileMemberId memberId={memberId} copied={copied} onCopyId={onCopyId} />
          {/* Yayında: kimlik numarasının sağında durur, kişi yayından çıkınca kaybolur. */}
          {liveLink && <div className="absolute right-0 top-0">{liveLink}</div>}
        </div>
      )}
    </div>
  </header>;
}