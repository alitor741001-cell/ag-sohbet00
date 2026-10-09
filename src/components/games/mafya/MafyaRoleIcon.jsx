import React from 'react';
import { BadgeCheck, Bomb, Crosshair, Eye, Flame, HeartPulse, Shield, User } from 'lucide-react';

const ICONS = {
  mafya: Crosshair,
  seytan: Flame,
  terorist: Bomb,
  polis: Shield,
  doktor: HeartPulse,
  komiser: BadgeCheck,
  gozcu: Eye,
  vatandas: User,
};

/** Rol simgesi: roller kartlarda ve sonuç dökümünde kendi simgesiyle görünür. */
export default function MafyaRoleIcon({ role, className }) {
  const Icon = ICONS[role] || User;
  return <Icon className={className} aria-hidden="true" />;
}