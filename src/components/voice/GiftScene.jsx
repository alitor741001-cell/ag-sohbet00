import { formatK, tierForK, toneColor } from '@/lib/giftTone';
import ProfileFrame from '@/components/ProfileFrame';
import VoiceSeatScore from '@/components/voice/VoiceSeatScore';
import Gift3DStage from '@/components/voice/three/Gift3DStage';
import GiftClipStage from '@/components/voice/GiftClipStage';
import GiftVideoStage from '@/components/voice/GiftVideoStage';
import { giftClipFor, giftVideoFor } from '@/lib/giftClips';

/**
 * Hediye gönderildiğinde odadaki herkes için gerçek görüntülü sinematik klip oynar.
 * Klibi olmayan hediyeler kendi 3D modeliyle gösterilir.
 * Altta hediye adı ve gönderen → alan bilgisi yazar.
 */
export default function GiftScene({ alert, tiers = [], gifts = [] }) {
  if (!alert) return null;

  const record = gifts.find((item) => item.id === alert.giftId) || null;
  const color = toneColor(tierForK(tiers, alert.kValue || 0));
  const video = giftVideoFor(record);
  const clip = giftClipFor({ name: alert.giftName, model_kind: record?.model_kind || 'auto' });
  const repeat = Number(alert.repeat) || 1;
  const people = Number(alert.count) || 1;
  const bulk = people > 1;
  const meta = bulk
    ? `${people} kişiye${alert.totalK ? ` · ${formatK(alert.totalK)}` : ''}`
    : `${alert.senderName ? `${alert.senderName} → ` : ''}${alert.recipientName || 'Oda'}`;

  return (
    <div className="pointer-events-none absolute inset-0 z-[200] overflow-hidden">
      {video ? (
        <GiftVideoStage src={video} poster={clip?.[0]} color={color} />
      ) : clip ? (
        <GiftClipStage frames={clip} color={color} />
      ) : (
        <>
          <div
            className="absolute inset-0"
            style={{ background: `radial-gradient(circle at 50% 46%, ${color}38, rgba(0,0,0,0.62) 58%, rgba(0,0,0,0.85))` }}
          />
          <Gift3DStage
            gift={{
              name: alert.giftName,
              model_url: record?.model_url || '',
              model_kind: record?.model_kind || 'auto',
            }}
            color={color}
            className="absolute inset-0"
          />
        </>
      )}

      <div className="absolute inset-x-0 bottom-[16%] flex flex-col items-center gap-1.5">
        <div
          className="flex items-center gap-2 rounded-2xl border bg-black/70 px-3 py-1.5 backdrop-blur-md"
          style={{ borderColor: color, boxShadow: `0 0 20px ${color}88` }}
        >
          <p className="text-sm font-black" style={{ color }}>{alert.giftName || 'Hediye'}</p>
          {repeat > 1 && (
            <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[11px] font-black text-white">×{repeat}</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-black/60 py-1 pl-1.5 pr-2.5">
          {!bulk && (
            <ProfileFrame
              size="2xs"
              avatar={alert.recipientAvatar}
              frame={alert.recipientFrame}
              frameScale={alert.recipientFrameScale}
              name={alert.recipientName || 'Oda'}
            />
          )}
          <p className="max-w-[70vw] truncate text-[11px] font-semibold text-white/85">{meta}</p>
          {!bulk && alert.value ? <VoiceSeatScore value={alert.value} /> : null}
        </div>
      </div>
    </div>
  );
}