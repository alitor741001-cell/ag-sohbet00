// Sesli oda sinyal odası.
//
// Ses trafiği buradan GEÇMEZ: taraflar birbirine doğrudan (WebRTC) bağlanır.
// Actor yalnızca kim var / kim mikrofonunu açtı / teklif-yanıt-ICE mesajlarını
// doğru eşe iletmekle ilgilenir.
//
// Güvenlik notu: conn.id istemci tarafından taşınır, bu yüzden yayınlarda ASLA
// kullanılmaz. Her bağlantıya sunucu tarafında kısa bir peerId verilir.
import { Actor } from 'base44:runtime/actors';

// Dinleyiciler sinyal odasında kalabalık olabilir; ses yalnızca konuşanlarla eşleşir.
const MAX_PEERS = 40;
// Kısa kopmalarda kimlik korunur: 15 saniye içinde dönen aynı bağlantı yerini geri alır.
const DROP_GRACE_MS = 15000;

export default class VoiceMesh extends Actor {
  peers = new Map(); // conn.id -> { peerId, userId, name, mic, offline }

  peerList() {
    return [...this.peers.values()]
      .filter((peer) => !peer.offline)
      .map((peer) => ({ peerId: peer.peerId, userId: peer.userId, name: peer.name, mic: peer.mic }));
  }

  broadcastPeers() {
    this.broadcast({ type: 'peers', peers: this.peerList() });
  }

  save() {
    return this.storage.put('peers', [...this.peers.entries()]);
  }

  connFor(peerId) {
    const entry = [...this.peers.entries()].find(([, peer]) => peer.peerId === peerId && !peer.offline);
    if (!entry) return null;
    // Aynı kimlikle yeniden bağlanan istemci (uygulama kapatılıp açıldığında) eski
    // soketi bir süre geride bırakır: sinyal her zaman EN YENİ açık bağlantıya gider,
    // yoksa teklif/yanıt ölü sokete düşüp ses hiç kurulmaz.
    const matching = this.getConnections().filter((conn) => conn.id === entry[0]);
    return matching.length ? matching[matching.length - 1] : null;
  }

  async handleStart() {
    const saved = await this.storage.get('peers');
    if (saved) this.peers = new Map(saved);
    const live = new Set(this.getConnections().map((conn) => conn.id));
    for (const [connId, peer] of [...this.peers]) {
      if (live.has(connId)) {
        peer.offline = false;
      } else {
        peer.offline = true;
        this.schedule(`drop:${peer.peerId}`, Date.now() + DROP_GRACE_MS);
      }
    }
    this.broadcastPeers();
  }

  async handleConnect(conn) {
    const known = this.peers.get(conn.id);
    if (!known && this.peerList().length >= MAX_PEERS) {
      conn.reject(4001, 'oda dolu');
      return;
    }
    if (known) {
      // Yeniden bağlanma: aynı kimlik geri alınır, yeni peerId üretilmez.
      known.offline = false;
      this.cancelSchedule(`drop:${known.peerId}`);
      conn.send({ type: 'you', peerId: known.peerId });
    } else {
      const identity = conn.identity;
      const userId = identity && identity.type === 'authenticated' ? String(identity.userId || '') : '';
      const peerId = `p${Math.random().toString(36).slice(2, 9)}`;
      this.peers.set(conn.id, { peerId, userId, name: 'Kullanıcı', mic: false, offline: false });
      conn.send({ type: 'you', peerId });
      await this.save();
    }
    this.broadcastPeers();
  }

  async handleMessage(conn, msg) {
    if (!msg || typeof msg !== 'object') return;
    const me = this.peers.get(conn.id);
    if (!me) return;
    // Mesaj canlı soketten geldiğine göre kişi bağlıdır: eski bir kopma kaydı varsa temizlenir.
    if (me.offline) {
      me.offline = false;
      this.cancelSchedule(`drop:${me.peerId}`);
      this.broadcastPeers();
    }

    if (msg.type === 'hello') {
      const name = String(msg.name || 'Kullanıcı').slice(0, 60);
      if (name !== me.name) {
        me.name = name;
        await this.save();
      }
      // A new browser transport must replace the other end's stale peer connection.
      if (msg.reset === true) this.broadcast({ type: 'gone', peerId: me.peerId });
      conn.send({ type: 'you', peerId: me.peerId });
      this.broadcastPeers();
      return;
    }

    if (msg.type === 'mic') {
      const changed = me.mic !== (msg.on === true);
      me.mic = msg.on === true;
      // Kalp atışı: kimlik ve oda listesi kendini onarır.
      conn.send({ type: 'you', peerId: me.peerId });
      if (changed) { await this.save(); this.broadcastPeers(); }
      else conn.send({ type: 'peers', peers: this.peerList() });
      return;
    }

    if (msg.type === 'signal') {
      const data = msg.data;
      if (!data || typeof data !== 'object') return;
      const target = this.connFor(String(msg.to || ''));
      if (target) target.send({ type: 'signal', from: me.peerId, data });
    }
  }

  async handleClose(conn) {
    const me = this.peers.get(conn.id);
    if (!me) return;
    // Aynı kimlikle daha yeni bir bağlantı açıldıysa eski soketin kapanması kişiyi düşürmez.
    // (Uygulama kapatılıp açıldığında eski soket sonradan kapanıyor ve sesi tamamen kesiyordu.)
    const superseded = this.getConnections().some((other) => other !== conn && other.id === conn.id);
    if (superseded) return;
    me.offline = true;
    me.mic = false;
    await this.save();
    this.schedule(`drop:${me.peerId}`, Date.now() + DROP_GRACE_MS);
    this.broadcast({ type: 'gone', peerId: me.peerId });
    this.broadcastPeers();
  }

  async handleWake(key) {
    if (!key.startsWith('drop:')) return;
    const peerId = key.slice(5);
    let changed = false;
    for (const [connId, peer] of [...this.peers]) {
      if (peer.peerId !== peerId) continue;
      const live = this.getConnections().some((conn) => conn.id === connId);
      if (live) {
        peer.offline = false;
      } else {
        this.peers.delete(connId);
        changed = true;
      }
    }
    if (changed) await this.save();
    this.broadcastPeers();
  }
}