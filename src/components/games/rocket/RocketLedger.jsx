import React from 'react';
import { Coins, TrendingDown, TrendingUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { format, formatMult } from './rocketConfig';

// Tur satırının sonucu: kazançta çekilen çarpan, kayıpta çakılma noktası yazılır.
function resultText(entry) {
  if (entry.status === 'cashed') return `${formatMult(entry.cashout_at)} · +${format(entry.payout)}`;
  if (entry.status === 'lost') {
    return entry.crash_at ? `${formatMult(entry.crash_at)} · -${format(entry.bet)}` : `-${format(entry.bet)}`;
  }
  return 'uçuşta';
}

/** Oyun defteri: yatırılan toplam, kazanç toplamı ve tur tur kazanç/kayıp dökümü. */
export default function RocketLedger({ open, onClose, data }) {
  const entries = data?.entries || [];
  const totalBet = data?.total_bet ?? 0;
  const totalWon = data?.total_won ?? 0;
  const net = totalWon - totalBet;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-[22rem] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">Oyun defteri</DialogTitle>
          <DialogDescription className="text-xs">
            Yatırdığın ve kazandığın coinler tur tur burada.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-1.5 text-center">
          <div className="rounded-xl border p-2">
            <p className="text-[10px] font-bold text-muted-foreground">YATIRILAN</p>
            <p className="text-sm font-black">{format(totalBet)}</p>
          </div>
          <div className="rounded-xl border p-2">
            <p className="text-[10px] font-bold text-muted-foreground">KAZANÇ</p>
            <p className="text-sm font-black text-emerald-500">{format(totalWon)}</p>
          </div>
          <div className="rounded-xl border p-2">
            <p className="text-[10px] font-bold text-muted-foreground">NET</p>
            <p className={`text-sm font-black ${net >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
              {net >= 0 ? '+' : '-'}
              {format(Math.abs(net))}
            </p>
          </div>
        </div>

        <div className="max-h-[38vh] space-y-1 overflow-y-auto">
          {entries.length === 0 && (
            <p className="py-4 text-center text-xs text-muted-foreground">Henüz oynanmış tur yok.</p>
          )}
          {entries.map((entry) => {
            const won = entry.status === 'cashed';
            return (
              <div
                key={`${entry.round_no}-${entry.slot}`}
                className="flex items-center gap-2 rounded-xl border px-2 py-1.5"
              >
                {won ? (
                  <TrendingUp className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5 shrink-0 text-red-500" />
                )}
                <span className="text-[11px] font-bold">Tur {entry.round_no}</span>
                <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                  <Coins className="h-3 w-3" />
                  {format(entry.bet)}
                </span>
                <span className={`ml-auto text-[11px] font-bold ${won ? 'text-emerald-500' : 'text-red-500'}`}>
                  {resultText(entry)}
                </span>
              </div>
            );
          })}
        </div>

        <Button type="button" size="sm" className="w-full" onClick={onClose}>
          Kapat
        </Button>
      </DialogContent>
    </Dialog>
  );
}