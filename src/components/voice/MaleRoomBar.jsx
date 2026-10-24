import MaleRoomSprite from '@/components/voice/MaleRoomSprite';
export default function MaleRoomBar({ micActive, deafened, gamesEnabled, onToggleChat, onToggleMic, onToggleSpeaker, onOpenGifts, onOpenPrivateChat, onOpenGames, onOpenSettings }) {
  const actions = [onToggleChat, onToggleMic, onToggleSpeaker, onOpenGifts, onOpenPrivateChat, onOpenGames, onOpenSettings];
  const labels = ['Sohbet', micActive ? 'Mikrofonu kapat' : 'Mikrofonu aç', deafened ? 'Sesi aç' : 'Sesi kapat', 'Hediye gönder', 'Özel sohbet', 'Oyunlar', 'Ayarlar'];
  const edges = [3, 18, 29, 41, 58, 71, 83, 98];
  return (
    <MaleRoomSprite x={0} y={865} w={497} h={126} className="w-full">
      {actions.map((action, i) => <button key={i} type="button" aria-label={labels[i]} disabled={i === 5 && !gamesEnabled} onClick={action} className="male-room-bar-hit" style={{ left: `${edges[i]}%`, width: `${edges[i + 1] - edges[i]}%` }}>
        {i === 1 && <span className={`male-room-mic-state ${micActive ? 'is-on' : ''}`} />}
        {i === 2 && deafened && <span className="male-room-sound-off" />}
      </button>)}
    </MaleRoomSprite>
  );
}