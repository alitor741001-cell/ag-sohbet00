import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import SettingsPageHeader from '@/components/profile/SettingsPageHeader';
import ProfileDetailsSection from '@/components/profile/ProfileDetailsSection';

/** Kişisel Bilgiler sayfası: düzenlenebilir hesap bilgileri. */
export default function ProfileDetailsPage() {
  const { user, reload } = useCurrentUser();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({});

  const startEdit = () => {
    setForm({
      username: user.username || '',
      full_name: user.full_name || '',
      phone: user.phone || '',
      birth_date: user.birth_date || '',
    });
    setEditing(true);
  };

  const save = async () => {
    if ((form.username || '').trim().length > 0 && form.username.trim().length < 3) {
      toast({ title: 'Kullanıcı adı en az 3 karakter olmalı.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { data } = await base44.functions.invoke('update-profile', {
        username: form.username ?? '',
        phone: form.phone ?? '',
        birth_date: form.birth_date ?? '',
      });
      if (!data?.ok) throw new Error(data?.error || 'Bilgiler kaydedilemedi.');
      await reload();
      setEditing(false);
      toast({ title: 'Bilgilerin güncellendi' });
    } catch (error) {
      toast({ title: 'Kaydedilemedi', description: error.response?.data?.error || error.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <div className="dark min-h-screen p-6 text-white">Yükleniyor...</div>;

  return (
    <div className="dark min-h-screen text-white">
      <div className="mx-auto w-full max-w-2xl px-4 pt-3 md:max-w-3xl xl:max-w-4xl">
        <SettingsPageHeader title="Kişisel Bilgiler" subtitle="Hesap bilgilerin ve profil detayların" />
        <div className="pb-10">
          <ProfileDetailsSection
            user={user}
            editing={editing}
            form={form}
            setForm={setForm}
            onSave={save}
            onEdit={startEdit}
            onCancel={() => setEditing(false)}
            saving={saving}
          />
        </div>
      </div>
    </div>
  );
}