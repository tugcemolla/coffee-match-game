/* ==========================================================================
   LEVEL MECHANICS & 6 CHAPTER REGIONS CONFIGURATIONS (1-100+ Levels)
   ========================================================================== */

const GAME_TILES = [
  { id: 'espresso', icon: '☕', name: 'Espresso', color: '#6f4e37' },
  { id: 'croissant', icon: '🥐', name: 'Kruvasan', color: '#e5a93c' },
  { id: 'cup', icon: '🥤', name: 'Buzlu Kahve', color: '#3498db' },
  { id: 'bean', icon: '🫘', name: 'Kahve Çekirdeği', color: '#8d5b4c' },
  { id: 'donut', icon: '🍩', name: 'Donut', color: '#e74c3c' },
  { id: 'milk', icon: '🥛', name: 'Süt Şişesi', color: '#ecf0f1' }
];

const MAP_REGIONS = [
  { 
    id: 1, 
    name: 'Etiyopya • Harar Vadisi', 
    icon: '🇪🇹', 
    levels: [1, 20], 
    bg: 'linear-gradient(180deg, #3d2417 0%, #1e1008 100%)', 
    borderColor: '#f5b027', 
    desc: 'Kahvenin doğduğu topraklar! Orijinal Harar çekirdeklerini topla ve taze demleme seremonisini tamamla.',
    envIcons: ['🇪🇹', '☕', '🫘', '💧', '🍯']
  },
  { 
    id: 2, 
    name: 'İtalya • Napoli & Roma', 
    icon: '🇮🇹', 
    levels: [21, 40], 
    bg: 'linear-gradient(180deg, #1d401a 0%, #122b10 100%)', 
    borderColor: '#2ecc71', 
    desc: 'Espresso başkenti İtalya! İpeksi kremalı Ristretto ve klasik İtalyan espressolarını ustalıkla demla.',
    envIcons: ['🇮🇹', '☕', '✨', '🥛', '🥐']
  },
  { 
    id: 3, 
    name: 'Kolombiya • Medellin', 
    icon: '🇨🇴', 
    levels: [41, 60], 
    bg: 'linear-gradient(180deg, #4d2d14 0%, #261507 100%)', 
    borderColor: '#f39c12', 
    desc: 'And dağlarının yüksek irtifa gurme Arabica çekirdekleri! Yoğun aromalı dağ kahvelerini servis et.',
    envIcons: ['🇨🇴', '🫘', '☁️', '☕', '⛰️']
  },
  { 
    id: 4, 
    name: 'Brezilya • Santos Tarlaları', 
    icon: '🇧🇷', 
    levels: [61, 80], 
    bg: 'linear-gradient(180deg, #4a1515 0%, #260909 100%)', 
    borderColor: '#e74c3c', 
    desc: 'Dünyanın dev kahve üreticisi Brezilya! Çikolatalı ve fındıklı taze Santos çekirdeklerini kavur.',
    envIcons: ['🇧🇷', '🫘', '🔥', '⚙️', '🍫']
  },
  { 
    id: 5, 
    name: 'Vietnam • Hanoi Drip Hub', 
    icon: '🇻🇳', 
    levels: [81, 100], 
    bg: 'linear-gradient(180deg, #1e3a5f 0%, #0d1b2a 100%)', 
    borderColor: '#3498db', 
    desc: 'Geleneksel Phin filtresi ve meşhur tatlı Yumurta Kahvesi (Cà Phê Trứng) katmanlarını mükemmel diz.',
    envIcons: ['🇻🇳', '🥛', '✨', '☕', '🍦']
  },
  { 
    id: 6, 
    name: 'Jamaika • Blue Mountain', 
    icon: '🇯🇲', 
    levels: [101, 120], 
    bg: 'linear-gradient(180deg, #381a42 0%, #1c0a24 100%)', 
    borderColor: '#9b59b6', 
    desc: 'Dünyanın en nadir ve lüks Blue Mountain kahvesi! Zirvedeki Altın Kahve İmparatoru ol!',
    envIcons: ['🇯🇲', '👑', '🏆', '💎', '☕']
  }
];

const MECHANIC_DEFINITIONS = {
  BASIC: { name: 'Temel Match-3 Öğretici', icon: '☕', desc: '4 temel taş ile eşleştirme yap, sipariş hedeflerini tamamla ve kahve çekirdeği kazan!' },
  SPECIAL_TILES: { name: 'Özel Taşlar & Kombolar', icon: '⚡', desc: '4 ve 5 taşlı eşleştirmelerle Çizgili Kahve ve Bomba komboları oluştur!' },
  ICE: { name: 'Buz Kaplaması', icon: '🧊', desc: 'Buz kaplı taşların bitişiğinde eşleşme yaparak buzları tamamen temizle!' },
  CRATE: { name: 'Ahşap Kasa (Koli)', icon: '📦', desc: 'Ahşap kolileri temizlemek için bitişiğinde patlatma yap!' },
  FOAM: { name: 'Süt Köpüğü', icon: '🥛', desc: 'Dikkat et! Süt köpüğü her hamlede bitişik hücrelere yayılır.' },
  CABINET: { name: 'Dolap (Katmanlı Engel)', icon: '🗄️', desc: 'Royal tarzı katmanlı dolap! İçindeki taşlara erişmek için yanında 2-3 kez eşleşme yap.' },
  COMPLEX_GOALS: { name: 'Çoklu Sipariş & Teras', icon: '🌇', desc: 'Aynı anda Donut, Latte ve Çekirdek toplayarak zengin siparişleri teslim et!' },
  MASTER_COMBINED: { name: 'Usta Birleşik Engeller', icon: '👑', desc: 'Dolap, Buz ve Ahşap Kasa aynı tahtada! Booster kombolarını stratejik kullan.' }
};

class LevelMechanicsManager {
  static getLevelConfig(levelNumber) {
    const validLevel = parseInt(levelNumber) || 1;
    const region = MAP_REGIONS.find(r => validLevel >= r.levels[0] && validLevel <= r.levels[1]) || MAP_REGIONS[0];

    let mechanicType = 'BASIC';
    let allowedTileIds = ['espresso', 'croissant', 'cup', 'bean']; // Default 4 basic tiles
    let moves = 25;
    let goals = [];

    if (validLevel <= 10) {
      // Bölüm 1–10: Öğretici - Sadece 4 Taş, Yüksek Hamle, Kolay Hedefler
      mechanicType = 'BASIC';
      allowedTileIds = ['espresso', 'croissant', 'cup', 'bean'];
      moves = Math.max(25, 30 - Math.floor((validLevel - 1) / 2));
      goals = [
        { type: 'espresso', target: 8 + Math.floor(validLevel * 0.8), icon: '☕' },
        { type: 'croissant', target: 6 + Math.floor(validLevel * 0.6), icon: '🥐' }
      ];
    } else if (validLevel <= 20) {
      // Bölüm 11–20: Özel Taşlar & Çeşitli Siparişler -> Bahçe Açılışı
      mechanicType = 'SPECIAL_TILES';
      allowedTileIds = ['espresso', 'croissant', 'cup', 'bean', 'donut', 'milk'];
      moves = Math.max(22, 26 - Math.floor((validLevel - 10) / 2));
      goals = [
        { type: 'espresso', target: 10 + Math.floor(validLevel * 0.5), icon: '☕' },
        { type: 'donut', target: 8 + Math.floor((validLevel - 10) * 0.7), icon: '🍩' },
        { type: 'milk', target: 6 + Math.floor((validLevel - 10) * 0.5), icon: '🥛' }
      ];
    } else if (validLevel <= 40) {
      // Bölüm 21–40: İlk Engeller (Ahşap Kasa 📦, Köpük 🥛, Buz 🧊)
      allowedTileIds = ['espresso', 'croissant', 'cup', 'bean', 'donut', 'milk'];
      moves = Math.max(20, 24 - Math.floor((validLevel - 20) / 3));

      if (validLevel <= 27) {
        mechanicType = 'ICE';
        goals = [
          { type: 'ice', target: 6 + (validLevel - 20), icon: '🧊' },
          { type: 'cup', target: 12 + (validLevel - 20), icon: '🥤' }
        ];
      } else if (validLevel <= 34) {
        mechanicType = 'CRATE';
        goals = [
          { type: 'crate', target: 5 + (validLevel - 27), icon: '📦' },
          { type: 'croissant', target: 14 + (validLevel - 27), icon: '🥐' }
        ];
      } else {
        mechanicType = 'FOAM';
        goals = [
          { type: 'foam', target: 6 + (validLevel - 34), icon: '🥛' },
          { type: 'espresso', target: 15 + (validLevel - 34), icon: '☕' }
        ];
      }
    } else if (validLevel <= 60) {
      // Bölüm 41–60: Dolap / Cabinet & Katmanlı Royal Kingdom Engelleri
      mechanicType = 'CABINET';
      allowedTileIds = ['espresso', 'croissant', 'cup', 'bean', 'donut', 'milk'];
      moves = Math.max(18, 22 - Math.floor((validLevel - 40) / 4));
      goals = [
        { type: 'cabinet', target: 4 + Math.floor((validLevel - 40) * 0.4), icon: '🗄️' },
        { type: 'donut', target: 12 + Math.floor((validLevel - 40) * 0.5), icon: '🍩' },
        { type: 'bean', target: 10 + Math.floor((validLevel - 40) * 0.5), icon: '🫘' }
      ];
    } else if (validLevel <= 80) {
      // Bölüm 61–80: Karmaşık Çoklu Hedefler -> Teras Açılışı
      mechanicType = 'COMPLEX_GOALS';
      allowedTileIds = ['espresso', 'croissant', 'cup', 'bean', 'donut', 'milk'];
      moves = Math.max(18, 22 - Math.floor((validLevel - 60) / 4));
      goals = [
        { type: 'cup', target: 14 + Math.floor((validLevel - 60) * 0.4), icon: '🥤' },
        { type: 'donut', target: 12 + Math.floor((validLevel - 60) * 0.4), icon: '🍩' },
        { type: 'ice', target: 8 + Math.floor((validLevel - 60) * 0.3), icon: '🧊' }
      ];
    } else {
      // Bölüm 81–100+: Usta Birleşik Engeller (Dolap + Buz + Kasa) & Kombo Stratejisi
      mechanicType = 'MASTER_COMBINED';
      allowedTileIds = ['espresso', 'croissant', 'cup', 'bean', 'donut', 'milk'];
      moves = Math.max(16, 20 - Math.floor((validLevel - 80) / 5));
      goals = [
        { type: 'cabinet', target: 4 + Math.floor((validLevel - 80) * 0.3), icon: '🗄️' },
        { type: 'crate', target: 6 + Math.floor((validLevel - 80) * 0.3), icon: '📦' },
        { type: 'ice', target: 8 + Math.floor((validLevel - 80) * 0.3), icon: '🧊' },
        { type: 'espresso', target: 20, icon: '☕' }
      ];
    }

    const isSuperHard = validLevel > 5 && validLevel % 10 === 0;
    const isHard = !isSuperHard && validLevel > 5 && validLevel % 5 === 0;

    let difficultyTag = 'NORMAL';
    if (isSuperHard) {
      difficultyTag = 'SUPER_HARD';
      moves = Math.max(14, moves - 5);
    } else if (isHard) {
      difficultyTag = 'HARD';
      moves = Math.max(16, moves - 3);
    }

    return {
      level: validLevel,
      region: region,
      mechanic: MECHANIC_DEFINITIONS[mechanicType],
      mechanicType: mechanicType,
      allowedTiles: allowedTileIds,
      moves: moves,
      goals: goals,
      isHard: isHard,
      isSuperHard: isSuperHard,
      difficultyTag: difficultyTag,
      coinRewardMultiplier: isSuperHard ? 3 : (isHard ? 2 : 1)
    };
  }
}
