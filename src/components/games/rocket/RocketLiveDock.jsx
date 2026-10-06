import React from 'react';
import { format, formatMult } from './rocketConfig';
import RocketLiveModule from './RocketLiveModule';

// İki modülün tasarımdaki merkezleri.
const CENTER = { 1: 211, 2: 617 };

/** Alt panel: iki bağımsız bahis alanı canlı değerlerle tasarımın üzerine oturur. */
export default function RocketLiveDock({ game, onAutoEdit }) {
  const phase = game.phase;

  const build = (slot) => {
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
      amount,
      auto,
      locked: active,
      label,
      badge,
      sub,
      disabled,
      onAmount: (direction) => game.changeBet(slot, direction),
      onAuto: (direction) => game.changeAuto(slot, direction),
      onAutoEdit: () => onAutoEdit(slot),
      onAction: () => (active ? game.cashout(slot) : game.placeBet(slot)),
    };
  };

  return (
    <>
      <RocketLiveModule center={CENTER[1]} {...build(1)} />
      <RocketLiveModule center={CENTER[2]} {...build(2)} />
    </>
  );
}