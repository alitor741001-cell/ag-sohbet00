import { Room, RoomEvent, Track } from 'livekit-client';
import { base44 } from '@/api/base44Client';
import { createVoiceOutput } from '@/lib/callAudio';

// Bağlantı ve mikrofon cevapsız kalırsa düğme kilitlenmez: süre sonunda bırakılır.
const CONNECT_TIMEOUT_MS = 20000;
const MIC_TIMEOUT_MS = 25000;

const withTimeout = (promise, ms, code) => new Promise((resolve, reject) => {
  const timer = setTimeout(() => {
    const error = new Error(code);
    error.code = code;
    reject(error);
  }, ms);
  Promise.resolve(promise).then(
    (value) => { clearTimeout(timer); resolve(value); },
    (error) => { clearTimeout(timer); reject(error); },
  );
});

const audioPublication = (participant) => {
  if (!participant?.getTrackPublication) return null;
  return participant.getTrackPublication(Track.Source.Microphone) || null;
};

/**
 * LiveKit Cloud üzerinden sesli oda bağlantısı.
 * Katılım jetonu her zaman sunucudan (livekit-token) alınır; API parolası istemciye gelmez.
 * Yalnızca gerçek bağlantı kurulur — bağlantı kurulamazsa hata yükseltilir.
 */
export class LiveKitVoiceRoom {
  constructor({ roomId, userId, name, user, onChange }) {
    this.roomId = roomId;
    this.userId = userId || '';
    this.name = name || 'Kullanıcı';
    this.onChange = onChange || (() => {});
    this.room = null;
    this.outputs = new Map();
    this.connectionState = 'disconnected';
    this.audioBlocked = false;
    this.outputsEnabled = true;
    this.deafened = false;
    this.canPublish = true;
    this.canPublishFlag = true;
    this.speakers = [];
    this.localSpeaking = false;
    this.lastMicrophoneError = null;
    this.micRequest = null;
    this.micDesired = false;
    this.listeners = [];
  }

  emit() {
    try { this.onChange(); } catch {}
  }

  bind(room) {
    const on = (event, handler) => {
      room.on(event, handler);
      this.listeners.push([event, handler]);
    };
    on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (track?.kind === 'audio') this.attachAudio(publication, participant, track);
    });
    on(RoomEvent.TrackUnsubscribed, (track, publication) => {
      if (track?.kind === 'audio') this.detachAudio(track.sid);
    });
    on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      const live = Array.isArray(speakers) ? speakers : [];
      this.localSpeaking = live.some((participant) => participant.identity === this.userId);
      this.speakers = live
        .filter((participant) => participant.identity !== this.userId)
        .map((participant) => participant.identity);
      this.emit();
    });
    on(RoomEvent.ParticipantConnected, () => this.emit());
    on(RoomEvent.ParticipantDisconnected, () => this.emit());
    on(RoomEvent.TrackMuted, () => this.emit());
    on(RoomEvent.TrackUnmuted, () => this.emit());
    on(RoomEvent.AudioPlaybackStatusChanged, () => {
      this.audioBlocked = !room.canPlaybackAudio;
      this.emit();
    });
    on(RoomEvent.ConnectionStateChanged, (state) => {
      // Kısa süreli yeniden bağlanmalar 'connected' sayılır: arayüz ve mikrofon
      // kurtarma akışı bağlantı kopmuş gibi davranmaz, LiveKit kendisi toparlar.
      this.connectionState = state === 'disconnected'
        ? 'disconnected'
        : state === 'connecting'
          ? 'connecting'
          : 'connected';
      this.emit();
    });
    on(RoomEvent.Disconnected, () => {
      this.connectionState = 'disconnected';
      this.clearOutputs();
      this.emit();
    });
  }

  /** Uzak sesi cihazın kendi çıkışına bağlar (iOS ahize/hoparlör yönlendirmesi korunur). */
  attachAudio(publication, participant, track) {
    const source = track || publication?.track;
    if (!source) return;
    const key = String(source.sid || publication?.trackSid || '');
    if (!key || this.outputs.has(key)) return;
    const output = createVoiceOutput(source, this.roomId, {
      startMuted: this.deafened || !this.outputsEnabled,
    });
    this.outputs.set(key, output);
    output.play()
      .then(() => { this.audioBlocked = false; this.emit(); })
      .catch(() => { this.audioBlocked = true; this.emit(); });
    this.emit();
  }

  detachAudio(sid) {
    const key = String(sid || '');
    const output = this.outputs.get(key);
    if (!output) return;
    this.outputs.delete(key);
    try { output.remove(); } catch (error) {}
    this.emit();
  }

  clearOutputs() {
    this.outputs.forEach((output) => { try { output.remove(); } catch (error) {} });
    this.outputs.clear();
  }

  /** Sunucudan imzalı katılım jetonunu alır; bağlantı gerçekten kurulmadan 'connected' denmez. */
  async connect() {
    if (this.room && this.connectionState === 'connected') return;
    this.connectionState = 'connecting';
    this.emit();

    const response = await base44.functions.invoke('livekit-token', { room_id: this.roomId });
    const token = response?.data?.token;
    const url = response?.data?.url;
    if (!token || !url) {
      const error = new Error('token_failed');
      error.code = 'token_failed';
      this.connectionState = 'disconnected';
      this.emit();
      throw error;
    }

    const room = new Room({ adaptiveStream: false, dynacast: false });
    this.room = room;
    this.bind(room);

    try {
      await withTimeout(room.connect(url, token), CONNECT_TIMEOUT_MS, 'connect_timeout');
    } catch (error) {
      this.connectionState = 'disconnected';
      try { room.disconnect(); } catch (disconnectError) {}
      this.room = null;
      this.emit();
      throw error;
    }

    // Bağlanmadan önce yayında olan sesler de çıkışa bağlanır.
    room.remoteParticipants.forEach((participant) => {
      participant.trackPublications.forEach((publication) => {
        if (publication.isSubscribed && publication.track?.kind === 'audio') {
          this.attachAudio(publication, participant, publication.track);
        }
      });
    });

    this.connectionState = 'connected';
    void this.retryPlayback();
    this.emit();
  }

  isConnected() {
    return this.connectionState === 'connected' && !!this.room;
  }

  canPublishNow() {
    return this.isConnected() && this.canPublish !== false;
  }

  isMicOn() {
    const local = this.room?.localParticipant;
    if (!local?.isMicrophoneEnabled) return false;
    const media = audioPublication(local)?.track?.mediaStreamTrack;
    return !!media && media.readyState === 'live' && !media.muted;
  }

  setMicEnabled(on) {
    if (!on) { this.stopMic(); return Promise.resolve(false); }
    this.micDesired = true;
    if (this.micRequest) return this.micRequest;
    const request = this.startMic().finally(() => {
      if (this.micRequest === request) this.micRequest = null;
    });
    this.micRequest = request;
    return request;
  }

  async startMic() {
    this.lastMicrophoneError = null;
    if (!this.isConnected()) {
      this.lastMicrophoneError = 'not_connected';
      const notConnected = new Error('not_connected');
      notConnected.code = 'not_connected';
      throw notConnected;
    }
    const local = this.room.localParticipant;
    try {
      await withTimeout(local.setMicrophoneEnabled(true), MIC_TIMEOUT_MS, 'mic_timeout');
    } catch (error) {
      this.lastMicrophoneError = error?.code || error?.name || 'mic_failed';
      throw error;
    }
    if (!this.micDesired) {
      await local.setMicrophoneEnabled(false).catch(() => {});
      return false;
    }
    const media = audioPublication(local)?.track?.mediaStreamTrack;
    if (!media || media.readyState !== 'live' || media.muted) {
      this.lastMicrophoneError = 'publish_unverified';
      const unverified = new Error('Mikrofon yayını doğrulanamadı.');
      unverified.code = 'publish_unverified';
      throw unverified;
    }
    this.emit();
    return true;
  }

  stopMic() {
    this.micDesired = false;
    this.micRequest = null;
    const local = this.room?.localParticipant;
    if (local) local.setMicrophoneEnabled(false).catch(() => {});
    this.emit();
  }

  // Yanıtsız kalan açma denemesi bırakılır: sonraki dokunuş yeni bir deneme başlatır.
  abandonMicRequest() {
    this.micRequest = null;
  }

  setOutputsEnabled(on) {
    this.outputsEnabled = !!on;
    this.outputs.forEach((output) => { output.muted = this.deafened || !this.outputsEnabled; });
    if (this.outputsEnabled) void this.retryPlayback();
    this.emit();
  }

  setDeafened(on) {
    this.deafened = !!on;
    this.outputs.forEach((output) => { output.muted = this.deafened || !this.outputsEnabled; });
    if (!this.deafened) void this.retryPlayback();
    this.emit();
  }

  audioElements() {
    return [...this.outputs.values()];
  }

  async retryPlayback() {
    try { await this.room?.startAudio?.(); } catch (error) {}
    const results = await Promise.all(this.audioElements().map((output) =>
      Promise.resolve(output.play?.()).then(() => true, () => false)));
    this.audioBlocked = results.some((played) => !played);
    this.emit();
    return !this.audioBlocked;
  }

  getSnapshot() {
    const micStates = {};
    const speakers = [];
    micStates[this.userId] = this.isMicOn();
    if (this.isMicOn() && this.localSpeaking) speakers.push(this.userId);
    let peers = 0;
    this.room?.remoteParticipants.forEach((participant) => {
      peers += 1;
      const on = !!participant.isMicrophoneEnabled;
      micStates[participant.identity] = on;
      if (on && this.speakers.includes(participant.identity)) speakers.push(participant.identity);
    });
    return {
      micStates,
      selfMicOn: this.isMicOn(),
      localSpeaking: this.localSpeaking && micStates[this.userId] === true,
      speakers,
      connectionState: this.connectionState,
      audioBlocked: this.audioBlocked,
      canPublish: this.canPublish !== false,
      participantCount: peers + 1,
      peerCount: peers,
      remoteTracks: this.outputs.size,
    };
  }

  close() {
    this.micDesired = false;
    this.micRequest = null;
    const room = this.room;
    if (room) {
      this.listeners.forEach(([event, handler]) => {
        try { room.off(event, handler); } catch (error) {}
      });
    }
    this.listeners = [];
    this.clearOutputs();
    if (room) { try { room.disconnect(); } catch (error) {} }
    this.room = null;
    this.connectionState = 'disconnected';
    this.speakers = [];
    this.localSpeaking = false;
    this.emit();
  }
}

export default LiveKitVoiceRoom;