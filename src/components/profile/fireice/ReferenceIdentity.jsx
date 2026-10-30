import { Camera, ChevronDown, LogOut, Pencil, Settings, Shield } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { badgesFromUser, vipDaysLeft } from '@/lib/userLevels';

export default function ReferenceIdentity({ user, avatar, uploading, onAvatar, onEdit, onSettings, onAdmin, onLogout }) {
  const name = user.username || user.full_name || 'Kullanıcı';
  const badges = badgesFromUser(user);
  const days = vipDaysLeft(user);
  return <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild><button className="reference-title" aria-label="Hesap menüsü">Profil <ChevronDown className="h-3 w-3" /></button></DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}><Pencil className="mr-2 h-4 w-4" />Bilgilerimi düzenle</DropdownMenuItem>
        <DropdownMenuItem onClick={onSettings}><Settings className="mr-2 h-4 w-4" />Eklentiler</DropdownMenuItem>
        {user.role === 'admin' && <DropdownMenuItem onClick={onAdmin}><Shield className="mr-2 h-4 w-4" />Yönetim Paneli</DropdownMenuItem>}
        <DropdownMenuItem onClick={onLogout}><LogOut className="mr-2 h-4 w-4" />Çıkış Yap</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    <label className="reference-avatar" aria-label="Profil fotoğrafını düzenle">
      {avatar || user.avatar ? <Image src={avatar || user.avatar} alt={name} className="h-full w-full rounded-full" loading="eager" /> : <span>{name[0]}</span>}
      <span className="reference-camera"><Camera className="h-3 w-3" /></span>
      <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" disabled={uploading} onChange={onAvatar} className="hidden" />
    </label>
    <div className="reference-identity">
      <h1>{name}</h1>
      <span>ID: {user.member_id || '—'}</span>
      <span>N{badges.n_level} · {badges.vip_level ? `VIP ${badges.vip_level}` : 'Standart Üye'}</span>
      {badges.vip_level > 0 && <span>{days == null ? 'Süresiz VIP' : `${days} gün kaldı`}</span>}
      {uploading && <span>Yükleniyor…</span>}
    </div>
  </>;
}