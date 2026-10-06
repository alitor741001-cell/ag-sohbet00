import { Loader2, Upload } from 'lucide-react';
import VoiceSheet from '@/components/voice/VoiceSheet';
import RoomTrackList from '@/components/voice/RoomTrackList';
import { useToast } from '@/components/ui/use-toast';

/**
 * Oda müziği penceresi: herkes kendi şarkılarını telefondan yükler ve kendi
 * listesinden odaya açar; liste kişiye özeldir, ses seviyesi köşedeki denetleyiciden ayarlanır.
 */
export default function RoomMusicSheet({ open, onClose, music, tracks = [], currentUri, uploading, onUpload, onPlayTrack }) {
  const { toast } = useToast();

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
        <label
          htmlFor="room-music-file"
          className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#FFD700] text-sm font-bold text-black"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Telefondan yükle
        </label>
        <p className="mt-2 text-center text-[11px] leading-snug text-white/55">
          {music ? 'Odada müzik çalıyor.' : 'Listendeki bir şarkıya dokunduğunda odada çalar.'}
        </p>
      </div>

      {/* Kendi şarkıların: yüklediklerin yalnızca senin listende görünür. */}
      <RoomTrackList tracks={tracks} currentUri={currentUri} busy={uploading} onPlay={play} />

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