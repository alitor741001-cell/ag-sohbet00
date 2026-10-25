import { Link } from 'react-router-dom';
import { zone } from '@/components/auth/BlueAuthLayout';

export default function BlueLoginForm({ email, setEmail, password, setPassword, shown, toggle, loading, onSubmit, returnTo }) {
  const q = returnTo !== '/' ? '?returnTo=' + encodeURIComponent(returnTo) : '';
  return <form onSubmit={onSubmit} className="contents">
    <input aria-label="Kullanıcı adı veya e-posta" placeholder=" " className="blue-auth-input absolute" style={zone(144, 550, 538, 597)} autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required />
    <input aria-label="Şifre" placeholder=" " className="blue-auth-input absolute" style={zone(144, 612, 538, 659)} type={shown ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required />
    <button type="button" aria-label={shown ? 'Şifreyi gizle' : 'Şifreyi göster'} className="blue-auth-eye absolute" style={zone(488, 615, 536, 656)} onClick={toggle} />
    <button type="submit" aria-label="Giriş Yap" className="blue-auth-hit absolute" style={zone(142, 680, 540, 735)} disabled={loading}>Giriş Yap</button>
    <Link aria-label="Kayıt Ol" className="blue-auth-hit absolute" style={zone(142, 752, 540, 800)} to={'/register' + q}>Kayıt Ol</Link>
    <Link aria-label="Şifremi Unuttum" className="blue-auth-hit absolute" style={zone(280, 818, 400, 846)} to="/forgot-password">Şifremi Unuttum</Link>
  </form>;
}