import { useEffect, useState } from 'react';
import { Copy } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ProfileFrame from '@/components/ProfileFrame';
import ProfileActionRow from '@/components/voice/ProfileActionRow';
import { useToast } from '@/components/ui/use-toast';

/** Profil kartı: isim, kopyalanabilir kimlik, rol ve eylem satırı. */
export default function VoiceProfileCard({ userId, nameHint, avatarHint, frameHint, actions = [], children }) {
  const { toast } = useToast();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!userId) return;
    setProfile(null);
    base44.functions.invoke('user-profile', { user_id: userId })
      .then((response) => setProfile(response?.data || {}))
      .catch(() => setProfile({}));
  }, [userId]);

  const name = profile?.username || profile?.full_name || nameHint || 'Kullanıcı';
  const avatar = profile?.avatar || avatarHint || '';
  const frame = profile?.profile_frame || frameHint || '';
  const memberId = profile?.member_id && profile.member_id !== '-' ? profile.member_id : String(userId || '').slice(-8);
  const roleLabel = profile?.title || profile?.display_role || '';

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(memberId);
      toast({ title: 'Kimlik kopyalandı', description: `#${memberId}` });
    } catch {
      toast({ title: 'Kopyalanamadı', variant: 'destructive' });
    }
  };

  return (
    <div>
      <div className="flex flex-col items-center gap-1.5">
        {frame
          ? <ProfileFrame frame={frame} avatar={avatar} name={name} size="sm" />
          : avatar
            ? <img src={avatar} alt={name} className="h-12 w-12 rounded-full object-cover object-center" referrerPolicy="no-referrer" draggable={false} />
            : <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1F2024] text-lg font-bold text-white">{(name || '?')[0]}</span>}
        <p className="text-sm font-bold text-[#1F2024]">{name}</p>
        {roleLabel && <p className="text-[11px] font-semibold text-[#6b7280]">{roleLabel}</p>}
        <button type="button" onClick={copyId} className="flex items-center gap-1.5 rounded-lg bg-black/5 px-2.5 py-1 text-[11px] font-semibold text-[#1F2024] active:scale-95 transition-transform">
          <span className="font-mono">#{memberId}</span>
          <Copy className="h-3 w-3" />
        </button>
      </div>
      {actions.length > 0 && <ProfileActionRow items={actions} />}
      {children}
    </div>
  );
}