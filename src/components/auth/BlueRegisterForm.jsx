import { Link } from 'react-router-dom';
import { zone } from '@/components/auth/BlueAuthLayout';

const GENDERS = [['erkek', 'Erkek', 162, 277], ['kadın', 'Kadın', 285, 398], ['diğer', 'Diğer', 406, 521]];

export default function BlueRegisterForm({ values, setters, shown, toggle, showConfirm, toggleConfirm, onSubmit, loading, returnTo }) {
  const [year = '', month = '', day = ''] = values.birthDate.split('-');
  const setDate = (part, v) => { const p = { year, month, day, [part]: v }; setters.birthDate(`${p.year}-${p.month}-${p.day}`); };
  const now = new Date().getFullYear();
  const input = (key, label, y, extra = {}) => <input aria-label={label} placeholder=" " className="blue-auth-input absolute" style={zone(162, y, 522, y + 36)} value={values[key]} onChange={e => setters[key](e.target.value)} required {...extra} />;
  const select = (part, label, x1, x2, count, toValue) => <select aria-label={label} required value={{ day, month, year }[part]} onChange={e => setDate(part, e.target.value)} className={`blue-auth-select absolute ${{ day, month, year }[part] ? 'has-value' : ''}`} style={zone(x1, 744, x2, 776)}>
    <option value="">{label}</option>{Array.from({ length: count }, (_, i) => <option key={i} value={toValue(i)}>{toValue(i).replace(/^0/, '')}</option>)}
  </select>;
  return <form onSubmit={onSubmit} noValidate className="contents">
    {input('username', 'Kullanıcı adı', 430, { autoComplete: 'username' })}
    {input('email', 'E-posta adresiniz', 478, { type: 'email', autoComplete: 'email' })}
    {input('password', 'Şifre oluşturun', 526, { type: shown ? 'text' : 'password', autoComplete: 'new-password', minLength: 6 })}
    <button type="button" aria-label="Şifreyi göster" className="blue-auth-eye absolute" style={zone(480, 528, 520, 560)} onClick={toggle} />
    {input('confirmPassword', 'Şifrenizi tekrar girin', 574, { type: showConfirm ? 'text' : 'password', autoComplete: 'new-password' })}
    <button type="button" aria-label="Şifreyi göster" className="blue-auth-eye absolute" style={zone(480, 576, 520, 608)} onClick={toggleConfirm} />
    {GENDERS.map(([key, label, x1, x2]) => <button key={key} type="button" aria-label={label} aria-pressed={values.gender === key} className="blue-auth-pick absolute" style={zone(x1, 651, x2, 700)} onClick={() => setters.gender(key)} />)}
    {select('day', 'Gün', 162, 276, 31, i => String(i + 1).padStart(2, '0'))}
    {select('month', 'Ay', 285, 398, 12, i => String(i + 1).padStart(2, '0'))}
    {select('year', 'Yıl', 408, 521, 121, i => String(now - i))}
    <button type="submit" aria-label="Kayıt Ol" className="blue-auth-hit absolute" style={zone(155, 791, 529, 836)} disabled={loading}>Kayıt Ol</button>
    <Link aria-label="Giriş Yap" className="blue-auth-hit absolute" style={zone(366, 864, 424, 886)} to={'/login' + (returnTo !== '/' ? '?returnTo=' + encodeURIComponent(returnTo) : '')}>Giriş Yap</Link>
  </form>;
}