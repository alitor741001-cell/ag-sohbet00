import { Link } from 'react-router-dom';
import { UserRound, LockKeyhole, Flame, Loader2, UserPlus } from 'lucide-react';
import BlueAuthField from '@/components/auth/BlueAuthField';
import BlueAuthSocial from '@/components/auth/BlueAuthSocial';
import LegalLinks from '@/components/auth/LegalLinks';

export default function BlueLoginForm({ email, setEmail, password, setPassword, shown, toggle, remember, setRemember, loading, socialLoading, onProvider, onSubmit, returnTo }) {
  return <>
    <form onSubmit={onSubmit} className="blue-auth-form">
      <BlueAuthField id="email" label="Kullanıcı adı veya e-posta" icon={UserRound} autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required />
      <BlueAuthField id="password" label="Şifre" icon={LockKeyhole} type={shown ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} shown={shown} onToggle={toggle} required />
      <button type="submit" className="blue-auth-primary" disabled={loading}>{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Flame className="h-5 w-5" />}{loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}</button>
      <Link className="blue-auth-secondary" to={'/register' + (returnTo !== '/' ? '?returnTo=' + encodeURIComponent(returnTo) : '')}><UserPlus size={20} /> Kayıt Ol</Link>
      <Link className="blue-auth-forgot" to="/forgot-password">Şifremi Unuttum</Link>
      <label className="blue-auth-check"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /> Beni hatırla</label>
    </form>
    <BlueAuthSocial loading={socialLoading} onProvider={onProvider} />
    <p className="blue-auth-note">Devam ederek yasal koşulları kabul etmiş olursunuz.</p>
    <LegalLinks className="blue-auth-legal" />
  </>;
}