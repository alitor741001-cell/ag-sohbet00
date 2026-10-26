// Eşler arası (P2P) ses motoru.
//
// Ses artık bir medya sunucusundan geçmez: her katılımcı diğerleriyle doğrudan
// WebRTC bağlantısı kurar. Bağlantının kurulması için gereken teklif/yanıt/ICE
// mesajları Base44 gerçek zamanlı kanalı (VoiceMesh odası) üzerinden yalnızca
// hedef eşe iletilir.
import { base44 } from '@/api/base44Client';
import { createStreamOutput, unlockVoicePlayback } from '@/lib/callAudio';
import { getMicNoiseSuppression } from '@/lib/micSource';

const ICE_SERVERS = [{ urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'] }];
const CONN_KEY = 'voice_mesh_conn';
const LEVEL_INTERVAL = 800;
const HEARTBEAT_INTERVAL = 20000;
const CONNECT_TIMEOUT = 12000;
const SPEAK_THRESHOLD = 0.02;

// Yankı önleme tek kanal yakalamada daha iyi çalışır: film sesi konuşmaya kaçmaz.
const micOptions = () => ({
  echoCancellation: true,
  noiseSuppression: getMicNoiseSuppression(),
  autoGainControl: !getMicNoiseSuppression(),
  channelCount: { ideal: 1 },
});

// Sekme başına tek bağlantı kimliği: sayfa yenilenince aynı yer geri alınır.
const connectionId = () => {
  try {
    let value = sessionStorage.getItem(CONN_KEY);
    if (!value) { value = crypto.randomUUID(); sessionStorage.setItem(CONN_KEY, value); }
    return value;
  } catch { return crypto.randomUUID(); }
};

const sameList = (a, b) => a.length === b.length && a.every((value, index) => value === b[index]);

export class VoiceMesh {
  constructor({ roomId, userId, name, onChange }) {
    this.roomId = roomId;
    this.userId = userId || '';
    this.name = name || 'Kullanıcı';
    this.onChange = onChange || (() => {});
    this.conn = null;
    this.selfId = '';
    this.peers = new Map(); // eş kimliği -> { id, userId, name, micOn, pc, output, initiator }
    this.localStream = null;
    this.localTrack = null;
    this.micOn = false;
    this.deafened = false;
    this.outputsEnabled = true;
    this.connectionState = 'connecting';
    this.audioBlocked = false;
    this.speakers = [];
    this.closed = false;
    this.intervals = [];
    this.timeouts = [];
  }

  // --- Bağlantı ---

  async connect() {
    this.conn = base44.actors.VoiceMesh(this.roomId).connect({ id: connectionId() });
    this.sub = this.conn.subscribe((msg) => this.handle(msg));
    // Soket açılmadan gönderilen mesajlar kuyruğa alınır.
    this.conn.send({ type: 'hello', name: this.name, micOn: false });
    this.startTimers();
    this.emit();
    await new Promise((resolve, reject) => {
      this.ready = resolve;
      this.timeouts.push(setTimeout(() => reject(new Error('Ses kanalı açılamadı.')), CONNECT_TIMEOUT));
    });
  }

  startTimers() {
    this.intervals.push(setInterval(() => this.pollLevels(), LEVEL_INTERVAL));
    this.intervals.push(setInterval(() => { if (!this.closed) this.conn?.send({ type: 'ping' }); }, HEARTBEAT_INTERVAL));
  }

  // --- Gelen mesajlar ---

  handle(msg) {
    if (this.closed || typeof msg !== 'object' || msg === null) return;

    if (msg.type === 'welcome') {
      this.selfId = String(msg.self || '');
      const list = Array.isArray(msg.peers) ? msg.peers : [];
      // Yeni gelen taraf teklif verir: mevcut eşler bekler, çakışma olmaz.
      list.forEach((peer) => { this.upsertPeer(peer); this.ensurePeer(peer.id, true); });
      this.connectionState = 'connected';
      this.ready?.();
      this.emit();
      return;
    }

    if (msg.type === 'peer-join') {
      if (msg.peer?.id) this.upsertPeer(msg.peer);
      this.emit();
      return;
    }

    if (msg.type === 'peer-leave') {
      this.removePeer(msg.id);
      return;
    }

    if (msg.type === 'peer-mic') {
      const peer = this.peers.get(msg.id);
      if (peer) { peer.micOn = !!msg.on; this.emit(); }
      return;
    }

    if (msg.type === 'signal') {
      this.handleSignal(msg.from, msg.data).catch((signalError) => console.warn('[VoiceMesh] Sinyal hatası', signalError));
      return;
    }

    if (msg.type === 'need-hello') {
      this.conn?.send({ type: 'hello', name: this.name, micOn: this.micOn });
    }
  }

  // --- Eşler ---

  upsertPeer(info) {
    const existing = this.peers.get(info.id);
    if (existing) {
      existing.userId = info.userId || existing.userId;
      existing.name = info.name || existing.name;
      existing.micOn = !!info.micOn;
      return existing;
    }
    const peer = {
      id: info.id,
      userId: info.userId || '',
      name: info.name || '',
      micOn: !!info.micOn,
      pc: null,
      transceiver: null,
      output: null,
      initiator: false,
      pendingIce: [],
      renegotiate: false,
    };
    this.peers.set(info.id, peer);
    return peer;
  }

  removePeer(peerId) {
    const peer = this.peers.get(peerId);
    if (!peer) return;
    try { peer.pc?.close(); } catch {}
    peer.output?.remove();
    this.peers.delete(peerId);
    this.emit();
  }

  ensurePeer(peerId, initiator) {
    const peer = this.peers.get(peerId) || this.upsertPeer({ id: peerId });
    if (peer.pc) return peer;
    peer.initiator = initiator;
    peer.pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    peer.pc.onicecandidate = (event) => {
      if (event.candidate) this.sendSignal(peer.id, { kind: 'ice', candidate: event.candidate.toJSON() });
    };
    peer.pc.ontrack = (event) => this.attachOutput(peer, event);
    peer.pc.onconnectionstatechange = () => {
      if (['failed', 'closed'].includes(peer.pc?.connectionState)) this.emit();
    };
    // Ses kanalı her iki yönde baştan açılır: mikrofon sonradan açılsa da
    // yeniden anlaşma gerekmez, yalnızca kanal açılır/kapanır.
    peer.transceiver = peer.pc.addTransceiver('audio', { direction: 'sendrecv' });
    this.attachLocalTrack(peer);
    if (peer.initiator) this.negotiate(peer).catch(() => {});
    return peer;
  }

  attachLocalTrack(peer) {
    if (!peer?.pc || !this.localTrack) return;
    const sender = peer.transceiver?.sender;
    if (sender) {
      if (sender.track !== this.localTrack) sender.replaceTrack(this.localTrack).catch(() => {});
      return;
    }
    const free = peer.pc.getSenders().find((item) => !item.track);
    if (free) { free.replaceTrack(this.localTrack).catch(() => {}); return; }
    try { peer.pc.addTrack(this.localTrack, this.localStream); } catch {}
  }

  // Teklif yalnızca başlatan taraf verir: aynı anda iki teklif çakışmaz.
  async negotiate(peer) {
    if (this.closed || !peer?.pc) return;
    if (peer.pc.signalingState !== 'stable') { peer.renegotiate = true; return; }
    this.attachLocalTrack(peer);
    const offer = await peer.pc.createOffer();
    await peer.pc.setLocalDescription(offer);
    this.sendSignal(peer.id, { kind: 'offer', sdp: offer.sdp });
  }

  async handleSignal(peerId, data) {
    if (!peerId || !data || typeof data !== 'object') return;

    if (data.kind === 'offer') {
      const peer = this.ensurePeer(peerId, false);
      await peer.pc.setRemoteDescription({ type: 'offer', sdp: String(data.sdp || '') });
      await this.flushIce(peer);
      this.attachLocalTrack(peer);
      const answer = await peer.pc.createAnswer();
      await peer.pc.setLocalDescription(answer);
      this.sendSignal(peer.id, { kind: 'answer', sdp: answer.sdp });
      return;
    }

    if (data.kind === 'answer') {
      const peer = this.peers.get(peerId);
      if (!peer?.pc || peer.pc.signalingState === 'stable') return;
      await peer.pc.setRemoteDescription({ type: 'answer', sdp: String(data.sdp || '') });
      await this.flushIce(peer);
      if (peer.renegotiate) { peer.renegotiate = false; await this.negotiate(peer); }
      return;
    }

    if (data.kind === 'ice' && data.candidate) {
      const peer = this.peers.get(peerId);
      if (!peer?.pc) return;
      if (!peer.pc.remoteDescription) { peer.pendingIce.push(data.candidate); return; }
      await peer.pc.addIceCandidate(data.candidate).catch(() => {});
      return;
    }

    if (data.kind === 'renegotiate') {
      const peer = this.peers.get(peerId);
      if (peer?.initiator) await this.negotiate(peer);
    }
  }

  async flushIce(peer) {
    const pending = peer.pendingIce.splice(0);
    for (const candidate of pending) await peer.pc.addIceCandidate(candidate).catch(() => {});
  }

  sendSignal(to, data) {
    this.conn?.send({ type: 'signal', to, data });
  }

  // --- Ses çıkışı ---

  attachOutput(peer, event) {
    const stream = event.streams?.[0] || new MediaStream([event.track]);
    if (peer.output?.dataset?.mediaId === stream.id) return;
    peer.output?.remove();
    const output = createStreamOutput(stream, this.roomId, { startMuted: this.deafened || !this.outputsEnabled });
    peer.output = output;
    output.play()
      .then(() => { if (this.audioBlocked) { this.audioBlocked = false; this.emit(); } })
      .catch(() => { this.audioBlocked = true; this.emit(); });
    this.emit();
  }

  applyOutputMuting() {
    const muted = this.deafened || !this.outputsEnabled;
    this.peers.forEach((peer) => { if (peer.output) peer.output.muted = muted; });
  }

  async retryPlayback() {
    const list = [...this.peers.values()].map((peer) => peer.output).filter(Boolean);
    await unlockVoicePlayback();
    if (!list.length) { this.audioBlocked = false; this.emit(); return; }
    const results = await Promise.allSettled(list.map((output) => output.play()));
    this.audioBlocked = results.every((result) => result.status === 'rejected');
    this.emit();
  }

  setDeafened(value) {
    this.deafened = !!value;
    this.applyOutputMuting();
    this.emit();
  }

  setOutputsEnabled(value) {
    this.outputsEnabled = !!value;
    this.applyOutputMuting();
    if (this.outputsEnabled) this.retryPlayback();
    this.emit();
  }

  // --- Mikrofon ---

  isMicOn() {
    return this.micOn && !!this.localTrack && this.localTrack.readyState === 'live' && this.localTrack.enabled;
  }

  async setMicEnabled(on) {
    if (on) {
      if (!this.localTrack || this.localTrack.readyState !== 'live') {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: micOptions() });
        if (this.closed) { stream.getTracks().forEach((track) => track.stop()); throw new Error('kapandı'); }
        this.localStream = stream;
        this.localTrack = stream.getAudioTracks()[0] || null;
        if (!this.localTrack) throw new Error('mikrofon yok');
        this.localTrack.addEventListener('ended', () => { this.localTrack = null; this.micOn = false; this.emit(); });
      }
      this.localTrack.enabled = true;
      this.micOn = true;
      this.conn?.send({ type: 'mic', on: true });
      this.peers.forEach((peer) => this.connectMic(peer));
      this.emit();
      return true;
    }
    if (this.localTrack) this.localTrack.enabled = false;
    this.micOn = false;
    this.conn?.send({ type: 'mic', on: false });
    this.emit();
    return false;
  }

  // Mikrofon açıldığında kanal zaten hazır: yalnızca ses akışı bağlanır.
  connectMic(peer) {
    if (!peer.pc) return;
    if (peer.transceiver?.sender) { this.attachLocalTrack(peer); return; }
    // Beklenmedik durum: kanal yoksa yeniden anlaşılır.
    if (peer.initiator) {
      this.attachLocalTrack(peer);
      this.negotiate(peer).catch(() => {});
    } else {
      this.sendSignal(peer.id, { kind: 'renegotiate' });
    }
  }

  stopMic() {
    if (this.localTrack) this.localTrack.enabled = false;
    this.micOn = false;
    this.conn?.send({ type: 'mic', on: false });
    this.emit();
  }

  // --- Konuşma göstergesi ---

  async pollLevels() {
    if (this.closed) return;
    const speaking = [];
    try {
      for (const peer of this.peers.values()) {
        if (!peer.pc || !peer.micOn) continue;
        const level = await this.audioLevel(peer.pc, 'inbound-rtp');
        if (level > SPEAK_THRESHOLD) speaking.push(peer.userId);
      }
      if (this.micOn && this.userId) {
        const withAudio = [...this.peers.values()].find((peer) => peer.pc && peer.transceiver?.sender?.track);
        if (withAudio) {
          const level = await this.audioLevel(withAudio.pc, 'media-source');
          if (level > SPEAK_THRESHOLD) speaking.push(this.userId);
        }
      }
    } catch {}
    const next = speaking.filter(Boolean).sort();
    if (sameList(next, this.speakers)) return;
    this.speakers = next;
    this.emit();
  }

  async audioLevel(pc, reportType) {
    const stats = await pc.getStats();
    let level = 0;
    stats.forEach((report) => {
      if (report.type !== reportType || report.kind !== 'audio') return;
      level = Math.max(level, Number(report.audioLevel) || 0);
    });
    return level;
  }

  // --- Görünüm ---

  getSnapshot() {
    const micStates = {};
    if (this.userId) micStates[this.userId] = this.isMicOn();
    let remoteTracks = 0;
    this.peers.forEach((peer) => {
      if (peer.userId) micStates[peer.userId] = !!peer.micOn;
      if (peer.output) remoteTracks += 1;
    });
    return {
      connectionState: this.connectionState,
      selfMicOn: this.isMicOn(),
      micStates,
      speakers: this.speakers.filter((id) => id !== this.userId),
      localSpeaking: this.speakers.includes(this.userId),
      peerCount: this.peers.size,
      participantCount: this.peers.size + 1,
      remoteTracks,
      audioBlocked: this.audioBlocked,
    };
  }

  emit() {
    if (!this.closed) this.onChange();
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.intervals.forEach(clearInterval);
    this.timeouts.forEach(clearTimeout);
    this.intervals = [];
    this.timeouts = [];
    this.peers.forEach((peer) => {
      try { peer.pc?.close(); } catch {}
      peer.output?.remove();
    });
    this.peers.clear();
    try { this.sub?.unsubscribe(); } catch {}
    try { this.conn?.close(); } catch {}
    this.localTrack?.stop();
    this.localStream?.getTracks().forEach((track) => track.stop());
    this.localTrack = null;
    this.localStream = null;
    this.micOn = false;
    this.connectionState = 'disconnected';
  }
}