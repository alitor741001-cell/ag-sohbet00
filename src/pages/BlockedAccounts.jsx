import BlockedUsers from '@/components/profile/BlockedUsers';
import SettingsPageHeader from '@/components/profile/SettingsPageHeader';

/** Engellenen Hesaplar: ayarlardan tam sayfa olarak açılır, geri düğmesiyle dönülür. */
export default function BlockedAccounts() {
  return (
    <div className="dark min-h-screen text-white">
      <div className="mx-auto w-full max-w-2xl px-4 pt-3 md:max-w-3xl xl:max-w-4xl">
        <SettingsPageHeader title="Engellenen Hesaplar" subtitle="Engellediğin üyeler burada listelenir" backTo="/profil" />
        <div className="pb-10">
          <BlockedUsers />
        </div>
      </div>
    </div>
  );
}