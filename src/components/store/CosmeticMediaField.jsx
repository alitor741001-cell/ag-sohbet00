import { useState } from 'react';
import { base44 } from '@/api/base44Client';
export default function CosmeticMediaField({ label, value, onChange, video = false }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const upload = async event => {
    const file = event.target.files?.[0]; if (!file) return;
    const allowed = video ? ['video/mp4','video/webm'] : ['image/png','image/jpeg','image/webp'];
    if (!allowed.includes(file.type) || file.size > (video ? 20 : 5) * 1024 * 1024) { setError(video ? 'En fazla 20 MB MP4/WebM seç.' : 'En fazla 5 MB PNG, JPG veya WebP seç.'); return; }
    setBusy(true); setError('');
    try { const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file }); onChange(file_uri); }
    catch (e) { setError(e.message || 'Dosya yüklenemedi.'); }
    finally { setBusy(false); event.target.value = ''; }
  };
  return <label className="block space-y-2 text-xs text-cabinet-ink"><span>{label}</span><input value={value || ''} onChange={e => onChange(e.target.value)} placeholder={video ? 'MP4 / WebM bağlantısı veya özel dosya adresi' : 'Yüklenmiş görsel bağlantısı veya özel dosya adresi'} className="min-h-11 w-full rounded-xl border border-cabinet-light/35 bg-cabinet px-3 text-sm" /><input type="file" accept={video ? '.mp4,.webm' : '.png,.jpg,.jpeg,.webp'} disabled={busy} onChange={upload} className="w-full text-xs" />{busy && <span role="status">Yükleniyor…</span>}{error && <span role="alert" className="block text-destructive">{error}</span>}</label>;
}