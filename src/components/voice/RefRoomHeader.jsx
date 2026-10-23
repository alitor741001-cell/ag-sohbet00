import { useMemo } from 'react';
import RefSprite from '@/components/voice/refSprite';
import useMessageProfiles from '@/hooks/useMessageProfiles';
import { isHiddenName } from '@/lib/hiddenUser';

/** Tasarım görselindeki üst bölüm: oda kartı, kişi/ayar/çıkış düğmeleri, hediye ve puan rozetleri. */
export default function RefRoomHeader({ room, onOpen, viewerCount = 0, onOpenViewers, onOpenMenu, onExit, score = 0, onOpenScore }) {
  const ownerId = room?.owner_id;
  const ids = useMemo(() => (ownerId ? [ownerId] : []), [ownerId]);
  const profile = useMessageProfiles(ids)[ownerId] || {};
  const hidden = isHiddenName(room?.owner_name);
  const memberId = !hidden && profile.member_id && profile.member_id !== '-' ? String(profile.member_id) : '';

  return (
    <div className="w-full">
      <div className="flex w-full items-start">
        <RefSprite x={9} y={9} w={503} h={185} className="w-[57.7%] shrink-0">
          <button type="button" onClick={onOpen} aria-label="Oda profilini aç" className="absolute inset-0" />
          <div className="pointer-events-none absolute left-[35%] top-[28%] w-[52%] rounded bg-black px-1">
            <p className="truncate text-[clamp(11px,3.4vw,15px)] font-bold leading-tight text-[#f4d77a]">{room?.name || 'Oda'}</p>
            {memberId && <p className="truncate text-[clamp(9px,2.6vw,12px)] leading-tight text-white/80">ID:{memberId}</p>}
          </div>
        </RefSprite>
        <div className="flex flex-1 items-start pt-[2%]">
          <RefSprite x={526} y={70} w={113} h={110} className="w-1/3">
            <button type="button" onClick={onOpenViewers} aria-label="Kişiler" className="absolute inset-0" />
            <span className="pointer-events-none absolute right-[16%] top-[34%] rounded bg-[#120a2a] px-0.5 text-[clamp(10px,3vw,14px)] font-bold text-white">{viewerCount}</span>
          </RefSprite>
          <RefSprite x={644} y={70} w={111} h={110} className="w-1/3">
            <button type="button" onClick={onOpenMenu} aria-label="Ayarlar" className="absolute inset-0" />
          </RefSprite>
          <RefSprite x={759} y={70} w={113} h={110} className="w-1/3">
            <button type="button" onClick={onExit} aria-label="Çıkış" className="absolute inset-0" />
          </RefSprite>
        </div>
      </div>
      <div className="-mt-[1%] flex w-[23%] items-center">
        <RefSprite x={14} y={190} w={78} h={66} className="w-[42%]">
          <button type="button" onClick={onOpenScore} aria-label="Hediye tablosu" className="absolute inset-0" />
        </RefSprite>
        <RefSprite x={92} y={190} w={106} h={66} className="w-[58%]">
          <button type="button" onClick={onOpenScore} aria-label="Puan" className="absolute inset-0" />
          <span className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded bg-[#1d5fd6] px-1 text-[clamp(10px,3vw,13px)] font-bold text-white">{score}</span>
        </RefSprite>
      </div>
    </div>
  );
}