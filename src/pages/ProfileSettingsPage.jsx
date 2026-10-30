import { useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut, User, Wand2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import SettingsPageHeader from '@/components/profile/SettingsPageHeader';
import DeleteAccountSection from '@/components/profile/DeleteAccountSection';

const ROW = 'flex w-full items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.04] px-3.5 py-3 text-left active:scale-[0.99]';
const ICON_BOX = 'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]';

/** Ayarlar menüsü: kişisel bilgiler ve eklentiler kendi sayfalarında açılır. */
export default function ProfileSettingsPage() {
  const { user } = useCurrentUser();
  const navigate = useNavigate();
  if (!user) return <div className="dark min-h-screen p-6 text-white">Yükleniyor...</div>;

  return (
    <div className="dark min-h-screen text-white">
      <div className="mx-auto w-full max-w-2xl px-4 pt-3 md:max-w-3xl xl:max-w-4xl">
        <SettingsPageHeader title="Ayarlar" backTo="/profil" />

        <div className="space-y-2.5 pb-10">
          <button type="button" onClick={() => navigate('/profil/ayarlar/kisisel')} className={ROW}>
            <span className={ICON_BOX}><User className="h-[18px] w-[18px] text-white/75" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-white">Kişisel Bilgiler</span>
              <span className="block truncate text-[11px] text-white/45">Kullanıcı adı, telefon, doğum tarihi</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
          </button>

          <button type="button" onClick={() => navigate('/profil/ayarlar/eklentiler')} className={ROW}>
            <span className={ICON_BOX}><Wand2 className="h-[18px] w-[18px] text-white/75" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-white">Eklentiler</span>
              <span className="block truncate text-[11px] text-white/45">Gizli profil, hareketli avatar, oda takibi, tema</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
          </button>

          <button type="button" onClick={() => base44.auth.logout('/login')} className={ROW}>
            <span className={ICON_BOX}><LogOut className="h-[18px] w-[18px] text-white/75" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-white">Çıkış Yap</span>
              <span className="block truncate text-[11px] text-white/45">Hesabından güvenli biçimde çık</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
          </button>

          <div className="pt-2">
            <DeleteAccountSection />
          </div>
        </div>
      </div>
    </div>
  );
}