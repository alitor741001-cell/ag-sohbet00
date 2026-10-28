import { base44 } from '@/api/base44Client';
import { createStreamOutput, ensureMicTrack, unlockVoicePlayback } from '@/lib/callAudio';
import { vipLevelOf } from '@/lib/userLevels';

// Eşlerin birbirini bulması için genel STUN; simetrik NAT / mobil ağlar için
// yedek TURN (80, 443 ve 443/TCP — kısıtlı ağlarda TCP yolu açık kalır).
// Ses trafiği sunucudan geçmez, yalnızca eşleşme için kullanılır.
const ICE_SERVERS = [
  { urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] },
  { urls: ['turn:openrelay.metered.ca:80'], username: 'openrelayproject', credential: 'openrelayproject' },
  { urls: ['turn:openrelay.metered.ca:443', 'turns:openrelay.metered.ca:443?transport=tcp'], username: 'openrelayproject', credential: 'openrelayproject' },
];

// --- Eski cihaz uyumluluğu (iOS 12 öncesi Safari, eski Android WebView) ---
const RTCPeerConnectionCtor = typeof window !== 'undefined'
  ? (window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection)
  : null;
const MediaStreamCtor = typeof window !== 'undefined'
  ? (window.MediaStream || window.webkitMediaStream)
  : null;

// Eski tarayıcılarda MediaStream kurucusu yoktur: akış gerektiren yerlerde null geçilir.
const makeStream = (track) => (track && MediaStreamCtor ? new MediaStreamCtor([track]) : null);

const sessionDescription = (sdp) => {
  if (!sdp) return sdp;
  const init = { type: sdp.type, sdp: sdp.sdp };
  return typeof window !== 'undefined' && window.RTCSessionDescription
    ? new window.RTCSessionDescription(init)
    : init;
};

const candidateInit = (candidate) => {
  if (!candidate) return null;
  if (typeof candidate.toJSON === 'function') {
    try { return candidate.toJSON(); } catch (error) {}
  }
  return { candidate: candidate.candidate, sdpMid: candidate.sdpMid, sdpMLineIndex: candidate.sdpMLineIndex };
};

// Eski sürümlerde connectionState yoktur: ICE durumu ile eşdeğer karar verilir.
const pcConnected = (pc) => ['connected', 'completed'].includes(pc.connectionState || pc.iceConnectionState);
const pcFailed = (pc) => ['failed', 'closed'].includes(pc.connectionState || pc.iceConnectionState);

const MIC_TIMEOUT_MS = 15000;
const HEARTBEAT_MS = 6000;
// Teklif yanıtsız kalırsa bu süre sonunda yeniden denenir (kaçan sinyal kurtarılır).
const OFFER_RETRY_MS = 5000;

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

const randomId = () => {
  try {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  } catch (error) {}
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
};

// Konuşma yetkisi: yönetici/mod veya aktif abonelik (VIP) — dinlemek herkese açık.
const canSpeakFor = (user) => ['admin', 'moderator'].includes(user?.role) || vipLevelOf(user) > 0;

/**
 * Sesli oda bağlantısı — tarayıcılar arası doğrudan WebRTC (mesh).
 * Sinyal Base44 actor'ından geçer, ses doğrudan eşler arasında akar.
 * Yalnızca konuşanlarla hat kurulur: 40 kişilik odada dinleyiciler yük bindirmez.
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
    this.peers = new Map(); // peerId -> { id, pc, sender, output, pending, remoteReady, attemptAt }
    this.remotePeers = [];
    this.micTrack = null;
    this.micOn = false;
    this.outputsEnabled = true;
    this.deafened = false;
    this.connectionState = 'disconnected';
    this.audioBlocked = false;
    this.lastMicrophoneError = null;
    this.heartbeat = null;
    this.lastMessageAt = 0;
    this.lastReconnectAt = 0;
  }

  emit() {
    try { this.onChange(); } catch {}
  }

  // Sekme yenilendiğinde aynı bağlantı kimliği kullanılır: yeri kaybetmez.
  stableConnId() {
    const key = `voice_conn_${this.roomId}`;
    try {
      let id = sessionStorage.getItem(key);
      if (!id) { id = randomId(); sessionStorage.setItem(key, id); }
      return id;
    } catch (error) {
      return randomId();
    }
  }

  async connect() {
    if (this.socket) return;
    if (!base44.actors?.VoiceMesh) throw new Error('Ses sinyal servisi hazır değil.');
    this.connectionState = 'connecting';
    this.emit();
    const socket = base44.actors.VoiceMesh(this.roomId).connect({ id: this.stableConnId() });
    this.socket = socket;
    this.unsubscribe = socket.subscribe((msg) => this.onMessage(msg));
    socket.send({ type: 'hello', name: this.name });
    this.connectionState = 'connected';
    this.lastMessageAt = Date.now();
    window.clearInterval(this.heartbeat);
    // Kalp atışı: kimlik ve oda listesi tazelenir, yarım kalan teklifler yeniden denenir.
    this.heartbeat = window.setInterval(() => {
      // Sinyal sessizce öldüyse (ağ değişimi, uygulama arka planda kalması) yeniden bağlanılır.
      if (Date.now() - this.lastMessageAt > 20000) {
        this.reconnect();
        return;
      }
      this.socket?.send({ type: 'mic', on: this.isMicOn() });
      this.retryPendingOffers();
    }, HEARTBEAT_MS);
    this.emit();
  }

  reconnect() {
    if (Date.now() - this.lastReconnectAt < 10000) return;
    this.lastReconnectAt = Date.now();
    const socket = this.socket;
    try { this.unsubscribe?.(); } catch (error) {}
    this.unsubscribe = null;
    this.socket = null;
    try { socket?.close(); } catch (error) {}
    // Eş hatları korunur: yeni presence listesiyle yalnızca eksikler kurulur.
    this.connect().catch(() => { this.connectionState = 'disconnected'; this.emit(); });
  }

  onMessage(raw) {
    this.lastMessageAt = Date.now();
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

  // Hangi eşlerle hat kurulacak: konuşan herkesle, mikrofonum açıksa odadaki herkesle.
  wantedPeerIds() {
    if (this.micOn) return this.remotePeers.map((peer) => peer.peerId);
    return this.remotePeers.filter((peer) => peer.mic === true).map((peer) => peer.peerId);
  }

  reconcile() {
    if (!this.peerId) return;
    const wanted = new Set(this.wantedPeerIds());
    [...this.peers.keys()].forEach((id) => { if (!wanted.has(id)) this.dropPeer(id); });
    wanted.forEach((id) => {
      try {
        const peer = this.ensurePeer(id);
        if (pcFailed(peer.pc)) {
          this.dropPeer(id);
          this.ensurePeer(id);
        }
        // Aynı anda iki teklif gitmesin: yalnızca küçük peerId teklif eder.
        if (this.peerId < id) void this.callPeer(id);
      } catch (error) {
        console.warn('[P2P] eş kurulamadı', error);
      }
    });
    this.emit();
  }

  ensurePeer(peerId) {
    const existing = this.peers.get(peerId);
    if (existing) return existing;
    if (!RTCPeerConnectionCtor) throw new Error('webrtc_unsupported');
    const pc = new RTCPeerConnectionCtor({ iceServers: ICE_SERVERS });
    const peer = { id: peerId, pc, sender: null, output: null, pending: [], remoteReady: false, attemptAt: 0 };
    this.peers.set(peerId, peer);

    this.attachLocalAudio(peer);

    pc.onicecandidate = (event) => {
      const candidate = candidateInit(event.candidate);
      if (candidate) this.sendSignal(peerId, { kind: 'ice', candidate });
    };
    pc.ontrack = (event) => {
      const stream = (event.streams && event.streams[0]) || makeStream(event.track);
      if (stream) this.attachRemote(peer, stream);
    };
    // Eski Android/iOS sürümleri ses akışını ayrı olayla bildirir.
    pc.onaddstream = (event) => { if (event?.stream) this.attachRemote(peer, event.stream); };
    const onStateChange = () => {
      if (this.peers.get(peerId) === peer && pcFailed(pc)) {
        this.dropPeer(peerId);
        if (this.wantedPeerIds().includes(peerId)) {
          this.ensurePeer(peerId);
          if (this.peerId < peerId) void this.callPeer(peerId);
        }
      }
      this.emit();
    };
    pc.onconnectionstatechange = onStateChange;
    pc.oniceconnectionstatechange = onStateChange;
    return peer;
  }

  // Ses hattı baştan açık: mikrofon sonradan açıldığında yeniden anlaşma gerekmez.
  // Eski cihazlarda transceiver/replaceTrack yoktur: hat mikrofonla doğrudan eklenir.
  attachLocalAudio(peer) {
    const track = this.isMicOn() ? this.micTrack : null;
    try {
      if (typeof peer.pc.addTransceiver === 'function') {
        // Android'de teklif oluşturulmadan önce gerçek kayıt kanalı bağlanır.
        const stream = track ? makeStream(track) : null;
        const transceiver = peer.pc.addTransceiver(track || 'audio', {
          direction: 'sendrecv',
          ...(stream ? { streams: [stream] } : {}),
        });
        peer.sender = transceiver.sender || null;
        return;
      }
      if (track && typeof peer.pc.addTrack === 'function') {
        const stream = makeStream(track);
        peer.sender = (stream ? peer.pc.addTrack(track, stream) : peer.pc.addTrack(track)) || null;
      } else if (track && typeof peer.pc.addStream === 'function') {
        const stream = makeStream(track);
        if (stream) peer.pc.addStream(stream);
      }
    } catch (error) {
      console.warn('[P2P] ses hattı kurulamadı', error);
    }
  }

  // Eski cihazlarda track yerinde değiştirilemez: hat mikrofonla birlikte yeniden kurulur.
  async applyLocalTrack(peer, track) {
    if (peer.sender && typeof peer.sender.replaceTrack === 'function') {
      try { await peer.sender.replaceTrack(track); return; }
      catch (error) { console.warn('[P2P] mikrofon kanalı yeniden kuruluyor', error); }
    }
    // Bazı Android WebView sürümleri boş sender'a track geçişini reddeder.
    // Her iki uç da eski hattı bırakır; mikrofon baştan eklenerek anlaşılır.
    this.dropPeer(peer.id);
    this.sendSignal(peer.id, { kind: 'restart' });
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
    if (pcConnected(peer.pc)) return;
    peer.attemptAt = Date.now();
    try {
      // offerToReceiveAudio: eski cihazlarda alıcı hat yalnızca bu bayrakla açılır.
      const offer = await peer.pc.createOffer({ offerToReceiveAudio: true });
      await peer.pc.setLocalDescription(offer);
      this.sendSignal(peerId, { kind: 'offer', sdp: { type: peer.pc.localDescription.type, sdp: peer.pc.localDescription.sdp } });
    } catch (error) {
      console.warn('[P2P] teklif oluşturulamadı', error);
    }
  }

  // Cevapsız kalan teklifler sessizce ölü bırakılmaz: yeniden denenir.
  retryPendingOffers() {
    if (!this.peerId) return;
    const now = Date.now();
    this.peers.forEach((peer) => {
      if (pcConnected(peer.pc)) return;
      if (now - (peer.attemptAt || 0) < OFFER_RETRY_MS) return;
      if (this.peerId < peer.id) void this.callPeer(peer.id);
    });
  }

  async onSignal(from, data) {
    if (!from || !data || typeof data !== 'object') return;
    if (data.kind === 'restart') {
      this.dropPeer(from);
      this.reconcile();
      return;
    }
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
        if (peer.pc.signalingState !== 'stable') return;
        await peer.pc.setRemoteDescription(sessionDescription(data.sdp));
        peer.remoteReady = true;
        peer.pending.splice(0).forEach((candidate) => peer.pc.addIceCandidate(candidate).catch(() => {}));
        const answer = await peer.pc.createAnswer();
        await peer.pc.setLocalDescription(answer);
        this.sendSignal(from, { kind: 'answer', sdp: { type: peer.pc.localDescription.type, sdp: peer.pc.localDescription.sdp } });
      } catch (error) {
        console.warn('[P2P] teklif işlenemedi', error);
      }
      return;
    }
    if (data.kind === 'answer') {
      const peer = this.peers.get(from);
      if (!peer) return;
      try {
        if (peer.pc.signalingState !== 'have-local-offer') return;
        await peer.pc.setRemoteDescription(sessionDescription(data.sdp));
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
    if (!RTCPeerConnectionCtor) {
      const unsupported = new Error('webrtc_unsupported');
      unsupported.code = 'webrtc_unsupported';
      this.lastMicrophoneError = 'webrtc_unsupported';
      throw unsupported;
    }
    const track = await withTimeout(ensureMicTrack(), MIC_TIMEOUT_MS, 'mic_timeout');
    if (!track || track.readyState !== 'live') {
      this.lastMicrophoneError = 'publish_unverified';
      throw new Error('Mikrofon yayını doğrulanamadı.');
    }
    track.enabled = true;
    this.micTrack = track;
    this.micOn = true;
    await Promise.all([...this.peers.values()].map((peer) => this.applyLocalTrack(peer, track)));
    this.socket?.send({ type: 'mic', on: true });
    // Konuşmaya başlayınca odadaki herkesle hat kurulur.
    this.reconcile();
    // Eski iOS'ta kayıt oturumu açılınca uzak ses susabilir: çıkışlar dokunuş içinde yeniden başlatılır.
    void this.retryPlayback();
    this.emit();
    return true;
  }

  stopMic() {
    this.micOn = false;
    this.peers.forEach((peer) => { void this.applyLocalTrack(peer, null); });
    this.socket?.send({ type: 'mic', on: false });
    // Sustuysan yalnızca konuşanları dinlemeye devam et.
    this.reconcile();
    this.emit();
  }

  isMicOn() {
    const track = this.micTrack;
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
      // Web Audio iOS'ta mikrofonu sessize düşürdüğü için ses analizi yapılmaz:
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
    this.micTrack = null;
    try { socket?.close(); } catch (error) {}
    this.emit();
  }
}