import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, LogOut, ShieldOff } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { useToast } from '@/components/ui/use-toast';
import ProfileDetailsSection from '@/components/profile/ProfileDetailsSection';
import ProfileSettings from '@/components/profile/ProfileSettings';
import DeleteAccountSection from '@/components/profile/DeleteAccountSection';

/** Ayarlar sayfası: kişisel bilgiler ve eklentiler; çıkış ile hesap silme en altta ayrı durur. */
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
        <div className="mb-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate('/profil')}
            aria-label="Geri"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-white active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-black text-white">Ayarlar</h1>
        </div>

        <div className="pb-10">
          <div className="mb-3">
            <h2 className="text-sm font-black text-white">Kişisel Bilgiler</h2>
            <p className="text-[11px] font-semibold text-white/45">Hesap bilgilerin ve profil detayların</p>
          </div>
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

          <div className="mb-3 mt-6">
            <h2 className="text-sm font-black text-white">Eklentiler</h2>
            <p className="text-[11px] font-semibold text-white/45">Tema, gizli hesap ve şifre</p>
          </div>
          <ProfileSettings user={user} onUpdated={reload} />

          {/* Çıkış ve hesap silme ayarların dışında, en altta ayrı durur. */}
          <div className="mt-8 space-y-2.5">
            <button
              type="button"
              onClick={() => base44.auth.logout('/login')}
              className="flex w-full items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.04] px-3.5 py-3 text-left active:scale-[0.99]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
                <LogOut className="h-[18px] w-[18px] text-white/75" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-white">Çıkış Yap</span>
                <span className="block truncate text-[11px] text-white/45">Hesabından güvenli biçimde çık</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
            </button>

            <button
              type="button"
              onClick={() => navigate('/profil/engellenen')}
              className="flex w-full items-center gap-3 rounded-2xl border border-white/12 bg-white/[0.04] px-3.5 py-3 text-left active:scale-[0.99]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]">
                <ShieldOff className="h-[18px] w-[18px] text-white/75" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-white">Engellenen Hesaplar</span>
                <span className="block truncate text-[11px] text-white/45">Engellediğin üyeleri yönet</span>
              </span>
              <ChevronRight className="h-4 w-4 shrink-0 text-white/30" />
            </button>

            <DeleteAccountSection />
          </div>
        </div>
      </div>
    </div>
  );
}