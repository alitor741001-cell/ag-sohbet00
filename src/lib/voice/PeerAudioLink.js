import { createStreamOutput } from '@/lib/callAudio';
import voiceSessionId from '@/lib/voice/sessionId';

/** One duplex audio connection, serialized signalling and collision-safe negotiation. */
export default class PeerAudioLink {
  constructor({ id, localId, roomId, track, iceServers, send, muted, changed }) {
    this.id = id;
    this.send = send;
    this.changed = changed;
    this.polite = localId > id;
    this.closed = false;
    this.makingOffer = false;
    this.pending = [];
    this.ignored = new Set();
    this.session = voiceSessionId();
    this.remoteSession = null;
    this.signalQueue = Promise.resolve();
    this.lastRestart = 0;
    this.restartCount = 0;
    this.startedAt = Date.now();
    this.blocked = false;
    this.muted = muted;
    this.pc = new RTCPeerConnection({ iceServers });
    this.sender = this.pc.addTransceiver(track || 'audio', {
      direction: 'sendrecv', ...(track ? { streams: [new MediaStream([track])] } : {}),
    }).sender;
    this.pc.onnegotiationneeded = () => { void this.offer(); };
    this.pc.onicecandidate = ({ candidate }) => {
      if (candidate && !this.closed) this.send({ kind: 'ice', session: this.session, candidate: candidate.toJSON() });
    };
    this.pc.ontrack = ({ track: remoteTrack, streams }) => {
      const stream = streams[0] || new MediaStream([remoteTrack]);
      if (this.output?.dataset.mediaId === stream.id) return;
      this.output?.remove();
      this.output = createStreamOutput(stream, roomId, { startMuted: this.muted, onPlaybackChange: (blocked) => {
        this.blocked = blocked; this.changed();
      } });
      void this.play();
    };
    this.pc.onconnectionstatechange = () => {
      if (this.closed) return;
      const state = this.pc.connectionState;
      if (state === 'connected') { this.disconnectedAt = 0; this.restartCount = 0; }
      else if (state === 'disconnected' && !this.disconnectedAt) this.disconnectedAt = Date.now();
      this.changed();
    };
  }

  async offer(iceRestart = false) {
    if (this.closed || this.makingOffer || this.pc.signalingState !== 'stable') return;
    this.makingOffer = true;
    try {
      const offer = await this.pc.createOffer({ iceRestart });
      if (this.closed || this.pc.signalingState !== 'stable') return;
      await this.pc.setLocalDescription(offer);
      if (!this.closed) this.send({ kind: 'offer', session: this.session, sdp: this.pc.localDescription.toJSON() });
    } catch (error) {
      if (!this.closed) console.warn('[Voice] negotiation', error);
    } finally { this.makingOffer = false; }
  }

  receive(data) {
    this.signalQueue = this.signalQueue.then(() => this.accept(data)).catch((error) => {
      if (!this.closed) console.warn('[Voice] signal', error);
    });
    return this.signalQueue;
  }

  async accept(data) {
    if (this.closed) return;
    if (data.kind === 'ice') {
      if (this.ignored.has(data.session)) return;
      if (!this.pc.remoteDescription || data.session !== this.remoteSession) {
        if (this.pending.length < 128) this.pending.push(data);
      } else await this.pc.addIceCandidate(data.candidate);
      return;
    }
    if (!['offer', 'answer'].includes(data.kind) || !data.sdp) return;
    if (data.kind === 'answer' && (data.replyTo !== this.session || this.pc.signalingState !== 'have-local-offer')) return;
    const collision = data.kind === 'offer' && (this.makingOffer || this.pc.signalingState !== 'stable');
    if (collision && !this.polite) { this.ignored.add(data.session); return; }
    this.ignored.delete(data.session);
    if (collision && this.pc.signalingState !== 'stable') await this.pc.setLocalDescription({ type: 'rollback' });
    await this.pc.setRemoteDescription(data.sdp);
    this.remoteSession = data.session;
    const candidates = this.pending.splice(0).filter((entry) => entry.session === data.session);
    for (const entry of candidates) await this.pc.addIceCandidate(entry.candidate);
    if (data.kind === 'offer') {
      await this.pc.setLocalDescription(await this.pc.createAnswer());
      if (!this.closed) this.send({ kind: 'answer', session: this.session, replyTo: data.session, sdp: this.pc.localDescription.toJSON() });
    }
  }

  async setTrack(track) {
    if (this.closed || this.sender.track === track) return;
    await this.sender.replaceTrack(track);
  }

  setMuted(muted) {
    this.muted = muted;
    if (this.output) this.output.muted = muted;
  }

  async play() {
    if (!this.output || this.closed) return true;
    try { await this.output.play(); this.blocked = false; }
    catch { this.blocked = !this.muted; }
    this.changed();
    return !this.blocked;
  }

  recover() {
    if (this.closed || this.pc.connectionState === 'connected') return;
    const now = Date.now();
    const stalled = now - this.startedAt > 20000;
    if (!stalled && this.pc.connectionState !== 'failed' && !(this.disconnectedAt && now - this.disconnectedAt > 8000)) return;
    if (now - this.lastRestart < 15000 || this.restartCount >= 3) return;
    this.lastRestart = now;
    this.restartCount += 1;
    this.changed();
    // Only the elected peer restarts; no two-device restart storm.
    if (!this.polite) {
      this.signalQueue = this.signalQueue.then(async () => {
        if (this.closed) return;
        if (this.pc.signalingState === 'have-local-offer') await this.pc.setLocalDescription({ type: 'rollback' });
        await this.offer(true);
      }).catch((error) => console.warn('[Voice] recovery', error));
    }
  }

  close() {
    this.closed = true;
    this.pc.onnegotiationneeded = this.pc.onicecandidate = this.pc.ontrack = this.pc.onconnectionstatechange = null;
    this.pc.close();
    this.output?.remove();
    this.output = null;
    this.pending = [];
  }
}