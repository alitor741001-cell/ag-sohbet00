import { base44 } from '@/api/base44Client';
import { ensureMicTrack, releaseMic, unlockVoicePlayback } from '@/lib/callAudio';
import { vipLevelOf } from '@/lib/userLevels';
import PeerAudioLink from '@/lib/voice/PeerAudioLink';
import voiceSessionId from '@/lib/voice/sessionId';
import waitForAudioTrack from '@/lib/voice/waitForAudioTrack';

// Existing relay configuration; production relay capacity is managed separately.
const ICE_SERVERS = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  { urls: ['turn:openrelay.metered.ca:80', 'turn:openrelay.metered.ca:443?transport=tcp', 'turns:openrelay.metered.ca:443?transport=tcp'], username: 'openrelayproject', credential: 'openrelayproject' },
];

/** Room session owns capture, signalling and one audio output per remote peer. */
export class P2PVoiceRoom {
  constructor({ roomId, userId, name, user, onChange }) {
    Object.assign(this, { roomId, userId, name, onChange });
    this.canPublish = ['admin', 'moderator'].includes(user?.role) || vipLevelOf(user) > 0;
    this.peers = new Map();
    this.remotePeers = [];
    this.pendingSignals = [];
    this.peerId = '';
    this.micTrack = null;
    this.micOn = false;
    this.micWanted = false;
    this.micVersion = 0;
    this.outputsEnabled = true;
    this.deafened = false;
    this.connectionState = 'disconnected';
    this.lastMicrophoneError = null;
    this.closed = false;
  }

  emit() { this.onChange?.(); }
  isConnected() { return this.connectionState === 'connected' && !!this.socket; }
  canPublishNow() { return this.canPublish; }
  isMicOn() { return this.micOn && this.micTrack?.readyState === 'live' && this.micTrack.enabled && !this.micTrack.muted; }

  connect() {
    if (this.connecting) return this.connecting;
    if (this.isConnected()) return Promise.resolve();
    this.closed = false;
    this.connectionState = 'connecting';
    this.emit();
    const key = `voice_conn_${this.roomId}`;
    let id = sessionStorage.getItem(key);
    if (!id) { id = voiceSessionId(); sessionStorage.setItem(key, id); }
    const socket = base44.actors.VoiceMesh(this.roomId).connect({ id });
    this.socket = socket;
    this.connecting = new Promise((resolve, reject) => {
      this.ready = resolve;
      this.rejectReady = reject;
      this.connectTimer = setTimeout(() => {
        if (this.socket !== socket) return;
        this.disconnectTransport();
        this.connectionState = 'disconnected';
        reject(new Error('Ses bağlantısı yanıt vermedi.'));
        this.emit();
      }, 15000);
    });
    this.unsubscribe = socket.subscribe((message) => {
      if (this.socket === socket && !this.closed) this.onMessage(message);
    });
    socket.send({ type: 'hello', name: this.name, reset: true });
    this.lastMessageAt = Date.now();
    clearInterval(this.heartbeat);
    this.heartbeat = setInterval(() => {
      if (this.closed || document.visibilityState === 'hidden') return;
      if (Date.now() - this.lastMessageAt > 25000) { void this.reconnect(); return; }
      this.socket?.send({ type: 'mic', on: this.isMicOn() });
      this.peers.forEach((peer) => peer.recover());
      if (this.micWanted && this.micOn && !this.isMicOn()) void this.refreshMic();
    }, 8000);
    if (!this.onResume) {
      this.onResume = () => {
        if (document.visibilityState === 'hidden' || this.closed) return;
        if (!this.isConnected() || Date.now() - this.lastMessageAt > 20000) void this.reconnect();
        else this.peers.forEach((peer) => peer.recover());
        void this.retryPlayback();
        if (this.micWanted && this.micOn && !this.isMicOn()) void this.refreshMic();
      };
      document.addEventListener('visibilitychange', this.onResume);
      window.addEventListener('pageshow', this.onResume);
      window.addEventListener('online', this.onResume);
    }
    return this.connecting.finally(() => { this.connecting = null; });
  }

  disconnectTransport() {
    clearTimeout(this.connectTimer);
    clearInterval(this.heartbeat);
    const subscription = this.unsubscribe;
    this.unsubscribe = null;
    if (typeof subscription === 'function') subscription();
    else subscription?.unsubscribe?.();
    const socket = this.socket;
    this.socket = null;
    socket?.close();
    [...this.peers.keys()].forEach((id) => this.dropPeer(id));
    this.peerId = '';
    this.remotePeers = [];
    this.pendingSignals = [];
  }

  async reconnect() {
    if (this.closed || this.reconnecting || this.connecting) return;
    if (Date.now() - (this.lastReconnectAt || 0) < 8000) return;
    this.lastReconnectAt = Date.now();
    this.reconnecting = true;
    this.disconnectTransport();
    try { await this.connect(); }
    catch { this.connectionState = 'disconnected'; this.emit(); }
    finally { this.reconnecting = false; }
  }

  onMessage(message) {
    const msg = typeof message === 'string' ? JSON.parse(message) : message;
    if (!msg || typeof msg !== 'object') return;
    this.lastMessageAt = Date.now();
    if (msg.type === 'you') {
      const first = !this.peerId;
      this.peerId = String(msg.peerId || '');
      if (!this.peerId) return;
      this.connectionState = 'connected';
      clearTimeout(this.connectTimer);
      this.ready?.(); this.ready = null; this.rejectReady = null;
      if (first) this.socket?.send({ type: 'mic', on: this.isMicOn() });
      this.reconcile();
    } else if (msg.type === 'peers') {
      this.remotePeers = (msg.peers || []).filter((peer) => peer.peerId && peer.peerId !== this.peerId && peer.userId !== this.userId);
      this.reconcile();
      const queued = this.pendingSignals;
      this.pendingSignals = [];
      queued.forEach((signal) => { if (this.remotePeers.some((peer) => peer.peerId === signal.from)) this.onMessage(signal); });
    } else if (msg.type === 'gone') {
      this.pendingSignals = this.pendingSignals.filter((signal) => signal.from !== msg.peerId);
      this.dropPeer(msg.peerId);
    } else if (msg.type === 'signal' && msg.from && msg.data) {
      if (msg.from === this.peerId) return;
      // A new peer's offer/ICE can arrive just before its presence broadcast.
      if (!this.peerId || !this.remotePeers.some((peer) => peer.peerId === msg.from)) {
        if (this.pendingSignals.length < 128) this.pendingSignals.push(msg);
        return;
      }
      if (msg.data.kind === 'restart') { this.dropPeer(msg.from); this.reconcile(); return; }
      if (!this.wantedPeerIds().includes(msg.from)) {
        // Capture announcements and SDP are asynchronous: retain the offer
        // until the microphone presence update makes this peer eligible.
        if (this.pendingSignals.length < 128) this.pendingSignals.push(msg);
        return;
      }
      void this.ensurePeer(msg.from).receive(msg.data);
    }
    this.emit();
  }

  wantedPeerIds() {
    return this.remotePeers.filter((peer) => peer.peerId !== this.peerId && (this.micOn || peer.mic)).map((peer) => peer.peerId);
  }

  ensurePeer(id) {
    if (this.peers.has(id)) return this.peers.get(id);
    const peer = new PeerAudioLink({
      id, localId: this.peerId, roomId: this.roomId, iceServers: ICE_SERVERS,
      track: this.micOn ? this.micTrack : null,
      muted: this.deafened || !this.outputsEnabled,
      send: (data) => this.socket?.send({ type: 'signal', to: id, data }),
      changed: () => this.emit(),
    });
    this.peers.set(id, peer);
    return peer;
  }

  reconcile() {
    if (!this.peerId || this.closed) return;
    const wanted = new Set(this.wantedPeerIds());
    [...this.peers.keys()].forEach((id) => { if (!wanted.has(id)) this.dropPeer(id); });
    wanted.forEach((id) => this.ensurePeer(id));
  }

  setMicEnabled(on) {
    if (!on) { this.stopMic(); return Promise.resolve(false); }
    if (this.isMicOn()) return Promise.resolve(true);
    if (this.micRequest) return this.micRequest;
    this.lastMicrophoneError = null;
    if (!this.canPublish) return Promise.reject(Object.assign(new Error('subscription_required'), { code: 'subscription_required' }));
    if (!window.RTCPeerConnection) return Promise.reject(Object.assign(new Error('webrtc_unsupported'), { code: 'webrtc_unsupported' }));
    this.micWanted = true;
    const version = ++this.micVersion;
    const request = this.startMic(version).catch((error) => {
      this.lastMicrophoneError = error.code || error.name;
      throw error;
    }).finally(() => { if (this.micRequest === request) this.micRequest = null; });
    this.micRequest = request;
    return request;
  }

  async startMic(version) {
    let track = await ensureMicTrack();
    if (this.closed || !this.micWanted || version !== this.micVersion) return false;
    track.enabled = true;
    try { await waitForAudioTrack(track); }
    catch (error) {
      if (error.code !== 'mic_muted' || this.closed || !this.micWanted || version !== this.micVersion) throw error;
      // Only replace capture after a real hardware stall, not a transient mute.
      track = await ensureMicTrack({ fresh: true });
      if (this.closed || !this.micWanted || version !== this.micVersion) return false;
      track.enabled = true;
      await waitForAudioTrack(track);
    }
    if (this.closed || !this.micWanted || version !== this.micVersion) return false;
    this.micTrack = track;
    this.micOn = true;
    await Promise.all([...this.peers.values()].map((peer) => peer.setTrack(track)));
    if (this.closed || !this.micWanted || version !== this.micVersion) return false;
    this.socket?.send({ type: 'mic', on: true });
    this.reconcile();
    void this.retryPlayback();
    this.emit();
    return true;
  }

  async refreshMic() {
    if (!this.micWanted || this.closed || this.isMicOn()) return;
    try { await this.setMicEnabled(true); }
    catch (error) { this.lastMicrophoneError = error.name; this.emit(); }
  }

  stopMic() {
    this.micWanted = false;
    this.micOn = false;
    this.micVersion += 1;
    // Keep the negotiated sender: muting sends silence, not a new iOS connection.
    if (this.micTrack) this.micTrack.enabled = false;
    this.socket?.send({ type: 'mic', on: false });
    this.reconcile();
    this.emit();
  }

  setOutputsEnabled(on) {
    this.outputsEnabled = !!on;
    this.peers.forEach((peer) => peer.setMuted(this.deafened || !this.outputsEnabled));
    if (on) void this.retryPlayback();
    this.emit();
  }
  setDeafened(on) {
    this.deafened = !!on;
    this.setOutputsEnabled(this.outputsEnabled);
  }
  audioElements() { return [...this.peers.values()].map((peer) => peer.output).filter(Boolean); }
  async retryPlayback() {
    // Invoke play before any await so Safari retains the user's gesture.
    const attempts = [...this.peers.values()].map((peer) => peer.play());
    void unlockVoicePlayback();
    const results = await Promise.all(attempts);
    this.emit();
    return results.every(Boolean);
  }
  dropPeer(id) { this.peers.get(id)?.close(); this.peers.delete(id); }
  getSnapshot() {
    const micStates = { [this.userId]: this.isMicOn() }, speakers = [];
    this.remotePeers.forEach((peer) => {
      micStates[peer.userId] = peer.mic === true;
      if (peer.mic) speakers.push(peer.userId);
    });
    return {
      micStates, selfMicOn: this.isMicOn(), localSpeaking: this.isMicOn(), speakers,
      connectionState: this.connectionState,
      audioBlocked: [...this.peers.values()].some((peer) => peer.blocked && !peer.muted),
      networkIssue: [...this.peers.values()].some((peer) => peer.restartCount >= 3 && peer.pc.connectionState !== 'connected'),
      canPublish: this.canPublish, participantCount: this.remotePeers.length + 1,
      peerCount: this.remotePeers.length, remoteTracks: this.audioElements().length,
    };
  }
  close() {
    if (this.closed) return;
    this.closed = true;
    this.stopMic();
    this.rejectReady?.(new Error('Ses oturumu kapatıldı.'));
    this.rejectReady = null; this.ready = null;
    this.disconnectTransport();
    document.removeEventListener('visibilitychange', this.onResume);
    window.removeEventListener('pageshow', this.onResume);
    window.removeEventListener('online', this.onResume);
    this.onResume = null;
    if (this.micTrack || this.micRequest) releaseMic();
    this.micTrack = null;
    this.connectionState = 'disconnected';
    this.onChange = null;
  }
}