// Oyunların "Nasıl oynanır" içeriği: değerler arka uçtaki motorlarla birebir aynıdır.
// Kurallar kısa cümlelerden oluşur; ek nesne/kademe notları "facts" altında toplanır.
export const GAME_HELP = {
  slot: {
    title: 'SLOT',
    tagline: '50 SATIR',
    rules: [
      'Toplam bahis = bahis x 50 satır; her turda bu tutar bakiyeden düşer.',
      'Aynı semboller soldan sağa bir ödeme satırında dizilince kazanır.',
      'Aslan joker sembolüdür: eksik sembolün yerine geçer.',
      '3 ve üzeri bedava tur sembolü hem ödeme yapar hem 3 bedava tur verir; bedava turlarda bahis alınmaz.',
      'Ekranda 5 jackpot sembolü gelince bahsin 120 katı ödenir; toplam bahis 5.000 coin altındaysa jackpot çıkmaz.',
    ],
    facts: [
      'Jackpot havuzları: kaybedilen turda bahis, kazanılan turda kazanç bulunduğun bahis kademesinin havuzunda birikir.',
      'Konsolda MİNİ · BIG · MEGA · X MEGA havuzları ve hepsinin toplamı olan GRAND JACKPOT görünür.',
      'AUTO açıkken turlar kendiliğinden çevrilir; DUR ile durdurulur.',
      'Toplam bahsin 10 katını geçen tur büyük kazanç sayılır.',
    ],
    note: 'Kazanç tur sonunda bakiyene eklenir; coin yüklemek için üstteki kese simgesine dokun.',
  },

  fruit: {
    title: 'MEYVE',
    tagline: 'KÜME SLOTU · 20 SATIR',
    rules: [
      'Toplam bahis = bahis x 20 satır.',
      'Aynı meyveden 8 ve üzeri gelince küme öder; yan yana olması gerekmez.',
      'Altın Muz bonus öder: 4 ve üzeri muz 10 bedava tur kazandırır.',
      'Bedava turlarda bahis alınmaz ve turlar sırayla çevrilir.',
    ],
    facts: [
      'Küme kademeleri: 8-9, 10-11 ve 12+ sembol; küme büyüdükçe ödeme katı artar.',
      'AUTO açıkken turlar kendiliğinden çevrilir.',
      'Toplam bahsin 10 katını geçen tur büyük kazanç sayılır.',
    ],
    note: 'Meyveler ekranın her yerinde sayılır; kazanç tur sonunda bakiyene eklenir.',
  },

  dede: {
    title: 'DEDE',
    tagline: 'ÇARPAN KÜRELERİ · 20 SATIR',
    rules: [
      'Toplam bahis = bahis x 20 satır.',
      'Aynı madalyondan 8 ve üzeri gelince küme öder; yan yana olması gerekmez.',
      'Kazanan küme patlar, yerine yeni madalyon düşer: zincir tur boyunca sürer.',
      'Zincir boyunca düşen çarpan jetonlarının toplamı tur kazancını çarpar.',
      'Dede sembolünden 4 ve üzeri gelince bonus öder.',
    ],
    facts: [
      'Küme kademeleri: 8-9, 10-11 ve 12+ madalyon.',
      'Aynı turda birden fazla jeton düşebilir; çarpan tur sonuna kadar katlanır.',
      'Tur kazancı bahsin 2000 katıyla sınırlıdır.',
      'AUTO açıkken turlar kendiliğinden çevrilir.',
    ],
    note: 'Çarpan jetonları tur sonunda toplanır ve tur kazancıyla çarpılır.',
  },

  seker: {
    title: 'ŞEKER',
    tagline: 'KÜME SLOTU · 20 SATIR',
    rules: [
      'Toplam bahis = bahis x 20 satır.',
      'Aynı şekerden 10 ve üzeri gelince küme öder; yan yana olması gerekmez.',
      'Altın Şeker bonus öder: 4 ve üzeri altın şeker 10 bedava tur kazandırır.',
      'Bedava turlarda bahis alınmaz ve turlar sırayla çevrilir.',
    ],
    facts: [
      'Küme kademeleri: 10-11, 12-13 ve 14+ şeker.',
      'AUTO açıkken turlar kendiliğinden çevrilir.',
      'Toplam bahsin 10 katını geçen tur büyük kazanç sayılır.',
    ],
    note: 'Şekerler ekranın her yerinde sayılır; kazanç tur sonunda bakiyene eklenir.',
  },

  sekerli: {
    title: 'ŞEKERLİ MEYVE',
    tagline: 'TAKLA ZİNCİRİ · 20 SATIR',
    rules: [
      'Toplam bahis = bahis x 20 satır.',
      'Kazanan semboller temizlenir, üstten yenisi düşer: zincir kazanç geldikçe sürer.',
      'Zincir adımı kazancı büyütür: 3. adım x2, 4. adım x3, 5. adım x5.',
      'Gökkuşağı şeker joker: eksik sembolün yerine geçer.',
      'Yıldız bonus 3 ve üzeri geldiğinde bahis katı öder ve ızgaradan temizlenir.',
    ],
    facts: [
      'Izgara 5 sütun x 4 satırdır ve 20 ödeme satırı vardır.',
      'Büyük kazanç toplam bahsin 7 katı, mega 16 katı, efsane 32 katıdır.',
      'Kazanan satırlar zincir boyunca parlar.',
    ],
    note: 'Zincir uzadıkça kazanç katlanır; kazanç tur sonunda bakiyene eklenir.',
  },

  rocket: {
    title: 'ROCKET',
    tagline: 'CRASH UÇUŞU',
    rules: [
      'Bahis kademeleri 500 coin ile 1.000.000 coin arasındadır.',
      '20 saniyelik bahis süresi bitince roket havalanır ve çarpan büyümeye başlar.',
      'Çarpan saniyede yaklaşık 1,09 kat büyür ve 500x e kadar çıkabilir.',
      'ÇEKİL e bastığın andaki çarpan bahsinle çarpılıp bakiyene eklenir.',
      'Çakılma anında çekilmeyen bahisler yanar.',
    ],
    facts: [
      'Otomatik çekilme kademesi 1,10x ile 500x arasında seçilir; 0 bırakırsan elle çekersin.',
      'Aynı turda iki ayrı bahis kutusuyla iki bahis oynayabilirsin.',
      'Geçmiş turlar ve çarpanlar üstteki defterde listelenir.',
    ],
    note: 'Roket çakılmadan çekilmek gerekir: beklemek kazancı da kaybı da büyütür.',
  },

  roulette: {
    title: 'ROULETTE',
    tagline: 'TEK SIFIR · 0 x36',
    rules: [
      'Turlar kendiliğinden başlar: 20 saniye bahis, 10 saniye çark.',
      'Jeton kademeleri 500 · 1K · 10K · 100K.',
      '0 yeşil x36, 1-12 / 13-24 / 25-36 blokları x3, KIRMIZI-SİYAH ve ÇİFT-TEK x2 öder.',
      'Kazanan cebe denk gelen bahis çarpanıyla ödenir; diğer bahisler kaybeder.',
    ],
    facts: [
      'Çark sunucu saatine göre döner: bahis süresi bitince ızgara kapanır.',
      'Kazanan sayı çarkın üstünde rozetle gösterilir.',
      'Sağdaki şeritte son turların kazanan sayıları listelenir.',
    ],
    note: 'Çark 37 sayıdan oluşur; tur bitince yeni tur kendiliğinden açılır.',
  },
};

export const helpFor = (game) => GAME_HELP[game] || null;