// Cevap veren uç, uzak teklifin gerçekten anlaşılmış ses hattına yayın yapar.
// Önceden eklenmiş fakat mid almamış bir sender'a replaceTrack yapmak sessiz yayın üretir.
export default async function answerVoiceTrack(peer, track) {
  if (typeof peer.pc.getTransceivers !== 'function') return;
  const transceiver = peer.pc.getTransceivers().find((item) =>
    item.mid !== null && !item.stopped && item.receiver?.track?.kind === 'audio');
  if (!transceiver) return;
  transceiver.direction = 'sendrecv';
  peer.sender = transceiver.sender;
  await peer.sender.replaceTrack(track);
  peer.micNegotiated = !!track;
}