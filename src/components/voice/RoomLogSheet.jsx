import { ShieldOff } from 'lucide-react';
import VoiceSheet from '@/components/voice/VoiceSheet';
import SocialPersonBadges from '@/components/profile/social/SocialPersonBadges';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import { Image } from '@/components/ui/image';
import { HIDDEN_AVATAR_URL, isHiddenName } from '@/lib/hiddenUser';

const formatTime = (value) => {
  if (!value) return '';
  try {
    return new Date(value).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

/** Giriş yasağı 24 saat sürer; kayıt defterinden kaldırılırsa hemen biter. */
const banTimeLeft = (person) => {
  if (!person?.banned_until) return 'süresiz yasak';
  const remaining = new Date(person.banned_until).getTime() - Date.now();
  if (remaining <= 0) return 'süre doldu';
  return `${Math.max(1, Math.ceil(remaining / 3600000))} saat kaldı`;
};

/** Kayıt defteri: yönetici işlemleri (koltuktan indirme, odadan atma) ve odadan atılanlar listesi. */
export default function RoomLogSheet({ open, onClose, logs = [], bannedUsers = [], onUnban, onOpenProfile }) {
  // İşlemi yapan ve hedef kişinin seviye/VIP rozetleri odadaki profil kartıyla aynı kaynaktan gelir.
  const ids = [
    ...bannedUsers.map((person) => person.user_id),
    ...logs.flatMap((entry) => [entry.actor_id, entry.target_id]),
  ].filter(Boolean);
  const profiles = useMessageProfiles(open ? ids : []);

  return (
    <VoiceSheet open={open} onClose={onClose} title="Kayıt Defteri">
      <section className="rounded-2xl border border-white/10 bg-[#171720] p-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/60">Odadan Atılanlar</p>
        {bannedUsers.length === 0 ? (
          <p className="text-xs text-white/50">Odadan atılmış kimse yok.</p>
        ) : (
          <div className="space-y-2">
            {bannedUsers.map((person) => (
              <div key={person.user_id} className="flex items-center gap-2 rounded-xl bg-black/30 px-3 py-2">
                <button
                  type="button"
                  onClick={() => onOpenProfile?.(person.user_id)}
                  className="min-w-0 flex-1 text-left active:scale-[0.99]"
                >
                  <p className="truncate text-sm text-white">
                    {profiles[person.user_id]?.username || profiles[person.user_id]?.full_name || person.name || 'Kullanıcı'}
                  </p>
                  <SocialPersonBadges person={profiles[person.user_id]} />
                  <p className="mt-0.5 text-[10px] text-white/50">{banTimeLeft(person)}</p>
                </button>
                <button
                  type="button"
                  onClick={() => onUnban?.(person.user_id)}
                  className="flex shrink-0 items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] font-bold text-white active:scale-95 transition-transform"
                >
                  <ShieldOff className="h-3.5 w-3.5" /> Yasağı kaldır
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-4 rounded-2xl border border-white/10 bg-[#171720] p-3">
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-white/75">İşlem Kayıtları</p>
        {logs.length === 0 ? (
          <p className="text-xs text-white/50">Henüz kayıt yok.</p>
        ) : (
          <div className="no-scrollbar max-h-[40vh] space-y-2 overflow-y-auto">
            {logs.map((entry, index) => {
              // Kayıt satırı odadaki giriş bildirimi gibi görünür: profil, isim, rozetler ve zaman.
              const hidden = isHiddenName(entry.actor_name);
              const profile = profiles[entry.actor_id];
              const name = hidden ? entry.actor_name : profile?.username || profile?.full_name || entry.actor_name || 'Yönetici';
              const avatar = hidden ? HIDDEN_AVATAR_URL : profile?.avatar;
              return (
                <button
                  key={`${entry.created_at || 'log'}-${index}`}
                  type="button"
                  disabled={!entry.actor_id || !onOpenProfile}
                  onClick={() => onOpenProfile?.(entry.actor_id)}
                  className="flex w-full items-start gap-2 rounded-xl bg-black/30 px-3 py-2 text-left active:scale-[0.99] disabled:active:scale-100"
                >
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10">
                    {avatar
                      ? <Image src={avatar} alt="" referrerPolicy="no-referrer" fittingType="fill" className="h-full w-full" />
                      : <span className="text-[11px] font-bold text-white/80">{name.trim().charAt(0) || '?'}</span>}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block truncate text-[12px] font-black ${hidden ? 'hidden-user-name' : 'text-white'}`}>{name}</span>
                    <SocialPersonBadges person={profile} />
                    <p className="mt-0.5 text-[12.5px] font-semibold leading-snug text-white">{entry.text}</p>
                    {entry.created_at && <p className="mt-0.5 text-[10.5px] text-white/60">{formatTime(entry.created_at)}</p>}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      <p className="mt-3 pb-4 text-center text-[10.5px] leading-tight text-white/60">
        Koltuktan indirme ve odadan atma işlemleri sohbet paneline değil buraya kaydedilir.
      </p>
    </VoiceSheet>
  );
}