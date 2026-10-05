import { ArrowLeftRight, Building2, Gem, Handshake, MailOpen, Mic2, Sparkles, Wallet } from 'lucide-react';

/**
 * Ajans bölümleri: her rol için ayrı sayfa bağlantıları.
 * Hem ajans merkezindeki menüde hem alt sayfaların üst gezinmesinde kullanılır.
 */
const AGENCY_SECTIONS = {
  owner: [
    { key: 'kazanc', label: 'Kazançlarım', path: '/ajans/kazanc', icon: Wallet },
    { key: 'yayincilar', label: 'Yayıncı Paneli', path: '/ajans/yayincilar', icon: Mic2 },
    { key: 'asistanlar', label: 'Asistanlar', path: '/ajans/asistanlar', icon: Handshake },
    { key: 'kota', label: 'Kota Tablosu', path: '/ajans/kota-tablosu', icon: Gem },
    { key: 'davetler', label: 'Davetler', path: '/ajans/davetler', icon: MailOpen },
    { key: 'transferler', label: 'Transferler', path: '/ajans/transferler', icon: ArrowLeftRight },
    { key: 'ajansim', label: 'Ajansım', path: '/ajans/ajansim', icon: Building2 },
  ],
  assistant: [
    { key: 'yayincilar', label: 'Yayıncılarım', path: '/ajans/yayincilar', icon: Mic2 },
    { key: 'kazanc', label: 'Kazançlarım', path: '/ajans/kazanc', icon: Wallet },
    { key: 'kota', label: 'Kota Tablosu', path: '/ajans/kota-tablosu', icon: Gem },
    { key: 'davetler', label: 'Davetler', path: '/ajans/davetler', icon: MailOpen },
    { key: 'ajansim', label: 'Ajansım', path: '/ajans/ajansim', icon: Building2 },
  ],
  broadcaster: [
    { key: 'kota', label: 'Kota Tablosu', path: '/ajans/kota-tablosu', icon: Gem },
    { key: 'kazanc', label: 'Kazançlarım', path: '/ajans/kazanc', icon: Wallet },
    { key: 'ajansim', label: 'Ajansım', path: '/ajans/ajansim', icon: Building2 },
    { key: 'davetler', label: 'Davetler', path: '/ajans/davetler', icon: MailOpen },
    { key: 'transferler', label: 'Ajans Değişikliği', path: '/ajans/transferler', icon: ArrowLeftRight },
  ],
  pending: [
    { key: 'ajansim', label: 'Başvuru Bilgileri', path: '/ajans/ajansim', icon: Sparkles },
    { key: 'davetler', label: 'Davetler', path: '/ajans/davetler', icon: MailOpen },
  ],
};

export const agencySections = (role) => AGENCY_SECTIONS[role] || [];

/** Menüdeki sayaç rozeti: yalnızca davetler bölümünde gösterilir. */
export const agencySectionBadge = (key, counts = {}) => (key === 'davetler' ? counts.davetler || 0 : 0);