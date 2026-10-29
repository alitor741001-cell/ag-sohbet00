import { base44 } from '@/api/base44Client';
import { createStreamOutput, ensureMicTrack } from '@/lib/callAudio';
import { membershipActive } from '@/lib/useCurrentUser';
import answerVoiceTrack from '@/lib/answerVoiceTrack';

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

// iOS Safari (iPad dahil): mikrofon sonradan eklenen ses hattında sessiz kalabiliyor.
const IS_IOS = typeof navigator !== 'undefined'
  && (/iPad|iPhone|iPod/.test(navigator.userAgent || '') || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));

// Sistem izin penceresindeki karar süresi de bu beklemeye dahildir.
const MIC_TIMEOUT_MS = 65000;
const HEARTBEAT_MS = 6000;
// Teklif yanıtsız kalırsa bu süre sonunda yeniden denenir (kaçan sinyal kurtarılır).
const OFFER_RETRY_MS = 5000;
// Hat "disconnected" görünüp kendine dönmezse bu süre sonunda tazelenir:
// ağ değişimi sonrası ses sessizce kaybolmasın (Android'de sık görülür).
const DISCONNECT_GRACE_MS = 4000;

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

// Koltuk servisiyle aynı üyelik kuralı: paket sistemi kaldırıldı, üyeler konuşabilir.
const canSpeakFor = (user) => membershipActive(user);

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
    this.pendingIce = new Map();
    this.signalQueues = new Map();
    this.micRevision = 0;
    this.micRequest = null;
    this.micDesired = false;
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
    this.bindLifecycle();
    this.heartbeat = window.setInterval(() => {
      // Sinyal sessizce öldüyse (ağ değişimi, uygulama arka planda kalması) yeniden bağlanılır.
      if (Date.now() - this.lastMessageAt > 20000) {
        this.reconnect();
        return;
      }
      this.socket?.send({ type: 'mic', on: this.isMicOn() });
      this.retryPendingOffers();
      // iOS/Android tarayıcısı uzak sesi kendiliğinden duraklatabilir:
      // bekleyen çıkışlar tazelenir, karşı tarafın sesi geri gelir.
      void this.retryPlayback();
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
    // Ağ değişimi ya da arka plan sonrası eski ses hatları ölü kalır (ICE yenilenmiyor).
    // Hatlar bırakılır; yeni bağlantıda tazeleri kurulur, böylece ses geri gelir.
    [...this.peers.keys()].forEach((id) => this.dropPeer(id));
    this.connect().catch(() => { this.connectionState = 'disconnected'; this.emit(); });
  }

  // Telefon uygulamadan çıkıp döndüğünde: kopan bağlantı kurulur, mikrofon yayını tazelenir.
  bindLifecycle() {
    if (this.lifecycleBound) return;
    this.lifecycleBound = true;
    this.onResume = () => {
      if (document.visibilityState === 'hidden') return;
      if (!this.isConnected()) { this.lastReconnectAt = 0; this.reconnect(); }
      void this.retryPlayback();
      if (this.micOn) void this.refreshMic();
    };
    this.onOnline = () => { this.lastReconnectAt = 0; this.reconnect(); };
    document.addEventListener('visibilitychange', this.onResume);
    window.addEventListener('pageshow', this.onResume);
    window.addEventListener('focus', this.onResume);
    window.addEventListener('online', this.onOnline);
  }

  unbindLifecycle() {
    if (!this.lifecycleBound) return;
    this.lifecycleBound = false;
    document.removeEventListener('visibilitychange', this.onResume);
    window.removeEventListener('pageshow', this.onResume);
    window.removeEventListener('focus', this.onResume);
    window.removeEventListener('online', this.onOnline);
    this.onResume = null;
    this.onOnline = null;
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

  ensurePeer(peerId, incoming = false) {
    const existing = this.peers.get(peerId);
    if (existing) return existing;
    if (!RTCPeerConnectionCtor) throw new Error('webrtc_unsupported');
    const pc = new RTCPeerConnectionCtor({ iceServers: ICE_SERVERS });
    const peer = { id: peerId, pc, sender: null, output: null, pending: [], remoteReady: false, attemptAt: 0, disconnectTimer: null };
    this.peers.set(peerId, peer);

    peer.pending = this.pendingIce.get(peerId) || [];
    this.pendingIce.delete(peerId);
    if (!incoming || typeof pc.addTransceiver !== 'function') this.attachLocalAudio(peer);

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
    const rebuild = () => {
      this.dropPeer(peerId);
      if (!this.wantedPeerIds().includes(peerId)) return;
      this.ensurePeer(peerId);
      if (this.peerId < peerId) void this.callPeer(peerId);
    };
    const onStateChange = () => {
      if (this.peers.get(peerId) === peer) {
        if (pcFailed(pc)) {
          rebuild();
        } else if (['disconnected', 'interrupted'].includes(pc.iceConnectionState)) {
          // Kısa kopmalar (ekran kilidi, ağ değişimi) kendiliğinden düzelir.
          // Düzelmezse hat tazelenir: ses sessizce kesik kalmaz.
          if (!peer.disconnectTimer) {
            peer.disconnectTimer = window.setTimeout(() => {
              peer.disconnectTimer = null;
              if (this.peers.get(peerId) === peer && !pcConnected(pc)) rebuild();
            }, DISCONNECT_GRACE_MS);
          }
        } else if (peer.disconnectTimer) {
          window.clearTimeout(peer.disconnectTimer);
          peer.disconnectTimer = null;
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
    // Mikrofon kapatılırken hat ayakta kalır: yalnızca yayın kanalı boşaltılır.
    if (!track) {
      if (peer.sender && typeof peer.sender.replaceTrack === 'function') {
        try { await peer.sender.replaceTrack(null); return; } catch (error) {}
      }
      return;
    }
    // Hat mikrofonla hiç anlaşmadıysa (dinleyici olarak kuruldu) bazı Android ve iOS
    // sürümlerinde ses karşıya gitmez. Böyle bir hat mikrofonla yeniden kurulur.
    const negotiated = !!peer.sender?.track || !!peer.micNegotiated;
    // iOS Safari mikrofonsuz açılan hatta sonradan konan sesi çoğu sürümde yayınlamaz
    // (karşı taraf sessizlik duyar): hat doğrudan mikrofonla yeniden kurulur.
    if (!IS_IOS && negotiated && peer.sender && typeof peer.sender.replaceTrack === 'function') {
      try { await peer.sender.replaceTrack(track); peer.micNegotiated = true; return; }
      catch (error) { console.warn('[P2P] mikrofon kanalı yeniden kuruluyor', error); }
    }
    // Her iki uç da eski hattı bırakır; mikrofon baştan eklenerek anlaşılır.
    this.dropPeer(peer.id);
    this.sendSignal(peer.id, { kind: 'restart' });
    this.reconcile();
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
    if (!peer || peer.makingOffer || peer.pc.signalingState !== 'stable') return;
    if (pcConnected(peer.pc)) return;
    peer.makingOffer = true;
    peer.attemptAt = Date.now();
    try {
      // offerToReceiveAudio: eski cihazlarda alıcı hat yalnızca bu bayrakla açılır.
      const offer = await peer.pc.createOffer({ offerToReceiveAudio: true });
      await peer.pc.setLocalDescription(offer);
      this.sendSignal(peerId, { kind: 'offer', sdp: { type: peer.pc.localDescription.type, sdp: peer.pc.localDescription.sdp } });
    } catch (error) {
      console.warn('[P2P] teklif oluşturulamadı', error);
    } finally { peer.makingOffer = false; }
  }

  // Cevapsız kalan teklifler sessizce ölü bırakılmaz: yeniden denenir.
  retryPendingOffers() {
    if (!this.peerId) return;
    const now = Date.now();
    this.peers.forEach((peer) => {
      if (pcConnected(peer.pc)) return;
      if (now - (peer.attemptAt || 0) < OFFER_RETRY_MS) return;
      // Yanıtsız kalan kendi teklifi geri alınır: hat "have-local-offer" durumunda kilitli kalmaz.
      if (peer.pc.signalingState === 'have-local-offer' && now - (peer.attemptAt || 0) > OFFER_RETRY_MS * 2) {
        peer.pc.setLocalDescription({ type: 'rollback' }).catch(() => {});
        return;
      }
      if (this.peerId < peer.id) void this.callPeer(peer.id);
    });
  }

  onSignal(from, data) {
    if (!from || !data || typeof data !== 'object') return;
    const previous = this.signalQueues.get(from) || Promise.resolve();
    const next = previous.then(() => this.socket && this.processSignal(from, data))
      .catch((error) => console.warn('[P2P] ses sinyali işlenemedi', error))
      .finally(() => { if (this.signalQueues.get(from) === next) this.signalQueues.delete(from); });
    this.signalQueues.set(from, next);
    return next;
  }

  async processSignal(from, data) {
    if (data.kind === 'restart') {
      this.dropPeer(from);
      this.reconcile();
      return;
    }
    if (data.kind === 'ice') {
      const peer = this.peers.get(from);
      if (!peer) {
        const pending = this.pendingIce.get(from) || [];
        if (pending.length < 64 && this.pendingIce.size < 256) {
          pending.push(data.candidate);
          this.pendingIce.set(from, pending);
        }
        return;
      }
      if (!peer.remoteReady) { peer.pending.push(data.candidate); return; }
      await peer.pc.addIceCandidate(data.candidate).catch(() => {});
      return;
    }
    if (data.kind === 'offer') {
      const peer = this.ensurePeer(from, true);
      try {
        // İki taraf aynı anda teklif verdiyse küçük peerId'li tarafın teklifi geçerlidir;
        // büyük olan kendi teklifini geri alır (yoksa iki taraf da kilitlenip ses kurulmaz).
        if (peer.pc.signalingState === 'have-local-offer' && this.peerId > from) {
          try { await peer.pc.setLocalDescription({ type: 'rollback' }); } catch (error) {}
        }
        if (peer.pc.signalingState !== 'stable') return;
        await peer.pc.setRemoteDescription(sessionDescription(data.sdp));
        await answerVoiceTrack(peer, this.isMicOn() ? this.micTrack : null);
        peer.remoteReady = true;
        await Promise.all(peer.pending.splice(0).map((candidate) => peer.pc.addIceCandidate(candidate).catch(() => {})));
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

  setMicEnabled(on) {
    if (!on) { this.stopMic(); return Promise.resolve(false); }
    this.micDesired = true;
    if (this.micRequest) return this.micRequest;
    if (this.isMicOn()) return Promise.resolve(true);
    const revision = ++this.micRevision;
    const request = this.startMic(revision).finally(() => {
      if (this.micRequest === request) this.micRequest = null;
    });
    this.micRequest = request;
    return request;
  }

  async startMic(revision) {
    this.lastMicrophoneError = null;
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
    // iOS'ta önbellekteki kanal arka plandan sonra sessiz kalır: mikrofon açılırken
    // taze kanal istenir, yoksa karşı taraf hiç ses duymaz.
    let track = await withTimeout(ensureMicTrack({ fresh: IS_IOS }), MIC_TIMEOUT_MS, 'mic_timeout');
    // Android'de ilk açılan kanal sessiz (muted) gelebilir: taze kanalla bir kez
    // daha denenir.
    if (revision !== this.micRevision || !this.micDesired) {
      if (!this.micDesired && track) track.enabled = false;
      return false;
    }
    if (!track || track.readyState !== 'live' || track.muted) {
      track = await withTimeout(ensureMicTrack({ fresh: true }), MIC_TIMEOUT_MS, 'mic_timeout');
    }
    if (revision !== this.micRevision || !this.micDesired) {
      if (!this.micDesired && track) track.enabled = false;
      return false;
    }
    if (!track || track.readyState !== 'live' || track.muted) {
      this.lastMicrophoneError = 'publish_unverified';
      throw new Error('Mikrofon yayını doğrulanamadı.');
    }
    track.enabled = true;
    this.micTrack = track;
    this.micOn = true;
    await Promise.all([...this.peers.values()].map((peer) => this.applyLocalTrack(peer, track)));
    if (revision !== this.micRevision || !this.micDesired) return false;
    this.socket?.send({ type: 'mic', on: true });
    // Konuşmaya başlayınca odadaki herkesle hat kurulur.
    this.reconcile();
    // Eski iOS'ta kayıt oturumu açılınca uzak ses susabilir: çıkışlar dokunuş içinde yeniden başlatılır.
    void this.retryPlayback();
    this.emit();
    return true;
  }

  // Arka plandan dönüşte iOS mikrofon kanalını sessize alır: kanal tazelenirse yayın geri gelir.
  async refreshMic() {
    if (!this.micDesired || this.isMicOn()) return;
    try { await this.setMicEnabled(true); }
    catch (error) {
      this.lastMicrophoneError = error?.code || error?.name || 'mic_failed';
      this.emit();
    }
  }

  stopMic() {
    this.micRevision += 1;
    this.micDesired = false;
    this.micRequest = null;
    if (this.micTrack) this.micTrack.enabled = false;
    this.micOn = false;
    this.peers.forEach((peer) => { void this.applyLocalTrack(peer, null); });
    this.socket?.send({ type: 'mic', on: false });
    // Sustuysan yalnızca konuşanları dinlemeye devam et.
    this.reconcile();
    this.emit();
  }

  isMicOn() {
    const track = this.micTrack;
    return !!this.micOn && !!track && track.readyState === 'live' && track.enabled && !track.muted;
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
    const results = await Promise.all(this.audioElements().map((output) =>
      Promise.resolve(output.play?.()).then(() => true, () => false)));
    this.audioBlocked = results.some((played) => !played);
    this.emit();
    return !this.audioBlocked;
  }

  dropPeer(peerId) {
    const peer = this.peers.get(peerId);
    if (!peer) return;
    this.peers.delete(peerId);
    if (peer.disconnectTimer) { window.clearTimeout(peer.disconnectTimer); peer.disconnectTimer = null; }
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
    this.micRevision += 1;
    this.micDesired = false;
    this.micRequest = null;
    if (this.micTrack) this.micTrack.enabled = false;
    this.micOn = false;
    this.pendingIce.clear();
    this.signalQueues.clear();
    window.clearInterval(this.heartbeat);
    this.heartbeat = null;
    this.unbindLifecycle();
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