import { useCurrentUser } from '@/lib/useCurrentUser';
import SettingsPageHeader from '@/components/profile/SettingsPageHeader';
import ProfileSettings from '@/components/profile/ProfileSettings';

/** Eklentiler sayfası: gizlilik anahtarları, tema ve şifre. */
export default function ProfileExtensionsPage() {
  const { user, reload } = useCurrentUser();
  if (!user) return <div className="dark min-h-screen p-6 text-white">Yükleniyor...</div>;

  return (
    <div className="dark min-h-screen text-white">
      <div className="mx-auto w-full max-w-2xl px-4 pt-3 md:max-w-3xl xl:max-w-4xl">
        <SettingsPageHeader title="Eklentiler" subtitle="Gizlilik, görünüm ve güvenlik" />
        <div className="pb-10">
          <ProfileSettings user={user} onUpdated={reload} />
        </div>
      </div>
    </div>
  );
}