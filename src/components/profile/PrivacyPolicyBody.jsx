import React from 'react';

const CONTACT = 'agsohbetdestek74@gmail.com';

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h3 className="text-[13px] font-bold text-[#a5e4ff]">{title}</h3>
      <div className="space-y-2 text-[12.5px] leading-6 text-white/80">{children}</div>
    </section>
  );
}

function Sub({ children }) {
  return <h4 className="pt-1 text-[12px] font-semibold text-white/90">{children}</h4>;
}

function List({ items }) {
  return (
    <ul className="list-disc space-y-1 pl-5 marker:text-[#7dd3fc]">
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

/** AG Sohbet gizlilik politikası metni. */
export default function PrivacyPolicyBody() {
  return (
    <div className="space-y-4">
      <p className="rounded-xl border border-[#7dd3fc]/25 bg-white/5 px-3 py-2 text-[12px] leading-5 text-white/75">
        Teknik Destek ve İletişim E-posta Adresi: <span className="font-semibold text-[#a5e4ff]">{CONTACT}</span>
      </p>

      <Section title="1. Giriş">
        <p>Ag Sohbet mobil uygulamasına (“Uygulama”) veya Uygulama aracılığıyla sunulan ya da Uygulamayla bağlantılı tüm hizmetlere (bu Gizlilik Politikası kapsamında topluca “Hizmetler” olarak anılacaktır) erişerek veya bu hizmetleri kullanarak bu Gizlilik Politikası’nı kabul etmiş olursunuz. Bu Gizlilik Politikası’nın şartlarını kabul etmiyorsanız lütfen Hizmetlerimizi kullanmayın.</p>
        <p>Web sitemizi veya Uygulamamızı ziyaret ettiğinizde aşağıda açıklanan bilgileri toplayabiliriz. Hesabınızı oluşturduğunuzda ve kullandığınızda, size Hizmetlerimizi sunabilmek amacıyla verilerinizi işleriz. Topladığımız verilerin türü, Uygulamamızı ve Hizmetlerimizi nasıl kullandığınıza bağlıdır.</p>
        <p>Bu Gizlilik Politikası, kişisel bilgilerinizin nasıl toplandığını, kullanıldığını, saklandığını, paylaşıldığını ve korunduğunu açıklar.</p>
      </Section>

      <Section title="2. Topladığımız Bilgiler">
        <p>Web sitemizi veya Uygulamamızı ziyaret ettiğinizde, Uygulamayı cihazınıza yüklediğinizde ya da Ag Sohbet hesabı oluşturduğunuzda, Hizmetlerimizi sunabilmek amacıyla sizinle ilişkilendirilebilen bilgiler toplayabiliriz. Bu bilgilerin ayrıntıları aşağıda açıklanmıştır.</p>

        <Sub>2.1. Kayıt ve Hesap Bilgileri</Sub>
        <p>Uygulamayı cihazınıza yüklediğinizde ve/veya Ag Sohbet hesabı oluşturduğunuzda, sizinle ilişkilendirilebilen kişisel bilgiler ve kişisel olmayan bilgiler toplanabilir.</p>
        <p>Zorunlu olarak sağlanan bilgiler: Kayıt sırasında cinsiyetinizi, adınızı veya takma adınızı, doğum tarihinizi ve cep telefonu numaranızı ya da e-posta adresinizi sağlamanız istenebilir. Bu bilgiler, Hizmetlerimizde diğer kullanıcılarla bağlantı kurmanıza ve arkadaşlık özelliklerini kullanmanıza yardımcı olmak için kullanılır.</p>
        <p>İsteğe bağlı olarak sağlanan bilgiler: Kendinize ait fotoğraflarınızı, videolarınızı, kendiniz hakkındaki açıklamaları ve ilgi alanlarınızı paylaşmayı seçebilirsiniz. Örneğin profil sayfanızda ilgi alanlarınızı belirtebilirsiniz. Bu bilgileri sağlamanız isteğe bağlıdır.</p>
        <p>Facebook, Google veya WhatsApp hesabınızla kayıt olur ya da giriş yaparsanız, ilgili platform üzerinden erişimimize açtığınız ek bilgileri toplayabiliriz.</p>
        <p>Örneğin Facebook hesabınızla Ag Sohbet’e kaydolduğunuzda, otomatik giriş ve hesap işlemleri için Facebook kimliğinizi (ID) ve ilgili erişim belirteçlerini saklayabiliriz. Açık rızanızın bulunması ve gerekli izinlerin verilmesi hâlinde adınız, soyadınız, e-posta adresiniz, profil fotoğrafınız ve doğum tarihiniz gibi Facebook üzerinden erişilebilir kıldığınız belirli bilgilere erişebiliriz.</p>
        <p>Bu bilgiler, Hizmetlerimizi kullanmanızı kolaylaştırmak ve hesabınızın farklı cihazlarda eşitlenmesini sağlamak gibi amaçlarla kullanılabilir.</p>
        <p>İletişim bilgilerinizi, yürürlükteki mevzuatın izin verdiği ölçüde, Hizmetlerimizdeki yenilikler, yeni teklifler ve güncellemeler hakkında sizi bilgilendirmek amacıyla kullanabiliriz. Gizlilik ayarlarınız izin veriyorsa diğer kullanıcıların sizi bulmasına yardımcı olmak için de bu bilgileri kullanabiliriz.</p>
        <p>E-posta ve mobil bildirim ayarlarınızı değiştirerek aldığınız bildirimleri kontrol edebilirsiniz. Pazarlama bildirimlerinden çıkmak isterseniz ilgili bildirimlerde yer alan talimatları izleyebilir veya bizimle iletişime geçebilirsiniz.</p>
        <p>Uygulamamızdaki görüntülü arama özelliklerinin yanı sıra metin mesajlaşma hizmetini de kullanabilirsiniz. Diğer kullanıcılara mesaj gönderdiğinizde veya onlardan mesaj aldığınızda, mesajlarınızı ve bunlarla ilişkili bilgileri işleyebiliriz.</p>
        <p>Bu işlemler; zararlı içeriklerin tespit edilmesini, kötüye kullanımın önlenmesini, yasaklanmış görsellerin incelenmesini ve kullanıcılar tarafından bildirilen sorunların değerlendirilmesini kapsayabilir.</p>
        <p>Hizmetlerimizin kullanımını anlamak ve platformumuzun güvenliğini korumak amacıyla kimlerle ve ne zaman iletişim kurduğunuza ilişkin bilgileri de kullanabiliriz. Mesaj içerikleri, belirtilen güvenlik ve inceleme amaçları kapsamında gerekli olduğu durumlar dışında, bu tür kullanım analizlerinin temelini oluşturmaz.</p>

        <Sub>2.2. Konum Bilgileri</Sub>
        <p>“Konum Verileri”; GPS koordinatları aracılığıyla belirlenen kesin konumunuz, Wi-Fi bağlantısı üzerinden tahmin edilen yaklaşık konumunuz veya IP adresiniz aracılığıyla belirlenen genel coğrafi konumunuz gibi bilgileri ifade eder.</p>
        <p>Konum bilgileriniz, ilgili izinlere ve cihaz ayarlarınıza bağlı olarak bize veya diğer kullanıcılara gösterilebilir.</p>
        <p>Konum verileri; hesabınızın güvenli şekilde oluşturulması ve yönetilmesi, Hizmetlerimizin sunulması, kullanıcı bağlantılarının kurulması ve platform güvenliğinin korunması gibi amaçlarla kullanılabilir.</p>
        <p>Hizmetlerimizin işleyişini sağlamak ve deneyiminizi kişiselleştirmek amacıyla, gerekli izinlerin bulunması ve yürürlükteki mevzuata uyulması şartıyla, mevcut kesin konumunuz veya Hizmetlerimizi daha önce kullandığınız yerler gibi ek konum bilgilerini toplayabilir, kullanabilir ve saklayabiliriz.</p>
        <p>Konum bilgilerinize cihazınızın izin ayarlarından erişimi yönetebilirsiniz. Konumunuzu paylaşmadan önce profilinizde ve uygulama ayarlarınızda hangi bilgilerin diğer kullanıcılara gösterildiğini kontrol etmenizi öneririz.</p>

        <Sub>2.3. Kayıt ve Kullanım Verileri</Sub>
        <p>Hizmetlerimizde içerikleri görüntülediğinizde veya başka şekillerde etkileşim kurduğunuzda belirli teknik ve kullanım bilgileri elde edebiliriz. Bu bilgiler “Kayıt Verileri” olarak adlandırılır.</p>
        <p>Web sitemizi ziyaret ettiğinizde, hesabınıza giriş yaptığınızda, e-posta bildirimlerimizle etkileşime geçtiğinizde veya hesabınızı üçüncü taraf bir hizmette kimlik doğrulamak için kullandığınızda aşağıdaki bilgiler toplanabilir:</p>
        <List items={[
          'IP adresi.',
          'Tarayıcı türü ve sürümü.',
          'İşletim sistemi ve cihaz yapılandırması.',
          'Ziyaret ettiğiniz sayfalar ve yönlendiren web sayfaları.',
          'Genel konum bilgileri.',
          'Mobil operatör bilgileri.',
          'Cihaz ve uygulama kimlikleri.',
          'Arama terimleri ve arama etkinlikleri.',
          'Çerez bilgileri.',
          'Hizmetlerimizdeki bağlantılara tıklama ve içerikleri görüntüleme etkinlikleri.',
          'İletişim kurduğunuz kullanıcı, iletişim tarihi ve süresi gibi kullanım üst verileri.',
        ]} />
        <p>Bu bilgiler, Hizmetlerimizi işletmek, performansını değerlendirmek, hesap güvenliğini korumak, şüpheli faaliyetleri tespit etmek ve platformumuzun güvenilirliğini artırmak amacıyla kullanılabilir.</p>
        <p>Ayrıca Kayıt Verilerini Hizmetlerimizdeki popüler özellikleri anlamak, kullanıcı deneyimini geliştirmek, yeni kullanıcı bağlantılarını kolaylaştırmak ve pazarlama faaliyetlerimizin etkinliğini ölçmek için kullanabiliriz.</p>
        <p>Hizmetlerimiz üzerinden oluşturduğunuz bağlantıların tarihi veya konumu gibi içeriklerle ilişkili üst veriler de işlenebilir.</p>
        <p>Kayıt Verileri en fazla 30 gün saklanır. Bununla birlikte, diğer kişisel verilerin saklanma süreleri bu Gizlilik Politikası’nın 9. bölümünde açıklanan kurallara göre belirlenir.</p>

        <Sub>2.4. Üçüncü Taraflar ve Bağlı Kuruluşlar</Sub>
        <p>Hizmetlerimizin güvenliğini ve kalitesini değerlendirmemize yardımcı olan iş ortaklarından, bağlı kuruluşlarımızdan ve hesabınıza bağladığınız diğer hizmetlerden hakkınızda bilgi alabiliriz.</p>
        <p>Bu bilgiler, Hizmetlerimizi sunmak ve geliştirmek amacıyla kullanılabilir.</p>
        <p>Resmî olarak desteklediğimiz entegrasyonlara verdiğiniz izinleri, ilgili uygulamanın ayarlarından geri çekebilirsiniz. Diğer entegrasyonlar için ilgili üçüncü taraf hizmetinin ayarlarını kullanmanız gerekebilir.</p>
        <p>Hizmetlerimiz kapsamında satın alma işlemi gerçekleştirmek için kredi kartı veya banka kartı numarası, kartın son kullanma tarihi, CVV kodu ve fatura adresi gibi ödeme bilgileri sağlamanız istenebilir.</p>
        <p>Ödeme yaptığınızda veya Hizmetlerimiz aracılığıyla para gönderdiğinizde, ödeme işleminin gerçekleştirilmesi için gerekli olan işlem tarihi, işlem tutarı ve işlem durumu gibi bilgileri alabiliriz.</p>
        <p>Ödeme bilgileriniz, işlemin niteliğine ve kullanılan ödeme altyapısına bağlı olarak tarafımızdan veya ilgili üçüncü taraf ödeme hizmet sağlayıcısı tarafından işlenebilir.</p>

        <Sub>2.5. Kimlik Bilgilerinin İlişkilendirilmesi ve Kişiselleştirme</Sub>
        <p>Ag Sohbet’e bir tarayıcıdan veya cihazdan giriş yaptığınızda, kimlik doğrulama, güvenlik ve kişiselleştirme amacıyla ilgili tarayıcıyı veya cihazı hesabınızla ilişkilendirebiliriz.</p>
        <p>Ayarlarınıza ve yürürlükteki mevzuata bağlı olarak hesabınız, farklı cihazlar veya tarayıcılarla da ilişkilendirilebilir.</p>
        <p>E-posta adresi gibi ek bilgiler sağladığınızda bu bilgileri hesabınızla ilişkilendirebiliriz. Gerekli hukuki dayanak bulunduğunda ve ilgili ayarlar izin verdiğinde, hesabınızın güvenliğini sağlamak ve Hizmetlerimizi kişiselleştirmek amacıyla bu bilgilerden ek çıkarımlar elde edebiliriz.</p>
        <p>Örneğin üçüncü taraf bir hesapla giriş yaptığınızda, ilgili platform üzerinden izin verilen bilgileri yaş koşullarının ve diğer kullanım gerekliliklerinin doğrulanması amacıyla değerlendirebiliriz.</p>
        <p>Bu işlemler yalnızca ilgili izinler, hukuki dayanaklar ve geçerli mevzuat çerçevesinde gerçekleştirilir.</p>

        <Sub>2.6. Uygulamanın Kullanımı Sırasında Toplanan Bilgiler</Sub>
        <p className="font-semibold text-white/90">Cihaz bilgileri</p>
        <p>Ag Sohbet; Uygulamayı yüklemek ve kullanmak için kullandığınız cihazlara ilişkin aşağıdaki bilgileri toplayabilir:</p>
        <List items={[
          'Cihaz modeli.',
          'Benzersiz cihaz tanımlayıcısı.',
          'IP adresi.',
          'Cihaz özellikleri.',
          'Uygulama ve cihaz sürümleri.',
          'Sayfa görüntüleme ve kullanım istatistikleri.',
        ]} />
        <p>Bu bilgiler, uygulamanın düzgün çalışmasını sağlamak, hataları gidermek ve kullanıcı deneyimini geliştirmek amacıyla kullanılabilir.</p>
        <p className="font-semibold text-white/90">Kullanıcı faaliyetleri</p>
        <p>Uygulama ve web sitemizdeki kullanımınıza ilişkin bilgiler toplanabilir. Bunlar eşleşmeler, eşleşme sayıları ve süreleri, metin mesajlaşma etkinlikleri, mesajlaşma sırasında seçilen müzikler ve bölgelere göre kullanım istatistiklerini içerebilir.</p>
        <p className="font-semibold text-white/90">Fotoğraf, kamera ve mikrofon izinleri</p>
        <p>Profil fotoğrafı olarak kullanmak veya paylaşmayı seçtiğiniz fotoğrafları ve medya dosyalarını Uygulamada görüntülemek amacıyla cihazınızdaki ilgili dosyalara erişim gerekebilir.</p>
        <p>Sesli ve görüntülü arama özelliklerini kullanabilmeniz için, ilgili özelliği çalıştırdığınızda kamera ve mikrofon izinleri istenebilir.</p>
        <p>Ses ve video aktarımı, müzik paylaşımı ve ilgili özelliklerin çalışması için gerekli teknik işlemler gerçekleştirilebilir.</p>
        <p>Bu izinler, ilgili özellikleri sunmak ve yasal yükümlülükleri yerine getirmek amacıyla, cihazınızın izin ayarları ve yürürlükteki mevzuat çerçevesinde kullanılır.</p>
        <p>Ag Sohbet, 18 yaşından küçük kişilerin Hizmeti kullanmasını engellemeye yönelik yaş doğrulama ve güvenlik süreçleri uygulayabilir.</p>
        <p className="font-semibold text-white/90">Paylaştığınız içerikler</p>
        <p>Ag Sohbet, profilinizi, ilgi alanlarınızı, metin mesajlarınızı, fotoğraflarınızı, ekran görüntülerinizi, videolarınızı, müzik tercihlerinizi ve diğer iletişimlerinizi Uygulama üzerinden paylaşmanıza olanak tanıyabilir.</p>
        <p>Paylaşmayı seçtiğiniz içerikler, ilgili özelliklerin çalışması için sunucularımızda saklanabilir.</p>
        <p>İçeriklerinizi diğer kullanıcılarla paylaştığınızda, bu kişilerin içerikleri kaydetmesi, kopyalaması veya yeniden paylaşması mümkün olabilir. Bu nedenle paylaştığınız bilgilerin sonraki kullanımını her zaman kontrol edemeyebilirsiniz.</p>
        <p>İçeriğinizi silmeniz, başka kullanıcılar tarafından daha önce kaydedilmiş veya kopyalanmış içeriklerin de silineceği anlamına gelmez.</p>
        <p>Diğer kullanıcılarla paylaştığınız bilgilerin onların cihazlarında veya hesaplarında nasıl kullanılacağı üzerinde tam kontrolümüz bulunmayabilir.</p>
        <p className="font-semibold text-white/90">Oluşturduğunuz içerikler</p>
        <p>Uygulamada oluşturduğunuz veya yayımladığınız fotoğraflar, ekran görüntüleri, yorumlar, ilgi alanları ve diğer materyaller gibi kullanıcı içerlerini toplayabilir ve saklayabiliriz.</p>
        <p>Bu içerikler, Hizmetlerin sunulması, kullanıcılar arasında paylaşım yapılması, güvenlik kontrolleri ve ilgili özelliklerin çalışması için işlenebilir.</p>
        <p className="font-semibold text-white/90">İşlem ve ödeme bilgileri</p>
        <p>Satın alma işlemi gerçekleştirmek için ödeme bilgilerinizi sağlamanız istenebilir. Bu bilgiler, satın alma işleminin tamamlanması amacıyla güvenli şekilde ilgili üçüncü taraf ödeme sağlayıcısına veya satıcıya iletilebilir.</p>
        <p>Uygulamada gerçekleştirilen satın alımlara ilişkin satıcı adı, işlem tarihi, saati, tutarı ve satın alma geçmişi gibi bilgiler saklanabilir.</p>
        <p className="font-semibold text-white/90">Hata raporlama bilgileri</p>
        <p>Uygulama çöktüğünde veya düzgün çalışmadığında, hataları incelemek ve uygulamanın kararlılığını geliştirmek amacıyla hata raporları toplayabiliriz.</p>
        <p>Bu raporlar cihaz türü ve sürümü, cihaz tanımlayıcısı, hatanın meydana geldiği zaman, kullanılan özellik ve hata sırasında Uygulamanın durumu gibi bilgileri içerebilir.</p>
        <p>Hata raporları, ilgili sorunun araştırılması ve giderilmesi amacıyla kullanılır.</p>

        <Sub>2.7. Web Sitemizi Ziyaret Ettiğinizde</Sub>
        <p>Web sitemizi ziyaret ettiğinizde çerezler, piksel etiketleri, web işaretçileri ve benzeri çevrim içi izleme teknolojileri aracılığıyla belirli bilgileri otomatik olarak toplayabiliriz.</p>
        <p>Bu bilgiler şunları içerebilir:</p>
        <List items={[
          'Web sitemizi ziyaret etme sıklığınız ve tarama geçmişiniz.',
          'Sitede geçirdiğiniz süre.',
          'IP adresiniz ve genel coğrafi konumunuz.',
          'Kullandığınız cihazın kimliği ve işletim sistemi.',
          'Cihaz türü.',
          'Tarayıcı türü ve sürümü.',
          'Mobil uygulama hataları ve sistem etkinlikleri.',
          'Hizmetlerimizle etkileşime geçmeden önce ziyaret ettiğiniz üçüncü taraf siteleri.',
        ]} />
        <p>Tarayıcı ayarlarınızı değiştirerek çerez kullanımını sınırlandırabilir veya engelleyebilirsiniz. Ancak bazı çerezlerin devre dışı bırakılması, web sitemizin veya Hizmetlerimizin belirli özelliklerinin düzgün çalışmamasına neden olabilir.</p>
        <p>Çerezlerin nasıl kullanıldığı hakkında daha fazla bilgi için 12. bölümdeki Çerez Politikası’nı inceleyebilirsiniz.</p>

        <Sub>2.8. Yaş Sınırlaması</Sub>
        <p>Ag Sohbet, 18 yaşından küçük kişilere yönelik değildir. Hizmetlerimiz 18 yaşını doldurmuş kişiler tarafından kullanılmak üzere tasarlanmıştır.</p>
        <p>18 yaşından küçük kişilerden bilerek kişisel bilgi toplamamayı amaçlarız. Bununla birlikte, yaş koşullarına uyulmasını sağlamak amacıyla doğum tarihi ve yaş doğrulama bilgileri işlenebilir.</p>
        <p>Bir kullanıcının 18 yaşından küçük olduğunu ve kişisel bilgilerinin uygun olmayan şekilde toplandığını öğrenirsek, yürürlükteki mevzuat ve uygulanabilir saklama yükümlülükleri doğrultusunda gerekli işlemleri yaparız.</p>
        <p>18 yaşından küçükseniz lütfen Ag Sohbet’i kullanmayın.</p>
      </Section>

      <Section title="3. Kullanıcı Profiliniz">
        <p>Uygulama üzerinden kullanıcı profilinizde (“Profil”) sağladığınız bilgileri görüntüleyebilir, kontrol edebilir ve değiştirebilirsiniz.</p>
        <p>Profiliniz; adınızı veya takma adınızı, profil fotoğraflarınızı, videolarınızı, ilgi alanlarınızı, kişisel açıklamanızı, konuştuğunuz dilleri ve doğum tarihinizi içerebilir.</p>
        <p>Profilinizdeki bilgiler, Uygulamanın özelliklerine ve gizlilik ayarlarınıza bağlı olarak diğer kullanıcılarla paylaşılabilir.</p>
        <p>Profiliniz diğer kullanıcılar tarafından keşfedilebilir. Uygulama, ilgili özellikler kapsamında diğer kullanıcılara yakınlığınız veya bağlantılarınız hakkında bilgi gösterebilir.</p>
        <p>İsterseniz Uygulama üzerinden başka bir kullanıcıyı engelleyebilirsiniz. Engelleme özelliği, ilgili kullanıcının sizinle etkileşimini ve profilinize erişimini sınırlandırmak amacıyla kullanılabilir. Bu özelliğin kapsamı Uygulamanın işleyişine bağlıdır.</p>
        <p>Facebook gibi üçüncü taraf bir hesapla giriş yapmanız durumunda, izin verilen bazı hesap bilgileri Profilinize aktarılabilir.</p>
        <p>Profil bilgilerinizi Uygulama ayarlarından değiştirebilir veya silebilirsiniz. Kişisel verilerinizin silinmesini talep etmek için 8. ve 14. bölümlerde açıklanan yöntemleri kullanabilirsiniz.</p>
        <p>Profilinize yalnızca paylaşmak istediğiniz bilgileri eklemenizi öneririz.</p>
      </Section>

      <Section title="4. Kişisel Verilerin İşlenmesinin Hukuki Dayanakları">
        <p>Kişisel verileriniz, yürürlükteki veri koruma mevzuatının izin verdiği hukuki dayanaklardan birine veya birkaçına dayanılarak işlenebilir.</p>
        <p>Sözleşmenin kurulması veya yerine getirilmesi: Hesabınızı oluşturmak, Hizmetlerimizi sunmak ve Kullanım Koşulları kapsamındaki yükümlülüklerimizi yerine getirmek için gerekli işlemler.</p>
        <p>Meşru menfaatler: Dolandırıcılığın önlenmesi, ağ ve bilgi güvenliğinin sağlanması, kötüye kullanımın tespit edilmesi, Hizmetlerimizin geliştirilmesi ve iç idari süreçlerin yürütülmesi gibi amaçlar. Bu işlemler, ilgili mevzuatın gerektirdiği menfaat dengesi gözetilerek gerçekleştirilir.</p>
        <p>Açık rıza veya diğer geçerli izinler: Belirli kişisel veri işleme faaliyetleri için mevzuatın gerektirdiği durumlarda açık rızanız alınabilir.</p>
        <p>Yasal yükümlülüklerin yerine getirilmesi: Yetkili kamu kurumlarının taleplerine yanıt vermek ve yasal saklama, bildirim veya raporlama yükümlülüklerini yerine getirmek.</p>
        <p>Kamu yararı veya hayati menfaatler: Yürürlükteki mevzuatın izin verdiği durumlarda kamu yararının veya kişilerin hayati menfaatlerinin korunması.</p>
        <p>Her veri işleme faaliyeti için uygun hukuki dayanak, işlemin niteliğine ve yürürlükteki mevzuata göre belirlenir.</p>
      </Section>

      <Section title="5. Bilgilerin Üçüncü Taraflarla Paylaşılması">
        <p>Hizmetlerimizi sunmak, işletmek, güvenliğini sağlamak ve geliştirmek amacıyla belirli bilgileri bağlı kuruluşlarımızla, iş ortaklarımızla ve hizmet sağlayıcılarımızla paylaşabiliriz.</p>
        <p>Bilgiler, yalnızca ilgili hizmetin gerektirdiği ölçüde ve yürürlükteki mevzuata uygun olarak paylaşılır.</p>
        <p>Paylaşılabilecek bilgiler ve taraflar şunları içerebilir:</p>
        <List items={[
          'Profil bilgileri: Ag Sohbet kullanıcı kimliğiniz, adınız veya takma adınız, cinsiyetiniz, bölgeniz, fotoğraflarınız, doğum tarihiniz, ilgi alanlarınız ve uygulama içindeki müzik tercihleriniz. Bu bilgilerin hangi bölümlerinin görüntüleneceği, ilgili özelliklere ve gizlilik ayarlarınıza bağlıdır.',
          'Diğer kullanıcılarla paylaşılan bilgiler: Uygulamada paylaşmayı seçtiğiniz içerikler ve diğer kullanıcılarla etkileşimleriniz kapsamında erişilebilir hâle gelen bilgiler.',
          'Teknik hizmet sağlayıcıları: Web sitemizi, Uygulamamızı ve diğer iş sistemlerimizi destekleyen bilgi teknolojileri şirketleri, altyapı sağlayıcıları ve teknik destek ekipleri.',
          'Analiz ve veri yönetimi hizmet sağlayıcıları: Verilerin yönetilmesi, analiz edilmesi ve Hizmetlerin geliştirilmesi için destek sunan kuruluşlar.',
          'İletişim ve pazarlama hizmet sağlayıcıları: Mevzuatın gerektirdiği izinlerin bulunması hâlinde e-posta, bildirim ve pazarlama iletişimlerini yönetmemize yardımcı olan kuruluşlar.',
          'Ödeme ve finansal hizmet sağlayıcıları: Ödeme işlemlerinin gerçekleştirilmesi için gerekli olan bankalar, ödeme kuruluşları, finansal kuruluşlar ve diğer ilgili sağlayıcılar.',
          'Telekomünikasyon ve güvenlik kuruluşları: Hizmetlerin sunulması, kimlik doğrulama ve güvenlik kontrolleri için gerekli olan ilgili kuruluşlar.',
          'Profesyonel danışmanlar: Hukuk danışmanları, denetçiler ve diğer profesyonel danışmanlar.',
          'Kamu kurumları ve yetkili makamlar: Yürürlükteki mevzuatın gerektirdiği durumlarda düzenleyici kurumlar, mahkemeler, kolluk kuvvetleri ve diğer yetkili kamu kurumları.',
          'Kurumsal işlem tarafları: Bir birleşme, devralma, varlık satışı veya benzeri kurumsal işlem kapsamında ilgili taraflar. Bu tür aktarımlar yürürlükteki mevzuata uygun şekilde gerçekleştirilir.',
        ]} />
        <p>Kişisel bilgileriniz, ilgili hukuki dayanak ve gerekli güvenceler bulunmaksızın üçüncü taraflara sınırsız şekilde açıklanmaz.</p>
      </Section>

      <Section title="6. Kişisel Bilgilerin Kullanım Amaçları">
        <p>Kişisel verilerinizi belirli, açık ve meşru amaçlar doğrultusunda işlemeyi hedefleriz. Verileriniz aşağıdaki amaçlarla kullanılabilir.</p>

        <Sub>6.1. Hizmetlerin Sunulması</Sub>
        <p>Kişisel bilgilerinizi aşağıdaki amaçlarla kullanabiliriz:</p>
        <List items={[
          'Uygulama içinde diğer kullanıcılarla bağlantı kurmanızı sağlamak.',
          'Profilinizi diğer kullanıcılarla paylaşmak.',
          'Sesli ve görüntülü arama özelliklerini sunmak.',
          'Uygulama üzerinden fotoğraf ve video göndermenizi sağlamak.',
          'İletişim kurduğunuz kullanıcıların adlarını göstermek.',
          'Mesajlaşma ve diğer iletişim özelliklerini çalıştırmak.',
          'Uygulama üzerinden oyun oynama, müzik paylaşma ve görüntülü aramalar sırasında müzik dinleme gibi özellikleri sunmak.',
          'Premium veya ücretli hizmetler gibi ek özellikleri sağlamak.',
          'Bizimle iletişime geçmenizi sağlamak.',
          'Ödeme işlemlerini gerçekleştirmek için ilgili hizmet sağlayıcılarla bağlantı kurmak.',
          'Hizmetlerin performansını analiz etmek ve kullanıcı deneyimini geliştirmek.',
          'Size uygun bağlantılar ve ilgili hizmet güncellemeleri sunmak.',
        ]} />

        <Sub>6.2. Hesap Yönetimi ve Hizmetlerin Geliştirilmesi</Sub>
        <p>Bilgileriniz aşağıdaki amaçlarla kullanılabilir:</p>
        <List items={[
          'Hesabınızı oluşturmak ve güncellemek.',
          'Kullanıcı profilinizi yönetmek.',
          'Hizmetlerimizle ilgili idari bildirimler, uyarılar ve bilgilendirmeler göndermek.',
          'Uygulama üzerinden kullanıcı bağlantıları kurmanızı kolaylaştırmak.',
          'Gizlilik ayarlarınıza ve izinlerinize bağlı olarak diğer kullanıcılarla ilgili konum veya ilgi alanı bilgilerini sunmak.',
          'Hizmetlerimizi geliştirmek için araştırmalar, anketler, istatistikler ve analizler gerçekleştirmek.',
          'Kullanıcıların Hizmetlerimizle nasıl etkileşim kurduğunu anlamak.',
          'İşlem geçmişi ve çevrim içi etkileşimler gibi verileri, uygun hukuki dayanak bulunduğunda değerlendirmek.',
          'Yeni özellikleri test etmek ve teknik sorunları gidermek.',
          'Üçüncü taraf ödeme sağlayıcıları aracılığıyla gerçekleştirilen işlemleri yönetmek.',
          'Mevzuatın izin verdiği ve gerekli izinlerin bulunduğu durumlarda pazarlama iletişimleri göndermek.',
          'Hizmetlerimiz, politikalarımız ve kullanım koşullarımız hakkında bilgi vermek.',
          'Sorularınızı, taleplerinizi ve şikâyetlerinizi yanıtlamak.',
          'Hizmetlerimizin sunulması için gerekli sözleşmesel yükümlülüklerimizi yerine getirmek.',
        ]} />

        <Sub>6.3. Güvenliğin, Bütünlüğün ve Emniyetin Korunması</Sub>
        <p>Kullanıcıların ve platformumuzun güvenliğini korumak amacıyla kişisel verileri uygun hukuki dayanaklarla işleyebiliriz.</p>
        <p>Bu işlemler aşağıdaki amaçları kapsayabilir:</p>
        <List items={[
          'Hesapları ve faaliyetleri doğrulamak.',
          'Dolandırıcılığı ve kötüye kullanımı önlemek.',
          'Şüpheli veya zararlı faaliyetleri tespit etmek.',
          'Kullanıcıların bildirdiği sorunları incelemek.',
          'Kullanım Koşullarımızın ve politikalarımızın ihlallerini değerlendirmek.',
          'Yasa dışı faaliyetleri önlemeye yönelik gerekli güvenlik işlemlerini gerçekleştirmek.',
          'Hizmetlerimizin bütünlüğünü ve güvenilirliğini korumak.',
          'İçerik denetimi ve kullanıcı güvenliği süreçlerini yürütmek.',
        ]} />
        <p>Bu amaçlarla otomatik tespit sistemleri ve gerektiğinde yetkili kişiler tarafından gerçekleştirilen incelemeler kullanılabilir.</p>

        <Sub>6.4. İşletme Yönetimi ve Yasal Yükümlülükler</Sub>
        <p>Kişisel verilerinizi aşağıdaki amaçlarla işleyebiliriz:</p>
        <List items={[
          'Yasal haklarımızı oluşturmak, kullanmak veya savunmak.',
          'Yasal, düzenleyici ve raporlama yükümlülüklerimizi yerine getirmek.',
          'Kullanıcı güvenliğini sağlamak ve içerikleri denetlemek.',
          'Kayıt ve veri yönetimi süreçlerini yürütmek.',
          'Birleşme, devralma veya varlık satışı gibi kurumsal işlemleri gerçekleştirmek.',
          'Hizmetlerimizi sunmak ve sözleşmeden doğan yükümlülüklerimizi yerine getirmek.',
          'Üçüncü taraflarla yaptığımız sözleşmeler kapsamındaki yükümlülüklerimizi yerine getirmek.',
        ]} />

        <Sub>6.5. Hizmetlerimiz Arasında Bilgi Kullanımı</Sub>
        <p>Ag Sohbet tarafından sunulan farklı uygulama ve hizmetler bulunması hâlinde, gerekli hukuki dayanaklar ve izinler çerçevesinde bilgileriniz bu hizmetler arasında ilişkilendirilebilir.</p>
        <p>Bunun amacı, Hizmetlerimizi kullanırken daha tutarlı ve kişiselleştirilmiş bir deneyim sunmaktır.</p>
        <p>Kişisel verileriniz, ilgili amaçla bağlantılı ve gerekli olan ölçüde işlenir.</p>
      </Section>

      <Section title="7. Kullanıcı İçeriklerinizi Paylaşabileceğiniz Taraflar">
        <p>Uygulamada gönüllü olarak paylaştığınız veya herkese açık hâle getirdiğiniz bilgiler, ilgili özelliklere ve gizlilik ayarlarınıza bağlı olarak diğer kullanıcılar tarafından görüntülenebilir.</p>
        <p>Bir içeriği herkese açık hâle getirdiğinizde diğer kullanıcılar bu içeriği kaydedebilir, kopyalayabilir veya yeniden paylaşabilir. Bu nedenle, içeriğin herkese açık hâle gelmesinden sonra dağıtımını tamamen engellemek mümkün olmayabilir.</p>
        <p>Bir kullanıcı içeriğini veya ekran görüntüsünü silseniz bile, daha önce diğer kullanıcılar tarafından kaydedilen kopyalar cihazlarda veya başka ortamlarda kalabilir.</p>
        <p>Diğer kullanıcılarla metin mesajları, fotoğraflar, videolar ve diğer iletişimler aracılığıyla paylaştığınız kişisel bilgiler bu kişiler tarafından görülebilir ve kullanılabilir.</p>
        <p>Bu nedenle, hassas veya özel bilgilerinizi paylaşmadan önce dikkatli olmanızı öneririz.</p>
        <p>Ag Sohbet, diğer kullanıcıların kendi cihazlarında sakladıkları veya yeniden paylaştıkları içerikler üzerinde her zaman kontrol sahibi olmayabilir. Bununla birlikte, tarafımıza bildirilen güvenlik ve gizlilik ihlallerini yürürlükteki mevzuat ve uygulanabilir politikalar çerçevesinde değerlendirebiliriz.</p>
      </Section>

      <Section title="8. Verilere Erişim ve Verilerin Silinmesi">
        <p>Uygulamada bizimle paylaşmayı seçtiğiniz bilgileri kontrol edebilirsiniz. Sağlanması zorunlu olan bilgiler, ilgili Hizmetin sunulabilmesi için gerekli olabilir.</p>
        <p>Kişisel bilgilerinizi Uygulama ayarlarından değiştirebilir veya silebilirsiniz. Cihazınızın izin ayarlarını kullanarak Uygulamanın konum, kamera, mikrofon ve fotoğraflar gibi bilgilere erişimini de yönetebilirsiniz.</p>
        <p>Hesabınızın veya kişisel verilerinizin silinmesini istediğiniz zaman talep edebilirsiniz.</p>
        <p>Hesap silme talebiniz bize ulaştığında, verilerinizi silmek için makul ve gerekli işlemleri gerçekleştiririz. Ancak yürürlükteki mevzuat, hukuki yükümlülükler, güvenlik gereklilikleri veya hukuki uyuşmazlıklar nedeniyle bazı bilgilerin belirli bir süre saklanması gerekebilir.</p>
        <p>Saklanması gereken veriler, ilgili saklama yükümlülüğü sona erdiğinde silinir veya uygun şekilde anonimleştirilir.</p>
        <p>Kişisel verilerinizin silinmesi, hesabınıza bağlı bazı özellikleri kullanamamanıza veya Hizmetlerimizin sunulmasının sona ermesine neden olabilir.</p>
        <p>Hesap iptaliyle ilgili ayrıntılar için 11. bölümü, taleplerin iletilmesi için 14. bölümü inceleyebilirsiniz.</p>
      </Section>

      <Section title="9. Verilerinizin Saklanma Süresi">
        <p>Kişisel verilerinizi yalnızca bu Gizlilik Politikası’nda açıklanan amaçlar için gerekli olduğu süre boyunca saklarız.</p>
        <p>Saklama süreleri; verinin türüne, kullanım amacına, güvenlik gerekliliklerine ve yürürlükteki mevzuata göre değişebilir.</p>
        <p>Yasalar daha uzun bir saklama süresi gerektiriyorsa ilgili veriler bu süre boyunca saklanabilir.</p>
        <p>Kişisel verilerinize artık ihtiyaç duyulmadığında, yürürlükteki mevzuata uygun olarak bu verileri güvenli şekilde siler, yok eder veya geri döndürülemez şekilde anonimleştiririz.</p>
        <p>Kayıt Verileri için 2.3. bölümde belirtilen 30 günlük saklama süresi geçerlidir. Diğer veri kategorileri için ilgili saklama gereklilikleri dikkate alınır.</p>
      </Section>

      <Section title="10. Doğrudan Pazarlama">
        <p>Pazarlama iletişimlerini almak için gerekli izinleri vermeniz hâlinde, kişisel bilgilerinizi yürürlükteki mevzuata uygun olarak aşağıdaki amaçlarla kullanabiliriz:</p>
        <List items={[
          'Ag Sohbet’in yeni özellikleri ve hizmetleri hakkında bilgi vermek.',
          'Coin teklifleri, kampanyalar, etkinlikler, yarışmalar ve promosyonlar hakkında bilgilendirme yapmak.',
          'Hizmetlerimizle ilgili haberler ve güncellemeler göndermek.',
          'Tercihlerinizi ve uygun hukuki dayanak bulunduğunda kullanım alışkanlıklarınızı değerlendirerek size daha ilgili teklifler sunmak.',
          'Web sitemiz, Uygulamamız, e-posta veya izin verilen diğer iletişim kanalları üzerinden pazarlama mesajları göndermek.',
        ]} />
        <p>Doğrudan pazarlama faaliyetleri için yürürlükteki mevzuatın gerektirdiği durumlarda önceden açık rızanızı veya ilgili izninizi alırız.</p>
        <p>Pazarlama iletişimlerini almak istemiyorsanız istediğiniz zaman abonelikten çıkabilir veya ilgili izninizi geri çekebilirsiniz.</p>
        <p>Pazarlama iletişimlerini reddetmeniz, gerekli olduğu durumlarda hesabınızla ilgili hizmet bildirimlerini almaya devam etmenizi engellemez.</p>
      </Section>

      <Section title="11. Hesabın İptali">
        <p>Ag Sohbet hesabınızı istediğiniz zaman Uygulama üzerinden hesap iptal talebi göndererek kapatma sürecine alabilirsiniz.</p>
        <p>Hesap iptal talebiniz alındıktan sonra hesabınız 30 günlük bir bekleme süresine alınır. Hesabınız, bu sürenin tamamlanmasıyla birlikte resmen iptal edilir.</p>
        <p>Bu 30 günlük süre boyunca Uygulamaya giriş yaptığınızda hesap iptal sürecine ilişkin hatırlatmalar gösterilebilir.</p>
        <p>Hesap iptal talebinizi 30 günlük süre içinde geri çekerseniz hesabınız iptal edilmez ve Uygulamayı kullanmaya devam edebilirsiniz.</p>
        <p>Talebinizi geri çekmezseniz, 30 günlük sürenin sonunda hesabınız resmen iptal edilir. Resmî iptalden sonra hesabınızın yeniden etkinleştirilmesi mümkün olmayabilir.</p>
        <p>Hesabınız resmen iptal edildiğinde, yürürlükteki mevzuatın gerektirdiği saklama yükümlülükleri ve diğer geçerli istisnalar dışında, hesabınızla ilişkili kişisel bilgiler silinir veya uygun şekilde anonimleştirilir.</p>
        <p>Hesap iptal talebinizin işleme alınması ya da verilerinizin silinmesi hakkında sorularınız varsa {CONTACT} adresinden bizimle iletişime geçebilirsiniz.</p>
      </Section>

      <Section title="12. Çerez Politikası">
        <p>Çerezler, web siteleri ve çevrim içi hizmetler tarafından ziyaret ettiğiniz sırada tarayıcınıza veya cihazınıza kaydedilen küçük metin dosyalarıdır.</p>
        <p>Ag Sohbet, web sitesinde ve desteklenen çevrim içi hizmetlerinde çerezler, piksel etiketleri, web işaretçileri ve benzeri teknolojilerden yararlanabilir.</p>
        <p>Bu teknolojiler aşağıdaki amaçlarla kullanılabilir:</p>
        <List items={[
          'Kullanıcıların kimliğini doğrulamak.',
          'Oturumun güvenli şekilde sürdürülmesini sağlamak.',
          'Kullanıcı tercihlerini ve ayarlarını hatırlamak.',
          'Hizmetlerin performansını ölçmek.',
          'Web sitesi ve uygulama kullanımını analiz etmek.',
          'Teknik sorunları tespit etmek.',
          'Kullanıcı deneyimini geliştirmek.',
          'Gerekli izinlerin ve uygun hukuki dayanakların bulunması hâlinde ilgili içerik ve reklamları sunmak.',
          'Reklam kampanyalarının etkinliğini değerlendirmek.',
          'Hizmetlerimizin kullanımına ilişkin istatistikler oluşturmak.',
        ]} />
        <p>Tarayıcı ayarlarınızı değiştirerek çerezleri kabul edebilir, reddedebilir veya cihazınızda saklanan çerezleri silebilirsiniz.</p>
        <p>Ancak bazı çerezlerin devre dışı bırakılması, web sitemizin veya Hizmetlerimizin belirli özelliklerinin düzgün çalışmasını engelleyebilir.</p>
        <p>Çerezler ve benzeri teknolojiler aracılığıyla gerçekleştirilen veri işleme faaliyetleri, yürürlükteki mevzuat ve gerektiğinde alınan izinler doğrultusunda yürütülür.</p>
      </Section>

      <Section title="13. Kişisel Veri Koruma Haklarınız">
        <p>Ag Sohbet olarak kişisel verileriniz üzerindeki haklarınızı kullanabilmenizi önemseriz.</p>
        <p>Yürürlükteki mevzuat kapsamında, durumunuza ve uygulanabilir hukuki koşullara bağlı olarak aşağıdaki haklara sahip olabilirsiniz.</p>
        <p>Kişisel verilerinize erişim hakkı: Kişisel verilerinizin işlenip işlenmediğini öğrenme ve işlendiği durumlarda bu veriler hakkında bilgi talep etme hakkına sahipsiniz.</p>
        <p>Bilgi talep etme hakkı: Kişisel verilerinizin hangi amaçlarla işlendiği, hangi taraflarla paylaşıldığı ve ilgili işleme faaliyetleri hakkında mevzuatın izin verdiği ölçüde bilgi isteyebilirsiniz.</p>
        <p>Düzeltme hakkı: Yanlış veya eksik kişisel verilerinizin düzeltilmesini talep edebilirsiniz. Örneğin hatalı yaş veya cinsiyet bilgileriyle ilgili olarak destek ekibimize başvurabilirsiniz.</p>
        <p>Silme veya yok etme hakkı: Yürürlükteki mevzuatta belirtilen şartlar kapsamında kişisel verilerinizin silinmesini veya yok edilmesini talep edebilirsiniz. Yasal saklama yükümlülükleri veya hukuki taleplerin korunması gibi nedenlerle bu hak bazı durumlarda sınırlanabilir.</p>
        <p>İşlemenin kısıtlanmasını talep etme hakkı: Mevzuatın izin verdiği durumlarda kişisel verilerinizin işlenmesinin sınırlandırılmasını talep edebilirsiniz.</p>
        <p>Veri taşınabilirliği hakkı: Uygulanabilir mevzuatın öngördüğü koşullar altında, sağladığınız kişisel verileri yapılandırılmış, yaygın olarak kullanılan ve makine tarafından okunabilir bir formatta almayı ve başka bir veri sorumlusuna aktarmayı talep edebilirsiniz.</p>
        <p>Rızayı geri çekme hakkı: İşlemenin hukuki dayanağı rızanız olduğunda, rızanızı istediğiniz zaman geri çekebilirsiniz. Rızanın geri çekilmesi, geri çekilmeden önce gerçekleştirilen işlemenin hukuka uygunluğunu geriye dönük olarak ortadan kaldırmaz.</p>
        <p>İtiraz hakkı: Yürürlükteki mevzuatın izin verdiği durumlarda, kişisel verilerinizin işlenmesine itiraz edebilirsiniz.</p>
        <p>Şikâyet hakkı: Kişisel verilerinizin işlenmesiyle ilgili bir ihlal olduğunu düşünüyorsanız ilgili veri koruma makamına başvurabilir veya bize şikâyet iletebilirsiniz.</p>
        <p>Bu hakların kapsamı ve kullanım koşulları, yürürlükteki mevzuata ve ilgili veri işleme faaliyetinin niteliğine göre belirlenir.</p>
      </Section>

      <Section title="14. Veri Koruma Haklarınızı Nasıl Kullanabilirsiniz?">
        <p>Kişisel bilgilerinizi güncellemek veya silmek istiyorsanız öncelikle Uygulama içindeki ilgili ayarları kullanabilirsiniz.</p>
        <p>Hesabınızın kapatılması, kişisel verilerinizin silinmesi, verileriniz hakkında bilgi alınması veya diğer veri koruma haklarınızın kullanılması için aşağıdaki e-posta adresinden bizimle iletişime geçebilirsiniz:</p>
        <p>Ag Sohbet Destek E-posta Adresi: <span className="font-semibold text-[#a5e4ff]">{CONTACT}</span></p>
        <p>Talebinizin işleme alınabilmesi için kimliğinizin veya hesabınızın doğrulanması gerekebilir. Bu durumda yalnızca talebinizin güvenli şekilde sonuçlandırılması için gerekli bilgileri isteyebiliriz.</p>
        <p>Talepleriniz, yürürlükteki mevzuatta belirtilen süreler ve koşullar çerçevesinde değerlendirilir.</p>
        <p>Kişisel verilerinizin işlenmesiyle ilgili bir şikâyetiniz varsa bize başvurabilir veya ilgili yerel veri koruma makamına şikâyette bulunabilirsiniz.</p>
      </Section>

      <Section title="15. Üçüncü Taraf Bağlantıları">
        <p>Uygulamamız veya web sitemiz üzerinden üçüncü taraflara ait web sitelerine ya da uygulamalara erişebilirsiniz.</p>
        <p>Bu üçüncü taraflar, kendi gizlilik politikalarına ve uygulamalarına göre hakkınızda bilgi toplayabilir.</p>
        <p>Ag Sohbet, üçüncü taraf web sitelerinin veya uygulamalarının sahibi değildir ve bunların gizlilik uygulamalarını doğrudan kontrol etmez.</p>
        <p>Bu nedenle, ilgili üçüncü taraf hizmetlerini kullanmadan önce onların gizlilik politikalarını incelemenizi öneririz.</p>
        <p>Bu Gizlilik Politikası, üçüncü taraf hizmetlerinin kendi veri işleme faaliyetlerini kapsamaz.</p>
      </Section>

      <Section title="16. Bilgi Güvenliği">
        <p>Kişisel bilgilerinizin güvenliğini ve gizliliğini korumak için uygun teknik ve idari önlemleri uygulamayı amaçlarız.</p>
        <p>Bilgilerinizi yetkisiz erişime, kaybolmaya, değiştirilmesine, açıklanmasına veya kötüye kullanılmasına karşı korumak için uygun güvenlik yöntemleri kullanabiliriz.</p>
        <p>Bu önlemler şunları içerebilir:</p>
        <List items={[
          'Parola koruması.',
          'Erişim yetkilendirmeleri.',
          'Erişim kayıtları.',
          'Sistem izleme.',
          'Teknik güvenlik kontrolleri.',
          'Güvenlik testleri.',
          'Yetkili personelle sınırlı erişim.',
          'Hizmet sağlayıcılarının erişimlerinin gerekli amaçlarla sınırlandırılması.',
        ]} />
        <p>Kişisel bilgilere yalnızca Hizmetlerimizi sunmak, işletmek, geliştirmek, sürdürmek, desteklemek veya bu Gizlilik Politikası’nda açıklanan diğer meşru amaçları yerine getirmek için ihtiyaç duyan yetkili kişiler erişebilir.</p>
        <p>İnternet ve dijital teknolojilerin doğası gereği hiçbir güvenlik sisteminin tamamen hatasız veya mutlak güvenli olduğu garanti edilemez. Bu nedenle, makul güvenlik önlemleri uygulamamıza rağmen bilgilerin her türlü riskten tamamen korunacağını garanti edemeyiz.</p>
        <p className="font-semibold text-white/90">Uluslararası veri aktarımı</p>
        <p>Kişisel verileriniz, Hizmetlerimizin sunulması için kullanılan teknik altyapıya bağlı olarak, ilgili hizmet sağlayıcılarının bulunduğu ülkelerde işlenebilir veya saklanabilir.</p>
        <p>Kişisel verilerin Türkiye dışına aktarılması gerektiğinde, yürürlükteki veri koruma mevzuatının öngördüğü aktarım koşulları ve uygun güvenceler dikkate alınır.</p>
        <p>Kişisel verilerinizin uluslararası aktarımı hakkında daha fazla bilgi almak için {CONTACT} adresinden bizimle iletişime geçebilirsiniz.</p>
        <p className="font-semibold text-white/90">Anonimleştirme ve toplu istatistikler</p>
        <p>Hizmetlerimizi geliştirmek, kullanım eğilimlerini analiz etmek, dolandırıcılığı önlemek ve güvenlik süreçlerini iyileştirmek amacıyla kişisel verileri uygun durumlarda takma adlandırabilir veya toplulaştırılmış istatistiklere dönüştürebiliriz.</p>
        <p>Bu veriler, ilgili hukuki gerekliliklere uygun şekilde değerlendirilir.</p>
      </Section>

      <Section title="17. Gizlilik Politikası’ndaki Değişiklikler">
        <p>Ag Sohbet, gerektiğinde bu Gizlilik Politikası’nı güncelleme hakkını saklı tutar.</p>
        <p>Güncel Gizlilik Politikası, Uygulama veya web sitemiz üzerinden yayımlanabilir.</p>
        <p>Kişisel verilerinizin işlenmesini önemli ölçüde etkileyen değişiklikler yapıldığında, yürürlükteki mevzuatın gerektirdiği durumlarda sizi Uygulama içi bildirim, açılır pencere, web sitesi duyurusu veya diğer uygun iletişim yöntemleriyle bilgilendirebiliriz.</p>
        <p>Güncel politikayı düzenli olarak incelemenizi öneririz.</p>
        <p>Değişikliklerin yürürlüğe girmesinden sonra Hizmetlerimizi kullanmaya devam etmeniz, yürürlükteki mevzuat kapsamında gerekli olan durumlarda güncellenmiş politikaya ilişkin bilgilendirme yapılmış olması anlamına gelir. Ancak bu durum, mevzuat gerektiriyorsa ayrıca alınması gereken açık rızanın yerine geçmez.</p>
      </Section>

      <Section title="18. İletişim Bilgileri">
        <p>Bu Gizlilik Politikası, kişisel verilerinizin işlenmesi veya veri koruma haklarınız hakkında sorularınız varsa bizimle aşağıdaki e-posta adresinden iletişime geçebilirsiniz.</p>
        <p>Uygulama Adı: Ag Sohbet</p>
        <p>Teknik Destek ve Gizlilik Talepleri: <span className="font-semibold text-[#a5e4ff]">{CONTACT}</span></p>
        <p>Hesap silme, kişisel verilerin güncellenmesi, veri erişim talepleri ve gizlilikle ilgili şikâyetleriniz için bu e-posta adresini kullanabilirsiniz.</p>
      </Section>

      <Section title="19. Son Güncelleme Tarihi">
        <p>Bu Gizlilik Politikası’nın son güncelleme tarihi: 21 Ekim 2026.</p>
      </Section>
    </div>
  );
}