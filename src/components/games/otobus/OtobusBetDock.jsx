import React from 'react';
import { format, formatMult } from '../rocket/rocketConfig';
import OtobusBetPanel from './OtobusBetPanel';

/** Alt panel: iki bağımsız bahis alanı. Üstte birinci, altta ikinci alan durur. */
export default function OtobusBetDock({ game }) {
  const phase = game.phase;

  const build = (slot) => {
    const rows = (game.bets || []).filter(
      (bet) => bet.user_id === game.me && (bet.slot === 2 ? 2 : 1) === slot
    );
    const row =
      rows.find((bet) => bet.status === 'active') ||
      rows.find((bet) => bet.status === 'cashed') ||
      rows.find((bet) => bet.status === 'lost');
    const active = row?.status === 'active';
    // Oynanmış bahis varsa modül kendi yatırdığı coini gösterir; seçilen miktar
    // yalnızca bahis yokken görünür.
    const amount = row ? row.bet ?? 0 : slot === 2 ? game.bet2 : game.bet1;
    const auto = slot === 2 ? game.auto2 : game.auto1;
    const pending = !!game.busy?.[slot];
    // Dokunulduğu an sabitlenen çarpan: düğme beklerken kazanç donar.
    const shown = game.pendingMult?.[slot] || game.displayMult;

    let action = { label: 'BAHİS YAP', tone: 'orange', sub: format(amount), disabled: false };

    if (phase === 'betting') {
      action = active
        ? { label: 'İPTAL', tone: 'dark', sub: 'iade', disabled: false }
        : { label: 'BAHİS YAP', tone: 'orange', sub: format(amount), disabled: false };
    } else if (phase === 'running') {
      if (active) {
        action = {
          label: pending ? 'ÇEKİLİYOR' : 'PARA ÇEK',
          tone: 'green',
          sub: format(amount * shown),
          live: !pending,
          disabled: pending,
        };
      } else if (row?.status === 'cashed') {
        action = {
          label: 'ÇEKİLDİ',
          tone: 'green',
          badge: formatMult(row.cashout_at),
          sub: `+${format(row.payout)}`,
          disabled: true,
        };
      } else {
        action = { label: 'UÇUŞTA', tone: 'dark', disabled: true };
      }
    } else if (phase === 'crashed') {
      if (row?.status === 'cashed') {
        action = {
          label: 'ÇEKİLDİ',
          tone: 'green',
          badge: formatMult(row.cashout_at),
          sub: `+${format(row.payout)}`,
          disabled: true,
        };
      } else if (row?.status === 'lost' || active) {
        action = { label: 'KAYBETTİ', tone: 'dark', sub: `-${format(row?.bet ?? amount)}`, disabled: true };
      } else {
        action = { label: 'BEKLE', tone: 'dark', disabled: true };
      }
    } else {
      action = { label: 'YÜKLENİYOR', tone: 'dark', disabled: true };
    }

    // İsteği süren düğmeye tekrar basmak yeni istek açmaz.
    if (pending) action = { ...action, disabled: true };

    return {
      amount,
      auto,
      locked: active,
      action,
      onAction: () => (active ? game.cashout(slot) : game.placeBet(slot)),
      onAmount: (direction) => game.changeBet(slot, direction),
      onAuto: (direction) => game.changeAuto(slot, direction),
      onPreset: (value) => game.setBetAmount(slot, value),
      onAutoPreset: (value) => game.setAutoTarget(slot, value),
    };
  };

  return (
    <div className="ob-dock">
      <OtobusBetPanel {...build(1)} />
      <OtobusBetPanel {...build(2)} />
    </div>
  );
}