import { Image } from '@/components/ui/image';
import { vipStyle } from '@/lib/userLevels';

/**
 * Kompakt profil kartının ortasındaki büyük fotoğraf: iki koltuk boyunda,
 * katmanlı buz kristali çerçeve, yanlarda kristal uçlar ve tabanında VIP etiketi.
 */
export default function CompactCrystalAvatar({ avatar, name, vipLevel = 0 }) {
  const vip = vipLevel > 0 ? vipStyle(vipLevel) : null;

  return (
    <div className="relative mx-auto h-[128px] w-[128px] shrink-0">
      <span aria-hidden className="pointer-events-none absolute -inset-3 rounded-full" style={{ boxShadow: '0 0 40px -8px rgba(120,196,246,0.95)' }} />
      <span aria-hidden className="pointer-events-none absolute -left-[11px] top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 rounded-[2px] border border-[#cfeaff]/70 bg-[#1b3f63]" />
      <span aria-hidden className="pointer-events-none absolute -right-[11px] top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 rounded-[2px] border border-[#cfeaff]/70 bg-[#1b3f63]" />
      <span aria-hidden className="pointer-events-none absolute left-1/2 -top-[9px] h-3 w-3 -translate-x-1/2 rotate-45 rounded-[2px] border border-[#eaf9ff]/80 bg-[#2a5c86]" />
      <span aria-hidden className="pointer-events-none absolute left-1/2 -bottom-[9px] h-2.5 w-2.5 -translate-x-1/2 rotate-45 rounded-[2px] border border-[#eaf9ff]/70 bg-[#2a5c86]" />

      <div
        className="relative h-full w-full rounded-full p-[3px]"
        style={{
          background: 'linear-gradient(158deg, #f2fbff 0%, #a8d8f5 26%, #3576b8 58%, #d9f2ff 82%, #6aa9e0 100%)',
          boxShadow: '0 0 26px -4px rgba(120,196,246,0.9)',
        }}
      >
        <div className="h-full w-full rounded-full p-[2px]" style={{ background: 'linear-gradient(180deg, #0b1f33, #050c16)' }}>
          <div className="h-full w-full overflow-hidden rounded-full" style={{ border: '1.5px solid rgba(217,242,255,0.75)' }}>
            {avatar
              ? <Image src={avatar} alt={name || 'Profil'} fittingType="fill" className="h-full w-full" referrerPolicy="no-referrer" />
              : <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-accent text-4xl font-bold text-white">{(name || '?')[0]}</span>}
          </div>
        </div>
      </div>

      {vip && (
        <span
          className="absolute -bottom-1.5 left-1/2 z-[3] -translate-x-1/2 whitespace-nowrap rounded-full border-2 px-2.5 py-[1px] text-[9px] font-black tracking-wider"
          style={{ borderColor: vip.border, background: vip.background, color: vip.color }}
        >
          VIP{vipLevel}
        </span>
      )}
    </div>
  );
}