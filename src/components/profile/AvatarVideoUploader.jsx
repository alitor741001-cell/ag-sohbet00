import { useState } from 'react';
import { Loader2, Video, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const MAX_MB = 8;

/** Hareketli avatar için kısa video (mp4/webm) yükler ve profile kaydeder. */
export default function AvatarVideoUploader() {
  const { user, checkUserAuth } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const current = user?.avatar_video || '';

  const save = async (url) => {
    await base44.functions.invoke('update-profile', { avatar_video: url });
    await checkUserAuth?.();
  };

  const onFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('video/')) return setError('Lütfen bir video dosyası seç.');
    if (file.size > MAX_MB * 1024 * 1024) return setError(`Video en fazla ${MAX_MB} MB olabilir.`);
    setBusy(true); setError('');
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      await save(file_url);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
    setBusy(false);
  };

  return <div className="mb-3 rounded-xl border border-cabinet-light/25 p-3">
    <div className="flex items-center gap-3">
      {current && <video src={current} autoPlay loop muted playsInline className="h-14 w-14 rounded-full object-cover" />}
      <label className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-full border border-cabinet-gold px-4 text-xs font-bold text-cabinet-gold">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
        {current ? 'Videoyu Değiştir' : 'Avatar Videosu Yükle'}
        <input type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" disabled={busy} onChange={onFile} />
      </label>
      {current && <button type="button" aria-label="Videoyu kaldır" disabled={busy} onClick={() => save('')} className="flex h-11 w-11 items-center justify-center rounded-full border border-destructive/50 text-destructive"><Trash2 className="h-4 w-4" /></button>}
    </div>
    <p className="mt-2 text-[10px] text-muted-foreground">Kısa, döngülü bir video seç (en fazla {MAX_MB} MB). Hareketli avatar aktifken profilinde video oynar.</p>
    {error && <p role="alert" className="mt-1 text-[10px] text-destructive">{error}</p>}
  </div>;
}