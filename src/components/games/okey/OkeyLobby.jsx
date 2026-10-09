import { useState } from 'react';
import { Coins, Loader2, Play, ShoppingBag } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { OKEY_CLASSIC_COVER, OKEY_COVER } from './okeyAssets';
import { OKEY_BETS, formatBet } from './okeyConfig';

/** Lobi: bahis seç, hızlı oyna ya da açık bir masaya otur. */
export default function OkeyLobby({ variant = 'okey101', coins, lobby, loading, busy, error, onQuick, onJoin, onStore }) {
  const [bet, setBet] = useState(OKEY_BETS[0]);
  const myTable = lobby.my_table_id;
  const classic = variant === 'okey';

  return (
    <div className="okey-lobby">
      <div className="okey-lobby-hero">
        <span className="okey-lobby-logo">
          <Image
            src={classic ? OKEY_CLASSIC_COVER : OKEY_COVER}
            alt=""
            className="h-full w-full"
            fittingType="fill"
            quality={85}
          />
        </span>
        <span>
          <p className="okey-lobby-title">{classic ? 'OKEY' : '101 OKEY'}</p>
          <p className="okey-lobby-text">
            {classic
              ? 'Dört kişilik bahisli klasik masa. 14 taşla oynanır: ortadan taş çek, elinden taş at; bir taş çıkarınca kalan taşların tümü seri/per/çift olursa BİTİR ve üç oyuncunun bahsini birden al.'
              : 'Dört kişilik bahisli masa. Ortadan taş çek, elinden taş at; kalan taşların seri/per/çift dizilirse BİTİR ve üç oyuncunun bahsini birden al.'}
          </p>
        </span>
      </div>

      {error ? <p className="okey-toast static translate-x-0">{error}</p> : null}

      <div className="flex items-center gap-2">
        <span className="okey-chip">
          <Coins className="h-3.5 w-3.5 text-[#ffd76a]" />
          <span className="okey-chip-label">COIN</span>
          <span className="okey-chip-value">{formatBet(coins)}</span>
        </span>
        <button type="button" className="okey-store ml-auto" onClick={onStore}>
          <ShoppingBag className="h-3.5 w-3.5" /> SATIN AL
        </button>
      </div>

      <p className="okey-section-title">BAHİS SEÇ</p>
      <div className="okey-bet-row">
        {OKEY_BETS.map((value) => (
          <button
            key={value}
            type="button"
            className="okey-bet"
            data-on={bet === value ? '1' : '0'}
            disabled={coins < value}
            onClick={() => setBet(value)}
          >
            {formatBet(value)} coin
          </button>
        ))}
      </div>

      <button
        type="button"
        className="okey-btn okey-btn-gold justify-center py-3 text-sm"
        disabled={busy || coins < bet}
        onClick={() => onQuick(bet)}
      >
        <Play className="h-4 w-4" /> HIZLI OYNA
      </button>
      <p className="okey-lobby-text">
        Rastgele, boş yeri olan bir masaya oturursun; uygun masa yoksa senin için yeni masa açılır. Masa dört kişiye
        dolduğu anda bahisler cüzdandan düşülür ve oyun başlar.
      </p>

      <p className="okey-section-title">AÇIK MASALAR</p>
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-[#ffd76a]" />
        </div>
      ) : lobby.tables.length === 0 ? (
        <p className="okey-lobby-text">Şu an açık masa yok — hızlı oynayarak ilk masayı sen aç.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {lobby.tables.map((table) => {
            const seats = table.seats || [];
            const filled = seats.filter((seat) => seat.user_id).length;
            const waiting = table.status === 'waiting';
            return (
              <div key={table.id} className="okey-table-row">
                <span className="okey-dots">
                  {[0, 1, 2, 3].map((index) => (
                    <span key={index} className="okey-dot" data-on={seats[index]?.user_id ? '1' : '0'} />
                  ))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="okey-table-code">MASA {table.code}</span>
                  <span className="okey-table-meta">
                    {' '}
                    · {formatBet(table.base_bet)} coin · {filled}/4 {waiting ? 'bekliyor' : 'oyunda'}
                    {table.pot ? ` · pot ${formatBet(table.pot)}` : ''}
                  </span>
                </span>
                {table.id === myTable ? (
                  <span className="okey-btn okey-btn-green">MASAYA DÖN</span>
                ) : (
                  <button
                    type="button"
                    className="okey-btn"
                    disabled={busy || !waiting || filled >= 4 || coins < table.base_bet}
                    onClick={() => onJoin(table.id)}
                  >
                    KATIL
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}