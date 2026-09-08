import { Camera, Crown, Loader2, LogOut, Minus, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import ProfileFrame from '@/components/ProfileFrame';
import RoleBadge from '@/components/RoleBadge';
import useRoomLevels from '@/hooks/useRoomLevels';
import RoomLevelBadge from '@/components/levels/RoomLevelBadge';
import useXp from '@/hooks/useXp';
import XpStatsCard from '@/components/xp/XpStatsCard';
import XpAvatar from '@/components/xp/XpAvatar';
import { daysInApp } from '@/lib/xp';
import { useToast } from '@/components/ui/use-toast';
import usePhotoGestures from '@/hooks/usePhotoGestures';

export default function ProfileHeader({ user, pkg, expired, avatar, onAvatar, onUpdated, uploading }) {
  const { toast } = useToast();
  const name = user.username || user.full_name || 'Kullanıcı';
  const status = user.role === 'admin' ? 'Kurucu · Süresiz' : user.membership_status === 'pending' ? 'Onay Bekliyor' : expired ? 'Süresi Doldu' : pkg?.name || 'Aktif Üyelik';
  const hasRole = user.display_role || user.custom_role?.name;
  const { levels: roomLevels } = useRoomLevels([user.id]);
  const xpStats = useXp([user.id])[user.id];
  const { zoom, panX, panY, adjustY, adjustX, handlers } = usePhotoGestures({
    initialZoom: user.profile_frame_scale || 100,
    initialPanX: user.profile_avatar_x || 0,
    initialPanY: user.profile_avatar_y || 0,
    onCommit: async (payload) => {
      try { await base44.functions.invoke('update-profile', payload); await onUpdated?.(); }
      catch (error) { toast({ title: 'Kaydedilemedi', description: error.response?.data?.error || error.message, variant: 'destructive' }); }
    },
  });
  return <header className="flex flex-col items-center text-center mb-6">
    <div className="relative mb-4" style={user.profile_frame ? { touchAction: 'none' } : undefined} {...(user.profile_frame ? handlers : {})}>
      {user.profile_frame ? (
        <ProfileFrame frame={user.profile_frame} size="lg" avatar={avatar || user.avatar} name={name} frameScale={zoom} panX={panX} panY={panY} />
      ) : (
        <XpAvatar avatar={avatar || user.avatar} name={name} frame={xpStats?.frame} size="lg" />
      )}
      <label className="absolute bottom-1 right-1 z-20 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
        {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}
        <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={uploading} onChange={onAvatar} />
      </label>
    </div>
    {user.profile_frame && (
      <div className="mb-3 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <button onClick={() => adjustY(-5)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary border border-border" aria-label="Aşağı"><Minus className="w-4 h-4" /></button>
          <span className="min-w-[3.5rem] text-xs font-semibold text-muted-foreground">Y: %{Math.round(panY)}</span>
          <button onClick={() => adjustY(5)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary border border-border" aria-label="Yukarı"><Plus className="w-4 h-4" /></button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => adjustX(-5)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary border border-border" aria-label="Sol"><Minus className="w-4 h-4" /></button>
          <span className="min-w-[3.5rem] text-xs font-semibold text-muted-foreground">X: %{Math.round(panX)}</span>
          <button onClick={() => adjustX(5)} className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary border border-border" aria-label="Sağ"><Plus className="w-4 h-4" /></button>
        </div>
      </div>
    )}
    <div className="flex items-center gap-2">
      <h1 className="text-2xl font-extrabold">{name}</h1>
      {user.role === 'admin' && <Crown className="w-5 h-5 text-amber-400" />}
    </div>
    <p className="text-sm text-muted-foreground">{user.email}</p>
    <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
      <span className="rounded-md bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-400">{status}</span>
      {hasRole && <RoleBadge user={user} size="md" />}
      <RoomLevelBadge level={roomLevels[user.id]} profile />
    </div>
    <div className="mt-3 w-full max-w-md"><XpStatsCard stats={xpStats} days={daysInApp(user.created_date)} /></div>
    <div className="mt-4 flex gap-3">
      {user.role === 'admin' && <Link to="/admin" className="rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold flex items-center gap-2"><Crown className="w-4 h-4 text-amber-400" />Admin Paneli</Link>}
      <button onClick={() => base44.auth.logout('/login')} className="rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold flex items-center gap-2"><LogOut className="w-4 h-4" />Çıkış</button>
    </div>
  </header>;
}