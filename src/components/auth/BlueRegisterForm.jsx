import { Link } from 'react-router-dom';
import { UserRound, Mail, LockKeyhole, UserPlus, Loader2, Camera } from 'lucide-react';
import { Image } from '@/components/ui/image';
import BlueAuthField from '@/components/auth/BlueAuthField';
import BlueAuthSocial from '@/components/auth/BlueAuthSocial';
import BlueBirthDate from '@/components/auth/BlueBirthDate';
import LegalLinks from '@/components/auth/LegalLinks';

export default function BlueRegisterForm({ values, setters, shown, toggle, showConfirm, toggleConfirm, onSubmit, onAvatar, loading, socialLoading, onProvider, returnTo }) {
  const field = (key) => ({ value: values[key], onChange: e => setters[key](e.target.value) });
  return <form className="blue-auth-form" onSubmit={onSubmit}>
    <BlueAuthField id="username" label="Kullanıcı adı" icon={UserRound} autoComplete="username" {...field('username')} required />
    <BlueAuthField id="email" label="E-posta adresiniz" icon={Mail} type="email" autoComplete="email" {...field('email')} required />
    <BlueAuthField id="password" label="Şifre oluşturun" icon={LockKeyhole} type={shown ? 'text' : 'password'} autoComplete="new-password" minLength={6} shown={shown} onToggle={toggle} {...field('password')} required />
    <BlueAuthField id="confirm" label="Şifrenizi tekrar girin" icon={LockKeyhole} type={showConfirm ? 'text' : 'password'} autoComplete="new-password" shown={showConfirm} onToggle={toggleConfirm} {...field('confirmPassword')} required />
    <fieldset className="blue-auth-gender"><legend>Cinsiyet Seçimi</legend><div className="grid grid-cols-3 gap-2">
      {[['erkek', '♂', 'Erkek'], ['kadın', '♀', 'Kadın'], ['diğer', '⚥', 'Diğer']].map(([key, symbol, label]) => <button key={key} type="button" aria-pressed={values.gender === key} className="blue-auth-secondary" onClick={() => setters.gender(key)}><span aria-hidden="true">{symbol}</span>{label}</button>)}
    </div></fieldset>
    <BlueBirthDate value={values.birthDate} onChange={setters.birthDate} />
    <BlueAuthField id="fullname" label="Ad Soyad" icon={UserRound} autoComplete="name" {...field('fullName')} required />
    <label className="blue-auth-avatar">
      {values.avatar ? <Image src={values.avatar} alt="Profil fotoğrafınız" className="h-8 w-8 rounded-full overflow-hidden" /> : <Camera size={20} />} Profil fotoğrafı ekle
      <input aria-label="Profil fotoğrafı" type="file" accept="image/*" onChange={onAvatar} className="sr-only" />
    </label>
    <label className="blue-auth-check"><input type="checkbox" checked={values.acceptTerms} onChange={e => setters.acceptTerms(e.target.checked)} /> Yasal koşulları okudum ve kabul ediyorum.</label>
    <LegalLinks className="blue-auth-legal" />
    <button type="submit" className="blue-auth-primary" disabled={loading}>{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserPlus size={22} />}{loading ? 'Hesap oluşturuluyor...' : 'Kayıt Ol'}</button>
    <p className="blue-auth-note">Zaten hesabın var mı? <Link to={'/login' + (returnTo !== '/' ? '?returnTo=' + encodeURIComponent(returnTo) : '')}>Giriş Yap</Link></p>
    <BlueAuthSocial loading={socialLoading} onProvider={onProvider} />
  </form>;
}