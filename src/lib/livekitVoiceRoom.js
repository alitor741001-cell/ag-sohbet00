import { Room, RoomEvent, Track } from 'livekit-client';
import { base44 } from '@/api/base44Client';
import { createVoiceOutput, unlockVoicePlayback } from '@/lib/callAudio';
import { getMicNoiseSuppression } from '@/lib/micSource';

// Yankı engelleme hep açık; gürültü engelleme kullanıcı ayarından gelir.
const micCaptureOptions = () => ({
  echoCancellation: true,
  noiseSuppression: getMicNoiseSuppression(),
  autoGainControl: !getMicNoiseSuppression(),
});
const isPermissionError = (error) => error?.name === 'NotAllowedError' || error?.name === 'SecurityError';
// iOS Safari mikrofon izni istemi bazen hiç sonuçlanmaz: istek zaman aşımına düşer,
// böylece düğme "HAZIRLANIYOR" durumunda kilitli kalmaz.
const withTimeout = (promise, ms, code) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => {
    const error = new Error(code);
    error.code = code;
    reject(error);
  }, ms);
  promise.then(
    (value) => { clearTimeout(timer); resolve(value); },
    (error) => { clearTimeout(timer); reject(error); },
  );
});
// Ölü veya kapatılmış kanal "açık" sayılmaz.
const isLiveMicTrack = (publication) => {
  const media = publication?.track?.mediaStreamTrack;
  return !!media && media.readyState === 'live';
};

/**
 * Sesli oda bağlantısı — LiveKit üzerinden yürür.
 * Arayüz bu sınıftan yalnızca bağlantı, mikrofon ve oynatma durumunu ister.
 */
export class LiveKitVoiceRoom {
  constructor({ roomId, userId, name, onChange }) {
    this.roomId = roomId;
    this.userId = userId || '';
    this.name = name || 'Kullanıcı';
    this.onChange = onChange || (() => {});
    this.room = null;
    this.elements = new Set();
    this.micOn = false;
    this.outputsEnabled = true;
    this.deafened = false;
    this.connectionState = 'disconnected';
    this.audioBlocked = false;
    this.speakers = [];
    // Abonelik kontrolü jetondan gelir: false ise kullanıcı yalnızca dinleyicidir.
    this.canPublish = true;
    // Son mikrofon hatası ("NotAllowedError", "publish_denied", "mic_timeout"…).
    this.lastMicrophoneError = null;
  }

  emit() {
    try { this.onChange(); } catch {}
  }

  async connect() {
    if (this.room) return;
    const room = new Room({ adaptiveStream: false, dynacast: false });
    this.room = room;

    room.on(RoomEvent.TrackSubscribed, (track) => this.attachAudio(track));
    room.on(RoomEvent.TrackUnsubscribed, (track) => this.detachAudio(track));
    room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      this.speakers = speakers.map((speaker) => speaker.identity).filter((id) => id !== this.userId);
      this.emit();
    });
    room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
      this.audioBlocked = !room.canPlaybackAudio;
      this.emit();
    });
    room.on(RoomEvent.Reconnecting, () => { this.connectionState = 'reconnecting'; this.emit(); });
    room.on(RoomEvent.Reconnected, () => {
      this.connectionState = 'connected';
      this.attachAllAudio();
      void this.retryPlayback();
      this.emit();
    });
    room.on(RoomEvent.Disconnected, () => { this.connectionState = 'disconnected'; this.micOn = false; this.emit(); });
    room.on(RoomEvent.ParticipantConnected, () => this.emit());
    room.on(RoomEvent.ParticipantDisconnected, () => this.emit());
    room.on(RoomEvent.TrackMuted, () => this.emit());
    room.on(RoomEvent.TrackUnmuted, () => this.emit());
    room.on(RoomEvent.LocalTrackPublished, () => { this.micOn = true; this.emit(); });
    room.on(RoomEvent.LocalTrackUnpublished, () => { this.micOn = false; this.emit(); });

    this.connectionState = 'connecting';
    this.emit();
    const response = await base44.functions.invoke('livekitToken', {
      roomName: this.roomId,
      participantName: this.name,
    });
    const data = response?.data || {};
    if (!data.url || !data.token) throw new Error(data.error || 'Ses jetonu alınamadı.');
    this.canPublish = data.canPublish !== false;
    await room.connect(data.url, data.token, { autoSubscribe: true });
    this.connectionState = 'connected';
    this.attachAllAudio();
    void this.retryPlayback();
    this.emit();
  }

  attachAudio(track) {
    if (track.kind !== Track.Kind.Audio) return;
    const mediaTrackId = track.mediaStreamTrack?.id || '';
    const existing = [...this.elements].find((element) => element.dataset.livekitTrack === track.sid);
    if (existing?.dataset.livekitMediaTrack === mediaTrackId) return;
    if (existing) { this.elements.delete(existing); try { existing.remove(); } catch {} }
    const output = createVoiceOutput(track, this.roomId);
    output.muted = this.deafened || !this.outputsEnabled;
    this.elements.add(output);
    this.playElement(output);
    this.emit();
  }

  detachAudio(track) {
    const existing = [...this.elements].find((element) => element.dataset.livekitTrack === track.sid);
    if (!existing) return;
    this.elements.delete(existing);
    try { existing.remove(); } catch {}
    this.emit();
  }

  attachAllAudio() {
    this.room?.remoteParticipants.forEach((participant) => {
      participant.trackPublications.forEach((publication) => {
        if (publication.track) this.attachAudio(publication.track);
      });
    });
  }

  playElement(output) {
    Promise.all([this.room?.startAudio?.(), output.play()])
      .then(() => { this.audioBlocked = false; })
      .catch(() => { this.audioBlocked = true; this.emit(); });
  }

  async retryPlayback() {
    this.attachAllAudio();
    await Promise.all([...this.elements].map((output) => Promise.resolve(output.play?.()).catch(() => {})));
    if (this.room?.startAudio) await this.room.startAudio().catch(() => {});
    await unlockVoicePlayback().catch(() => {});
    this.audioBlocked = this.room ? !this.room.canPlaybackAudio : false;
    this.emit();
  }

  // Oda gerçekten bağlı mı: React durumu bayat olabileceği için canlı bağlantı sorulur.
  isConnected() {
    return !!this.room && this.room.state === 'connected';
  }

  // Yayın yetkisi: jetonla gelen abonelik bayrağı + LiveKit'in verdiği izin.
  canPublishNow() {
    const permissions = this.room?.localParticipant?.permissions;
    return this.canPublish && permissions?.canPublish !== false;
  }

  async setMicEnabled(on) {
    const room = this.room;
    this.lastMicrophoneError = null;
    if (!room || room.state !== 'connected') {
      this.lastMicrophoneError = 'room_not_connected';
      throw new Error('Ses bağlantısı kurulmadı.');
    }
    if (!on) { this.stopMic(); return false; }
    if (!this.canPublishNow()) {
      const denied = new Error('subscription_required');
      denied.code = 'subscription_required';
      this.lastMicrophoneError = 'publish_denied';
      throw denied;
    }
    const open = () => withTimeout(
      room.localParticipant.setMicrophoneEnabled(true, micCaptureOptions()),
      15000,
      'mic_timeout',
    );
    try {
      await open();
    } catch (firstError) {
      if (firstError?.code === 'mic_timeout') {
        this.lastMicrophoneError = 'mic_timeout';
        throw firstError;
      }
      // Ölü bir yayın kaydı kalmışsa temizlenir ve bir kez daha denenir.
      const stale = room.localParticipant.getTrackPublication(Track.Source.Microphone);
      if (isPermissionError(firstError) || !stale?.track) {
        this.lastMicrophoneError = firstError?.name || 'mic_failed';
        throw firstError;
      }
      await room.localParticipant.unpublishTrack(stale.track, true).catch(() => {});
      try {
        await open();
      } catch (retryError) {
        this.lastMicrophoneError = retryError?.code || retryError?.name || 'mic_failed';
        throw retryError;
      }
    }
    let publication = room.localParticipant.getTrackPublication(Track.Source.Microphone);
    // iOS Safari: yayın açılmış ama sessize alınmış gelebilir; gerçek duruma çekilir.
    if (publication?.track && publication.isMuted) {
      await publication.unmute().catch(() => {});
      publication = room.localParticipant.getTrackPublication(Track.Source.Microphone);
    }
    const media = publication?.track?.mediaStreamTrack;
    if (!publication || !media || media.readyState !== 'live' || publication.isMuted) {
      this.lastMicrophoneError = 'publish_unverified';
      throw new Error('Mikrofon yayını doğrulanamadı.');
    }
    media.enabled = true;
    this.micOn = true;
    console.info('[LiveKit] Mikrofon yayınlandı', {
      sid: publication.trackSid,
      muted: publication.isMuted,
      track: media.readyState,
    });
    this.emit();
    return true;
  }

  stopMic() {
    this.micOn = false;
    this.room?.localParticipant?.setMicrophoneEnabled(false).catch(() => {});
    this.emit();
  }

  isMicOn() {
    if (!this.room || this.room.state !== 'connected' || !this.micOn) return false;
    return isLiveMicTrack(this.room.localParticipant.getTrackPublication(Track.Source.Microphone));
  }

  setOutputsEnabled(on) {
    this.outputsEnabled = !!on;
    this.elements.forEach((output) => { output.muted = this.deafened || !this.outputsEnabled; });
    if (this.outputsEnabled) void this.retryPlayback();
    this.emit();
  }

  setDeafened(on) {
    this.deafened = !!on;
    this.elements.forEach((output) => { output.muted = this.deafened || !this.outputsEnabled; });
    if (!this.deafened) { this.attachAllAudio(); void this.retryPlayback(); }
    this.emit();
  }

  audioElements() {
    return [...this.elements];
  }

  getSnapshot() {
    const room = this.room;
    const micStates = {};
    let participantCount = 0;
    if (room) {
      const people = [room.localParticipant, ...room.remoteParticipants.values()];
      participantCount = people.length;
      people.forEach((participant) => {
        const publication = participant.getTrackPublication?.(Track.Source.Microphone);
        micStates[participant.identity] = !!publication && !!publication.track && !publication.isMuted;
      });
    }
    return {
      micStates,
      selfMicOn: this.isMicOn(),
      localSpeaking: !!room?.localParticipant?.isSpeaking && this.isMicOn(),
      speakers: this.speakers,
      connectionState: room?.state === 'reconnecting' ? 'reconnecting' : this.connectionState,
      audioBlocked: this.audioBlocked,
      canPublish: this.canPublish,
      participantCount,
      peerCount: Math.max(0, participantCount - 1),
      remoteTracks: this.elements.size,
    };
  }

  close() {
    const room = this.room;
    this.room = null;
    this.micOn = false;
    this.connectionState = 'disconnected';
    this.speakers = [];
    this.elements.forEach((output) => { try { output.remove(); } catch {} });
    this.elements.clear();
    if (room) {
      try { room.localParticipant?.setMicrophoneEnabled?.(false)?.catch?.(() => {}); } catch {}
      try { room.removeAllListeners(); } catch {}
      try { room.disconnect(true); } catch {}
    }
    this.emit();
  }
}