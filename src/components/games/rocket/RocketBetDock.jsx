import React from 'react';
import { Film } from 'lucide-react';
import { format, formatMult } from './rocketConfig';
import RocketBetPanel from './RocketBetPanel';

/** Alt panel: iki bağımsız bahis alanı ve aralarında film makarası göbeği. */
export default function RocketBetDock({ game }) {
  const phase = game.round?.status;

  const build = (slot, tone) => {
    const rows = (game.bets || []).filter(
      (b) => b.user_id === game.me && (b.slot === 2 ? 2 : 1) === slot
    );
    const row =
      rows.find((b) => b.status === 'active') ||
      rows.find((b) => b.status === 'cashed') ||
      rows.find((b) => b.status === 'lost');
    const active = row?.status === 'active';
    const amount = slot === 2 ? game.bet2 : game.bet1;
    const auto = slot === 2 ? game.auto2 : game.auto1;

    let label = 'BAHİS YAP';
    let sub = '';
    let disabled = false;

    if (phase === 'betting') {
      label = active ? 'İPTAL' : 'BAHİS YAP';
      sub = active ? 'iade' : '';
    } else if (phase === 'running') {
      if (active) {
        label = 'ÇEK';
        sub = `${formatMult(game.liveMult)} · ${format(amount * game.liveMult)}`;
      } else {
        label = 'UÇUŞTA';
        disabled = true;
      }
    } else if (phase === 'crashed') {
      if (row?.status === 'cashed') {
        label = 'ÇEKİLDİ';
        sub = formatMult(row.cashout_at);
      } else if (row?.status === 'lost' || active) {
        label = 'KAYBETTİ';
      } else {
        label = 'BEKLE';
      }
      disabled = true;
    } else {
      label = 'YÜKLENİYOR';
      disabled = true;
    }

    return {
      tone,
      amount,
      auto,
      locked: active,
      label,
      sub,
      disabled,
      onAmount: (direction) => game.changeBet(slot, direction),
      onAuto: (direction) => game.changeAuto(slot, direction),
      onAction: () => (active ? game.cashout(slot) : game.placeBet(slot)),
    };
  };

  return (
    <div className="relative flex items-stretch gap-2 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1">
      <RocketBetPanel {...build(1, 'blue')} />
      <RocketBetPanel {...build(2, 'gold')} />
      <div className="rk-hub" aria-hidden="true">
        <Film className="h-3.5 w-3.5 text-[#ffb800]" />
      </div>
    </div>
  );
}