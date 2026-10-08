import React, { useState } from 'react';
import { Rocket } from 'lucide-react';
import { format, formatMult } from './rocketConfig';
import RocketBetPanel from './RocketBetPanel';
import RocketAutoDialog from './RocketAutoDialog';

/** Alt panel: iki bağımsız bahis alanı ve aralarında film makarası göbeği. */
export default function RocketBetDock({ game }) {
  const phase = game.phase;
  const [autoEdit, setAutoEdit] = useState(null);

  const build = (slot, tone) => {
    const rows = (game.bets || []).filter(
      (b) => b.user_id === game.me && (b.slot === 2 ? 2 : 1) === slot
    );
    const row =
      rows.find((b) => b.status === 'active') ||
      rows.find((b) => b.status === 'cashed') ||
      rows.find((b) => b.status === 'lost');
    const active = row?.status === 'active';
    // Oynanmış bahis varsa panel kendi yatırdığı coini gösterir; seçilen miktar
    // yalnızca bahis yokken görünür.
    const amount = row ? row.bet ?? 0 : slot === 2 ? game.bet2 : game.bet1;
    const auto = slot === 2 ? game.auto2 : game.auto1;
    const pending = !!game.busy?.[slot];
    // Dokunulduğu an sabitlenen çarpan: buton beklerken kazanç donar.
    const shown = game.pendingMult?.[slot] || game.displayMult;

    let label = 'BAHİS YAP';
    let badge = '';
    let sub = '';
    let disabled = false;

    if (phase === 'betting') {
      label = active ? 'İPTAL' : 'BAHİS YAP';
      sub = active ? 'iade' : '';
    } else if (phase === 'running') {
      if (active) {
        label = pending ? 'ÇEKİLİYOR' : 'ÇEK';
        sub = `${format(amount)} · ${formatMult(shown)} · ${format(amount * shown)}`;
      } else if (row?.status === 'cashed') {
        label = 'ÇEKİLDİ';
        badge = formatMult(row.cashout_at);
        sub = `${format(row.bet ?? 0)} · +${format(row.payout)}`;
      } else {
        label = 'UÇUŞTA';
        disabled = true;
      }
    } else if (phase === 'crashed') {
      if (row?.status === 'cashed') {
        label = 'ÇEKİLDİ';
        badge = formatMult(row.cashout_at);
        sub = `${format(row.bet ?? 0)} · +${format(row.payout)}`;
      } else if (row?.status === 'lost' || active) {
        label = 'KAYBETTİ';
        sub = format(row?.bet ?? amount);
      } else {
        label = 'BEKLE';
      }
      disabled = true;
    } else {
      label = 'YÜKLENİYOR';
      disabled = true;
    }

    // İsteği süren butona tekrar basmak yeni istek açmaz.
    if (pending) disabled = true;

    return {
      tone,
      amount,
      auto,
      locked: active,
      label,
      badge,
      sub,
      disabled,
      onAmount: (direction) => game.changeBet(slot, direction),
      onAuto: (direction) => game.changeAuto(slot, direction),
      onAutoEdit: () => setAutoEdit(slot),
      onAction: () => (active ? game.cashout(slot) : game.placeBet(slot)),
    };
  };

  return (
    <>
      <div className="relative flex items-stretch gap-2 border-t border-white/10 bg-[#05070f]/75 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        <RocketBetPanel {...build(1, 'blue')} />
        <RocketBetPanel {...build(2, 'gold')} />
        {/* Podların arasındaki göbek: fırlatma arması. */}
        <div className="rk-hub" aria-hidden="true">
          <Rocket className="h-4 w-4" />
        </div>
      </div>

      <RocketAutoDialog
        open={autoEdit !== null}
        value={autoEdit === 2 ? game.auto2 : game.auto1}
        onSave={(value) => game.setAutoTarget(autoEdit, value)}
        onClose={() => setAutoEdit(null)}
      />
    </>
  );
}