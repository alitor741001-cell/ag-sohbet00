import { useState } from 'react';
import { Camera, Check, Loader2, Pencil } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Image } from '@/components/ui/image';
import ProfileFrame from '@/components/ProfileFrame';
import usePhotoGestures from '@/hooks/usePhotoGestures';

export default function AdminProfilePhotoEditor({ user, onUpdated }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [avatar, setAvatar] = useState(user.avatar || '');
  const name = user.username || user.full_name || 'Kullanıcı';
  const { zoom, panX, panY, commit, handlers } = usePhotoGestures({
    initialZoom: user.profile_frame_scale || 100,
    initialPanX: user.profile_avatar_x || 0,
    initialPanY: user.profile_avatar_y || 0,
    onCommit: (payload) => base44.entities.User.update(user.id, payload),
  });
  const upload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.User.update(user.id, { avatar: file_url });
      setAvatar(file_url); await onUpdated?.(); toast({ title: 'Profil fotoğrafı güncellendi' });
    } catch (error) { toast({ title: 'Yükleme hatası', description: error.message, variant: 'destructive' }); }
    finally { setUploading(false); event.target.value = ''; }
  };
  const save = async () => {
    setSaving(true);
    try { await commit(); await onUpdated?.(); setEditing(false); toast({ title: 'Profil görünümü kaydedildi' }); }
    catch (error) { toast({ title: 'Kaydedilemedi', description: error.message, variant: 'destructive' }); }
    finally { setSaving(false); }
  };
  return <div className="mt-3 flex flex-col items-start gap-2">
    <div className={`relative ${editing ? 'rounded-full ring-2 ring-primary' : ''}`} style={editing && user.profile_frame ? { touchAction: 'none' } : undefined} {...(editing && user.profile_frame ? handlers : {})}>
      {user.profile_frame ? <ProfileFrame frame={user.profile_frame} size="lg" avatar={avatar} name={name} frameScale={zoom} panX={panX} panY={panY} /> : avatar ? <Image src={avatar} className="h-14 w-14 rounded-full" fittingType="fill" alt={name} /> : <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary font-bold">{name[0]}</span>}
      <label className="absolute bottom-0 right-0 z-20 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">{uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" disabled={uploading} onChange={upload} /></label>
    </div>
    {user.profile_frame && (editing ? <><p className="text-[11px] text-muted-foreground">Tek parmakla taşı, iki parmakla yakınlaştır.</p><button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}Profili Sabitle</button></> : <button onClick={() => setEditing(true)} className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold"><Pencil className="h-3.5 w-3.5" />Profili Düzenle</button>)}
  </div>;
}