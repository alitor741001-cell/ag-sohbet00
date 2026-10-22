import { Eye, EyeOff, ImagePlay, MapPinOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
const DETAILS = {
  visitors: [Eye, 'Profiline bakan üyeleri ve ziyaret zamanlarını görüntüle.'],
  'stealth-visit': [EyeOff, 'Açıkken yeni profil ziyaretlerin karşı tarafın listesine kaydedilmez.'],
  avatar: [ImagePlay, 'Profil fotoğrafını profilde ve sesli oda koltuğunda canlı hareket efektiyle göster.'],
  'room-privacy': [MapPinOff, 'Bulunduğun oda ve seni takip ederek katılma bağlantısı arkadaş listesinde görünmez. Odadaki üyeler seni görmeye devam eder.'],
};
export default function VipExtensionCard({ feature, busy, onToggle, onVisitors }) {
  const [Icon, description] = DETAILS[feature.key];
  return <div className="rounded-xl border border-border bg-background/40 p-3">
    <div className="flex items-center gap-3">
      <Icon className="h-5 w-5 shrink-0 text-primary" />
      <div className="min-w-0 flex-1"><p className="text-sm font-bold">{feature.label}</p><p className="text-[10px] text-muted-foreground">VIP {feature.minLevel}+ · {feature.available ? feature.key === 'visitors' ? 'Kullanılabilir' : feature.enabled ? 'Açık' : 'Kapalı' : 'Üyelik gerekli'}</p></div>
      {feature.key === 'visitors' ? <button type="button" disabled={!feature.available || !!busy} onClick={onVisitors} className="min-h-11 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground disabled:opacity-40">Görüntüle</button> : <Switch aria-label={feature.label} checked={feature.enabled} disabled={!feature.available || !!busy} onCheckedChange={value => onToggle(feature.key, value)} />}
    </div>
    <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{description}</p>
    {busy === feature.key && <p role="status" className="mt-1 text-xs text-primary">Kaydediliyor...</p>}
  </div>;
}