// Oyunların "Nasıl oynanır" içeriği: değerler arka uçtaki motorlarla birebir aynıdır.
// Kurallar kısa cümlelerden oluşur; taş listesi "legend" altında görselleriyle verilir.
// legend.pays değerleri bahis katıdır; başlıklar dizilim/küme kademeleridir.
import { SLOT_SYMBOL_ART } from '../slotAssets';
import { FRUIT_SYMBOLS } from '../fruit/fruitConfig';
import { DEDE_ORB_ART } from '../dede/dedeAssets';
import { DEDE_SYMBOLS } from '../dede/dedeConfig';
import { SEKERLI_ART } from '../sekerli/sekerliAssets';
import { SYMBOLS as SEKERLI_SYMBOLS } from '../sekerli/sekerliConfig';
import { TEAMS } from '../futbol/futbolConfig';

// SLOT: 3-4-5 sembol dizilimi için bahis katı (slotEngine SYMBOLS ile aynı).
const SLOT_LEGEND = {
  headings: ["3'lü", "4'lü", "5'li"],
  note: 'Değerler bahis katıdır; dizilim soldan sağa sayılır.',
  rows: [
    { art: SLOT_SYMBOL_ART.ten, name: 'On', desc: 'Kart sembolü.', pays: [10, 30, 100] },
    { art: SLOT_SYMBOL_ART.jack, name: 'Vale', desc: 'Kart sembolü.', pays: [12, 40, 150] },
    { art: SLOT_SYMBOL_ART.queen, name: 'Kız', desc: 'Kart sembolü.', pays: [15, 50, 200] },
    { art: SLOT_SYMBOL_ART.king, name: 'Papaz', desc: 'Kart sembolü.', pays: [20, 70, 300] },
    { art: SLOT_SYMBOL_ART.ace, name: 'As', desc: 'Kart sembolü.', pays: [25, 100, 500] },
    { art: SLOT_SYMBOL_ART.gem, name: 'Elmas', desc: 'Nesne sembolü; kartlardan yüksek öder.', pays: [30, 150, 800] },
    { art: SLOT_SYMBOL_ART.eagle, name: 'Kartal', desc: 'Nesne sembolü.', pays: [40, 200, 1000] },
    { art: SLOT_SYMBOL_ART.tiger, name: 'Kaplan', desc: 'Nesne sembolü.', pays: [60, 300, 1500] },
    {
      art: SLOT_SYMBOL_ART.lion,
      name: 'Aslan',
      tag: 'JOKER',
      desc: 'Eksik sembolün yerine geçer; kendi diziliminde de öder.',
      pays: [100, 600, 3000],
    },
    {
      art: SLOT_SYMBOL_ART.free,
      name: 'Bedava Tur',
      tag: 'SCATTER',
      desc: '3 ve üzeri gelince hem öder hem 3 bedava tur verir.',
      pays: [20, 100, 500],
    },
    {
      art: SLOT_SYMBOL_ART.jackpot,
      name: 'Jackpot',
      tag: 'DEV ÖDEME',
      desc: 'Ayrıca ekranda 5 tane gelince bahsin 120 katı ödenir.',
      pays: [150, 1000, 5000],
    },
  ],
};

// MEYVE / ELİMİNSLOT: küme kademeleri 8-9, 10-11 ve 12+ (fruitEngine ile aynı).
const FRUIT_LEGEND = {
  headings: ['8-9', '10-11', '12+'],
  note: 'Değerler bahis katıdır; küme ekranın her yerinde sayılır, yan yana olması gerekmez.',
  rows: [
    { art: FRUIT_SYMBOLS.lollipop.art, name: 'Lolipop', desc: 'En yüksek ödemeli meyve.', pays: [144, 450, 1440] },
    { art: FRUIT_SYMBOLS.plum.art, name: 'Yaban Mersini', pays: [90, 270, 900] },
    { art: FRUIT_SYMBOLS.grapes.art, name: 'Üzüm', pays: [72, 216, 630] },
    { art: FRUIT_SYMBOLS.melon.art, name: 'Karpuz', pays: [54, 162, 450] },
    { art: FRUIT_SYMBOLS.apple.art, name: 'Elma', pays: [36, 108, 324] },
    { art: FRUIT_SYMBOLS.candy.art, name: 'Çilek', pays: [27, 72, 216] },
    { art: FRUIT_SYMBOLS.cherry.art, name: 'Kiraz', pays: [18, 54, 162] },
    {
      art: FRUIT_SYMBOLS.banana.art,
      name: 'Altın Muz',
      tag: 'BONUS',
      desc: '4 ve üzeri gelince 10 bedava tur kazandırır.',
    },
  ],
};

// DEDE: küme kademeleri 8-9, 10-11 ve 12+; ayrıca çarpan jetonları.
const ORB_LEGEND = Object.entries(DEDE_ORB_ART).map(([value, art]) => ({
  art,
  name: `${value}x Çarpan`,
  tag: 'JETON',
  desc: `Tur kazancını ${value} katına çıkarır; aynı turda birden fazlası katlanır.`,
}));

const DEDE_LEGEND = {
  headings: ['8-9', '10-11', '12+'],
  note: 'Değerler bahis katıdır; kazanan küme patlar, zincir tur boyunca sürer.',
  rows: [
    { art: DEDE_SYMBOLS.crown.art, name: 'Taç', desc: 'En yüksek ödemeli madalyon.', pays: [60, 180, 540] },
    { art: DEDE_SYMBOLS.amethyst.art, name: 'Mor Damla', pays: [50, 150, 450] },
    { art: DEDE_SYMBOLS.gem.art, name: 'Elmas', pays: [40, 120, 360] },
    { art: DEDE_SYMBOLS.topaz.art, name: 'Altın Sekizgen', pays: [35, 105, 315] },
    { art: DEDE_SYMBOLS.ring.art, name: 'Yüzük', pays: [30, 90, 270] },
    { art: DEDE_SYMBOLS.hour.art, name: 'Kum Saati', pays: [25, 75, 225] },
    { art: DEDE_SYMBOLS.chalice.art, name: 'Kupa', pays: [20, 60, 180] },
    { art: DEDE_SYMBOLS.bolt.art, name: 'Yakut Yıldız', pays: [10, 30, 90] },
    {
      art: DEDE_SYMBOLS.dede.art,
      name: 'Dede',
      tag: 'BONUS',
      desc: '4 ve üzeri gelince bonus öder ve 15 çevirme hakkını başlatır.',
    },
    ...ORB_LEGEND,
  ],
};

// ŞEKER: küme kademeleri 10-11, 12-13 ve 14+ (sekerEngine ile aynı).
const SEKER_LEGEND = {
  headings: ['10-11', '12-13', '14+'],
  note: 'Değerler bahis katıdır; küme ekranda kaç şeker varsa ona göre öder.',
  rows: [
    { seker: 'flower', name: 'Mor Çiçek', desc: 'En yüksek ödemeli şeker.', pays: [144, 450, 1440] },
    { seker: 'sphere', name: 'Mavi Top', pays: [90, 270, 900] },
    { seker: 'bean', name: 'Kırmızı Fasulye', pays: [72, 216, 630] },
    { seker: 'oval', name: 'Turuncu Şeker', pays: [54, 162, 450] },
    { seker: 'square', name: 'Yeşil Küp', pays: [36, 108, 324] },
    { seker: 'drop', name: 'Sarı Damla', pays: [18, 54, 162] },
    {
      seker: 'golden',
      name: 'Altın Şeker',
      tag: 'BONUS',
      desc: '4 ve üzeri gelince 10 bedava tur kazandırır; kendi kümesinde de öder.',
    },
  ],
};

// ŞEKERLİ MEYVE: satır ödemesi, soldan sağa 3/4/5 sembol için bahis katsayısı.
const SEKERLI_LEGEND = {
  headings: ["3'lü", "4'lü", "5'li"],
  note: 'Değerler bahis katıdır; yıldız ödemesi toplam bahis üzerinden hesaplanır.',
  rows: [
    { art: SEKERLI_ART.pink, name: SEKERLI_SYMBOLS.pink.name, pays: [3, 9, 28] },
    { art: SEKERLI_ART.blue, name: SEKERLI_SYMBOLS.blue.name, pays: [3, 13, 35] },
    { art: SEKERLI_ART.yellow, name: SEKERLI_SYMBOLS.yellow.name, pays: [5, 15, 43] },
    { art: SEKERLI_ART.green, name: SEKERLI_SYMBOLS.green.name, pays: [5, 19, 60] },
    { art: SEKERLI_ART.heart, name: SEKERLI_SYMBOLS.heart.name, pays: [6, 35, 119] },
    { art: SEKERLI_ART.lolli, name: SEKERLI_SYMBOLS.lolli.name, pays: [13, 60, 236] },
    {
      art: SEKERLI_ART.rainbow,
      name: SEKERLI_SYMBOLS.rainbow.name,
      tag: 'JOKER',
      desc: 'Eksik sembolün yerine geçer.',
      pays: [13, 60, 236],
    },
    {
      art: SEKERLI_ART.star,
      name: SEKERLI_SYMBOLS.star.name,
      tag: 'SCATTER',
      desc: '3 yıldız toplam bahsin 2 katı, 4 yıldız 10 katı, 5 yıldız 50 katı öder.',
    },
  ],
};

// ROULETTE: masa blokları ve jeton kademeleri.
const ROULETTE_LEGEND = {
  note: 'Çarkta 37 cep vardır: 0 yeşil, 18 kırmızı, 18 siyah.',
  rows: [
    { badge: 'x36', tone: 'green', name: '0 (YEŞİL)', desc: '0 cebine bahis yaparsan 36 katı öder.' },
    { badge: 'x3', tone: 'gold', name: '1-12 · 13-24 · 25-36', desc: 'Sayı bu bloklardan birine düşerse bahsin 3 katı ödenir.' },
    { badge: 'x2', tone: 'red', name: 'KIRMIZI', desc: 'Gelen sayı kırmızıysa bahsin 2 katı ödenir.' },
    { badge: 'x2', tone: 'black', name: 'SİYAH', desc: 'Gelen sayı siyahsa bahsin 2 katı ödenir.' },
    { badge: 'x2', tone: 'gold', name: 'ÇİFT / TEK', desc: 'Gelen sayı çift ya da tek olursa bahsin 2 katı ödenir.' },
    { badge: '500', tone: 'gold', name: 'Jeton kademeleri', desc: '500 · 1K · 10K · 100K jetonlarla bahis konur.' },
  ],
};

// ROCKET: çarpan rengi büyüklüğü gösterir.
const ROCKET_LEGEND = {
  note: 'Çarpan saniyede yaklaşık 1,09 kat büyür; 90x üstüne çıkan yüksek turlar ortalama 100 turda bir gelir, çakılma anında çekilmeyen bahis yanar.',
  rows: [
    { badge: '1-2x', tone: 'sky', name: 'Mavi çarpan', desc: 'Uçuşun ilk saniyeleri; roket mavi okunur.' },
    { badge: '2-8x', tone: 'green', name: 'Yeşil çarpan', desc: '2x ile 8x arası.' },
    { badge: '8-25x', tone: 'yellow', name: 'Sarı çarpan', desc: '8x ile 25x arası.' },
    { badge: '25x+', tone: 'red', name: 'Kırmızı çarpan', desc: '25x geçilince roket kırmızı okunur; kırmızı turlar 500x e kadar tırmanır.' },
    {
      badge: 'YÜKSEK',
      tone: 'gold',
      name: 'Yüksek tur',
      desc: 'Ortalama 100 turda bir gelir ve 90x · 100x · 120x · 150x · 200x · 250x · 300x · 400x · 500x kademelerinden birine oturur.',
    },
    { badge: 'AUTO', tone: 'gold', name: 'Otomatik çekilme', desc: '1,10x · 1,20x · 1,50x · 2x · 5x … 500x kademelerinden biri seçilir.' },
    { badge: '500-1M', tone: 'gold', name: 'Bahis kademeleri', desc: '500 coin ile 1.000.000 coin arası.' },
  ],
};

// ALTIN GOL: sekiz takım kartı ve çarpanları.
const FUTBOL_LEGEND = {
  note: 'Kazanan kart ibreyle seçilir; ödeme bahis x kart çarpanıdır.',
  rows: [
    ...TEAMS.map((team) => ({
      art: team.crest,
      name: team.name,
      tag: `x${team.x}`,
      desc: `Kazanan bu kart olursa ödemen bahis x ${team.x}.`,
    })),
    { badge: 'İBRE', tone: 'gold', name: 'Seçim ibresi', desc: 'Seçim bitince kare ortadan çıkar ve kartların üstünde dönerek kazananı seçer.' },
  ],
};

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
    legend: SLOT_LEGEND,
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
    legend: FRUIT_LEGEND,
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
      'Dede (scatter) 4, 5 ya da 6 gelince hem bonus öder hem 15 çevirme hakkını bedelsiz başlatır.',
      'Çevirme hakkı sürerken yeniden 4 skatter gelirse 15 tur bedelsiz eklenir; coin düşülmez ve ek hak seyrektir.',
    ],
    legend: DEDE_LEGEND,
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
    legend: SEKER_LEGEND,
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
    legend: SEKERLI_LEGEND,
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
      'Çarpan saniyede yaklaşık 1,09 kat büyür ve en yüksek 500x e kadar çıkar.',
      'Ortalama 100 turda bir yüksek tur gelir: çarpan 90x ile 500x arasındaki kademeye kadar tırmanır.',
      'ÇEKİL e bastığın andaki çarpan bahsinle çarpılıp bakiyene eklenir.',
      'Çakılma anında çekilmeyen bahisler yanar.',
    ],
    legend: ROCKET_LEGEND,
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
    legend: ROULETTE_LEGEND,
    facts: [
      'Çark sunucu saatine göre döner: bahis süresi bitince ızgara kapanır.',
      'Kazanan sayı çarkın üstünde rozetle gösterilir.',
      'Sağdaki şeritte son turların kazanan sayıları listelenir.',
    ],
    note: 'Çark 37 sayıdan oluşur; tur bitince yeni tur kendiliğinden açılır.',
  },

  futbol: {
    title: 'ALTIN GOL',
    tagline: 'TAKIM ÇARKI',
    legend: FUTBOL_LEGEND,
    note: 'Kazanan takım sekiz kart arasından her turda yeniden çekilir.',
  },
};

export const helpFor = (game) => GAME_HELP[game] || null;