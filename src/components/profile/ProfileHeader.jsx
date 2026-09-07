import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import ProfileFrame from '@/components/ProfileFrame';
import RoleBadge from '@/components/RoleBadge';
import { Camera, Loader2, Crown, Calendar } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function ProfileHeader({ user, updateUser }) {
  const [uploading, setUploading] = useState(false);

  const onAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await updateUser({ avatar: file_url });
      toast({ title: 'Profil güncellendi' });
    } catch (err) {
      toast({ title: 'Hata', description: err.message, variant: 'destructive' });
    } finally { setUploading(false); }
  };

  const isActive = user?.membership_status === 'active' && (!user?.membership_end || new Date(user.membership_end) > new Date());

  return (
    <div className="relative mb-8">
      <div className="h-32 rounded-2xl bg-gradient-to-r from-purple-600/30 to-pink-600/30" />
      <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 px-4">
        <div className="relative">
          <ProfileFrame user={user} src={user?.avatar} size={128} />
          <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center cursor-pointer hover:bg-purple-700">
            {uploading ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Camera className="w-4 h-4 text-white" />}
            <input type="file" accept="image/*" className="hidden" onChange={onAvatar} />
          </label>
        </div>
        <div className="flex-1 text-center sm:text-left pb-2">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <h1 className="text-2xl font-bold text-white">{user?.full_name || user?.username}</h1>
            <RoleBadge user={user} />
          </div>
          <p className="text-sm text-muted-foreground">@{user?.username}</p>
          <div className="flex items-center gap-4 mt-2 justify-center sm:justify-start">
            <span className={`flex items-center gap-1 text-xs ${isActive ? 'text-green-400' : 'text-amber-400'}`}>
              <Crown className="w-3 h-3" /> {isActive ? 'Aktif Üye' : 'Pasif Üye'}
            </span>
            {user?.membership_end && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" /> {new Date(user.membership_end).toLocaleDateString('tr-TR')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}