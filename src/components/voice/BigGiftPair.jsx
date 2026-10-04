import { ArrowRight } from 'lucide-react';
import ProfileFrame from '@/components/ProfileFrame';

/** Büyük hediye duyurusunda gönderen ve alan: profil fotoğrafı + isim yan yana. */
export default function BigGiftPair({ alert }) {
  const side = (label, person, right) => (
    <div className={`flex min-w-0 flex-1 items-center gap-2 ${right ? 'flex-row-reverse text-right' : ''}`}>
      <ProfileFrame
        avatar={person.avatar}
        frame={person.frame}
        frameScale={person.frameScale}
        name={person.name}
        size="sm"
      />
      <div className="min-w-0">
        <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-amber-300/90">{label}</p>
        <p className="truncate text-[13px] font-black text-white">{person.name || 'Kullanıcı'}</p>
      </div>
    </div>
  );

  return (
    <div className="relative flex items-center gap-2">
      {side('Gönderen', {
        avatar: alert.sender_avatar,
        frame: alert.sender_frame,
        frameScale: alert.sender_frame_scale,
        name: alert.sender_name,
      }, false)}
      <ArrowRight className="h-4 w-4 shrink-0 text-amber-300" />
      {side('Alan', {
        avatar: alert.recipient_avatar,
        frame: alert.recipient_frame,
        frameScale: alert.recipient_frame_scale,
        name: alert.recipient_name,
      }, true)}
    </div>
  );
}