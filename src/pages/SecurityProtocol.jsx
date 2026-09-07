import { Shield, Lock, Eye, MessageSquare, Database, Server, AlertTriangle, Bug, UserCheck, RefreshCw, Info } from 'lucide-react';

const SECTIONS = [
  {
    icon: Shield,
    title: '1. Amaç',
    body: 'FLİM KEYFİ olarak kullanıcı hesaplarının, kişisel verilerin, oda bilgilerinin, mesajların ve platform üzerindeki diğer verilerin güvenliğini korumayı amaçlıyoruz. Platformun güvenliği için teknik ve idari güvenlik önlemleri uygulanmaktadır.'
  },
  {
    icon: Lock,
    title: '2. Hesap Güvenliği',
    items: [
      'Güvenli kimlik doğrulama mekanizmaları kullanılır.',
      'Kullanıcı şifreleri düz metin olarak saklanmaz.',
      'Yetkisiz hesap erişimlerine karşı koruma uygulanır.',
      'Şüpheli giriş ve kullanım hareketleri izlenebilir.',
      'Kullanıcıların yalnızca kendi yetkileri dahilindeki verilere erişmesine izin verilir.'
    ],
    note: 'Kullanıcılar hesap bilgilerini ve şifrelerini üçüncü kişilerle paylaşmamalıdır.'
  },
  {
    icon: Eye,
    title: '3. Oda Güvenliği',
    items: [
      'Oda erişimleri yetkilendirilir.',
      'Şifreli odalar için erişim kontrolü uygulanır.',
      'Kullanıcıların yetkisiz odalara erişmesi engellenir.',
      'Oda mesajları oda erişim kurallarına göre korunur.',
      'Oda sahibi yetkileri kontrol edilir.'
    ]
  },
  {
    icon: MessageSquare,
    title: '4. Canlı Sohbet Güvenliği',
    items: [
      'Zararlı kodların mesajlar üzerinden çalıştırılması engellenir.',
      'Spam ve flood kontrolleri uygulanır.',
      'Mesaj gönderme işlemleri kullanıcı yetkilerine göre kontrol edilir.',
      'Kullanıcıların başka odaların mesajlarına erişmesi engellenir.'
    ]
  },
  {
    icon: Database,
    title: '5. Veri Güvenliği',
    body: 'Kullanıcı verilerine yalnızca gerekli durumlarda ve yetkilendirilmiş sistemler üzerinden erişilmesi hedeflenir. Hassas sistem bilgileri, erişim anahtarları, şifreler ve güvenlik tokenları kullanıcı arayüzünde paylaşılmaz.'
  },
  {
    icon: Server,
    title: '6. API ve Sistem Güvenliği',
    body: 'Platformun API ve backend servislerinde kimlik doğrulama, yetkilendirme, girdi doğrulama, rate limiting, güvenli hata yönetimi ve erişim kontrolü gibi güvenlik mekanizmaları uygulanır.'
  },
  {
    icon: AlertTriangle,
    title: '7. Kötüye Kullanım',
    intro: 'Aşağıdaki davranışlara izin verilmez:',
    items: [
      'Yetkisiz hesap erişimi',
      'Başka kullanıcıların verilerine erişmeye çalışma',
      'Admin yetkisini ele geçirmeye çalışma',
      'API\'leri kötüye kullanma',
      'Spam ve flood',
      'Zararlı kod gönderme',
      'Sistemi veya hizmeti engellemeye yönelik saldırılar',
      'Güvenlik açıklarını kötüye kullanma'
    ],
    note: 'Şüpheli faaliyetler tespit edildiğinde ilgili hesap veya bağlantı geçici olarak sınırlandırılabilir.'
  },
  {
    icon: Bug,
    title: '8. Güvenlik Açığı Bildirimi',
    body: 'FLİM KEYFİ üzerinde bir güvenlik açığı tespit ettiğinizi düşünüyorsanız, açığı kötüye kullanmak yerine platform yönetimine bildirin. Bildiriminizde mümkün olduğunca açığın bulunduğu bölüm, açığın nasıl oluştuğu, tekrarlanabilen adımlar, varsa ekran görüntüsü ve etkilenen özellik bilgilerini paylaşın.'
  },
  {
    icon: UserCheck,
    title: '9. Kullanıcıların Sorumlulukları',
    items: [
      'Hesap şifrelerini başkalarıyla paylaşmamalı',
      'Şüpheli bağlantılara tıklamamalı',
      'Hesaplarını güvenli cihazlarda kullanmalı',
      'Hesaplarında olağan dışı bir hareket fark ettiklerinde yönetime bildirmelidir'
    ]
  },
  {
    icon: RefreshCw,
    title: '10. Güvenlik Güncellemeleri',
    body: 'Platform güvenliğini artırmak amacıyla güvenlik kontrolleri ve sistem bileşenleri düzenli olarak gözden geçirilebilir ve güncellenebilir.'
  }
];

export default function SecurityProtocol() {
  return (
    <div className="min-h-screen bg-background pb-16">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent" />
        <div className="relative max-w-3xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold">Güvenlik ve Kullanıcı Güvenliği Protokolü</h1>
              <p className="text-sm text-muted-foreground">Son Güncelleme: 11 Ağustos 2026</p>
            </div>
          </div>
          <p className="text-muted-foreground text-sm sm:text-base">
            FLİM KEYFİ olarak kullanıcı güvenliğini korumak için teknik ve idari önlemler uyguluyoruz.
          </p>
        </div>
      </div>

      {/* Sections */}
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="bg-card border border-border rounded-2xl p-5 sm:p-6">
              <div className="flex items-start gap-3 mb-3">
                <div className="shrink-0 w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-bold pt-1.5">{s.title}</h2>
              </div>
              {s.body && <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>}
              {s.intro && <p className="text-sm text-muted-foreground mb-2">{s.intro}</p>}
              {s.items && (
                <ul className="space-y-2 mt-3">
                  {s.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm">
                      <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-primary mt-1.5" />
                      <span className="text-foreground/90">{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {s.note && (
                <div className="mt-3 flex items-start gap-2 bg-primary/10 border border-primary/20 rounded-lg p-3">
                  <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground/80">{s.note}</p>
                </div>
              )}
            </div>
          );
        })}

        {/* Important Note */}
        <div className="bg-gradient-to-br from-accent/10 to-primary/5 border border-accent/20 rounded-2xl p-5 sm:p-6">
          <div className="flex items-start gap-3 mb-2">
            <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
            <h2 className="text-lg font-bold">11. Önemli Not</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            Hiçbir internet sistemi yüzde 100 saldırıya karşı garanti edilemez. FLİM KEYFİ, makul ve uygun teknik güvenlik önlemlerini uygulayarak yetkisiz erişim ve kötüye kullanım risklerini azaltmayı hedefler.
          </p>
          <p className="text-sm font-semibold text-gradient">FLİM KEYFİ — Güvenli ve keyifli izleme deneyimi.</p>
        </div>
      </div>
    </div>
  );
}