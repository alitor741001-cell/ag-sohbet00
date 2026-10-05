import { useState } from 'react';
import { Camera, Crown, Loader2, Shield } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import ProfileFrame from '@/components/ProfileFrame';
import RoleBadge from '@/components/RoleBadge';
import XpAvatar from '@/components/xp/XpAvatar';
import { isRedNameVip } from '@/lib/userLevels';
import useXp from '@/hooks/useXp';
import { useToast } from '@/components/ui/use-toast';
import usePhotoGestures from '@/hooks/usePhotoGestures';

/** Profil başlığı: neon halkalı avatar, yanında kamera simgesi; altında isim, e-posta ve rol etiketi. */
export default function ProfileHeader({ user, avatar, onAvatar, onUpdated, uploading }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const name = user.username || user.full_name || 'Kullanıcı';
  const isAdmin = user.role === 'admin';
  const hasRole = user.display_role || user.custom_role?.name;
  const xpStats = useXp([user.id])[user.id];
  const { zoom, panX, panY, commit, handlers } = usePhotoGestures({
    initialZoom: user.profile_frame_scale || 100,
    initialPanX: user.profile_avatar_x || 0,
    initialPanY: user.profile_avatar_y || 0,
    onCommit: async (payload) => {
      await base44.functions.invoke('update-profile', payload);
      await onUpdated?.();
    },
  });
  const handleSave = async () => {
    setSaving(true);
    try { if (user.profile_frame) await commit(); }
    catch (error) { toast({ title: 'Kaydedilemedi', description: error.response?.data?.error || error.message, variant: 'destructive' }); }
    finally { setSaving(false); setEditing(false); }
  };

  const avatarBox = user.profile_frame ? (
    <ProfileFrame frame={user.profile_frame} size="xl" avatar={avatar || user.avatar} name={name} frameScale={zoom} panX={panX} panY={panY} />
  ) : (
    <span className="block rounded-full p-[3px]" style={{ background: 'linear-gradient(135deg, #e040fb, #00e5ff 55%, #7c4dff)', boxShadow: '0 0 18px rgba(224,64,251,0.45), 0 0 34px rgba(0,229,255,0.28)' }}>
      <XpAvatar avatar={avatar || user.avatar} name={name} frame={xpStats?.frame} size="xl" />
    </span>
  );

  return (
    <header className="flex flex-col items-center px-4 pb-1 pt-5 text-center">
      <div
        className={`relative ${editing ? 'rounded-full ring-2 ring-red-500' : ''}`}
        style={editing && user.profile_frame ? { touchAction: 'none' } : undefined}
        {...(editing && user.profile_frame ? handlers : {})}
      >
        {avatarBox}
        {/* Profilin yanındaki kamera simgesi: dokunulunca düzenleme modu açılır
            (fotoğraf seçme + kaydetme). */}
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Profili düzenle"
            className="absolute -bottom-1 -right-1 z-20 flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#f2ce6b] text-white active:scale-95"
            style={{ background: 'linear-gradient(135deg, #dc2626, #f2ce6b)', boxShadow: '0 0 14px rgba(242,206,107,0.6)' }}
          >
            <Camera className="h-4 w-4" />
          </button>
        )}
      </div>

      {editing && (
        <div className="mt-3 flex items-center justify-center gap-2">
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-white">
            {uploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Fotoğrafı Değiştir
            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={uploading} onChange={onAvatar} />
          </label>
          <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Profili Kaydet
          </button>
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
        {isAdmin && <Crown className="h-5 w-5 text-amber-400" />}
        <h2 className="text-xl font-extrabold text-white" style={isRedNameVip(user.vip_level) ? { color: '#ef4444' } : undefined}>{name}</h2>
      </div>
      <p className="mt-1 max-w-full truncate text-xs text-white/55">{user.email}</p>
      {(isAdmin || hasRole) && (
        <div className="mt-2 flex items-center justify-center gap-2">
          {isAdmin ? (
            <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold" style={{ background: 'rgba(124,77,255,0.35)', color: '#d8b4fe', boxShadow: '0 0 12px rgba(124,77,255,0.35)' }}>
              <Shield className="h-3.5 w-3.5" /> Yönetici
            </span>
          ) : (
            <RoleBadge user={user} size="lg" />
          )}
        </div>
      )}
    </header>
  );
}