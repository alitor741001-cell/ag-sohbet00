import { ArrowLeft } from 'lucide-react';
import { Image } from '@/components/ui/image';
import ProfileFrame from '@/components/ProfileFrame';
import VipAvatarFrame from '@/components/vip/VipAvatarFrame';
import VipShowcase from '@/components/profile/VipShowcase';
import { vipLook, vipVars } from '@/components/vip/vipTheme';
import ProfileMemberId from '@/components/profile/ProfileMemberId';

/** Sesli oda profil kartının üst bölümü: çember ve profil resmi en üstte,
    isim ile kimlik numarası temanın alt hizasına kadar iner. */
export default function VoiceFantasyHero({ female, hidden, name, avatar, role, onClose, profile, memberId, copied, onCopyId }) {
  const card = !hidden && vipLook(profile, 'card');
  const nameTheme = !hidden && vipLook(profile, 'name');
  const background = card?.image || (female ? 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/13118d5f1_generated_image.png' : 'https://media.base44.com/images/public/6a77d66e4da6de214628ee62/0079dc925_generated_image.png');
  return <header className="voice-fantasy-hero relative isolate flex min-h-[15rem] flex-col overflow-hidden rounded-t-[2rem] px-5 pb-2 pt-2">
    {!hidden && <Image src={background} alt="" className="absolute inset-0 -z-20 h-full w-full" />}
    <div className="voice-fantasy-shade absolute inset-0 -z-10" />
    <button type="button" onClick={onClose} aria-label="Geri" className="voice-fantasy-button absolute left-2 top-2 z-10 flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold"><ArrowLeft className="h-4 w-4" />Geri</button>
    <div className="mx-auto w-fit rounded-full border-2 border-fantasy-gold p-0.5 shadow-lg"><VipAvatarFrame theme={!hidden && vipLook(profile, 'frame')}><ProfileFrame avatar={avatar} name={name} size="md" /></VipAvatarFrame></div>
    <div className="mt-auto pt-4">
      {!hidden && <VipShowcase profile={profile} />}
      {role && <p className="mt-1 text-center text-[10px] font-bold tracking-widest text-fantasy-gold">{role}</p>}
      <h2 style={vipVars(nameTheme)} className={`mt-1 break-words text-center font-serif text-2xl font-bold ${nameTheme ? 'vip-tint' : 'text-fantasy-text'} ${nameTheme?.nameAnimated ? 'vip-name-animated' : ''}`}>{name}</h2>
      {!hidden && <ProfileMemberId memberId={memberId} copied={copied} onCopyId={onCopyId} />}
    </div>
  </header>;
}