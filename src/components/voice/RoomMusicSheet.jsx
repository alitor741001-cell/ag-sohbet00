import { useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import VoiceSheet from '@/components/voice/VoiceSheet';
import RoomTrackList from '@/components/voice/RoomTrackList';
import { useToast } from '@/components/ui/use-toast';

/**
 * Oda müziği penceresi: telefondan tek seferde birden fazla şarkı yüklenebilir.
 * Yüklenen şarkı kendiliğinden çalmaz; listeden dokunulduğunda odada çalar ve pencere kapanır.
 */
export default function RoomMusicSheet({ open, onClose, music, tracks = [], currentUri, uploading, onUpload, onPlayTrack, onDeleteTrack }) {
  const { toast } = useToast();
  const [count, setCount] = useState(0);

  // Listeden çalma sonucu bildirilir; şarkı açıldığında liste kapanır.
  const report = (result) => {
    if (result === 'busy') toast({ title: 'Çok sık şarkı değiştiriliyor', description: 'Biraz bekleyip tekrar dene.', variant: 'destructive' });
    else if (result === 'timeout') toast({ title: 'İşlem tamamlanmadı', description: 'Bağlantı yavaş olabilir. Tekrar dene.', variant: 'destructive' });
    else if (result === 'error') toast({ title: 'Şarkı açılamadı', description: 'Bağlantını kontrol edip tekrar dene.', variant: 'destructive' });
    else if (result === 'ok') toast({ title: '🎵 Müzik açıldı', description: 'Odadaki herkes şarkıyı duyuyor.' });
  };

  // Yükleme sonucu: kaç şarkının listeye eklendiği tek bildirimde söylenir.
  const reportUpload = (result) => {
    const status = result?.status;
    if (status === 'ok') toast({
      title: `🎵 ${result.added} şarkı listene eklendi`,
      description: result.skipped ? `${result.skipped} şarkı eklenemedi.` : 'Şarkı yalnızca listeden dokunduğunda odada çalar.',
    });
    else if (status === 'too-large') toast({ title: 'Şarkı çok büyük', description: 'Her şarkı en fazla 25 MB olabilir.', variant: 'destructive' });
    else if (status === 'busy') toast({ title: 'Çok sık işlem yapılıyor', description: 'Biraz bekleyip tekrar dene.', variant: 'destructive' });
    else if (status === 'timeout') toast({ title: 'Yükleme tamamlanmadı', description: 'Bağlantı yavaş olabilir. Dosyaları tekrar seçmeyi dene.', variant: 'destructive' });
    else toast({ title: 'Şarkı yüklenemedi', description: 'Bağlantını kontrol edip tekrar dene.', variant: 'destructive' });
  };

  // Birden fazla dosya seçilebilir; seçim alanı yükleme bitince sıfırlanır.
  const pick = async (event) => {
    const input = event.currentTarget;
    const files = Array.from(input.files || []);
    if (!files.length || uploading) return;
    setCount(files.length);
    const result = await onUpload(files);
    input.value = '';
    setCount(0);
    reportUpload(result);
  };

  // Listeden seçilen şarkı odaya açılır; liste hemen kapanır.
  const play = async (track) => {
    const result = await onPlayTrack(track);
    report(result);
    if (result === 'ok') onClose?.();
  };

  // Sola kaydırıp Sil'e basılan şarkı kendi listenden kaldırılır.
  const remove = async (track) => {
    const result = await onDeleteTrack(track);
    if (result === 'ok') toast({ title: '🗑️ Şarkı silindi', description: 'Şarkı listenden kaldırıldı.' });
    else if (result === 'busy') toast({ title: 'Çok sık işlem yapılıyor', description: 'Biraz bekleyip tekrar dene.', variant: 'destructive' });
    else toast({ title: 'Şarkı silinemedi', description: 'Bağlantını kontrol edip tekrar dene.', variant: 'destructive' });
  };

  return (
    <VoiceSheet open={open} onClose={onClose} title="Oda müziği">
      <div className="rounded-2xl border border-[#FFD700]/45 bg-black/70 p-3">
        <label
          htmlFor="room-music-file"
          className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#FFD700] text-sm font-bold text-black"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {uploading ? `${count || ''} şarkı yükleniyor...` : 'Telefondan şarkı yükle'}
        </label>
        <p className="mt-2 text-center text-[11px] leading-snug text-white/55">
          {music
            ? 'Odada müzik çalıyor. Yeni yüklediğin şarkılar kendiliğinden çalmaz.'
            : 'Birden fazla şarkı seçebilirsin. Yüklenen şarkı çalmaz; listenden dokunduğunda çalar.'}
        </p>
      </div>

      {/* Kendi şarkıların: yüklediklerin yalnızca senin listende görünür. */}
      <RoomTrackList tracks={tracks} currentUri={currentUri} busy={uploading} onPlay={play} onDelete={remove} />

      {/* iPhone'da müzik dosyası Dosyalar'dan seçilir; Apple Music şarkıları korumalıdır. */}
      <p className="mt-2 px-1 text-[11px] leading-snug text-white/45">
        iPhone'da şarkıyı Dosyalar (Files) uygulamasında bulup oradan seç. Apple Music'te indirilen korumalı şarkılar yüklenemez.
      </p>

      {/* Seçici iPhone'da en güvenilir şekilde etiketle açılır: input görünmez ama sayfada durur.
          multiple ile tek seferde birden fazla şarkı seçilebilir. */}
      <input
        id="room-music-file"
        multiple
        disabled={uploading}
        type="file"
        accept="audio/*,.mp3,.m4a,.aac,.m4b,.wav,.ogg,.oga,.opus,.flac,.mp4,.webm"
        className="absolute h-px w-px overflow-hidden opacity-0"
        onChange={pick}
      />
    </VoiceSheet>
  );
}