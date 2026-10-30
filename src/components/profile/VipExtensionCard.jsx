import { EyeOff, ImagePlay, MapPinOff } from 'lucide-react';
import SettingSwitch from '@/components/profile/SettingSwitch';

const DETAILS = {
  'stealth-visit': [EyeOff, 'Açıkken yeni profil ziyaretlerin karşı tarafın listesine kaydedilmez.'],
  avatar: [ImagePlay, 'Profil fotoğrafını profilde ve sesli oda koltuğunda canlı hareket efektiyle göster.'],
  'room-privacy': [MapPinOff, 'Bulunduğun oda ve seni takip ederek katılma bağlantısı arkadaş listesinde görünmez. Odadaki üyeler seni görmeye devam eder.'],
};

/** Eklenti satırı: solda simge ve açıklama, sağda yeşil anahtar. */
export default function VipExtensionCard({ feature, busy, onToggle }) {
  const [Icon, description] = DETAILS[feature.key] || [ImagePlay, ''];
  return (
    <div className="rounded-2xl border border-white/12 bg-white/[0.04] px-3.5 py-3">
      <div className="flex items-center gap-3">
        <Icon className={`h-[18px] w-[18px] shrink-0 ${feature.enabled ? 'text-green-400' : 'text-white/60'}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-white">{feature.label}</p>
          <p className="text-[11px] font-semibold text-white/45">
            VIP {feature.minLevel}+ · {feature.available ? (feature.enabled ? 'Açık' : 'Kapalı') : 'Üyelik gerekli'}
          </p>
        </div>
        <SettingSwitch
          checked={!!feature.enabled}
          disabled={!feature.available || !!busy}
          onChange={() => onToggle(feature.key, !feature.enabled)}
          label={feature.label}
        />
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-white/40">{description}</p>
      {busy === feature.key && <p role="status" className="mt-1 text-[11px] font-semibold text-green-400">Kaydediliyor...</p>}
    </div>
  );
}