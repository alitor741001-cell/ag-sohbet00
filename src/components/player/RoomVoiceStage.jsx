import ProfileFrame from '@/components/ProfileFrame';
import XpAvatar from '@/components/xp/XpAvatar';
import VoiceControls from '@/components/player/VoiceControls';

/** Sesli sohbet alanı: odadaki herkes burada görünür, mikrofonu açan konuşur. Kimse odadan çıkarılmaz. */
export default function RoomVoiceStage({ participants = [], voice, userId, viewerProfiles = {} }) {
  const speakingIds = voice?.speakingIds || [];

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-4 overflow-hidden bg-black p-4">
      <p className="text-sm font-bold text-white/85">Sesli Sohbet Alanı</p>

      <div className="flex max-h-[55%] w-full flex-wrap content-start items-start justify-center gap-3 overflow-y-auto">
        {participants.map((person) => {
          const profile = viewerProfiles[person.user_id];
          const avatar = person.avatar || profile?.avatar;
          const speaking = speakingIds.includes(person.user_id);
          return (
            <div key={person.user_id} className="flex w-16 flex-col items-center gap-1">
              <div className={`rounded-full ${speaking ? 'speaking-glow' : ''}`}>
                {profile?.profile_frame ? (
                  <ProfileFrame frame={profile.profile_frame} avatar={avatar} name={person.name} size="md" frameScale={profile.profile_frame_scale} />
                ) : (
                  <XpAvatar avatar={avatar} name={person.name} userId={person.user_id} size="md" />
                )}
              </div>
              <p className="w-full truncate text-center text-[10px] font-semibold text-white/85">
                {person.user_id === userId ? 'Sen' : person.name}
              </p>
            </div>
          );
        })}
      </div>

      <div className="w-64 max-w-full">
        <VoiceControls voice={voice} />
      </div>

      <p className="max-w-xs text-center text-[11px] text-white/55">
        Odadaki herkes sesli sohbete katılabilir. Yönetici film odasına döndüğünde film kaldığı yerden devam eder.
      </p>
    </div>
  );
}