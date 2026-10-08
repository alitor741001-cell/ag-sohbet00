import React from 'react';
import { Flame, User, Users } from 'lucide-react';

const ITEMS = [
  { icon: User, label: 'Seçimlerim' },
  { icon: Users, label: 'Tüm Kullanıcıların Coinleri' },
  { icon: Flame, label: 'Popülerlik' },
];

/** Kartlardaki rozetlerin ne anlama geldiğini gösteren küçük açıklama satırı. */
export default function FutbolLegend() {
  return (
    <ul className="fut-legend">
      {ITEMS.map(({ icon: Icon, label }) => (
        <li key={label} className="fut-legend-item">
          <Icon className="h-3.5 w-3.5" />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}