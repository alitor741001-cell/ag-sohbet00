import { base44 } from '@/api/base44Client';
import { createStreamOutput, ensureMicTrack, unlockVoicePlayback } from '@/lib/callAudio';
import { vipLevelOf } from '@/lib/userLevels';

// Eşlerin birbirini bulması için genel STUN; simetrik NAT arkasında kalan
// mobil ağlar için yedek TURN. Ses trafiği sunucuya yüklenmez, yalnızca geçiş.
const ICE_SERVERS = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  { urls: ['turn:openrelay.metered.ca:80'], username: 'openrelayproject', credential: 'openrelayproject' },
];

const MIC_TIMEOUT_MS = 15000;
const HEARTBEAT_MS = 8000;

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

// Konuşma yetkisi: yönetici/mod veya aktif abonelik (VIP) — dinlemek herkese açık.
const canSpeakFor = (user) => ['admin', 'moderator'].includes(user?.role) || vipLevelOf(user) > 0;

/**
 * Sesli oda bağlantısı — tarayıcılar arası doğrudan WebRTC (mesh).
 * Sinyal Base44 actor'ından geçer, ses doğrudan eşler arasında akar.
 */
export class P2PVoiceRoom {
  constructor({ roomId, userId, name, user, onChange }) {
    this.roomId = roomId;
    this.userId = userId || '';
    this.name = name || 'Kullanıcı';
    this.onChange = onChange || (() => {});
    this.canPublish = canSpeakFor(user);
    this.peerId = '';
    this.socket = null;
    this.unsubscribe = null;
    this.peers = new Map(); // peerId -> { id, pc, sender, output, pending, remoteReady }
    this.remotePeers = [];
    this.micStream = null;
    this.micOn = false;
    this.outputsEnabled = true;
    this.deafened = false;
    this.connectionState = 'disconnected';
    this.audioBlocked = false;
    this.lastMicrophoneError = null;
    this.heartbeat = null;
  }

  emit() {
    try { this.onChange(); } catch {}
  }

  // Sekme yenilendiğinde aynı bağlantı kimliği kullanılır: koltuğu kaybetmez.
  stableConnId() {
    const key = `voice_conn_${this.roomId}`;
    try {
      let id = sessionStorage.getItem(key);
      if (!id) { id = crypto.randomUUID(); sessionStorage.setItem(key, id); }
      return id;
    } catch (error) {
      return crypto.randomUUID();
    }
  }

  async connect() {
    if (this.socket) return;
    this.connectionState = 'connecting';
    this.emit();
    const socket = base44.actors.VoiceMesh(this.roomId).connect({ id: this.stableConnId() });
    this.socket = socket;
    this.unsubscribe = socket.subscribe((msg) => this.onMessage(msg));
    socket.send({ type: 'hello', name: this.name });
    this.connectionState = 'connected';
    // Durum taze kalsın: sessiz kalan oda uykuya dalsa da presence yenilenir.
    this.heartbeat = window.setInterval(() => {
      this.socket?.send({ type: 'mic', on: this.isMicOn() });
    }, HEARTBEAT_MS);
    this.emit();
  }

  onMessage(raw) {
    let msg = raw;
    if (typeof msg === 'string') {
      try { msg = JSON.parse(msg); } catch (error) { return; }
    }
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'you') {
      this.peerId = String(msg.peerId || '');
      this.reconcile();
      return;
    }
    if (msg.type === 'peers') {
      this.remotePeers = (msg.peers || []).filter((peer) => peer && peer.peerId && peer.peerId !== this.peerId);
      this.reconcile();
      return;
    }
    if (msg.type === 'signal') {
      void this.onSignal(String(msg.from || ''), msg.data);
      return;
    }
    if (msg.type === 'gone') {
      this.dropPeer(String(msg.peerId || ''));
    }
  }

  reconcile() {
    if (!this.peerId) return;
    const present = new Set(this.remotePeers.map((peer) => peer.peerId));
    [...this.peers.keys()].forEach((id) => { if (!present.has(id)) this.dropPeer(id); });
    this.remotePeers.forEach((peer) => {
      if (this.peers.has(peer.peerId)) return;
      this.ensurePeer(peer.peerId);
      // Aynı anda iki teklif gitmesin: yalnızca küçük peerId teklif eder.
      if (this.peerId < peer.peerId) void this.callPeer(peer.peerId);
    });
    this.emit();
  }

  ensurePeer(peerId) {
    const existing = this.peers.get(peerId);
    if (existing) return existing;
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    const peer = { id: peerId, pc, sender: null, output: null, pending: [], remoteReady: false };
    this.peers.set(peerId, peer);

    // Ses hattı baştan açık: mikrofon sonradan açıldığında yeniden anlaşma gerekmez.
    try {
      const transceiver = pc.addTransceiver('audio', { direction: 'sendrecv' });
      peer.sender = transceiver.sender;
      const live = this.micOn ? this.micStream?.getAudioTracks?.()[0] : null;
      if (live) peer.sender.replaceTrack(live).catch(() => {});
    } catch (error) {
      console.warn('[P2P] ses hattı kurulamadı', error);
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignal(peerId, { kind: 'ice', candidate: event.candidate.toJSON() });
      }
    };
    pc.ontrack = (event) => {
      const stream = (event.streams && event.streams[0]) || new MediaStream([event.track]);
      this.attachRemote(peer, stream);
    };
    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        try { pc.restartIce?.(); } catch (error) {}
      }
      this.emit();
    };
    return peer;
  }

  attachRemote(peer, stream) {
    if (peer.output) {
      try { peer.output.remove(); } catch (error) {}
    }
    const output = createStreamOutput(stream, this.roomId, { startMuted: this.deafened || !this.outputsEnabled });
    peer.output = output;
    output.play()
      .then(() => { this.audioBlocked = false; this.emit(); })
      .catch(() => { this.audioBlocked = true; this.emit(); });
    this.emit();
  }

  sendSignal(peerId, data) {
    this.socket?.send({ type: 'signal', to: peerId, data });
  }

  async callPeer(peerId) {
    const peer = this.peers.get(peerId);
    if (!peer || peer.pc.signalingState !== 'stable') return;
    try {
      const offer = await peer.pc.createOffer();
      await peer.pc.setLocalDescription(offer);
      this.sendSignal(peerId, { kind: 'offer', sdp: peer.pc.localDescription });
    } catch (error) {
      console.warn('[P2P] teklif oluşturulamadı', error);
    }
  }

  async onSignal(from, data) {
    if (!from || !data || typeof data !== 'object') return;
    if (data.kind === 'ice') {
      const peer = this.peers.get(from);
      if (!peer) return;
      if (!peer.remoteReady) { peer.pending.push(data.candidate); return; }
      peer.pc.addIceCandidate(data.candidate).catch(() => {});
      return;
    }
    if (data.kind === 'offer') {
      const peer = this.ensurePeer(from);
      try {
        await peer.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        peer.remoteReady = true;
        peer.pending.splice(0).forEach((candidate) => peer.pc.addIceCandidate(candidate).catch(() => {}));
        const answer = await peer.pc.createAnswer();
        await peer.pc.setLocalDescription(answer);
        this.sendSignal(from, { kind: 'answer', sdp: peer.pc.localDescription });
      } catch (error) {
        console.warn('[P2P] teklif işlenemedi', error);
      }
      return;
    }
    if (data.kind === 'answer') {
      const peer = this.peers.get(from);
      if (!peer) return;
      try {
        await peer.pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
        peer.remoteReady = true;
        peer.pending.splice(0).forEach((candidate) => peer.pc.addIceCandidate(candidate).catch(() => {}));
      } catch (error) {
        console.warn('[P2P] yanıt işlenemedi', error);
      }
    }
  }

  isConnected() {
    return this.connectionState === 'connected' && !!this.socket;
  }

  canPublishNow() {
    return this.canPublish;
  }

  async setMicEnabled(on) {
    this.lastMicrophoneError = null;
    if (!on) { this.stopMic(); return false; }
    if (!this.canPublish) {
      const denied = new Error('subscription_required');
      denied.code = 'subscription_required';
      this.lastMicrophoneError = 'publish_denied';
      throw denied;
    }
    const stream = await withTimeout((async () => {
      const track = await ensureMicTrack();
      return new MediaStream([track]);
    })(), MIC_TIMEOUT_MS, 'mic_timeout');
    const track = stream.getAudioTracks()[0];
    if (!track || track.readyState !== 'live') {
      this.lastMicrophoneError = 'publish_unverified';
      throw new Error('Mikrofon yayını doğrulanamadı.');
    }
    track.enabled = true;
    this.micStream = stream;
    this.peers.forEach((peer) => { peer.sender?.replaceTrack(track).catch(() => {}); });
    this.micOn = true;
    this.socket?.send({ type: 'mic', on: true });
    this.emit();
    return true;
  }

  stopMic() {
    this.micOn = false;
    this.peers.forEach((peer) => { peer.sender?.replaceTrack(null).catch(() => {}); });
    this.socket?.send({ type: 'mic', on: false });
    this.emit();
  }

  isMicOn() {
    const track = this.micStream?.getAudioTracks?.()[0];
    return !!this.micOn && !!track && track.readyState === 'live';
  }

  setOutputsEnabled(on) {
    this.outputsEnabled = !!on;
    this.peers.forEach((peer) => { if (peer.output) peer.output.muted = this.deafened || !this.outputsEnabled; });
    if (this.outputsEnabled) void this.retryPlayback();
    this.emit();
  }

  setDeafened(on) {
    this.deafened = !!on;
    this.peers.forEach((peer) => { if (peer.output) peer.output.muted = this.deafened || !this.outputsEnabled; });
    if (!this.deafened) void this.retryPlayback();
    this.emit();
  }

  audioElements() {
    return [...this.peers.values()].map((peer) => peer.output).filter(Boolean);
  }

  async retryPlayback() {
    await Promise.all(this.audioElements().map((output) => Promise.resolve(output.play?.()).catch(() => {})));
    await unlockVoicePlayback().catch(() => {});
    this.emit();
  }

  dropPeer(peerId) {
    const peer = this.peers.get(peerId);
    if (!peer) return;
    this.peers.delete(peerId);
    try { peer.pc.close(); } catch (error) {}
    if (peer.output) { try { peer.output.remove(); } catch (error) {} }
    this.emit();
  }

  getSnapshot() {
    const micStates = {};
    const speakers = [];
    micStates[this.userId] = this.isMicOn();
    this.remotePeers.forEach((peer) => {
      const on = peer.mic === true;
      if (peer.userId) {
        micStates[peer.userId] = on;
        if (on) speakers.push(peer.userId);
      }
    });
    return {
      micStates,
      selfMicOn: this.isMicOn(),
      // Web Audio iOS'ta mikrofonu sessize düşürdüğü için ayrı ses analizi yapılmaz:
      // mikrofonu açık olan kişi konuşuyor sayılır.
      localSpeaking: this.isMicOn(),
      speakers,
      connectionState: this.connectionState,
      audioBlocked: this.audioBlocked,
      canPublish: this.canPublish,
      participantCount: this.remotePeers.length + 1,
      peerCount: this.remotePeers.length,
      remoteTracks: this.audioElements().length,
    };
  }

  close() {
    this.micOn = false;
    window.clearInterval(this.heartbeat);
    this.heartbeat = null;
    [...this.peers.keys()].forEach((peerId) => this.dropPeer(peerId));
    try { this.unsubscribe?.(); } catch (error) {}
    this.unsubscribe = null;
    const socket = this.socket;
    this.socket = null;
    this.connectionState = 'disconnected';
    this.peerId = '';
    this.remotePeers = [];
    this.micStream = null;
    try { socket?.close(); } catch (error) {}
    this.emit();
  }
}