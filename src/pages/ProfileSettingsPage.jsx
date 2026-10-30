import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import ProfileDetailsSection from '@/components/profile/ProfileDetailsSection';
import ProfileSettings from '@/components/profile/ProfileSettings';
import DeleteAccountSection from '@/components/profile/DeleteAccountSection';

const CARD_STYLE = {
  background: 'linear-gradient(160deg, rgba(18,58,112,0.95), rgba(6,22,48,0.95))',
  border: '1px solid rgba(125,211,252,0.35)',
};

/** Ayarlar sayfası: kişisel bilgiler, eklentiler (tema/gizli hesap/şifre) ve hesap işlemleri tek ekranda. */
export default function ProfileSettingsPage() {
  const { user, reload } = useCurrentUser();
  const { toast } = useToast();
  const navigate = useNavigate();
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
      toast({
        title: 'Kaydedilemedi',
        description: error.response?.data?.error || error.message,
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return <div className="dark min-h-screen p-6 text-white">Yükleniyor...</div>;

  return (
    <div className="dark min-h-screen text-white">
      <div className="mx-auto w-full max-w-2xl px-4 pt-3 md:max-w-3xl xl:max-w-4xl">
        <div className="mb-3 flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/profil')}
            aria-label="Geri"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#7dd3fc]/35 bg-[#0B2A52] text-[#a5e4ff] active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-black text-white">Ayarlar</h1>
        </div>

        <div className="space-y-4 pb-10">
          <Section title="Kişisel Bilgiler" subtitle="Hesap bilgilerin ve profil detayların">
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
          </Section>

          <Section title="Eklentiler" subtitle="Tema, gizli hesap ve şifre">
            <ProfileSettings user={user} onUpdated={reload} />
          </Section>

          <Section title="Hesap" subtitle="Hesabını kalıcı olarak sil">
            <DeleteAccountSection />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, subtitle, children }) {
  return (
    <div className="rounded-2xl p-3.5" style={CARD_STYLE}>
      <div className="mb-3">
        <p className="text-sm font-black text-white">{title}</p>
        <p className="text-[11px] font-semibold text-[#a5e4ff]/70">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}