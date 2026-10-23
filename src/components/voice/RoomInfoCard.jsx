import { useMemo } from 'react';
import { isHiddenName } from '@/lib/hiddenUser';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import DesignSprite from '@/components/voice/DesignSprite';
import { formatScore } from '@/components/voice/scoreTier';

const hit = 'absolute rounded-full active:scale-95 transition-transform';

/** Üst bar: tasarımdaki profil kartı, kişi sayısı, ayarlar, çıkış ve hediye kutusu. */
export default function RoomInfoCard({ room, onOpen, viewerCount = 0, onOpenViewers, onOpenMenu, onExit, giftScore = 0, onOpenGiftBoard }) {
  const ownerId = room?.owner_id;
  const ids = useMemo(() => ownerId ? [ownerId] : [], [ownerId]);
  const profile = useMessageProfiles(ids)[ownerId] || {};
  const ownerHidden = isHiddenName(room?.owner_name);
  const memberId = !ownerHidden && profile.member_id && profile.member_id !== '-' ? String(profile.member_id) : '';
  const roomName = room?.name || 'Oda';

  return (
    <DesignSprite x={0} y={22} w={494} h={118} className="w-full">
      <button type="button" onClick={onOpen} aria-label="Oda profilini aç" className="absolute left-[2%] top-0 h-[73%] w-[56%]" />
      <div className="pointer-events-none absolute left-[20.5%] top-[19%] flex h-[40%] w-[34%] flex-col justify-center overflow-hidden rounded-md bg-[#0a0c1c] px-1.5">
        <span className="truncate text-[clamp(11px,3.4vw,15px)] font-black leading-tight text-white">{roomName} <span className="text-[#f5c542]">♛</span></span>
        {memberId && (
          <span className="flex items-center gap-1 truncate text-[clamp(9px,2.6vw,12px)] leading-tight text-white/80">
            ID:{memberId}<span className="h-1.5 w-1.5 rounded-full bg-green-500" />
          </span>
        )}
      </div>

      <button type="button" onClick={onOpenViewers} aria-label={`Odada ${viewerCount} kişi`} className={`${hit} left-[60.7%] top-[13%] h-[53%] w-[13.2%]`}>
        <span className="absolute left-[64%] top-[38%] flex h-[34%] min-w-[24%] items-center justify-center rounded bg-[#0d0f24] text-[clamp(10px,3vw,14px)] font-bold tabular-nums text-white">{viewerCount}</span>
      </button>
      <button type="button" onClick={onOpenMenu} aria-label="Oda ayarları" className={`${hit} left-[74.9%] top-[13%] h-[53%] w-[11.3%]`} />
      <button type="button" onClick={onExit} aria-label="Odadan çık" className={`${hit} left-[87.4%] top-[13%] h-[53%] w-[11.7%]`} />

      <button type="button" onClick={onOpenGiftBoard} aria-label={`Hediye kutusu: ${formatScore(giftScore)}`} className="absolute left-[2.5%] top-[70%] h-[28%] w-[19%]">
        <span className="absolute left-[54%] top-[22%] flex h-[62%] min-w-[38%] items-center justify-center rounded-sm bg-[#1f5fd6] px-0.5 text-[clamp(9px,2.8vw,13px)] font-black tabular-nums text-white">
          {formatScore(Math.max(0, Math.round(Number(giftScore) || 0)))}
        </span>
      </button>
    </DesignSprite>
  );
}