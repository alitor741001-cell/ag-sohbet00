import { base44 } from '@/api/base44Client';

// Each entity has one transport while consumers keep their own event filters.
const channels = new Map();
export default function subscribeEntity(name, listener) {
  let channel = channels.get(name);
  if (!channel) {
    channel = { listeners: new Set(), off: null };
    channels.set(name, channel);
    channel.off = base44.entities[name].subscribe((event) => {
      [...channel.listeners].forEach((callback) => callback(event));
    });
  }
  channel.listeners.add(listener);
  let active = true;
  return () => {
    if (!active) return;
    active = false;
    channel.listeners.delete(listener);
    if (!channel.listeners.size) {
      channel.off?.();
      channels.delete(name);
    }
  };
}