import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Settings2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { ROOM_BACKGROUNDS } from '@/lib/roomBackgrounds';

/**
 * Kayıtlı oda bilgileriyle odayı doğrudan açar: oda adı, kapak ve arka plan bir kez
 * girildiği için "Oda Kur" her basıldığında form tekrar sorulmaz, oda anında açılır.
 */
export default function RoomAutoOpen({ preset, onFailed }) {
  const navigate = useNavigate();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let alive = true;
    (async () => {
      try {
        const res = await base44.functions.invoke('personal-room', {
          settings: {
            name: preset.name,
            seat_count: Number(preset.seat_count) || 8,
            background: preset.background || ROOM_BACKGROUNDS[0].key,
            cover_url: preset.cover_url || '',
            voice: true,
          },
        });
        const id = res.data?.id;
        if (!id) throw new Error('oda oluşturulamadı');
        if (alive) navigate(`/sesli-oda/${id}`, { replace: true });
      } catch {
        if (alive) onFailed?.();
      }
    })();
    return () => { alive = false; };
  }, [preset, navigate, onFailed]);

  return (
    <div
      className="dark flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center text-white"
      style={{ background: 'radial-gradient(120% 70% at 50% 0%, #241c40 0%, #14131c 46%, #0c0c10 100%)' }}
    >
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Loader2 className="h-4 w-4 animate-spin" /> Kayıtlı bilgilerinle odan açılıyor…
      </p>
      <p className="text-xs text-white/55">{preset.name}</p>
      <button
        type="button"
        onClick={() => navigate('/oda-kur?duzenle=1', { replace: true })}
        className="mt-2 flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 active:scale-95"
      >
        <Settings2 className="h-3.5 w-3.5" /> Ayarları düzenle
      </button>
    </div>
  );
}