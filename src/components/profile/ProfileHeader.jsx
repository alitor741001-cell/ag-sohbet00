import { useState } from 'react';
import { Camera, Crown, Loader2, Shield } from 'lucide-react';
import RoleBadge from '@/components/RoleBadge';
import XpAvatar from '@/components/xp/XpAvatar';
import { isRedNameVip } from '@/lib/userLevels';
import { visibleEmail } from '@/lib/visibleEmail';
import useXp from '@/hooks/useXp';

/** Profil başlığı: çerçevesiz avatar, yanında kamera simgesi; altında isim, e-posta ve rol etiketi. */
export default function ProfileHeader({ user, avatar, onAvatar, uploading }) {
  const [editing, setEditing] = useState(false);
  const name = user.username || user.full_name || 'Kullanıcı';
  const isAdmin = user.role === 'admin';
  const hasRole = user.display_role || user.custom_role?.name;
  const xpStats = useXp([user.id])[user.id];

  const avatarBox = (
    <span className="block rounded-full p-[3px]" style={{ background: 'linear-gradient(135deg, #c62828, #f2ce6b)', boxShadow: '0 0 18px rgba(242,206,107,0.45), 0 0 34px rgba(198,40,40,0.35)' }}>
      <XpAvatar avatar={avatar || user.avatar} name={name} frame={xpStats?.frame} size="xl" />
    </span>
  );

  return (
    <header className="flex flex-col items-center px-4 pb-1 pt-5 text-center">
      <div className={`relative ${editing ? 'rounded-full ring-2 ring-red-500' : ''}`}>
        {avatarBox}
        {/* Profilin yanındaki kamera simgesi: dokunulunca düzenleme modu açılır
            (fotoğraf seçme). */}
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label="Profil fotoğrafını düzenle"
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
            Fotoğraf Seç
            <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={uploading} onChange={onAvatar} />
          </label>
          <button onClick={() => setEditing(false)} className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white">
            Kapat
          </button>
        </div>
      )}

      <div className="mt-2 flex items-center gap-2">
        {isAdmin && <Crown className="h-5 w-5 text-[#f2ce6b]" />}
        <h2 className="text-xl font-extrabold text-white" style={isRedNameVip(user.vip_level) ? { color: '#ef4444' } : undefined}>{name}</h2>
      </div>
      {visibleEmail(user) && <p className="mt-1 max-w-full truncate text-xs text-white/55">{visibleEmail(user)}</p>}
      {(isAdmin || hasRole) && (
        <div className="mt-2 flex items-center justify-center gap-2">
          {isAdmin ? (
            <span className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold" style={{ background: 'linear-gradient(135deg, rgba(198,40,40,0.45), rgba(242,206,107,0.25))', color: '#f2ce6b', border: '1px solid rgba(242,206,107,0.45)', boxShadow: '0 0 12px rgba(242,206,107,0.3)' }}>
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