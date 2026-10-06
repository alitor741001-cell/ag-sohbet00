import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Mic } from 'lucide-react';
import { base44 } from '@/api/base44Client';

/**
 * Kayıtlı bilgilerle sesli oda açar: kullanıcı koltuk düzenini, oda adını ve şifresini
 * bir kez girdiyse bir daha sorulmaz. Oda açılamazsa forma düşülür.
 */
export default function VoiceRoomAutoOpen({ preset, onFailed }) {
  const navigate = useNavigate();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let alive = true;
    (async () => {
      try {
        const response = await base44.functions.invoke('create-room', {
          name: preset.name,
          room_type: 'voice',
          seat_count: Number(preset.seat_count) || 8,
        });
        const roomId = response.data?.id;
        if (!roomId) throw new Error('oda oluşturulamadı');
        if (alive) navigate(`/sesli-oda/${roomId}`, { replace: true });
      } catch {
        if (alive) onFailed?.();
      }
    })();
    return () => { alive = false; };
  }, [preset, navigate, onFailed]);

  return (
    <div className="dark flex min-h-screen flex-col items-center justify-center gap-3 px-6 text-center text-white">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20">
        <Mic className="h-7 w-7 text-primary" />
      </span>
      <p className="flex items-center gap-2 text-sm font-semibold">
        <Loader2 className="h-4 w-4 animate-spin" /> Kayıtlı bilgilerinle odan açılıyor…
      </p>
      <p className="text-xs text-gray-400">{preset.name} • {Number(preset.seat_count) || 8} mikrofon koltuğu</p>
    </div>
  );
}