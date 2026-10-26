// Sesli odaların eşleşme (signaling) odası.
// Buradan yalnızca WebRTC teklif/yanıt/ICE mesajları geçer; ses trafiği geçmez —
// eşler birbirine doğrudan bağlanır. Yayın (broadcast) yoktur: her sinyal yalnızca
// hedef eşe iletilir.
import { Actor } from 'base44:runtime/actors';

const MAX_PEERS = 12;
const randomId = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);

const publicPeer = (peer) => ({ id: peer.id, userId: peer.userId, name: peer.name, micOn: peer.micOn });

export default class VoiceMesh extends Actor {
  // conn.id -> { id (sunucunun verdiği eş kimliği), userId, name, micOn }
  peers = new Map();

  async handleStart() {
    const saved = await this.storage.get('peers');
    if (Array.isArray(saved)) this.peers = new Map(saved);
    // Uykudan dönüşte soketler bağlı kalabilir: canlı olmayan kayıtlar temizlenir.
    const live = new Set(this.getConnections().map((conn) => conn.id));
    let changed = false;
    for (const connId of [...this.peers.keys()]) {
      if (!live.has(connId)) { this.peers.delete(connId); changed = true; }
    }
    if (changed) await this.save();
  }

  handleConnect(conn) {
    // Kimliği platform doğrular: anonim bağlantı ses odasına alınmaz.
    if (conn.identity?.type !== 'authenticated') { conn.reject(4003, 'auth'); return; }
    if (!this.peers.has(conn.id) && this.peers.size >= MAX_PEERS) conn.reject(4001, 'full');
  }

  async handleMessage(conn, msg) {
    if (typeof msg !== 'object' || msg === null) return;

    if (msg.type === 'hello') {
      const userId = conn.identity?.type === 'authenticated' ? conn.identity.userId : '';
      if (!userId) { conn.reject(4003, 'auth'); return; }
      let me = this.peers.get(conn.id);
      const isNew = !me;
      if (isNew) {
        if (this.peers.size >= MAX_PEERS) { conn.reject(4001, 'full'); return; }
        me = { id: randomId(), userId, name: '', micOn: false };
        this.peers.set(conn.id, me);
      }
      me.userId = userId;
      me.name = String(msg.name || '').slice(0, 60);
      me.micOn = !!msg.micOn;
      await this.save();
      // Yeni gelen mevcut eşleri öğrenir ve onlara teklif verir; kendisi listelenmez.
      conn.send({ type: 'welcome', self: me.id, peers: this.roster(me.id) });
      if (isNew) this.sendOthers(conn.id, { type: 'peer-join', peer: publicPeer(me) });
      return;
    }

    const me = this.peers.get(conn.id);
    if (!me) { conn.send({ type: 'need-hello' }); return; }

    if (msg.type === 'mic') {
      me.micOn = !!msg.on;
      await this.save();
      this.sendOthers(conn.id, { type: 'peer-mic', id: me.id, on: me.micOn });
      return;
    }

    if (msg.type === 'signal' && typeof msg.to === 'string' && msg.data && typeof msg.data === 'object') {
      const target = [...this.peers.entries()].find(([, peer]) => peer.id === msg.to);
      if (!target) return;
      const targetConn = this.getConnections().find((c) => c.id === target[0]);
      targetConn?.send({ type: 'signal', from: me.id, data: msg.data });
    }
    // 'ping' ve bilinmeyen mesajlar sessizce yok sayılır.
  }

  async handleClose(conn) {
    const me = this.peers.get(conn.id);
    if (!me) return;
    this.peers.delete(conn.id);
    await this.save();
    this.sendOthers(conn.id, { type: 'peer-leave', id: me.id });
  }

  roster(exceptId) {
    return [...this.peers.values()].filter((peer) => peer.id !== exceptId).map(publicPeer);
  }

  sendOthers(exceptConnId, payload) {
    for (const conn of this.getConnections()) {
      if (conn.id === exceptConnId) continue;
      if (!this.peers.has(conn.id)) continue;
      conn.send(payload);
    }
  }

  save() {
    return this.storage.put('peers', [...this.peers.entries()]);
  }
}