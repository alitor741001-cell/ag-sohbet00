import { Camera, Crown, Loader2, LogOut } from 'lucide-react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';

export default function ProfileHeader({ user, pkg, expired, avatar, onAvatar, uploading }) {
  const name = user.username || user.full_name || 'Kullanıcı';
  const status = user.role === 'admin' ? 'Kurucu · Süresiz' : user.membership_status === 'pending' ? 'Onay Bekliyor' : expired ? 'Süresi Doldu' : pkg?.name || 'Aktif Üyelik';
  return <header className="flex flex-col items-center text-center mb-6">
    <div className="relative mb-4 h-28 w-28 overflow-hidden rounded-full bg-secondary border-2 border-border">
      {avatar || user.avatar ? <Image src={avatar || user.avatar} alt={name} className="h-full w-full object-cover" fittingType="fill" /> : <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-muted-foreground">{name.slice(0, 1).toUpperCase()}</div>}
      <label className="absolute bottom-1 right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
        {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Camera className="h-5 w-5" />}<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={uploading} onChange={onAvatar} />
      </label>
    </div>
    <div className="flex items-center gap-2"><h1 className="text-2xl font-extrabold">{name}</h1>{user.role === 'admin' && <Crown className="w-5 h-5 text-amber-400" />}</div>
    <p className="text-sm text-muted-foreground">{user.email}</p><span className="mt-3 rounded-md bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-400">{status}</span>
    <div className="mt-4 flex gap-3">{user.role === 'admin' && <Link to="/admin" className="rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold flex items-center gap-2"><Crown className="w-4 h-4 text-amber-400" />Admin Paneli</Link>}<button onClick={() => base44.auth.logout('/login')} className="rounded-full bg-secondary px-5 py-2.5 text-sm font-semibold flex items-center gap-2"><LogOut className="w-4 h-4" />Çıkış</button></div>
  </header>;
}