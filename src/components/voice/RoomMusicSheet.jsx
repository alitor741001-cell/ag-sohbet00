import { useEffect, useState } from 'react';
import { Loader2, Music, Pause, Play, Square, Upload } from 'lucide-react';
import VoiceSheet from '@/components/voice/VoiceSheet';
import RoomTrackList from '@/components/voice/RoomTrackList';
import { useToast } from '@/components/ui/use-toast';

const clock = (seconds) => {
  const total = Math.max(0, Math.floor(seconds || 0));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

/**
 * Oda müziği penceresi: oda sahibi ve yöneticiler telefondan şarkı seçer,
 * odadaki herkes aynı şarkıyı duyar ve kendi telefonunda sesini ayarlar.
 */
export default function RoomMusicSheet({ open, onClose, music, tracks = [], currentUri, isMod, uploading, onUpload, onPlayTrack, onControl }) {
  const { toast } = useToast();
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

  // Sonuç bildirimleri tek yerde: yükleme ve listeden çalma aynı mesajları kullanır.
  const report = (result) => {
    if (result === 'too-large') toast({ title: 'Şarkı çok büyük', description: 'En fazla 25 MB boyutunda bir şarkı seç.', variant: 'destructive' });
    else if (result === 'busy') toast({ title: 'Çok sık şarkı değiştiriliyor', description: 'Biraz bekleyip tekrar dene.', variant: 'destructive' });
    else if (result === 'timeout') toast({ title: 'Yükleme tamamlanmadı', description: 'Bağlantı yavaş olabilir. Dosyayı tekrar seçmeyi dene.', variant: 'destructive' });
    else if (result === 'error') toast({ title: 'Şarkı açılamadı', description: 'Bağlantını kontrol edip tekrar dene. Korumalı (Apple Music) şarkılar yüklenemez.', variant: 'destructive' });
    else if (result === 'ok') toast({ title: '🎵 Müzik açıldı', description: 'Odadaki herkes şarkıyı duyuyor.' });
  };

  const pick = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;
    if (uploading) return;
    const result = await onUpload(file);
    // Seçim alanı yükleme bitince sıfırlanır: iOS dosya referansı yükleme sırasında silinmez.
    input.value = '';
    report(result);

  };

  // Listeden seçilen şarkı odaya açılır; pencere açık kalır.
  const play = async (track) => {

    report(await onPlayTrack(track));

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
                <label htmlFor="room-music-file" className="flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-white/10 text-sm font-bold">
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Telefondan yükle
                </label>
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
              <label
                htmlFor="room-music-file"
                className="mt-3 flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#FFD700] text-sm font-bold text-black"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Telefondan yükle
              </label>
            )}
          </div>
        )}
      </div>

      {/* Yüklenen şarkılar: müzik tuşuna basıldığında liste hâlinde görünür. */}
      <RoomTrackList tracks={tracks} currentUri={currentUri} canPlay={isMod} busy={uploading} onPlay={play} />

      {/* iPhone'da müzik dosyası Dosyalar'dan seçilir; Apple Music şarkıları korumalıdır. */}
      <p className="mt-2 px-1 text-[11px] leading-snug text-white/45">
        iPhone'da şarkıyı Dosyalar (Files) uygulamasında bulup oradan seç. Apple Music'te indirilen korumalı şarkılar yüklenemez.
      </p>

      {/* Seçici iPhone'da en güvenilir şekilde etiketle açılır: input görünmez ama sayfada durur. */}
      <input
        id="room-music-file"
        disabled={uploading}
        type="file"
        accept="audio/*,.mp3,.m4a,.aac,.m4b,.wav,.ogg,.oga,.opus,.flac,.mp4,.webm"
        className="absolute h-px w-px overflow-hidden opacity-0"
        onChange={pick}
      />
    </VoiceSheet>
  );
}