import { Loader2 } from 'lucide-react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { zone } from '@/components/auth/BlueAuthLayout';

export default function BlueOtpForm({ email, error, code, setCode, loading, onVerify, resending, cooldown, onResend }) {
  return <form style={zone(150, 420, 532, 845)} className="absolute flex flex-col justify-center gap-3 rounded-2xl bg-[#04071a] p-4 text-center text-white" onSubmit={e => { e.preventDefault(); if (code.length === 6 && !loading) onVerify(); }}>
    <h1 className="text-xl font-bold">E-postanı doğrula</h1>
    <p className="text-xs text-blue-100">{email} adresine bir kod gönderdik</p>
    {error && <p className="text-xs text-red-300" role="alert">{error}</p>}
    <div className="flex justify-center"><InputOTP maxLength={6} value={code} onChange={setCode} autoFocus autoComplete="one-time-code"><InputOTPGroup>
      {Array.from({ length: 6 }, (_, i) => <InputOTPSlot key={i} index={i} />)}
    </InputOTPGroup></InputOTP></div>
    <button className="flex h-11 items-center justify-center gap-2 rounded-full bg-blue-600 font-semibold disabled:opacity-50" disabled={loading || code.length !== 6}>{loading && <Loader2 className="h-4 w-4 animate-spin" />}{loading ? 'Doğrulanıyor...' : 'Doğrula'}</button>
    <button type="button" className="text-xs text-blue-200 underline" onClick={onResend} disabled={resending || cooldown > 0}>{resending ? 'Gönderiliyor...' : cooldown > 0 ? `Tekrar gönder (${cooldown})` : 'Kodu tekrar gönder'}</button>
  </form>;
}