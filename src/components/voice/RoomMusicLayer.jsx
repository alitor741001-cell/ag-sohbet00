import MusicController from '@/components/voice/MusicController';
import RoomMusicSheet from '@/components/voice/RoomMusicSheet';

/**
 * Oda müziği katmanı: şarkı bu cihazda çalar, liste penceresi ve köşedeki çember/panel
 * denetleyicisi burada durur. Şarkı seçimi kişiye özel listeden yapılır.
 */
export default function RoomMusicLayer({ music, sheetOpen, onCloseSheet, controllerVisible, onOpenList, isMod, onControl, onPlayNext }) {
  return (
    <>
      <audio ref={music.audioRef} crossOrigin="anonymous" className="hidden" playsInline preload="auto" />

      <RoomMusicSheet
        open={sheetOpen}
        onClose={onCloseSheet}
        music={music.music}
        tracks={music.library}
        currentUri={music.music?.file_uri}
        uploading={music.uploading}
        onUpload={music.uploadTracks}
        onPlayTrack={music.playTrack}
        onDeleteTrack={music.removeTrack}
      />

      {/* Denetleyici: pencere kapanınca köşedeki çember olarak kalır, dokununca panel açılır. */}
      {controllerVisible && (
        <MusicController
          title={music.music.title}
          playing={!!music.music.is_playing}
          volume={music.volume}
          onVolume={music.setVolume}
          isMod={isMod}
          onToggle={() => onControl(music.music?.is_playing ? 'pause' : 'play')}
          onNext={onPlayNext}
          onOpenList={onOpenList}
          onStop={() => onControl('stop')}
        />
      )}
    </>
  );
}