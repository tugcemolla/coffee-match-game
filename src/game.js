/* ==========================================================================
   COFFEE MATCH ☕ - MAIN APPLICATION CONTROLLER
   ========================================================================== */

class CoffeeMatchApp {
  constructor() {
    this.state = {
      coins: 50000,
      coffeeBeans: 999,
      lives: 5,
      currentLevel: 3,
      completedLevel: 2,
      levelStars: { 1: 3, 2: 3 },
      cafeState: {
        wall: 1,
        floor: 1,
        table: 1,
        machine: 1,
        shelf: 1,
        plant: 1,
        display: 1,
        sign: 1
      },
      boosters: {
        bomb: 99,
        steam: 99,
        lightning: 99,
        shuffle: 99
      },
      avatar: '👨‍🍳',
      user: null
    };

    this.activeScreen = 'screenSplash';
    this.loadLocalState();
    this.bindNavigation();
    this.bindSplashEvents();
    this.bindUI();
    this.bindBoosterButtons();
    this.initApp();
  }

  // Load Saved Game State from LocalStorage
  loadLocalState() {
    try {
      const saved = localStorage.getItem('coffeematch_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.state = {
          ...this.state,
          ...parsed,
          coffeeBeans: Math.max(999, parsed.coffeeBeans || 999),
          cafeState: {
            ...this.state.cafeState,
            ...(parsed.cafeState || {})
          },
          boosters: {
            bomb: Math.max(99, parsed.boosters?.bomb || 99),
            steam: Math.max(99, parsed.boosters?.steam || 99),
            lightning: Math.max(99, parsed.boosters?.lightning || 99),
            shuffle: Math.max(99, parsed.boosters?.shuffle || 99)
          }
        };
      } else {
        this.state.coffeeBeans = 99;
        this.state.boosters = { bomb: 99, steam: 99, lightning: 99, shuffle: 99 };
      }
    } catch (e) {
      console.warn('LocalStorage yüklenirken hata oluştu:', e);
    }
  }

  // Save Game State to LocalStorage & Backend Sync
  saveState() {
    try {
      localStorage.setItem('coffeematch_state', JSON.stringify(this.state));
    } catch (e) {
      console.warn('LocalStorage kaydedilirken hata oluştu:', e);
    }

    if (apiClient && apiClient.token) {
      apiClient.syncCafeState(this.state.cafeState);
    }

    this.updateTopBarUI();
  }

  initApp() {
    this.updateTopBarUI();

    // Render 6 Chapter-Based Regions Map
    levelMapManager.renderMap(
      this.state.completedLevel,
      this.state.levelStars,
      (levelId) => this.startLevel(levelId)
    );

    // Render Initial Cafe Scene
    cafeManager.renderRenovationTasks(
      this.state.coffeeBeans,
      this.state.cafeState,
      (itemKey, chosenOption) => this.handleCafeUpgrade(itemKey, chosenOption)
    );

    // Show Entrance Splash Screen at Launch
    this.switchScreen('screenSplash');
    this.startSplashProgress();
  }

  startSplashProgress() {
    const fill = document.getElementById('splashProgressFill');
    const status = document.getElementById('splashStatusText');
    if (!fill) return;

    fill.style.width = '0%';
    const statuses = [
      'İpeksi Süt Köpüğü Hazırlanıyor... 🥛',
      'Kahve Çekirdekleri Kavruluyor... 🫘',
      'Fırından Sıcak Kruvasanlar Çıkıyor... 🥐',
      'Siparişiniz Hazır! Kafeye Hoş Geldiniz! ☕'
    ];

    let step = 0;
    const interval = setInterval(() => {
      step++;
      const pct = Math.min(100, step * 25);
      fill.style.width = `${pct}%`;
      if (status && statuses[step - 1]) {
        status.textContent = statuses[step - 1];
      }
      if (pct >= 100) {
        clearInterval(interval);
      }
    }, 550);
  }

  // Bind Entrance Splash Screen Buttons
  bindSplashEvents() {
    const enterGame = () => {
      try {
        if (typeof audioEngine !== 'undefined' && audioEngine.playVictoryFanfare) {
          audioEngine.playVictoryFanfare();
        }
      } catch (e) {}
      this.switchScreen('screenHome');
    };

    document.getElementById('btnSplashEnter')?.addEventListener('click', enterGame);
    document.getElementById('btnSplashCup')?.addEventListener('click', enterGame);
    document.getElementById('btnSplashAuth')?.addEventListener('click', () => {
      this.openRegisterModal();
    });
  }

  updateBoosterBadges() {
    const cBomb = document.getElementById('countBomb');
    const cSteam = document.getElementById('countSteam');
    const cLight = document.getElementById('countLightning');
    const cShuff = document.getElementById('countShuffle');

    if (cBomb) cBomb.textContent = this.state.boosters.bomb || 99;
    if (cSteam) cSteam.textContent = this.state.boosters.steam || 99;
    if (cLight) cLight.textContent = this.state.boosters.lightning || 99;
    if (cShuff) cShuff.textContent = this.state.boosters.shuffle || 99;
  }

  // Bind Match-3 Booster Buttons (Bomb 💣, Steam 💨, Lightning ⚡, Shuffle 🔀)
  bindBoosterButtons() {
    const handleBoosterClick = async (type) => {
      if (this.activeScreen !== 'screenGame') return;
      boardEngine.isGameActive = true;
      boardEngine.isAnimating = false;

      if (!this.state.boosters[type] || this.state.boosters[type] <= 0) {
        this.state.boosters[type] = 99;
        this.saveState();
        this.updateBoosterBadges();
      }

      if (type === 'bomb') {
        document.body.classList.add('shake-fx');
        setTimeout(() => document.body.classList.remove('shake-fx'), 500);

        if (typeof particleEngine !== 'undefined' && particleEngine.flyRewardIcon) {
          particleEngine.flyRewardIcon(window.innerWidth / 2, window.innerHeight / 2, 120, 30, '💣', 12);
        }

        await boardEngine.useBombBooster();
        this.state.boosters.bomb--;
        this.saveState();
        this.updateBoosterBadges();
        try { if (typeof audioEngine !== 'undefined') audioEngine.playMatchChime(); } catch(e){}

      } else if (type === 'steam') {
        if (typeof particleEngine !== 'undefined' && particleEngine.flyRewardIcon) {
          particleEngine.flyRewardIcon(window.innerWidth / 2, window.innerHeight / 2, 120, 30, '💨', 10);
        }

        await boardEngine.useSteamBooster();
        this.state.boosters.steam--;
        this.saveState();
        this.updateBoosterBadges();
        try { if (typeof audioEngine !== 'undefined') audioEngine.playMatchChime(); } catch(e){}

      } else if (type === 'lightning') {
        const strobe = document.getElementById('lightningScreenStrobe');
        if (strobe) {
          strobe.classList.add('active');
          setTimeout(() => strobe.classList.remove('active'), 600);
        }

        await boardEngine.useLightningBooster();
        this.state.boosters.lightning--;
        this.saveState();
        this.updateBoosterBadges();
        try { if (typeof audioEngine !== 'undefined') audioEngine.playMatchChime(); } catch(e){}

      } else if (type === 'shuffle') {
        const grid = document.getElementById('gameBoardGrid');
        if (grid) {
          grid.style.transition = 'transform 0.4s ease';
          grid.style.transform = 'rotate(360deg) scale(0.95)';
          setTimeout(() => {
            grid.style.transform = 'none';
          }, 400);
        }

        boardEngine.shuffleBoard();
        this.state.boosters.shuffle--;
        this.saveState();
        this.updateBoosterBadges();
        try { if (typeof audioEngine !== 'undefined') audioEngine.playShuffleSound(); } catch(e){}
      }
    };

    const addBoosterListener = (id, type) => {
      const el = document.getElementById(id);
      if (el) {
        let isFired = false;
        const fire = (e) => {
          if (isFired) return;
          isFired = true;
          if (e) {
            e.preventDefault();
            e.stopPropagation();
          }
          handleBoosterClick(type);
          setTimeout(() => { isFired = false; }, 400);
        };
        el.onclick = fire;
        el.ontouchend = fire;
      }
    };

    addBoosterListener('boostBomb', 'bomb');
    addBoosterListener('boostSteam', 'steam');
    addBoosterListener('boostLightning', 'lightning');
    addBoosterListener('boostShuffle', 'shuffle');

    this.updateBoosterBadges();
  }

  // Handle Cafe Item Level Upgrade
  handleCafeUpgrade(itemKey, chosenOption) {
    const item = RENOVATION_ITEMS[itemKey];
    if (!item) return;

    if (this.state.coffeeBeans >= item.cost) {
      this.state.coffeeBeans -= item.cost;
      this.state.cafeState[itemKey] = chosenOption;
      this.saveState();
      cafeManager.renderRenovationTasks(this.state.coffeeBeans, this.state.cafeState, (k, o) => this.handleCafeUpgrade(k, o));
    } else {
      this.showCustomRewardModal({
        icon: '🫘',
        title: 'YETERSİZ ÇEKİRDEK!',
        text: `${item.cost} 🫘 Kahve Çekirdeği gerekiyor.`,
        sub: 'Eşleştirme bölümlerini oynayarak çekirdek kazanabilirsin! ☕'
      });
    }
  }

  getDestinationRequiredLevel(dest) {
    const reqs = {
      'ethiopia': { lvl: 1, reg: '1. Bölge (Etiyopya)' },
      'italy': { lvl: 21, reg: '2. Bölge (İtalya)' },
      'colombia': { lvl: 41, reg: '3. Bölge (Kolombiya)' },
      'brazil': { lvl: 61, reg: '4. Bölge (Brezilya)' },
      'vietnam': { lvl: 81, reg: '5. Bölge (Vietnam)' },
      'jamaica': { lvl: 101, reg: '6. Bölge (Jamaika)' }
    };
    return reqs[dest] || { lvl: 1, reg: '1. Bölge' };
  }

  renderTourTab() {
    const beanVal = document.getElementById('tourBeanCount');
    const stampVal = document.getElementById('tourStampCount');
    if (beanVal) beanVal.textContent = (this.state.coffeeBeans || 999).toLocaleString();

    if (!this.state.tourStamps) this.state.tourStamps = {};
    const count = Object.keys(this.state.tourStamps).length;
    if (stampVal) stampVal.textContent = `${count} / 6`;

    const currentLvl = (this.state.completedLevel || 0) + 1;

    // Update buttons & badges
    const cards = document.querySelectorAll('.tour-card');
    cards.forEach(card => {
      const dest = card.dataset.dest;
      const isStamped = this.state.tourStamps[dest];
      const badge = card.querySelector('.stamp-badge-status');
      const btn = card.querySelector('.btn-travel');
      const req = this.getDestinationRequiredLevel(dest);

      const isRegionUnlocked = currentLvl >= req.lvl;

      if (isStamped) {
        card.classList.add('unlocked');
        if (badge) {
          badge.textContent = '✅ DAMGALANDI';
          badge.classList.add('stamped');
        }
        if (btn) {
          btn.textContent = '☕ ZİYARET ET & DEMLE!';
          btn.disabled = false;
          btn.style.opacity = '1';
        }
      } else if (!isRegionUnlocked) {
        card.classList.remove('unlocked');
        if (badge) {
          badge.textContent = `🔒 SEVİYE ${req.lvl}'DE AÇILIR`;
          badge.classList.remove('stamped');
        }
        if (btn) {
          btn.textContent = `🔒 SEVİYE ${req.lvl} KİLİTLİ`;
          btn.style.opacity = '0.75';
        }
      } else {
        card.classList.add('unlocked');
        if (badge) {
          badge.textContent = '🔓 UÇUŞA HAZIR';
          badge.classList.remove('stamped');
        }
        if (btn) {
          const cost = card.dataset.cost || 5;
          btn.textContent = `🎫 VİP BİLET AL (${cost} 🫘)`;
          btn.disabled = false;
          btn.style.opacity = '1';
        }
      }
    });

    this.bindTourEvents();
  }

  bindTourEvents() {
    document.querySelectorAll('.btn-travel, .tour-card').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const dest = btn.dataset.dest || e.currentTarget.dataset.dest;
        const cost = parseInt(btn.dataset.cost || e.currentTarget.dataset.cost) || 5;
        if (dest) {
          this.handleWorldTourTravel(dest, cost);
        }
      };
    });
  }

  handleWorldTourTravel(dest, cost) {
    if (!this.state.tourStamps) this.state.tourStamps = {};

    const isAlreadyStamped = this.state.tourStamps[dest];
    const currentLvl = (this.state.completedLevel || 0) + 1;
    const req = this.getDestinationRequiredLevel(dest);

    if (!isAlreadyStamped && currentLvl < req.lvl) {
      this.showCustomRewardModal({
        icon: '🔒',
        title: '🔒 BÖLGE KİLİTLİ!',
        text: `Bu ülkeye VIP uçak bileti alabilmek için Haritada ${req.reg} (Seviye ${req.lvl}) aşamasına ulaşmalısın!`,
        sub: `Mevcut Seviyen: ${currentLvl} | Bölüm geçerek rotanın kilidini aç! ✈️`,
        onConfirm: () => {
          this.switchScreen('screenMap');
        }
      });
      return;
    }

    if (!isAlreadyStamped) {
      if ((this.state.coffeeBeans || 0) < cost) {
        this.state.coffeeBeans = 999;
      }
      this.state.coffeeBeans -= cost;
      this.state.tourStamps[dest] = true;

      if (dest === 'ethiopia') this.state.coins = (this.state.coins || 0) + 1000;
      else if (dest === 'italy') this.state.coins = (this.state.coins || 0) + 2500;
      else if (dest === 'colombia') this.state.coins = (this.state.coins || 0) + 5000;
      else if (dest === 'brazil') this.state.coins = (this.state.coins || 0) + 8000;
      else if (dest === 'vietnam') this.state.coins = (this.state.coins || 0) + 12000;
      else if (dest === 'jamaica') this.state.coins = (this.state.coins || 0) + 25000;

      this.saveState();
      this.updateTopBarUI();
      this.renderTourTab();
    }

    let destName = 'ETİYOPYA';
    let flag = '🇪🇹';
    if (dest === 'ethiopia') { destName = 'ETİYOPYA'; flag = '🇪🇹'; }
    else if (dest === 'italy') { destName = 'İTALYA'; flag = '🇮🇹'; }
    else if (dest === 'colombia') { destName = 'KOLOMBİYA'; flag = '🇨🇴'; }
    else if (dest === 'brazil') { destName = 'BREZİLYA'; flag = '🇧🇷'; }
    else if (dest === 'vietnam') { destName = 'VİETNAM'; flag = '🇻🇳'; }
    else if (dest === 'jamaica') { destName = 'JAMAYKA'; flag = '🇯🇲'; }

    let cityCode = 'ETH';
    let cityName = 'HARAR';
    if (dest === 'italy') { cityCode = 'ITA'; cityName = 'NAPOLİ'; }
    else if (dest === 'colombia') { cityCode = 'COL'; cityName = 'MEDELLIN'; }
    else if (dest === 'brazil') { cityCode = 'BRA'; cityName = 'SANTOS'; }
    else if (dest === 'vietnam') { cityCode = 'VIE'; cityName = 'HANOI'; }
    else if (dest === 'jamaica') { cityCode = 'JAM'; cityName = 'BLUE MTN'; }

    // Trigger 3D VIP Flight Boarding Pass Animation Overlay EVERY SINGLE TIME!
    const overlay = document.getElementById('flightBoardingOverlay');
    const boardFlag = document.getElementById('boardFlag');
    const boardDestName = document.getElementById('boardDestName');
    const boardRewardText = document.getElementById('boardRewardText');
    const boardCityCode = document.getElementById('boardCityCode');
    const boardCityName = document.getElementById('boardCityName');

    let rewardText = '+1,000 🪙 Coin';
    if (dest === 'italy') rewardText = '+2,500 🪙 Coin & ⚡ Şurup';
    if (dest === 'colombia') rewardText = '+5,000 🪙 Coin & ❤️ Sınırsız Can';
    if (dest === 'brazil') rewardText = '+8,000 🪙 Coin & 👨‍🍳 Altın Avatar';
    if (dest === 'vietnam') rewardText = '+12,000 🪙 Coin & 💣 5 Bomba';
    if (dest === 'jamaica') rewardText = '+25,000 🪙 Coin & 👑 İmparator Ünvanı';

    if (boardFlag) boardFlag.textContent = flag;
    if (boardDestName) boardDestName.textContent = `${destName} • KAFE ROTASI`;
    if (boardRewardText) boardRewardText.textContent = rewardText;
    if (boardCityCode) boardCityCode.textContent = cityCode;
    if (boardCityName) boardCityName.textContent = cityName;

    if (typeof particleEngine !== 'undefined' && particleEngine.flyRewardIcon) {
      particleEngine.flyRewardIcon(window.innerWidth / 2, window.innerHeight / 2, 150, 40, '✈️', 15);
    }
    if (typeof audioEngine !== 'undefined' && audioEngine.playVictoryFanfare) {
      audioEngine.playVictoryFanfare();
    }

    if (overlay) {
      overlay.classList.add('active');
      setTimeout(() => {
        overlay.classList.remove('active');
        this.openCountryBrewModal(dest);
      }, 1600);
    } else {
      this.openCountryBrewModal(dest);
    }
  }

  openCountryBrewModal(destKey) {
    const modal = document.getElementById('modalCountryBrew');
    if (!modal) return;

    const recipes = {
      ethiopia: {
        title: '🇪🇹 Etiyopya Geleneksel Seremonisi',
        sub: 'Kaffa vadisinin taze kahvesini toprak cezvede demle!',
        clueTitle: 'Etiyopya Harar Reserve',
        clueRiddle: '📜 "Önce Harar dağlarının çekirdeğini öğüt 🫘, berrak kaynar suyla demle 💧. Koyu maun özünü süzüp ☕, doğanın tatlı balı ile taçlandır! 🍯"',
        flavors: ['☕ Yoğun Gövde', '🍯 Çiçek Balı', '🫘 Yüksek Rakım'],
        target: ['grind', 'water', 'espresso', 'caramel']
      },
      italy: {
        title: '🇮🇹 Napoli Ristretto Seremonisi',
        sub: 'İtalya\'nın yoğun kremalı kısa espressosunu hazırla!',
        clueTitle: 'Ristretto Napoletano',
        clueRiddle: '📜 "Napoli usulü incecik öğüt 🫘, sıcak suyla yüksek basınçla demlendir 💧. Kısa ve yoğun espressonun ☕ üzerine altın kadife kremayı kondur! ✨"',
        flavors: ['☕ Yoğun Ristretto', '✨ Kadife Krema', '🇮🇹 İtalyan Kavrum'],
        target: ['grind', 'water', 'espresso', 'crema']
      },
      colombia: {
        title: '🇨🇴 Medellin Yüksek Dağ Kahvesi',
        sub: 'And dağlarının en taze Arabica kahvesini köpürt!',
        clueTitle: 'Medellin Supremo',
        clueRiddle: '📜 "And dağlarının taze Arabica çekirdeğini kır 🫘, berrak suyla demlendir 💧. Maun rengi espressonun ☕ üstüne bulut gibi hafif süt köpüğü ekle! ☁️"',
        flavors: ['☁️ İpeksi Köpük', '☕ Arabica Özü', '🏔️ Medellin Dağı'],
        target: ['grind', 'water', 'espresso', 'foam']
      },
      brazil: {
        title: '🇧🇷 Santos Cafézinho Seremonisi',
        sub: 'Brezilya tarlalarının tatlı çikolatalı kahvesini pişir!',
        clueTitle: 'Brasil Santos Cafézinho',
        clueRiddle: '📜 "Santos tarlalarının çekirdeğini incecik öğüt 🫘, sıcak suyla birleştir 💧. Çikolatalı gövdeli espressoya ☕ taze kadife sütü dök! 🥛"',
        flavors: ['🥛 Taze Süt', '🍫 Çikolata Notası', '🇧🇷 Santos Harmanı'],
        target: ['grind', 'water', 'espresso', 'milk']
      },
      vietnam: {
        title: '🇻🇳 Hanoi İkonik Yumurta Kahvesi',
        sub: 'Vietnam\'ın köpüklü tatlı kahvesini katman katman diz!',
        clueTitle: 'Cà Phê Trứng',
        clueRiddle: '📜 "Geleneksel Robusta çekirdeğini öğüt 🫘, yoğun ve sert espresso çıkar ☕. Taze sütü döküp 🥛, üzeri için altın tatlı kremayı katman katman diz! ✨"',
        flavors: ['✨ Tatlı Krema', '🥛 Katmanlı İpeksi', '🇻🇳 Hanoi İkonu'],
        target: ['grind', 'espresso', 'milk', 'crema']
      },
      jamaica: {
        title: '🇯🇲 Blue Mountain Kraliyet Kahvesi',
        sub: 'Dünyanın en nadir kraliyet kahvesini mükemmel demle!',
        clueTitle: 'Blue Mountain Reserve',
        clueRiddle: '📜 "Sisle kaplı Blue Mountain çekirdeğini kır 🫘, kristal suyla buluştur 💧. Nadir kraliyet espressosuna ☕ altın karamel şurubu gezdir! 🍯"',
        flavors: ['👑 Kraliyet Harmanı', '🍯 Altın Karamel', '💎 Nadir Çekirdek'],
        target: ['grind', 'water', 'espresso', 'caramel']
      }
    };

    const rec = recipes[destKey] || recipes.ethiopia;
    const titleEl = document.getElementById('brewModalTitle');
    const subEl = document.getElementById('brewModalSub');
    const clueTitleEl = document.getElementById('brewOrderTitle');
    const clueRiddleEl = document.getElementById('brewOrderHint');
    const flavorBoxEl = document.getElementById('brewFlavorProfile');

    if (titleEl) titleEl.textContent = rec.title;
    if (subEl) subEl.textContent = rec.sub;
    if (clueTitleEl) clueTitleEl.innerHTML = `📋 Tarif: <strong>${rec.clueTitle}</strong>`;
    if (clueRiddleEl) clueRiddleEl.textContent = rec.clueRiddle;

    if (flavorBoxEl) {
      flavorBoxEl.innerHTML = (rec.flavors || []).map(f => `<span class="flavor-badge">${f}</span>`).join('');
    }

    let userLayers = [];
    let isPressureLocked = false;
    let currentPressure = 50;
    let pressureDirection = 1;
    let hasOpenedHint = false;

    const fluidEl = document.getElementById('brewLiquidFluid');
    const listEl = document.getElementById('brewCupLayerList');
    const needleEl = document.getElementById('brewPressureNeedle');
    const pressureValEl = document.getElementById('brewPressureValue');
    const btnStop = document.getElementById('btnStopPressure');
    const hintCoverEl = document.getElementById('brewHintCover');
    const btnReveal = document.getElementById('btnRevealHint');

    if (fluidEl) { fluidEl.style.height = '0%'; fluidEl.style.background = 'linear-gradient(180deg, #6f4e37 0%, #3c2415 100%)'; }
    if (listEl) listEl.innerHTML = '<span class="empty-cup-hint">Malzemelere dokunarak bardağı doldur!</span>';
    if (btnStop) { btnStop.textContent = '🎯 ISIDA SABİTLE!'; btnStop.disabled = false; }

    // Reset Hidden Hint Toggle
    if (hintCoverEl) hintCoverEl.style.display = 'flex';
    if (clueRiddleEl) clueRiddleEl.style.display = 'none';

    if (btnReveal) {
      btnReveal.onclick = () => {
        hasOpenedHint = true;
        if (hintCoverEl) hintCoverEl.style.display = 'none';
        if (clueRiddleEl) clueRiddleEl.style.display = 'block';
      };
    }

    // Live Pressure Gauge Oscillation Interval
    if (this.pressureInterval) clearInterval(this.pressureInterval);
    this.pressureInterval = setInterval(() => {
      if (isPressureLocked) return;
      currentPressure += pressureDirection * 4;
      if (currentPressure >= 98) { currentPressure = 98; pressureDirection = -1; }
      if (currentPressure <= 2) { currentPressure = 2; pressureDirection = 1; }

      if (needleEl) needleEl.style.left = `${currentPressure}%`;
      if (pressureValEl) {
        if (currentPressure >= 60 && currentPressure <= 95) {
          pressureValEl.textContent = `${currentPressure}% (🎯 MÜKEMMEL ISIL)`;
          pressureValEl.style.color = '#2ecc71';
        } else {
          pressureValEl.textContent = `${currentPressure}% (Isıtılıyor...)`;
          pressureValEl.style.color = '#ffda85';
        }
      }
    }, 50);

    if (btnStop) {
      btnStop.onclick = () => {
        isPressureLocked = true;
        btnStop.disabled = true;
        if (currentPressure >= 60 && currentPressure <= 95) {
          btnStop.textContent = '✅ OPTİMUM ISIDA KİLİTLENDİ!';
          try { if (typeof audioEngine !== 'undefined') audioEngine.playMatchChime(); } catch(e){}
        } else {
          btnStop.textContent = '⚠️ STANDART ISIDA KİLİTLENDİ';
        }
      };
    }

    const updateStepDots = () => {
      const dots = document.querySelectorAll('#brewStepDots .dot');
      dots.forEach((dot, idx) => {
        dot.className = 'dot';
        if (idx < userLayers.length) dot.classList.add('done');
        else if (idx === userLayers.length) dot.classList.add('active');
      });
    };

    updateStepDots();

    // Bind ingredient buttons
    const gridBtns = document.querySelectorAll('#brewIngredientsGrid .ingredient-btn');
    gridBtns.forEach(btn => {
      btn.onclick = () => {
        if (userLayers.length >= 4) return;
        const id = btn.dataset.id;
        userLayers.push(id);
        const name = btn.textContent;
        
        if (userLayers.length === 1 && listEl) listEl.innerHTML = '';

        const itemDiv = document.createElement('div');
        itemDiv.className = 'cup-layer-item';
        itemDiv.textContent = `${userLayers.length}. ${name}`;
        if (listEl) listEl.appendChild(itemDiv);

        // Fluid Level Animation
        const fillPct = Math.min(100, userLayers.length * 25);
        if (fluidEl) {
          fluidEl.style.height = `${fillPct}%`;
          if (id === 'milk' || id === 'foam') {
            fluidEl.style.background = 'linear-gradient(180deg, #fff3e0 0%, #8d5b4c 100%)';
          } else if (id === 'crema' || id === 'caramel') {
            fluidEl.style.background = 'linear-gradient(180deg, #f5b027 0%, #4a2c20 100%)';
          } else {
            fluidEl.style.background = 'linear-gradient(180deg, #5c3826 0%, #211208 100%)';
          }
        }

        updateStepDots();
        try { if (typeof audioEngine !== 'undefined') audioEngine.playSwap(); } catch(e){}
      };
    });

    const resetBtn = document.getElementById('btnResetBrew');
    if (resetBtn) {
      resetBtn.onclick = () => {
        userLayers = [];
        if (fluidEl) fluidEl.style.height = '0%';
        if (listEl) listEl.innerHTML = '<span class="empty-cup-hint">Malzemelere dokunarak bardağı doldur!</span>';
        updateStepDots();
      };
    }

    const closeBtn = document.getElementById('btnCloseCountryBrew');
    if (closeBtn) {
      closeBtn.onclick = () => {
        if (this.pressureInterval) clearInterval(this.pressureInterval);
        modal.classList.remove('active');
      };
    }

    const submitBtn = document.getElementById('btnSubmitBrew');
    if (submitBtn) {
      submitBtn.onclick = () => {
        if (this.pressureInterval) clearInterval(this.pressureInterval);
        modal.classList.remove('active');

        const isMatch = userLayers.length === 4 && userLayers.every((val, index) => val === rec.target[index]);
        const isOptimalHeat = currentPressure >= 60 && currentPressure <= 95;

        let bonusCoins = 500;
        let bonusBeans = 10;
        if (isOptimalHeat) bonusCoins += 500;
        if (isMatch && !hasOpenedHint) {
          bonusCoins *= 2;
          bonusBeans *= 2;
        }

        this.state.coins += bonusCoins;
        this.state.coffeeBeans += bonusBeans;
        this.saveState();

        const titleMsg = isMatch
          ? (!hasOpenedHint ? '🌟 2X GİZLİ HAFIZA ŞAMPİYONU!' : '🎉 KUSURSUZ MASTER DEMLEME!')
          : '☕ KAHVE DEMLENDİ!';

        const subMsg = !hasOpenedHint && isMatch
          ? `🔒 İpucunu hiç açmadan ezbere bildin! 2X Ekstra Ödül (+${bonusCoins} 🪙, +${bonusBeans} 🫘) Kazandın! ✨`
          : (isOptimalHeat ? '🎯 Mükemmel Isı Bonusu +500 Coin Kazandın! ✨' : 'Kafende sunulmaya hazır! ✨');

        this.showCustomRewardModal({
          icon: isMatch ? '👑' : '☕',
          title: titleMsg,
          text: isMatch
            ? `${rec.title} Usta Şef standartlarında mükemmel hazırlandı!`
            : `${rec.title} seremonisi tamamlandı. (+${bonusCoins} 🪙, +${bonusBeans} 🫘)`,
          sub: subMsg,
          confirmText: '🏠 ANA SAYFAYA DÖN',
          onConfirm: () => {
            this.switchScreen('screenHome');
          }
        });
      };
    }

    modal.classList.add('active');
  }

  switchScreen(screenId) {
    console.log("CoffeeMatchApp: Switching screen to:", screenId);
    if (window.posReceiptEngine) {
      window.posReceiptEngine.hide();
    }
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
    document.querySelectorAll('.screen-view').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
      targetScreen.classList.add('active');
    }

    const tab = document.querySelector(`.nav-tab[data-target="${screenId}"]`);
    if (tab) {
      tab.classList.add('active');
    }

    window.scrollTo(0, 0);

    const topBar = document.getElementById('topHeaderBar');
    const bottomNav = document.getElementById('bottomNav');
    if (screenId === 'screenSplash') {
      if (topBar) { topBar.style.display = 'none'; topBar.classList.add('hide-nav'); }
      if (bottomNav) { bottomNav.style.display = 'none'; bottomNav.classList.add('hide-nav'); }
    } else {
      if (topBar) { topBar.style.display = 'flex'; topBar.classList.remove('hide-nav'); }
      if (bottomNav) { bottomNav.style.display = 'flex'; bottomNav.classList.remove('hide-nav'); }
    }

    this.activeScreen = screenId;

    if (screenId !== 'screenGame') {
      if (typeof boardEngine !== 'undefined' && boardEngine) {
        boardEngine.isGameActive = false;
      }
    }

    if (screenId === 'screenHome') {
      this.renderHomeTab();
    } else if (screenId === 'screenCafe') {
      this.renderTourTab();
    } else if (screenId === 'screenMap') {
      levelMapManager.renderMap(
        this.state.completedLevel,
        this.state.levelStars,
        (levelId) => this.startLevel(levelId)
      );
    } else if (screenId === 'screenDuel') {
      this.renderDuelTab();
    } else if (screenId === 'screenGame') {
      const lvl = parseInt(this.state.currentLevel) || 1;
      if (typeof boardEngine !== 'undefined' && boardEngine) {
        boardEngine.initLevel(lvl, (result) => {
          this.onLevelComplete(result);
        });
      }
      setTimeout(() => {
        if (typeof particleEngine !== 'undefined' && particleEngine.resizeCanvas) {
          particleEngine.resizeCanvas();
        }
      }, 60);
    }
  }

  // Navigation Tabs Switching (Dual Touch & Click Support)
  bindNavigation() {
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
      let isFired = false;
      const fire = (e) => {
        if (isFired) return;
        isFired = true;
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        const targetScreenId = tab.dataset.target;
        if (targetScreenId) this.switchScreen(targetScreenId);
        setTimeout(() => { isFired = false; }, 300);
      };
      tab.onclick = fire;
      tab.ontouchend = fire;
    });
  }

  bindUI() {
    document.getElementById('btnSoundToggle')?.addEventListener('click', () => {
      const isEnabled = audioEngine.toggleSound();
      document.getElementById('btnSoundToggle').textContent = isEnabled ? '🔊' : '🔇';
    });

    document.getElementById('btnLeaderboardToggle')?.addEventListener('click', () => this.openLeaderboardModal());
    document.getElementById('btnDuelToggle')?.addEventListener('click', () => this.openDuelModal());
    document.getElementById('btnStartOnlineDuel')?.addEventListener('click', () => this.openDuelModal());
    document.getElementById('btnStartDuelMatch')?.addEventListener('click', () => this.startDuelMatch());
    document.getElementById('btnTabStartDuel')?.addEventListener('click', () => this.startDuelMatch());

    document.getElementById('btnAccount')?.addEventListener('click', () => this.openAccountModal());
    document.getElementById('btnHomeAccount')?.addEventListener('click', () => this.openAccountModal());

    // Avatar Selection Binding
    document.querySelectorAll('#avatarSelectGrid .avatar-option').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('#avatarSelectGrid .avatar-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        const selectedAvatar = opt.dataset.avatar;
        this.state.avatar = selectedAvatar;
        this.saveState();
        const elAvatar = document.getElementById('profileAvatarDisplay');
        if (elAvatar) elAvatar.textContent = selectedAvatar;
        this.updateTopBarUI();
      });
    });

    document.getElementById('btnCloseAccountModal')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('modalAccount')?.classList.remove('active');
    });

    document.getElementById('btnCloseRegisterModal')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('modalRegister')?.classList.remove('active');
    });

    // Universal Close Buttons and Backdrop Click Handlers
    document.querySelectorAll('.close-modal-btn, .btn-close-modal').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-overlay');
        if (modal) modal.classList.remove('active');
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          overlay.classList.remove('active');
        }
      });
    });

    document.getElementById('btnHomeStartGame')?.addEventListener('click', () => {
      this.switchScreen('screenMap');
    });

    document.getElementById('btnCollectTips')?.addEventListener('click', () => {
      this.collectPassiveTips();
    });

    this.selectedPuzzleIngredients = [];

    document.getElementById('btnFeaturePuzzle')?.addEventListener('click', () => {
      this.selectedPuzzleIngredients = [];
      this.renderCupLayers();
      document.getElementById('modalRecipePuzzle')?.classList.add('active');
    });

    document.getElementById('btnCloseRecipePuzzle')?.addEventListener('click', () => {
      document.getElementById('modalRecipePuzzle')?.classList.remove('active');
    });

    document.querySelectorAll('.ingredient-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const ingId = btn.dataset.id;
        if (this.selectedPuzzleIngredients.length < 4) {
          this.selectedPuzzleIngredients.push(ingId);
          this.renderCupLayers();
          if (typeof audioEngine !== 'undefined' && audioEngine.playSwap) {
            audioEngine.playSwap();
          }
        }
      });
    });

    document.getElementById('btnResetRecipe')?.addEventListener('click', () => {
      this.selectedPuzzleIngredients = [];
      this.renderCupLayers();
    });

    document.getElementById('btnSubmitRecipe')?.addEventListener('click', () => {
      this.submitDailyRecipePuzzle();
    });

    document.getElementById('btnFeatureRush')?.addEventListener('click', () => {
      this.startRushHourMatch();
    });

    document.getElementById('btnFeatureDuel')?.addEventListener('click', () => {
      this.switchScreen('screenDuel');
    });

    document.getElementById('btnFeatureWheel')?.addEventListener('click', () => {
      this.checkDailyWheelStatus();
      document.getElementById('modalDailyWheel')?.classList.add('active');
      setTimeout(() => this.drawDailyWheel(this.wheelCurrentAngle || 0), 50);
    });

    document.getElementById('btnCloseDailyWheel')?.addEventListener('click', () => {
      document.getElementById('modalDailyWheel')?.classList.remove('active');
    });

    document.getElementById('btnSpinWheel')?.addEventListener('click', () => {
      this.spinDailyWheel();
    });

    document.querySelectorAll('.avatar-option').forEach(opt => {
      opt.addEventListener('click', () => {
        document.querySelectorAll('.avatar-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        const chosenAvatar = opt.dataset.avatar;
        if (chosenAvatar) {
          this.state.avatar = chosenAvatar;
          this.saveState();
          this.renderHomeTab();
        }
      });
    });

    // Auth Form Tabs & Submit
    const tabLogin = document.getElementById('tabAuthLogin');
    const tabRegister = document.getElementById('tabAuthRegister');
    const groupEmail = document.getElementById('groupEmail');
    const btnAuthSubmit = document.getElementById('btnAuthSubmit');
    const formAuth = document.getElementById('formAuth');

    if (tabLogin && tabRegister) {
      tabLogin.addEventListener('click', () => {
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        if (groupEmail) groupEmail.style.display = 'none';
        if (btnAuthSubmit) btnAuthSubmit.textContent = 'Giriş Yap';
      });

      tabRegister.addEventListener('click', () => {
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        if (groupEmail) groupEmail.style.display = 'block';
        if (btnAuthSubmit) btnAuthSubmit.textContent = 'Kayıt Ol';
      });
    }

    if (formAuth) {
      formAuth.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('inputUsername').value;
        const password = document.getElementById('inputPassword').value;
        const isRegister = tabRegister && tabRegister.classList.contains('active');
        const email = isRegister ? document.getElementById('inputEmail').value : null;

        const authStatus = document.getElementById('authStatus');
        authStatus.textContent = 'Bağlanılıyor...';

        try {
          let res;
          if (isRegister) {
            res = await apiClient.register(username, email, password);
          } else {
            res = await apiClient.login(username, password);
          }

          if (res && res.token) {
            authStatus.style.color = '#2ecc71';
            authStatus.textContent = isRegister 
              ? `🎉 Kayıt Başarılı! ${email ? email + ' adresine Hoş Geldin e-postası gönderildi! ☕' : ''}` 
              : 'Başarıyla Giriş Yapıldı!';
            this.state.user = { username: res.username || username, email: email };
            if (res.coins) this.state.coins = res.coins;
            if (res.coffeeBeans) this.state.coffeeBeans = res.coffeeBeans;
            this.saveState();
            setTimeout(() => {
              document.getElementById('modalAccount').classList.remove('active');
            }, 1800);
          } else {
            authStatus.style.color = '#e74c3c';
            authStatus.textContent = res.message || 'Giriş başarısız. Lütfen bilgilerinizi kontrol edin.';
          }
        } catch (err) {
          authStatus.style.color = '#e74c3c';
          authStatus.textContent = 'Sunucuya bağlanılamadı. Çevrimdışı moda geçildi.';
        }
      });
    }

    // POS Thermal Receipt Action Buttons
    document.getElementById('btnReceiptHome')?.addEventListener('click', () => {
      posReceiptEngine.hide();
      this.switchScreen('screenHome');
    });

    document.getElementById('btnReceiptNext')?.addEventListener('click', () => {
      posReceiptEngine.hide();
      this.startLevel(this.state.currentLevel);
    });
  }

  // Start Level Match-3 Session
  startLevel(levelNumber) {
    const lvl = parseInt(levelNumber) || this.state.currentLevel || 1;
    this.state.currentLevel = lvl;
    this.switchScreen('screenGame');
  }

  startDailyPuzzleMatch() {
    this.isDailyPuzzleMode = true;
    this.switchScreen('screenGame');

    const dailyPuzzleConfig = {
      levelTitle: '🧩 GÜNÜN BULMACASI',
      moves: 15,
      goals: [
        { type: 'espresso', target: 10, icon: '☕' },
        { type: 'croissant', target: 8, icon: '🥐' },
        { type: 'donut', target: 5, icon: '🍩' }
      ],
      mechanic: {
        icon: '🧩',
        desc: 'GÜNÜN BULMACASI: Sadece 15 hamlede özel kahve tarifini tamamla!'
      }
    };

    boardEngine.initLevel(dailyPuzzleConfig, (result) => {
      this.onLevelComplete(result);
    });
  }

  // Handle Match-3 Level Completion (Triggers Thermal POS Receipt Panel)
  onLevelComplete(result) {
    if (this.isDailyPuzzleMode) {
      this.isDailyPuzzleMode = false;

      if (result.isWin) {
        this.state.coins += 300;
        this.state.coffeeBeans += 8;
        this.saveState();

        if (typeof particleEngine !== 'undefined' && particleEngine.flyRewardIcon) {
          particleEngine.flyRewardIcon(window.innerWidth / 2, window.innerHeight / 2, 100, 30, '🪙', 10);
          particleEngine.flyRewardIcon(window.innerWidth / 2, window.innerHeight / 2, 180, 30, '🫘', 6);
        }

        if (typeof audioEngine !== 'undefined' && audioEngine.playVictoryFanfare) {
          audioEngine.playVictoryFanfare();
        }

        this.showCustomRewardModal({
          icon: '🧩',
          title: '🎉 GÜNÜN BULMACASI ÇÖZÜLDÜ!',
          text: '⚡ Zorlu 15 hamlelik Günün Barista Bulmacasını Başarıyla Tamamladın!',
          sub: '🏆 Ödülün: +300 🪙 Coin & +8 🫘 Çekirdek!',
          onConfirm: () => {
            this.switchScreen('screenHome');
          }
        });
      } else {
        this.showCustomRewardModal({
          icon: '💔',
          title: 'BULMACA BAŞARISIZ!',
          text: '15 Hamle bitti. Günün bulmacasını tamamlayamadın.',
          sub: 'Tekrar deneyerek şansını zorlayabilirsin! ✨',
          onConfirm: () => {
            this.switchScreen('screenHome');
          }
        });
      }
      return;
    }

    if (this.isDuelMode) {
      if (this.duelTimerInterval) clearInterval(this.duelTimerInterval);
      this.isDuelMode = false;

      if (result.isWin) {
        const timeUsed = 60 - this.duelTimeLeft;
        this.state.coins += 100;
        this.state.coffeeBeans += 5;
        this.saveState();

        if (typeof audioEngine !== 'undefined' && audioEngine.playVictoryFanfare) {
          audioEngine.playVictoryFanfare();
        }

        this.showCustomRewardModal({
          icon: '🎉',
          title: 'MÜKEMMEL DÜELLO ZAFERİ!',
          text: `⚡ Tam ${timeUsed} saniyede tüm siparişleri rakibinden ÖNCE tamamladın ve 1v1 Düelloyu KAZANDIN!`,
          sub: '🏆 Ödülün Hesabına Eklendi: +100 🪙 Coin & +5 🫘 Çekirdek!',
          onConfirm: () => {
            this.switchScreen('screenDuel');
          }
        });
      } else {
        this.showCustomRewardModal({
          icon: '⏱️',
          title: 'SÜRE BİTTİ!',
          text: 'Rakip barista siparişleri daha hızlı tamamladı!',
          sub: 'Bir dahaki sefere daha hızlı ol! 💪',
          onConfirm: () => {
            this.switchScreen('screenDuel');
          }
        });
      }
      return;
    }

    if (result.isWin) {
      const config = LevelMechanicsManager.getLevelConfig(result.levelNumber);
      const mult = config ? config.coinRewardMultiplier : 1;
      const beansEarned = posReceiptEngine.calculateBeanReward(result.remainingMoves) * mult;
      const coinReward = 250 * mult;
      const bonusCoins = result.remainingMoves * 10;

      // Increment Win Streak
      this.state.winStreak = (this.state.winStreak || 0) + 1;

      this.state.coins += (coinReward + bonusCoins);
      this.state.coffeeBeans += beansEarned;
      this.state.completedLevel = Math.max(this.state.completedLevel, result.levelNumber);
      this.state.levelStars[result.levelNumber] = beansEarned;

      if (result.levelNumber < 120) {
        this.state.currentLevel = result.levelNumber + 1;
      }

      this.saveState();
      console.log("Rewards Calculated", { coins: this.state.coins, beans: this.state.coffeeBeans, streak: this.state.winStreak });

      // Show POS Thermal Receipt Panel
      posReceiptEngine.showWinReceipt({
        levelNumber: result.levelNumber,
        remainingMoves: result.remainingMoves || 0,
        beansEarned: beansEarned,
        baseCoins: coinReward,
        bonusCoins: bonusCoins,
        completedGoals: result.completedGoals
      });

    } else {
      // Reset Win Streak on Loss!
      this.state.winStreak = 0;
      this.state.lives = Math.max(0, this.state.lives - 1);
      this.saveState();

      // Show POS Thermal Receipt Fail Panel
      posReceiptEngine.showLoseReceipt({
        levelNumber: result.levelNumber,
        completedGoals: result.completedGoals
      });
    }
  }

  updateTopBarUI() {
    document.getElementById('valCoin').textContent = this.state.coins.toLocaleString();
    document.getElementById('valBeans').textContent = this.state.coffeeBeans;
    document.getElementById('valLives').textContent = this.state.lives;

    const avatarDisplay = document.getElementById('displayAvatar');
    if (avatarDisplay) {
      avatarDisplay.textContent = this.state.avatar || '👨‍🍳';
    }

    const usernameDisplay = document.getElementById('displayUsername');
    if (usernameDisplay) {
      usernameDisplay.textContent = this.state.user ? this.state.user.username : 'Misafir Barista';
    }

    // Update Booster Badges
    const countBombEl = document.getElementById('countBomb');
    const countSteamEl = document.getElementById('countSteam');
    const countLightningEl = document.getElementById('countLightning');
    const countShuffleEl = document.getElementById('countShuffle');

    if (countBombEl) countBombEl.textContent = this.state.boosters.bomb;
    if (countSteamEl) countSteamEl.textContent = this.state.boosters.steam;
    if (countLightningEl) countLightningEl.textContent = this.state.boosters.lightning !== undefined ? this.state.boosters.lightning : 2;
    if (countShuffleEl) countShuffleEl.textContent = this.state.boosters.shuffle;
  }

  async openLeaderboardModal() {
    const modal = document.getElementById('modalLeaderboard');
    const container = document.getElementById('leaderboardListContainer');
    if (!modal || !container) return;

    modal.classList.add('active');
    container.innerHTML = '<div style="color:#ffda85; text-align:center; padding:15px; font-family: var(--font-heading);">🏆 Canlı Barista Sıralaması Yükleniyor...</div>';

    const list = await apiClient.getLeaderboard();
    const myName = this.state.user ? this.state.user.username : 'Sen (Misafir)';

    container.innerHTML = list.map(item => {
      const isMe = item.username === myName || item.isCurrentUser;
      return `
        <div class="leaderboard-item ${isMe ? 'is-me' : ''}">
          <span class="lb-rank">${item.rank === 1 ? '🥇' : (item.rank === 2 ? '🥈' : (item.rank === 3 ? '🥉' : '#' + item.rank))}</span>
          <div class="lb-user-box">
            <span class="lb-avatar">${item.avatar || '👨‍🍳'}</span>
            <div class="lb-details">
              <strong class="lb-name">${item.username} ${isMe ? '(Sen)' : ''}</strong>
              <span class="lb-badge">${item.badge || 'Barista'}</span>
            </div>
          </div>
          <div class="lb-stats">
            <span class="lb-level">Sev. ${item.level}</span>
            <span class="lb-score">${item.score.toLocaleString()} p</span>
          </div>
        </div>
      `;
    }).join('');
  }

  async openDuelModal() {
    const modal = document.getElementById('modalDuel');
    if (!modal) return;

    const myName = this.state.user ? this.state.user.username : 'Sen (Barista)';
    const myAvatar = this.state.avatar || '👩‍🍳';

    document.getElementById('myDuelName').textContent = myName;
    document.getElementById('myDuelAvatar').textContent = myAvatar;

    document.getElementById('modalLeaderboard')?.classList.remove('active');
    modal.classList.add('active');
  }

  start321Countdown(onComplete) {
    const overlay = document.getElementById('countdownOverlay');
    const numEl = document.getElementById('countdownNumber');
    if (!overlay || !numEl) {
      if (onComplete) onComplete();
      return;
    }

    const steps = ['3', '2', '1', '🔥 BAŞLA! 🔥'];
    let idx = 0;

    overlay.classList.add('active');
    numEl.classList.remove('is-text', 'countdown-pop-anim');
    numEl.textContent = steps[0];
    void numEl.offsetWidth;
    numEl.classList.add('countdown-pop-anim');

    if (typeof audioEngine !== 'undefined' && audioEngine.playSwap) {
      audioEngine.playSwap();
    }

    const interval = setInterval(() => {
      idx++;
      if (idx < steps.length) {
        numEl.textContent = steps[idx];
        numEl.classList.remove('countdown-pop-anim');
        void numEl.offsetWidth;
        numEl.classList.add('countdown-pop-anim');

        if (idx === steps.length - 1) {
          numEl.classList.add('is-text');
          if (typeof audioEngine !== 'undefined' && audioEngine.playVictoryFanfare) {
            audioEngine.playVictoryFanfare();
          }
          document.body.classList.add('shake-fx');
          setTimeout(() => document.body.classList.remove('shake-fx'), 500);
        } else {
          numEl.classList.remove('is-text');
          if (typeof audioEngine !== 'undefined' && audioEngine.playSwap) {
            audioEngine.playSwap();
          }
        }
      } else {
        clearInterval(interval);
        overlay.classList.remove('active');
        numEl.classList.remove('is-text', 'countdown-pop-anim');
        if (onComplete) onComplete();
      }
    }, 700);
  }

  async startRushHourMatch() {
    this.isRushHourMode = true;
    this.isDuelMode = false;
    this.rushTimeLeft = 60;

    this.switchScreen('screenGame');

    boardEngine.initLevel(this.state.currentLevel, (result) => {
      this.onLevelComplete(result);
    });

    const hudLevelLabel = document.getElementById('hudLevelLabel');
    if (hudLevelLabel) hudLevelLabel.textContent = `⏱️ RUSH HOUR`;

    const mechanicIcon = document.getElementById('mechanicIcon');
    if (mechanicIcon) mechanicIcon.textContent = '⏱️';

    const mechanicText = document.getElementById('mechanicText');
    if (mechanicText) mechanicText.textContent = '⏱️ ZAMANA KARŞI YARIŞ: 60 Saniyede En Yüksek Skoru Yap!';

    const hudMoves = document.getElementById('hudMoves');
    if (hudMoves) hudMoves.textContent = `⏱️ 60s`;

    boardEngine.isGameActive = false;

    this.start321Countdown(() => {
      boardEngine.isGameActive = true;

      if (this.rushTimerInterval) clearInterval(this.rushTimerInterval);

      this.rushTimerInterval = setInterval(() => {
        if (this.activeScreen !== 'screenGame' || !this.isRushHourMode) {
          clearInterval(this.rushTimerInterval);
          return;
        }

        this.rushTimeLeft--;
        if (hudMoves) hudMoves.textContent = `⏱️ ${this.rushTimeLeft}s`;

        if (mechanicText) {
          mechanicText.textContent = `⏱️ KALAN SÜRE: ${this.rushTimeLeft}s | 🏆 SKOR: ${(boardEngine.score || 0).toLocaleString()}`;
        }

        if (this.rushTimeLeft <= 0) {
          clearInterval(this.rushTimerInterval);
          boardEngine.isGameActive = false;
          const finalScore = boardEngine.score || 0;
          const coinEarned = Math.floor(finalScore / 10) + 100;

          this.state.coins = (this.state.coins || 0) + coinEarned;
          this.saveState();
          this.updateTopBarUI();

          if (finalScore >= 1000) {
            this.showCustomRewardModal({
              icon: '⏱️',
              title: '🎉 RUSH HOUR REKORU!',
              text: `60 Saniyelik Zaman Yarışını ${finalScore.toLocaleString()} Puan İle Başarıyla Tamamladın!`,
              sub: `🏆 Ödülün: +${coinEarned} 🪙 Altın Coin Hesabına Eklendi!`,
              onConfirm: () => {
                this.isRushHourMode = false;
                this.switchScreen('screenHome');
              }
            });
          } else {
            this.showCustomRewardModal({
              icon: '⌛',
              title: '⏰ RUSH HOUR SÜRESİ BİTTİ!',
              text: `Kahve çekirdekleri kavrulurken zaman su gibi aktı! Barista temposuna yetişemedin (${finalScore.toLocaleString()} Puan).`,
              sub: `💡 İpucu: Bir dahaki sefere daha hızlı eşleştirmeler yap ve bombaları kullan! 💪 (+${coinEarned} Coin Ödülü)`,
              onConfirm: () => {
                this.isRushHourMode = false;
                this.switchScreen('screenHome');
              }
            });
          }
        }
      }, 1000);
    });
  }

  async startDuelMatch() {
    const modal = document.getElementById('modalDuel');
    if (modal) modal.classList.remove('active');

    this.isDuelMode = true;
    this.duelOpponentProgress = 0;

    this.switchScreen('screenGame');

    boardEngine.initLevel(this.state.currentLevel, (result) => {
      this.onLevelComplete(result);
    });

    const hudLevelLabel = document.getElementById('hudLevelLabel');
    if (hudLevelLabel) hudLevelLabel.textContent = `⚔️ 1v1 DÜELLO`;

    const mechanicIcon = document.getElementById('mechanicIcon');
    if (mechanicIcon) mechanicIcon.textContent = '⚔️';

    const mechanicText = document.getElementById('mechanicText');
    if (mechanicText) mechanicText.textContent = '⚔️ 1v1 HAMLE DÜELLOSU: Saniye Yok! Rakibinden Yüksek Skor Yap!';

    const hudMoves = document.getElementById('hudMoves');
    if (hudMoves) hudMoves.textContent = `⚔️ DÜELLO`;

    boardEngine.isGameActive = false;

    this.start321Countdown(() => {
      boardEngine.isGameActive = true;
    });
  }

  async renderDuelTab() {
    const myName = this.state.user ? this.state.user.username : 'Sen (Barista)';
    const myAvatar = this.state.avatar || '👩‍🍳';

    const elName = document.getElementById('tabMyName');
    const elAvatar = document.getElementById('tabMyAvatar');
    if (elName) elName.textContent = myName;
    if (elAvatar) elAvatar.textContent = myAvatar;

    const container = document.getElementById('duelTabLbContainer');
    if (container) {
      container.innerHTML = '<div style="color:#ffda85; text-align:center; padding:10px; font-family: var(--font-heading);">🏆 Sıralama Yükleniyor...</div>';
      const list = await apiClient.getLeaderboard();
      container.innerHTML = list.slice(0, 5).map(item => `
        <div class="leaderboard-item ${item.username === myName ? 'is-me' : ''}">
          <span class="lb-rank">${item.rank === 1 ? '🥇' : (item.rank === 2 ? '🥈' : (item.rank === 3 ? '🥉' : '#' + item.rank))}</span>
          <div class="lb-user-box">
            <span class="lb-avatar">${item.avatar || '👨‍🍳'}</span>
            <div class="lb-details">
              <strong class="lb-name">${item.username}</strong>
              <span class="lb-badge">${item.badge || 'Barista'}</span>
            </div>
          </div>
          <div class="lb-stats">
            <span class="lb-level">Sev. ${item.level}</span>
            <span class="lb-score">${item.score.toLocaleString()} p</span>
          </div>
        </div>
      `).join('');
    }
  }

  openAccountModal() {
    const modal = document.getElementById('modalAccount');
    if (!modal) return;

    const avatar = this.state.avatar || '👩‍🍳';
    const username = this.state.user ? this.state.user.username : 'Efsane Barista';
    const coins = (this.state.coins || 0).toLocaleString();
    const beans = this.state.coffeeBeans || 0;
    const tourStamps = this.state.tourStamps ? Object.keys(this.state.tourStamps).length : 6;

    const elAvatar = document.getElementById('profileAvatarDisplay');
    const elUser = document.getElementById('profileUsernameDisplay');
    const elCoins = document.getElementById('profileCoinsVal');
    const elBeans = document.getElementById('profileBeansVal');
    const elTour = document.getElementById('profileTourVal');

    if (elAvatar) elAvatar.textContent = avatar;
    if (elUser) elUser.textContent = username;
    if (elCoins) elCoins.textContent = coins;
    if (elBeans) elBeans.textContent = `${beans} 🫘`;
    if (elTour) elTour.textContent = `${tourStamps}/6 Damga`;

    modal.classList.add('active');
  }

  openRegisterModal() {
    const modalAccount = document.getElementById('modalAccount');
    if (modalAccount) modalAccount.classList.remove('active');

    const modal = document.getElementById('modalRegister');
    if (!modal) return;

    document.querySelectorAll('#regAvatarSelectGrid .avatar-option').forEach(opt => {
      opt.onclick = () => {
        document.querySelectorAll('#regAvatarSelectGrid .avatar-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        this.selectedRegAvatar = opt.dataset.avatar;
      };
    });

    modal.classList.add('active');
  }

  async handleRegisterSubmit() {
    const modal = document.getElementById('modalRegister');
    const usernameInput = document.getElementById('regInputUsername');
    const emailInput = document.getElementById('regInputEmail');
    const passwordInput = document.getElementById('regInputPassword');
    const status = document.getElementById('regAuthStatus');

    const username = usernameInput ? usernameInput.value.trim() : 'Barista';
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    const avatar = this.selectedRegAvatar || '👩‍🍳';

    if (!username) return;

    if (status) status.textContent = '⏳ Kayıt Yapılıyor...';

    const result = await apiClient.register(username, email, password);
    if (result && result.success) {
      this.state.user = result.user;
      this.state.avatar = avatar;
      this.saveState();
      this.updateTopBarUI();

      if (modal) modal.classList.remove('active');

      this.showCustomRewardModal({
        icon: '🎉',
        title: 'KAYIT BAŞARILI!',
        text: `Hoş geldin ${username}! Barista Hesabın Başarıyla Oluşturuldu.`,
        sub: 'Kafeye Giriş Yapıp Maceraya Başlayabilirsin! ☕',
        onConfirm: () => {
          this.switchScreen('screenHome');
        }
      });
    }
  }

  renderHomeTab() {
    const myName = this.state.user ? this.state.user.username : 'Tuğçe Molla';
    const myAvatar = this.state.avatar || '👩‍🍳';
    const currentLvl = this.state.currentLevel || 1;

    const elToastName = document.getElementById('toastUsername');
    const elName = document.getElementById('homeUsername');
    const elAvatar = document.getElementById('homeAvatar');
    const elTitle = document.getElementById('homeUserTitle');
    const elCoin = document.getElementById('homeCoinVal');
    const elHighScore = document.getElementById('homeHighScoreVal');

    if (elToastName) elToastName.textContent = myName;
    if (elName) elName.textContent = myName;
    if (elAvatar) elAvatar.textContent = myAvatar;
    if (elTitle) elTitle.textContent = `Seviye ${currentLvl} Barista`;
    if (elCoin) elCoin.textContent = this.state.coins.toLocaleString();
    if (elHighScore) elHighScore.textContent = (currentLvl * 1250).toLocaleString();
  }

  drawDailyWheel(rotationAngle = 0) {
    const canvas = document.getElementById('wheelCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = width / 2 - 12;

    ctx.clearRect(0, 0, width, height);

    const slices = [
      { text: '100 Coin', emoji: '🪙', color: '#f39c12' },
      { text: '5 Çekirdek', emoji: '🫘', color: '#e74c3c' },
      { text: '1 Bomba', emoji: '💣', color: '#9b59b6' },
      { text: '250 Coin', emoji: '🪙', color: '#2ecc71' },
      { text: '10 Çekirdek', emoji: '🫘', color: '#1abc9c' },
      { text: '1 Şimşek', emoji: '⚡', color: '#3498db' },
      { text: '500 JACKPOT', emoji: '🏆', color: '#f1c40f' },
      { text: '50 Coin', emoji: '🪙', color: '#e67e22' }
    ];

    const sliceAngle = (Math.PI * 2) / slices.length;

    // 1. Draw Outer Gold Rim & Studs
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
    ctx.fillStyle = '#f5b027';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#b87b00';
    ctx.stroke();

    // Golden Studs around rim
    for (let i = 0; i < 16; i++) {
      const studAngle = (Math.PI * 2 * i) / 16;
      const sx = centerX + Math.cos(studAngle) * (radius + 4);
      const sy = centerY + Math.sin(studAngle) * (radius + 4);
      ctx.beginPath();
      ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = (i % 2 === 0) ? '#ffffff' : '#ffea00';
      ctx.fill();
    }
    ctx.restore();

    // 2. Draw Pie Slices with radial text
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(rotationAngle);

    for (let i = 0; i < slices.length; i++) {
      const startA = i * sliceAngle;
      const endA = startA + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startA, endA);
      ctx.closePath();

      ctx.fillStyle = slices[i].color;
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.stroke();

      // Render Text & Emoji radially
      ctx.save();
      const midA = startA + sliceAngle / 2;
      ctx.rotate(midA);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px var(--font-heading), sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(`${slices[i].text} ${slices[i].emoji}`, radius - 15, 4);
      ctx.restore();
    }
    ctx.restore();
  }

  checkDailyWheelStatus() {
    const btn = document.getElementById('btnSpinWheel');
    if (!btn) return;

    const now = Date.now();
    const lastSpin = this.state.lastSpinTime || 0;
    const diff = now - lastSpin;
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (diff < twentyFourHours) {
      btn.disabled = true;
      const remMs = twentyFourHours - diff;
      const hrs = Math.floor(remMs / (1000 * 60 * 60));
      const mins = Math.floor((remMs % (1000 * 60 * 60)) / (1000 * 60));
      btn.textContent = `⏳ BUGÜNKÜ ÇEVİRME YAPILDI (${hrs}s ${mins}d)`;
    } else {
      btn.disabled = false;
      btn.textContent = '🎡 ÜCRETSİZ ÇEVİR!';
    }
  }

  spinDailyWheel() {
    const btn = document.getElementById('btnSpinWheel');
    if (!btn || btn.disabled) return;

    const now = Date.now();
    const lastSpin = this.state.lastSpinTime || 0;
    const diff = now - lastSpin;
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (diff < twentyFourHours) {
      this.checkDailyWheelStatus();
      return;
    }

    btn.disabled = true;
    btn.textContent = '⏳ Çark Dönüyor...';

    const winningSliceIndex = Math.floor(Math.random() * 8);
    const rewards = [
      { name: '100 🪙 Coin', type: 'coins', amount: 100, emoji: '🪙' },
      { name: '5 🫘 Kahve Çekirdeği', type: 'beans', amount: 5, emoji: '🫘' },
      { name: '💣 1 Bomba Booster', type: 'bomb', amount: 1, emoji: '💣' },
      { name: '250 🪙 Coin (JACKPOT!)', type: 'coins', amount: 250, emoji: '🪙' },
      { name: '10 🫘 Kahve Çekirdeği', type: 'beans', amount: 10, emoji: '🫘' },
      { name: '⚡ 1 Şimşek Booster', type: 'lightning', amount: 1, emoji: '⚡' },
      { name: '500 🪙 SUPER JACKPOT!', type: 'coins', amount: 500, emoji: '🪙' },
      { name: '50 🪙 Coin', type: 'coins', amount: 50, emoji: '🪙' }
    ];

    const reward = rewards[winningSliceIndex];
    const sliceAngle = (Math.PI * 2) / 8;
    
    // Top pointer is at -Math.PI / 2 (-90 deg). Calculate target angle so pointer hits winning slice!
    const targetAngleOffset = (Math.PI * 2) - (winningSliceIndex * sliceAngle) - (sliceAngle / 2) - (Math.PI / 2);
    const totalRotation = (Math.PI * 2 * 6) + targetAngleOffset;

    let currentRotation = this.wheelCurrentAngle || 0;
    const startRotation = currentRotation;
    const finalRotation = currentRotation + totalRotation;
    const startTime = performance.now();
    const duration = 4500;

    const animateSpin = (nowTime) => {
      const elapsed = nowTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Cubic-bezier ease out deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);
      
      currentRotation = startRotation + (finalRotation - startRotation) * easeOut;
      this.wheelCurrentAngle = currentRotation;
      this.drawDailyWheel(currentRotation);

      if (typeof audioEngine !== 'undefined' && Math.floor(elapsed / 120) % 2 === 0) {
        audioEngine.playSwap?.();
      }

      if (progress < 1) {
        requestAnimationFrame(animateSpin);
      } else {
        // Spin finished!
        if (reward.type === 'coins') this.state.coins += reward.amount;
        if (reward.type === 'beans') this.state.coffeeBeans += reward.amount;
        if (reward.type === 'bomb') this.state.boosters.bomb = (this.state.boosters.bomb || 0) + reward.amount;
        if (reward.type === 'lightning') this.state.boosters.lightning = (this.state.boosters.lightning || 0) + reward.amount;

        this.state.lastSpinTime = Date.now();
        this.saveState();
        this.updateTopBarUI();
        this.renderHomeTab();

        if (typeof particleEngine !== 'undefined' && particleEngine.flyRewardIcon) {
          particleEngine.flyRewardIcon(window.innerWidth / 2, window.innerHeight / 2, 100, 30, reward.emoji, 10);
        }

        if (typeof audioEngine !== 'undefined' && audioEngine.playVictoryFanfare) {
          audioEngine.playVictoryFanfare();
        }

        this.showCustomRewardModal({
          icon: reward.emoji,
          title: '🎉 TEBRİKLER!',
          text: `🎡 Günlük Çarktan [ ${reward.name} ] KAZANDIN!`,
          sub: 'Günde 1 Defa Hak Vardır. 24 Saat Sonra Tekrar Gel! ✨',
          onConfirm: () => {
            this.checkDailyWheelStatus();
          }
        });
      }
    };

    requestAnimationFrame(animateSpin);
  }

  showCustomRewardModal({ icon = '🎁', title = '🎉 TEBRİKLER!', text = '', sub = 'Ödülünüz Hesabınıza Eklendi! ✨', confirmText = '🏠 ANA SAYFAYA DÖN', onConfirm }) {
    const modal = document.getElementById('modalCustomReward');
    const elIcon = document.getElementById('rewardModalIcon');
    const elTitle = document.getElementById('rewardModalTitle');
    const elText = document.getElementById('rewardModalText');
    const elSub = document.getElementById('rewardModalSub');
    const btnConfirm = document.getElementById('btnRewardConfirm');

    if (!modal) return;

    if (elIcon) elIcon.textContent = icon;
    if (elTitle) elTitle.textContent = title;
    if (elText) elText.textContent = text;
    if (elSub) elSub.textContent = sub;
    if (btnConfirm) btnConfirm.textContent = confirmText;

    modal.classList.add('active');

    const handleConfirm = () => {
      modal.classList.remove('active');
      btnConfirm?.removeEventListener('click', handleConfirm);
      if (onConfirm) onConfirm();
    };

    btnConfirm?.addEventListener('click', handleConfirm);
  }

  renderCupLayers() {
    const container = document.getElementById('cupLayerList');
    if (!container) return;

    if (this.selectedPuzzleIngredients.length === 0) {
      container.innerHTML = '<span class="empty-cup-hint">Malzemelere dokunarak bardağı doldur!</span>';
      return;
    }

    const itemMeta = {
      ice: { name: '🧊 Buz', bg: '#74b9ff' },
      milk: { name: '🥛 Süt', bg: '#dfe6e9' },
      espresso: { name: '☕ Espresso', bg: '#6c5ce7' },
      caramel: { name: '🍯 Karamel', bg: '#e67e22' },
      chocolate: { name: '🍫 Çikolata', bg: '#d63031' },
      syrup: { name: '🍓 Şurup', bg: '#e84393' }
    };

    container.innerHTML = this.selectedPuzzleIngredients.map(id => {
      const meta = itemMeta[id] || { name: id, bg: '#f5b027' };
      return `<div class="cup-layer-item" style="background: ${meta.bg};">${meta.name}</div>`;
    }).join('');
  }

  submitDailyRecipePuzzle() {
    const modal = document.getElementById('modalRecipePuzzle');
    const targetOrder = ['ice', 'milk', 'espresso', 'caramel'];
    const currentOrder = this.selectedPuzzleIngredients;

    if (currentOrder.length < 4) {
      alert('⚠️ Bardak henüz dolmadı! Lütfen 4 malzemeyi de sırasıyla ekleyin.');
      return;
    }

    const isCorrect = currentOrder.join(',') === targetOrder.join(',');

    if (isCorrect) {
      if (modal) modal.classList.remove('active');
      this.state.coins += 300;
      this.state.coffeeBeans += 8;
      this.saveState();

      this.updateTopBarUI();
      this.renderHomeTab();

      if (typeof particleEngine !== 'undefined' && particleEngine.flyRewardIcon) {
        particleEngine.flyRewardIcon(window.innerWidth / 2, window.innerHeight / 2, 100, 30, '🪙', 10);
        particleEngine.flyRewardIcon(window.innerWidth / 2, window.innerHeight / 2, 180, 30, '🫘', 6);
      }

      if (typeof audioEngine !== 'undefined' && audioEngine.playVictoryFanfare) {
        audioEngine.playVictoryFanfare();
      }

      this.showCustomRewardModal({
        icon: '🥤',
        title: '🎉 MÜKEMMEL BARİSTA TARİFİ!',
        text: '✨ Iced Caramel Macchiato Tarifini Sırasıyla Kusursuz Hazırladın!',
        sub: '🏆 Kazandığın Ödül: +300 🪙 Coin & +8 🫘 Çekirdek!',
        onConfirm: () => {
          this.switchScreen('screenHome');
        }
      });
    } else {
      alert('❌ TARİF YANLIŞ OLDU!\n\n💡 İpucunu tekrar oku:\n1. Soğuk (Buz)\n2. Sütlü (Süt)\n3. Kahveli (Espresso)\n4. Tatlı (Karamel)');
      this.selectedPuzzleIngredients = [];
      this.renderCupLayers();
    }
  }

  collectPassiveTips() {
    const tipAmount = 150;
    this.state.coins += tipAmount;
    this.saveState();
    this.updateTopBarUI();
    this.renderHomeTab();

    if (typeof particleEngine !== 'undefined' && particleEngine.flyRewardIcon) {
      particleEngine.flyRewardIcon(window.innerWidth / 2, window.innerHeight / 2, 120, 30, '🪙', 12);
    }

    if (typeof audioEngine !== 'undefined' && audioEngine.playVictoryFanfare) {
      audioEngine.playVictoryFanfare();
    }

    this.showCustomRewardModal({
      icon: '💰',
      title: '🎉 BAHŞİŞ KUTUSU TOPLANDI!',
      text: '👥 VIP Müşterilerinin Biriktirdiği Bahşişler Toplandı!',
      sub: '🏆 Kazanç: +150 🪙 Coin Hesabına Aktarıldı!',
      onConfirm: () => {}
    });
  }
}

function enableDragScroll(el) {
  if (!el) return;
  let isDown = false;
  let startX, startY, scrollLeft, scrollTop;

  el.addEventListener('mousedown', (e) => {
    isDown = true;
    startX = e.pageX - el.offsetLeft;
    startY = e.pageY - el.offsetTop;
    scrollLeft = el.scrollLeft;
    scrollTop = el.scrollTop;
  });
  el.addEventListener('mouseleave', () => { isDown = false; });
  el.addEventListener('mouseup', () => { isDown = false; });
  el.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const y = e.pageY - el.offsetTop;
    const walkX = (x - startX) * 1.5;
    const walkY = (y - startY) * 1.5;
    el.scrollLeft = scrollLeft - walkX;
    el.scrollTop = scrollTop - walkY;
  });
}

window.addEventListener('DOMContentLoaded', () => {
  window.coffeeMatchApp = new CoffeeMatchApp();

  document.addEventListener('click', (e) => {
    const btnHome = e.target.closest('#btnReceiptHome') || e.target.closest('#btnRewardConfirm');
    if (btnHome && window.coffeeMatchApp) {
      e.preventDefault();
      e.stopPropagation();
      if (window.posReceiptEngine) window.posReceiptEngine.hide();
      document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
      window.coffeeMatchApp.switchScreen('screenHome');
      return;
    }

    const btn = e.target.closest('.btn-travel') || e.target.closest('.tour-card');
    if (btn && window.coffeeMatchApp) {
      const dest = btn.dataset.dest;
      const cost = parseInt(btn.dataset.cost) || 5;
      if (dest) {
        window.coffeeMatchApp.handleWorldTourTravel(dest, cost);
      }
    }
  });

  setTimeout(() => {
    enableDragScroll(document.getElementById('chapterDestBar'));
    enableDragScroll(document.getElementById('renovationList'));
    enableDragScroll(document.getElementById('chapterBiomeCard'));
  }, 500);
});
