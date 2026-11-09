import { ChevronRight } from 'lucide-react';
import VoiceSheet from '@/components/voice/VoiceSheet';
import { Image } from '@/components/ui/image';
import SocialPersonBadges from '@/components/profile/social/SocialPersonBadges';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import { HIDDEN_AVATAR_URL, isHiddenName } from '@/lib/hiddenUser';

/**
 * PK izleyicileri: ekranın yarısı kadar açılan alt panelde odadaki dinleyiciler listelenir.
 * Her satırda profil fotoğrafı, isim ve seviye/VIP rozetleri vardır; satıra dokununca
 * sesli odadaki profil kartının aynısı açılır.
 */
export default function PkViewerSheet({ open, onClose, people = [], onOpenProfile }) {
  const visible = people.filter((person) => person?.user_id);
  // Gizli kullanıcının profili hiç istenmez; yalnızca görünen kişilerin rozetleri sorgulanır.
  const ids = visible.filter((person) => !isHiddenName(person.name)).map((person) => person.user_id);
  const profiles = useMessageProfiles(open ? ids : []);

  return (
    <VoiceSheet open={open} onClose={onClose} title={`İzleyiciler (${visible.length})`} halfHeight>
      {visible.length === 0 ? (
        <p className="py-6 text-center text-xs text-white/50">Şu an odada izleyici yok.</p>
      ) : (
        <div className="space-y-2 pb-2">
          {visible.map((person) => {
            const hidden = isHiddenName(person.name);
            const profile = profiles[person.user_id];
            const name = hidden ? person.name : (profile?.username || profile?.full_name || person.name || 'Kullanıcı');
            const avatar = hidden ? HIDDEN_AVATAR_URL : (profile?.avatar || person.avatar);
            return (
              <button
                key={person.user_id}
                type="button"
                onClick={() => { onClose(); onOpenProfile?.(person.user_id); }}
                className="flex w-full items-center gap-2.5 rounded-xl bg-white/[0.07] px-2.5 py-2 text-left ring-1 ring-white/10 active:scale-[0.99]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10 ring-1 ring-white/20">
                  {avatar
                    ? <Image src={avatar} alt="" fittingType="fill" className="h-full w-full" />
                    : <span className="text-[12px] font-black text-white/80">{name.trim().charAt(0) || '?'}</span>}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-[12px] font-black ${hidden ? 'hidden-user-name' : 'text-white'}`}>{name}</span>
                  <SocialPersonBadges person={profile} />
                </span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-white/40" />
              </button>
            );
          })}
        </div>
      )}
    </VoiceSheet>
  );
}