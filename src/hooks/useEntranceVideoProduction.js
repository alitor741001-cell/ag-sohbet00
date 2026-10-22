import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { cosmeticArtwork } from '@/lib/cosmeticMedia';
export default function useEntranceVideoProduction(product) {
  const [estimate, setEstimate] = useState(null); const [job, setJob] = useState({ id: product.video_job_id, status: product.video_status, url: product.video_url });
  const [busy, setBusy] = useState(false); const [error, setError] = useState(''); const [cycle, setCycle] = useState(0); const [waiting, setWaiting] = useState(false);
  const quote = async () => {
    setBusy(true); setError('');
    try { const { data } = await base44.functions.invoke('entranceVideos', { action: 'estimate', product_id: product.id }); setEstimate(data.estimated_credits); }
    catch (e) { setError(e.response?.data?.error || 'Maliyet hesaplanamadı.'); }
    finally { setBusy(false); }
  };
  const generate = async () => {
    if (busy) return; setBusy(true); setError('');
    try {
      const source = await cosmeticArtwork(product); const blob = await (await fetch(source)).blob();
      const extension = blob.type==='image/jpeg' ? 'jpg' : blob.type==='image/webp' ? 'webp' : 'png';
      const file = new File([blob], `entrance-${product.id}.${extension}`, { type: blob.type || 'image/png' });
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      const { data } = await base44.functions.invoke('entranceVideos', { action: 'create', product_id: product.id, reference_uri: file_uri });
      setJob(data);
    } catch (e) { setError(e.response?.data?.error || 'Üretim başlatılamadı.'); }
    finally { setBusy(false); }
  };
  useEffect(() => {
    if (!job.id || !['queued','in_progress'].includes(job.status)) return;
    let alive = true; let timer; let attempts = 0; setWaiting(false);
    const poll = async () => {
      if (!alive) return;
      if (attempts >= 40) { setWaiting(true); return; }
      if (document.visibilityState === 'hidden') { timer = setTimeout(poll,15000); return; }
      attempts++;
      try {
        const { data } = await base44.functions.invoke('entranceVideos', { action: 'retrieve', product_id: product.id });
        if (!alive) return;
        if (data.status==='failed') { setJob(data); setError(data.error || 'Üretim başarısız oldu.'); return; }
        if (data.status==='completed') { setJob(data); return; }
        setJob(old => ({ ...old, status: data.status })); timer = setTimeout(poll,15000);
      } catch (e) { if (alive) { setError(e.response?.data?.error || 'Durum alınamadı; üretim sürüyor olabilir.'); setWaiting(true); } }
    };
    timer = setTimeout(poll,15000);
    return () => { alive = false; clearTimeout(timer); };
  }, [job.id, cycle, product.id]);
  return { estimate, job, busy, error, waiting, quote, generate, resume: () => setCycle(old => old+1) };
}