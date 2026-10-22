import { FRAME_DESIGNS } from '@/lib/frameCollection';
export default function vipFrameArt(level, ownerSeed = '', membershipLevel = level) {
  if (level < 5 || level > 12) return null;
  const pool = FRAME_DESIGNS.filter(frame => membershipLevel > 8 ? frame.family === 'dragon' : frame.family !== 'dragon');
  // A stable, account-specific draw: never reshuffle on reload or between rooms.
  let draw = 2166136261;
  for (const character of `${ownerSeed || 'vip-preview'}:${level}:${membershipLevel}`) draw = Math.imul(draw ^ character.charCodeAt(0), 16777619) >>> 0;
  return pool[draw % pool.length] || null;
}