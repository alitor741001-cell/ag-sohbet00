import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/lib/useCurrentUser';
import { Button } from '@/components/ui/button';
import { Loader2, Check, Crown, CreditCard, Calendar } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

export default function Subscription() {
  const { user, loading, updateUser } = useCurrentUser();
  const [plans, setPlans] = useState([]);
  const [methods, setMethods] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [processing, setProcessing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    base44.entities.SubscriptionPlan.filter({ is_active: true }).then(setPlans).catch(() => {});
    base44.entities.PaymentMethod.filter({ is_active: true }).then(setMethods).catch(() => {});
    if (user) base44.entities.Payment.filter({ user_id: user.id }).then(setPayments).catch(() => {});
  }, [user?.id]);

  const isActive = user?.membership_status === 'active' && (!user?.membership_end || new Date(user.membership_end) > new Date());

  const startPayment = async (plan) => {
    setSelectedPlan(plan);
    setProcessing(true);
    try {
      const result = await base44.functions.invoke('payment-service', {
        action: 'create',
        plan_id: plan.id,
        amount: plan.price,
        currency: plan.currency || 'TRY',
        plan_name: plan.name,
      });
      if (result?.data?.payment_url) {
        window.location.href = result.data.payment_url;
      } else {
        toast({ title: 'Ödeme başlatıldı', description: 'Ödeme sayfasına yönlendiriliyorsunuz.' });
      }
    } catch (err) {
      toast({ title: 'Ödeme hatası', description: err.message, variant: 'destructive' });
      setProcessing(false);
    }
  };

  if (loading || !user) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /></div>;

  return (
    <div className="min-h-screen pt-20 pb-24 px-4 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-2">Abonelik</h1>
      <p className="text-muted-foreground mb-6">Premium içeriğe erişim için aboneliğinizi aktif edin.</p>

      {isActive && (
        <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center gap-3">
          <Check className="w-5 h-5 text-green-400" />
          <div>
            <p className="font-semibold text-white">Aboneliğiniz aktif</p>
            {user.membership_end && <p className="text-sm text-muted-foreground">Bitiş: {new Date(user.membership_end).toLocaleDateString('tr-TR')}</p>}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {plans.map((plan) => (
          <div key={plan.id} className={`relative rounded-2xl border p-6 ${plan.name?.toLowerCase().includes('premium') || plan.name?.toLowerCase().includes('vip') ? 'border-purple-500 bg-purple-500/5' : 'border-border bg-card'}`}>
            {plan.name?.toLowerCase().includes('premium') || plan.name?.toLowerCase().includes('vip') ? (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-purple-600 text-white text-xs font-semibold">En Popüler</div>
            ) : null}
            <Crown className="w-8 h-8 text-purple-400 mb-3" />
            <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
            <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>
            <div className="mb-4">
              <span className="text-3xl font-bold text-white">{plan.price}</span>
              <span className="text-muted-foreground ml-1">{plan.currency || '₺'}</span>
              <span className="text-sm text-muted-foreground block">{plan.duration_days} gün</span>
            </div>
            {plan.features?.length > 0 && (
              <ul className="space-y-2 mb-4">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground"><Check className="w-4 h-4 text-green-400 shrink-0" /> {f}</li>
                ))}
              </ul>
            )}
            <Button onClick={() => startPayment(plan)} disabled={processing && selectedPlan?.id === plan.id} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
              {processing && selectedPlan?.id === plan.id ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CreditCard className="w-4 h-4 mr-2" />}
              {isActive ? 'Yenile' : 'Satın Al'}
            </Button>
          </div>
        ))}
      </div>

      {payments.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Calendar className="w-5 h-5" /> Ödeme Geçmişi</h2>
          <div className="space-y-2">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-card border border-border">
                <div>
                  <p className="font-medium text-white text-sm">{p.plan_name}</p>
                  <p className="text-xs text-muted-foreground">{new Date(p.created_date).toLocaleDateString('tr-TR')}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-white">{p.amount} {p.currency || '₺'}</p>
                  <span className={`text-xs ${p.status === 'completed' ? 'text-green-400' : p.status === 'failed' ? 'text-red-400' : 'text-amber-400'}`}>{p.status === 'completed' ? 'Tamamlandı' : p.status === 'failed' ? 'Başarısız' : 'Beklemede'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}