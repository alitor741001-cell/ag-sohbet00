import { FRAME_DESIGNS, VIP_FRAME_KEYS } from '@/lib/frameCollection';
export default function vipFrameArt(level) {
  return FRAME_DESIGNS.find(frame => frame.key === VIP_FRAME_KEYS[level]) || null;
}