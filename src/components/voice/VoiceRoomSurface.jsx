import RoomTopArt from '@/components/voice/RoomTopArt';
import VoiceStage from '@/components/voice/VoiceStage';
import VoiceChatDock from '@/components/voice/VoiceChatDock';
import VoiceControlBar from '@/components/voice/VoiceControlBar';
import RoomRocketFeature from '@/components/voice/roomRocket/RoomRocketFeature';
import MicPermissionGuide from '@/components/voice/MicPermissionGuide';

/** Responsive room surface; overlays stay outside this layout. */
export default function VoiceRoomSurface({ room, top, stage, chat, controls, audio, composerOpen, dockRef, dockHeight, guideDismissed, onDismissGuide }) {
  return (
    <div className="voice-room-layout">
      <RoomTopArt room={room} {...top} />
      <div className="voice-stage-region"><VoiceStage room={room} {...stage} /></div>
      <div ref={dockRef} className={`voice-chat-dock min-h-0 shrink-0 ${composerOpen ? 'is-composing' : ''}`} style={dockHeight ? { height: `${dockHeight}px` } : undefined}>
        <VoiceChatDock composerOpen={composerOpen} {...chat} />
        {audio.networkIssue && <button type="button" onClick={audio.retryConnection} className="mx-3 min-h-11 rounded-xl border border-primary bg-secondary px-4 text-sm text-secondary-foreground">Ses ağına bağlanılamadı. Yeniden bağlan</button>}
        {audio.audioBlocked && <button type="button" onClick={audio.retryAudio} className="mx-3 min-h-11 rounded-xl border border-primary bg-secondary px-4 text-sm text-secondary-foreground">Sesi başlatmak için dokun</button>}
        {(audio.remoteMuted || audio.error) && <p role="status" className="px-3 pb-1 text-center text-[11px] text-slot-gold">{audio.remoteMuted ? 'Yönetici mikrofonunu kapattı.' : audio.error}</p>}
        <MicPermissionGuide open={audio.micDenied && !guideDismissed} onClose={onDismissGuide} onRetry={audio.retryMic} />
      </div>
      <div className="voice-controls-anchor shrink-0" hidden={composerOpen}>
        <RoomRocketFeature room={room} hidden={composerOpen} />
        <VoiceControlBar requesting={audio.requesting} micActive={!audio.muted} deafened={audio.deafened} onToggleSpeaker={audio.toggleDeafen} {...controls} />
      </div>
    </div>
  );
}