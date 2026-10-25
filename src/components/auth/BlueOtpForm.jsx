import { Loader2 } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

export default function BlueOtpForm({ error, code, setCode, loading, onVerify, resending, cooldown, onResend }) {
  return <form className="blue-auth-form" onSubmit={e => { e.preventDefault(); if (code.length === 6 && !loading) onVerify(); }}>
    {error && <p className="blue-auth-error" role="alert">{error}</p>}
    <div className="flex justify-center py-4"><InputOTP maxLength={6} value={code} onChange={setCode} autoFocus autoComplete="one-time-code"><InputOTPGroup>
      {Array.from({ length: 6 }, (_, i) => <InputOTPSlot key={i} index={i} />)}
    </InputOTPGroup></InputOTP></div>
    <button className="blue-auth-primary" disabled={loading || code.length !== 6}>{loading && <Loader2 className="h-4 w-4 animate-spin" />}{loading ? 'Doğrulanıyor...' : 'Doğrula'}</button>
    <p className="blue-auth-note">Kod gelmedi mi? <button type="button" onClick={onResend} disabled={resending || cooldown > 0}>{resending ? 'Gönderiliyor...' : cooldown > 0 ? `Tekrar gönder (${cooldown})` : 'Tekrar gönder'}</button></p>
  </form>;
}