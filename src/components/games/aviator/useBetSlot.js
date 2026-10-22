import { format, formatMult } from '../rocket/rocketConfig';

/** Bir bahis alanının durumu: buton yazısı, alt satır, kilit ve aksiyonlar. */
export default function betSlot(game, slot) {
  const phase = game.phase;
  const rows = (game.bets || []).filter((b) => b.user_id === game.me && (b.slot === 2 ? 2 : 1) === slot);
  const row = rows.find((b) => b.status === 'active') || rows.find((b) => b.status === 'cashed') || rows.find((b) => b.status === 'lost');
  const active = row?.status === 'active';
  const amount = row ? row.bet ?? 0 : slot === 2 ? game.bet2 : game.bet1;
  const pending = !!game.busy?.[slot];
  const shown = game.pendingMult?.[slot] || game.displayMult;

  let label = 'BAHİS';
  let sub = '';
  let tone = 'bet';
  let disabled = false;

  if (phase === 'betting') {
    if (active) { label = 'İPTAL'; sub = 'iade'; tone = 'cancel'; }
  } else if (phase === 'running') {
    if (active) { label = pending ? 'ÇEKİLİYOR' : 'ÇEK'; sub = format(amount * shown); tone = 'cash'; }
    else if (row?.status === 'cashed') { label = 'ÇEKİLDİ'; sub = `${formatMult(row.cashout_at)} · +${format(row.payout)}`; tone = 'done'; disabled = true; }
    else { label = 'UÇUŞTA'; sub = 'sonraki tur'; disabled = true; }
  } else if (phase === 'crashed') {
    if (row?.status === 'cashed') { label = 'ÇEKİLDİ'; sub = `+${format(row.payout)}`; tone = 'done'; }
    else if (row) { label = 'KAYBETTİ'; sub = format(row.bet); tone = 'cancel'; }
    else label = 'BEKLE';
    disabled = true;
  } else { label = 'YÜKLENİYOR'; disabled = true; }
  if (pending) disabled = true;

  return {
    amount,
    auto: slot === 2 ? game.auto2 : game.auto1,
    locked: active,
    label, sub, tone, disabled,
    onAmount: (d) => game.changeBet(slot, d),
    onSet: (v) => game.setBetAmount(slot, v),
    onAction: () => (active ? game.cashout(slot) : game.placeBet(slot)),
  };
}