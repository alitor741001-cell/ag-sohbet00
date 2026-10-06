import { useEffect, useRef, useState } from 'react';
import { Loader2, Music, Pause, Play, Settings, Square, Upload, Volume2 } from 'lucide-react';
import VoiceSheet from '@/components/voice/VoiceSheet';
import VoiceMenuTile from '@/components/voice/VoiceMenuTile';
import { useToast } from '@/components/ui/use-toast';

const clock = (seconds) => {
  const total = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

/**
 * Oda müziği penceresi: oda sahibi ve yöneticiler telefondan şarkı seçer,
 * odadaki herkes aynı şarkıyı duyar ve kendi telefonunda sesini ayarlar.
 */
export default function RoomMusicSheet({ open, onClose, music, volume, onVolume, isMod, uploading, onUpload, onControl, onOpenSettings }) {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [now, setNow] = useState(() => Date.now());

  // Süre yalnızca şarkı çalarken ve pencere açıkken ilerler.
  useEffect(() => {
    if (!open || !music?.is_playing) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [open, music?.is_playing]);

  const elapsed = (Number(music?.position) || 0) + (music?.is_playing && music?.started_at
    ? Math.max(0, (now - new Date(music.started_at).getTime()) / 1000)
    : 0);

  const pick = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const result = await onUpload(file);
    if (result === 'too-large') toast({ title: 'Şarkı çok büyük', description: 'En fazla 15 MB boyutunda bir şarkı seç.', variant: 'destructive' });
    else if (result === 'busy') toast({ title: 'Çok sık şarkı değiştiriliyor', description: 'Biraz bekleyip tekrar dene.', variant: 'destructive' });
    else if (result === 'error') toast({ title: 'Şarkı açılamadı', description: 'Dosyayı tekrar seç.', variant: 'destructive' });
    else if (result === 'ok') toast({ title: '🎵 Müzik açıldı', description: 'Odadaki herkes şarkıyı duyuyor.' });
  };

  return (
    <VoiceSheet open={open} onClose={onClose} title="Oda müziği">
      <div className="rounded-2xl border border-[#FFD700]/45 bg-black/70 p-3">
        {music ? (
          <>
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FFD700]/15 text-[#FFD700]">
                <Music className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{music.title || 'Şarkı'}</p>
                <p className="text-[11px] text-white/50">
                  {music.owner_name ? `${music.owner_name} açtı` : 'Odada çalıyor'} • {clock(elapsed)}
                  {music.is_playing ? '' : ' • duraklatıldı'}
                </p>
              </div>
            </div>
            {isMod && (
              <div className="mt-3 grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => onControl(music.is_playing ? 'pause' : 'play')}
                  className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-[#FFD700] text-sm font-bold text-black"
                >
                  {music.is_playing ? <><Pause className="h-4 w-4" /> Duraklat</> : <><Play className="h-4 w-4" /> Çal</>}
                </button>
                <button type="button" onClick={() => fileRef.current?.click()} className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-white/10 text-sm font-bold">
                  <Upload className="h-4 w-4" /> Şarkı değiştir
                </button>
                <button type="button" onClick={() => onControl('stop')} className="flex h-11 items-center justify-center gap-1.5 rounded-xl bg-red-600 text-sm font-bold">
                  <Square className="h-4 w-4" /> Durdur
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="py-2 text-center">
            <p className="text-sm font-bold">Odada müzik yok</p>
            <p className="mt-1 text-[11px] text-white/55">
              {isMod ? 'Telefonundaki şarkıyı seç; odadaki herkes aynı şarkıyı duyar.' : 'Müziği oda sahibi ve yöneticiler açabilir.'}
            </p>
            {isMod && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#FFD700] text-sm font-bold text-black"
              >
                <Upload className="h-4 w-4" /> Telefondan şarkı seç
              </button>
            )}
          </div>
        )}
        {uploading && (
          <p className="mt-3 flex items-center justify-center gap-2 text-[11px] text-white/60">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Şarkı odaya yükleniyor…
          </p>
        )}
      </div>

      {/* Ses seviyesi yalnızca bu cihazda çalışır: herkes müziği kendi telefonunda kısar. */}
      <div className="mt-3 rounded-2xl border border-white/10 bg-black/60 p-3">
        <div className="flex items-center gap-3">
          <Volume2 className="h-4 w-4 shrink-0 text-white/70" />
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round((Number(volume) || 0) * 100)}
            onChange={(event) => onVolume(Number(event.target.value) / 100)}
            className="h-1.5 min-w-0 flex-1 accent-[#FFD700]"
            aria-label="Müzik ses seviyesi"
          />
          <span className="w-10 shrink-0 text-right text-[11px] font-bold tabular-nums text-white/70">{Math.round((Number(volume) || 0) * 100)}%</span>
        </div>
        <p className="mt-2 text-[11px] text-white/45">Ses seviyesi yalnızca senin telefonunda değişir.</p>
      </div>

      {isMod && (
        <div className="mt-4">
          <VoiceMenuTile icon={Settings} label="Oda Ayarları" tone="gold" onClick={onOpenSettings} />
        </div>
      )}

      <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={pick} />
    </VoiceSheet>
  );
}