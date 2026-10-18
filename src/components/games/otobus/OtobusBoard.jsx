import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import useBackDismiss from '@/hooks/useBackDismiss';
import { format, formatMult } from '../rocket/rocketConfig';

const TABS = [
  ['all', 'Tüm Bahisler'],
  ['mine', 'Bahislerim'],
  ['general', 'Genel Sonuçlar'],
];

const initials = (name) => (name || '?').trim().slice(0, 1).toUpperCase();

// Satır sonucu: kazançta çekilen çarpan, kayıpta yatırılan jeton yazılır.
function resultOf(bet) {
  if (bet.status === 'cashed') return { text: `${formatMult(bet.cashout_at)} · +${format(bet.payout)}`, tone: 'ob-win' };
  if (bet.status === 'lost') return { text: `-${format(bet.bet)}`, tone: 'ob-lose' };
  return { text: 'yolda', tone: 'ob-live' };
}

/** Alt panel: turun tüm bahisleri, kendi bahislerin ve geçmiş tur sonuçları. */
export default function OtobusBoard({ open, tab, onTab, game, onClose }) {
  useBackDismiss(open, onClose);

  // Kendi dökümü yalnızca o sekme açıldığında sunucudan istenir.
  useEffect(() => {
    if (open && tab === 'mine') game.loadLedger();
  }, [open, tab]);

  if (!open) return null;

  const myBets = (game.bets || []).filter((bet) => bet.user_id === game.me);
  const entries = game.ledger?.entries || [];
  const totalBet = game.ledger?.total_bet ?? 0;
  const totalWon = game.ledger?.total_won ?? 0;
  const net = totalWon - totalBet;

  return (
    <div className="ob-sheet">
      <button type="button" aria-label="Paneli kapat" onClick={onClose} className="ob-sheet-veil" />
      <div className="ob-sheet-body">
        <span aria-hidden="true" className="ob-sheet-grip" />

        <div className="ob-sheet-tabs">
          {TABS.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => onTab(id)}
              className={`ob-tabbtn ${tab === id ? 'ob-tabbtn-on' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === 'all' && (
          <div className="ob-sheet-list">
            {(game.bets || []).length === 0 && <p className="ob-empty">Bu turda henüz bahis yok.</p>}
            {(game.bets || []).map((bet) => {
              const result = resultOf(bet);
              return (
                <div key={bet.id || `${bet.user_id}-${bet.slot}`} className="ob-row">
                  <span className="ob-avatar">{initials(bet.user_name)}</span>
                  <span className="ob-row-name">{bet.user_name || 'Kullanıcı'}</span>
                  {bet.slot === 2 ? <span className="ob-row-tag">2</span> : null}
                  <span className="ob-row-sub">{format(bet.bet)}</span>
                  <span className={`ob-row-value ${result.tone}`}>{result.text}</span>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'mine' && (
          <div className="ob-sheet-list">
            <div className="ob-summary">
              <div>
                <p>YATIRILAN</p>
                <p>{format(totalBet)}</p>
              </div>
              <div>
                <p>KAZANÇ</p>
                <p className="ob-win">{format(totalWon)}</p>
              </div>
              <div>
                <p>NET</p>
                <p className={net >= 0 ? 'ob-win' : 'ob-lose'}>
                  {net >= 0 ? '+' : '-'}
                  {format(Math.abs(net))}
                </p>
              </div>
            </div>

            {myBets.length === 0 && entries.length === 0 && <p className="ob-empty">Bu turda bahsin yok.</p>}

            {myBets.map((bet) => {
              const result = resultOf(bet);
              return (
                <div key={`now-${bet.id || bet.slot}`} className="ob-row">
                  <span className="ob-avatar">{initials(bet.user_name)}</span>
                  <span className="ob-row-name">Bu tur · {bet.slot === 2 ? '2. alan' : '1. alan'}</span>
                  <span className="ob-row-sub">{format(bet.bet)}</span>
                  <span className={`ob-row-value ${result.tone}`}>{result.text}</span>
                </div>
              );
            })}

            {entries.map((entry) => {
              const won = entry.status === 'cashed';
              return (
                <div key={`${entry.round_no}-${entry.slot}`} className="ob-row">
                  <span className="ob-avatar">#{entry.round_no}</span>
                  <span className="ob-row-name">Tur {entry.round_no}</span>
                  <span className="ob-row-sub">{format(entry.bet)}</span>
                  <span className={`ob-row-value ${won ? 'ob-win' : 'ob-lose'}`}>
                    {won
                      ? `${formatMult(entry.cashout_at)} · +${format(entry.payout)}`
                      : `-${format(entry.bet)}`}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'general' && (
          <div className="ob-sheet-list">
            {(game.history || []).length === 0 && <p className="ob-empty">Henüz bitmiş tur yok.</p>}
            {(game.history || []).map((row) => (
              <div key={row.round_no} className="ob-row">
                <span className="ob-avatar">#{row.round_no}</span>
                <span className="ob-row-name">Tur {row.round_no}</span>
                <span className="ob-row-value ob-live ml-auto">{formatMult(row.crash_at)}</span>
              </div>
            ))}
          </div>
        )}

        <button type="button" onClick={onClose} className="ob-sheet-close">
          <X className="h-4 w-4" /> Kapat
        </button>
      </div>
    </div>
  );
}