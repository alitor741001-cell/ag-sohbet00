import React from 'react';
import MafyaRoleIcon from './MafyaRoleIcon';
import { roleOf, sideLabel } from './mafyaConfig';

/** Rol kartı: rolün kendi renginde parlar. Lobi tanıtımında ve rol listelerinde kullanılır. */
export default function MafyaRoleCard({ role }) {
  const info = roleOf(role);
  if (!info) return null;
  return (
    <div className="mf-role-card" style={{ '--role-tone': info.tone, '--role-glow': info.glow }}>
      <MafyaRoleIcon role={info.id} className="mf-role-icon" />
      <p className="mf-role-name">{info.name}</p>
      <p className="mf-role-duty">{info.duty}</p>
      <span className="mf-role-side">{sideLabel(info.side)}</span>
    </div>
  );
}