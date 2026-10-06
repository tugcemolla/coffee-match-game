/* ==========================================================================
   COFFEE MATCH ☕ - POS THERMAL RECEIPT ENGINE (Master Design Reference)
   ========================================================================== */

class POSReceiptEngine {
  constructor() {
    this.modalEl = document.getElementById('modalReceipt');
    this.receiptCardEl = document.getElementById('receiptCard');
    this.feederEl = document.getElementById('posPaperFeeder');
    this.confettiCanvas = document.getElementById('receiptConfettiCanvas');
    
    // Configurable Bean Reward Matrix based on remaining moves
    this.beanRewardConfig = [
      { minMoves: 0, maxMoves: 2, beans: 1 },
      { minMoves: 3, maxMoves: 5, beans: 2 },
      { minMoves: 6, maxMoves: 8, beans: 3 },
      { minMoves: 9, maxMoves: 999, beans: 5 }
    ];

    this.winMessages = [
      'Harika İş Çıkardın Barista!',
      'Muhteşem Bir Sipariş!',
      'Müşteriler Çok Memnun!',
      'Kahven Şehrin En İyisi!'
    ];

    this.loseMessages = [
      'Bir sonraki siparişte daha iyi olacaksın!',
      'Neredeyse başarıyordun! Tekrar dene!'
    ];

    this.stopParticleShower = null;
  }

  calculateBeanReward(remainingMoves) {
    const match = this.beanRewardConfig.find(
      c => remainingMoves >= c.minMoves && remainingMoves <= c.maxMoves
    );
    return match ? match.beans : 1;
  }

  // Show Win Thermal Receipt Panel matching Master Reference Design
  showWinReceipt(data) {
    console.log("Showing Receipt");
    if (!this.modalEl) this.modalEl = document.getElementById('modalReceipt');
    if (!this.receiptCardEl) this.receiptCardEl = document.getElementById('receiptCard');
    if (!this.feederEl) this.feederEl = document.getElementById('posPaperFeeder');
    if (!this.confettiCanvas) this.confettiCanvas = document.getElementById('receiptConfettiCanvas');

    const { levelNumber, remainingMoves, baseCoins = 120, completedGoals } = data;
    const beansEarned = this.calculateBeanReward(remainingMoves);
    const bonusCoins = remainingMoves * 10;
    const totalCoins = baseCoins + bonusCoins;
    const xpEarned = 20 + (remainingMoves * 5);
    const randomMsg = this.winMessages[Math.floor(Math.random() * this.winMessages.length)];

    if (!this.modalEl || !this.receiptCardEl || !this.feederEl) {
      console.warn('Receipt modal elements not found in DOM');
      return;
    }

    const receiptNo = Math.floor(10000 + Math.random() * 90000);
    const nowStr = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const goalsToShow = (completedGoals && completedGoals.length > 0)
      ? completedGoals
      : [{ type: 'espresso', target: 3 }, { type: 'croissant', target: 3 }];

    // Reset Receipt Content Markup matching Squarish Premium Theme Layout
    this.receiptCardEl.innerHTML = `
      <div class="receipt-header">
        <div class="receipt-logo-header-row">
          <span class="receipt-logo-icon">☕</span>
          <h2 class="receipt-brand">COFFEE MATCH</h2>
        </div>
        <div class="receipt-meta-info">
          <span>Fiş No: #${receiptNo}</span> • <span>${nowStr}</span>
        </div>
        <div class="receipt-status-badge win">Sipariş Başarıyla Hazırlandı!</div>
      </div>

      <div class="receipt-divider-zigzag"></div>

      <div class="receipt-compact-goals-section">
        <div class="receipt-items-list" id="receiptGoalsList">
          ${goalsToShow.map((g, idx) => `
            <div class="receipt-item-row" id="stepGoal_${idx}">
              <div class="item-name-group">
                <span class="item-box-icon check">☑️</span>
                <span class="item-name">${this.getGoalName(g.type)}</span>
              </div>
              <span class="item-qty">${g.target} / ${g.target}</span>
            </div>
          `).join('')}
        </div>

        <div class="receipt-moves-compact">
          <span class="moves-label">Kalan Hamle:</span>
          <strong class="moves-num">${remainingMoves} 🫘</strong>
          ${bonusCoins > 0 ? `<small class="moves-bonus-tag">+${bonusCoins} 🪙</small>` : ''}
        </div>
      </div>

      <div class="receipt-divider-dashed"></div>

      <!-- Compact Circular 3D Rewards Grid -->
      <div class="receipt-section rewards-section">
        <div class="rewards-circle-grid">
          <div class="reward-circle-item">
            <div class="reward-circle-badge gold"><span>🪙</span></div>
            <strong class="reward-val" id="valReceiptCoin">${totalCoins}</strong>
          </div>
          <div class="reward-circle-item">
            <div class="reward-circle-badge bean"><span>🫘</span></div>
            <strong class="reward-val" id="valReceiptBeans">${beansEarned}</strong>
          </div>
          <div class="reward-circle-item">
            <div class="reward-circle-badge star"><span>⭐</span></div>
            <strong class="reward-val" id="valReceiptXP">${xpEarned}</strong>
          </div>
        </div>
      </div>

      <div class="receipt-divider-dashed"></div>

      <div class="receipt-barcode-box">
        <svg class="receipt-barcode-svg" viewBox="0 0 140 22" preserveAspectRatio="none">
          <rect x="0" y="0" width="3" height="22" fill="#3b2314"/>
          <rect x="5" y="0" width="1" height="22" fill="#3b2314"/>
          <rect x="8" y="0" width="4" height="22" fill="#3b2314"/>
          <rect x="14" y="0" width="2" height="22" fill="#3b2314"/>
          <rect x="18" y="0" width="1" height="22" fill="#3b2314"/>
          <rect x="21" y="0" width="5" height="22" fill="#3b2314"/>
          <rect x="28" y="0" width="2" height="22" fill="#3b2314"/>
          <rect x="32" y="0" width="3" height="22" fill="#3b2314"/>
          <rect x="37" y="0" width="1" height="22" fill="#3b2314"/>
          <rect x="40" y="0" width="4" height="22" fill="#3b2314"/>
          <rect x="46" y="0" width="2" height="22" fill="#3b2314"/>
          <rect x="50" y="0" width="6" height="22" fill="#3b2314"/>
          <rect x="58" y="0" width="1" height="22" fill="#3b2314"/>
          <rect x="61" y="0" width="3" height="22" fill="#3b2314"/>
          <rect x="66" y="0" width="2" height="22" fill="#3b2314"/>
          <rect x="70" y="0" width="5" height="22" fill="#3b2314"/>
          <rect x="77" y="0" width="2" height="22" fill="#3b2314"/>
          <rect x="81" y="0" width="1" height="22" fill="#3b2314"/>
          <rect x="84" y="0" width="4" height="22" fill="#3b2314"/>
          <rect x="90" y="0" width="2" height="22" fill="#3b2314"/>
          <rect x="94" y="0" width="6" height="22" fill="#3b2314"/>
          <rect x="102" y="0" width="1" height="22" fill="#3b2314"/>
          <rect x="105" y="0" width="3" height="22" fill="#3b2314"/>
          <rect x="110" y="0" width="2" height="22" fill="#3b2314"/>
          <rect x="114" y="0" width="4" height="22" fill="#3b2314"/>
          <rect x="120" y="0" width="1" height="22" fill="#3b2314"/>
          <rect x="123" y="0" width="5" height="22" fill="#3b2314"/>
          <rect x="130" y="0" width="2" height="22" fill="#3b2314"/>
          <rect x="134" y="0" width="3" height="22" fill="#3b2314"/>
        </svg>
        <span class="barcode-num">|||| 849201074 ||||</span>
      </div>

      <div class="receipt-motto" id="receiptMotto">${randomMsg}</div>

      <!-- Action Buttons inside POS Tray -->
      <div class="receipt-actions-row" id="stepButtons">
        <button class="btn-receipt-3d btn-green-3d" id="btnReceiptHome" onclick="window.posReceiptEngine && window.posReceiptEngine.onHomeClick(event)">
          ANA SAYFAYA DÖN
        </button>
        <button class="btn-receipt-3d btn-gold-3d" id="btnReceiptNext" onclick="window.posReceiptEngine && window.posReceiptEngine.onNextClick(event)">
          SONRAKİ BÖLÜM
        </button>
      </div>
    `;

    // 1. Activate Modal & Trigger Paper Rollout out of POS Head
    this.modalEl.classList.add('active');
    this.feederEl.className = 'pos-paper-feeder feeding-paper';

    // Start Confetti & Bean Particles
    this.startParticleShower();

    // 2. Step 1 (0.7s): Reveal Completed Goals Line Items
    setTimeout(() => {
      (completedGoals || []).forEach((g, idx) => {
        setTimeout(() => {
          const item = document.getElementById(`stepGoal_${idx}`);
          try {
            if (typeof audioEngine !== 'undefined' && audioEngine.playMatch) audioEngine.playMatch();
          } catch(e) {}
        }, idx * 250);
      });
    }, 700);

    // 3. Step 2 (1.6s): Count Up Coins & XP in Circular Badges
    setTimeout(() => {
      this.animateCountUp('valReceiptCoin', 0, totalCoins, 1000);
      this.animateCountUp('valReceiptXP', 0, xpEarned, 1000);
    }, 1600);

    // 4. Step 3 (2.4s): 3D Embossed Buttons Bounce Pop In
    setTimeout(() => {
      const btns = document.getElementById('stepButtons');
      if (btns) {
        btns.classList.remove('hidden-step');
        btns.classList.add('bounce-in');
      }
    }, 2400);

    this.bindButtons({
      onHome: () => this.onHomeClick(),
      onNext: () => this.onNextClick()
    });
  }

  onHomeClick(e) {
    if (e) {
      try { e.preventDefault(); } catch(err){}
      try { e.stopPropagation(); } catch(err){}
    }
    console.log("POSReceiptEngine: Direct Navigating to Home Screen");
    
    // 1. Instantly hide receipt modal and all overlays
    this.hide();
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));

    // 2. Instantly deactivate all screens & tabs
    document.querySelectorAll('.screen-view').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));

    // 3. Instantly activate screenHome & tabHome in DOM
    const homeScreen = document.getElementById('screenHome');
    if (homeScreen) homeScreen.classList.add('active');

    const homeTab = document.getElementById('tabHome') || document.querySelector('.nav-tab[data-target="screenHome"]');
    if (homeTab) homeTab.classList.add('active');

    // 4. Reset board engine active status
    if (window.boardEngine) {
      window.boardEngine.isGameActive = false;
      window.boardEngine.isAnimating = false;
    }

    // 5. Trigger app rendering & top bar
    const app = window.coffeeMatchApp;
    if (app) {
      app.activeScreen = 'screenHome';
      if (app.renderHomeTab) app.renderHomeTab();
    }

    window.scrollTo(0, 0);
  }

  onNextClick(e) {
    if (e) {
      try { e.preventDefault(); } catch(err){}
      try { e.stopPropagation(); } catch(err){}
    }
    console.log("POSReceiptEngine: Launching Next Level");

    this.hide();
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));

    const app = window.coffeeMatchApp;
    if (app) {
      const nextLvl = parseInt(app.state.currentLevel) || 1;
      console.log("Starting Next Level:", nextLvl);
      
      if (window.boardEngine) {
        window.boardEngine.isGameActive = false;
        window.boardEngine.isAnimating = false;
      }
      app.activeScreen = null; // Force switchScreen to re-run initLevel
      app.startLevel(nextLvl);
    }
  }

  onRetryClick(e) {
    if (e) {
      try { e.preventDefault(); } catch(err){}
      try { e.stopPropagation(); } catch(err){}
    }
    console.log("POSReceiptEngine: Retrying Current Level");

    this.hide();
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));

    const app = window.coffeeMatchApp;
    if (app) {
      const currentLvl = parseInt(app.state.currentLevel) || 1;
      console.log("Retrying Level:", currentLvl);

      if (window.boardEngine) {
        window.boardEngine.isGameActive = false;
        window.boardEngine.isAnimating = false;
      }
      app.activeScreen = null; // Force switchScreen to re-run initLevel
      app.startLevel(currentLvl);
    }
  }

  // Show Fail Thermal Receipt Panel matching Master Reference Design
  showLoseReceipt(data) {
    if (!this.modalEl) this.modalEl = document.getElementById('modalReceipt');
    if (!this.receiptCardEl) this.receiptCardEl = document.getElementById('receiptCard');
    if (!this.feederEl) this.feederEl = document.getElementById('posPaperFeeder');
    if (!this.confettiCanvas) this.confettiCanvas = document.getElementById('receiptConfettiCanvas');

    const { levelNumber, completedGoals } = data;
    const randomMsg = this.loseMessages[Math.floor(Math.random() * this.loseMessages.length)];

    if (!this.modalEl || !this.receiptCardEl || !this.feederEl) return;

    this.receiptCardEl.innerHTML = `
      <div class="receipt-header">
        <div class="receipt-logo-header-row">
          <span class="receipt-logo-icon">☕</span>
          <h2 class="receipt-brand">COFFEE MATCH</h2>
        </div>
        <div class="receipt-status-badge lose">Sipariş Tamamlanamadı!</div>
      </div>

      <div class="receipt-divider-zigzag"></div>

      <div class="receipt-section">
        <div class="receipt-items-list" id="receiptGoalsList">
          ${(completedGoals || []).map(g => `
            <div class="receipt-item-row fail">
              <div class="item-name-group">
                <span class="item-box-icon cross">❎</span>
                <span class="item-name">${this.getGoalName(g.type)}</span>
              </div>
              <span class="item-qty fail-qty">${g.target - Math.min(g.target, 1)} / ${g.target}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="receipt-divider-dashed"></div>

      <div class="receipt-motto lose">${randomMsg}</div>

      <!-- Action Buttons -->
      <div class="receipt-actions-row" id="stepButtons">
        <button class="btn-receipt-3d btn-green-3d" id="btnReceiptHome" onclick="window.posReceiptEngine && window.posReceiptEngine.onHomeClick(event)">
          ANA SAYFAYA DÖN
        </button>
        <button class="btn-receipt-3d btn-gold-3d" id="btnReceiptRetry" onclick="window.posReceiptEngine && window.posReceiptEngine.onRetryClick(event)">
          TEKRAR DENE
        </button>
      </div>
    `;

    this.modalEl.classList.add('active');
    this.feederEl.className = 'pos-paper-feeder feeding-paper';

    this.bindButtons({
      onHome: () => this.onHomeClick(),
      onNext: () => this.onNextClick(),
      onRetry: () => this.onRetryClick()
    });
  }

  hide() {
    if (this.modalEl) this.modalEl.classList.remove('active');
    if (this.feederEl) this.feederEl.className = 'pos-paper-feeder';
    if (this.stopParticleShower) this.stopParticleShower();
    if (window.boardEngine) {
      window.boardEngine.isAnimating = false;
      window.boardEngine.isGameActive = false;
    }
  }

  bindButtons({ onHome, onNext, onRetry }) {
    const addListener = (elementId, handler) => {
      if (!handler) return;
      const el = document.getElementById(elementId);
      if (el) {
        let isFired = false;
        const fire = (e) => {
          if (isFired) return;
          isFired = true;
          if (e) {
            try { e.preventDefault(); } catch(err){}
            try { e.stopPropagation(); } catch(err){}
          }
          handler(e);
          setTimeout(() => { isFired = false; }, 300);
        };
        el.onclick = fire;
        el.ontouchend = fire;
      }
    };

    addListener('btnReceiptHome', onHome);
    addListener('btnReceiptNext', onNext);
    addListener('btnReceiptRetry', onRetry);
  }

  animateCountUp(elementId, start, end, duration) {
    const el = document.getElementById(elementId);
    if (!el) return;

    const startTime = performance.now();
    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const current = Math.floor(start + (end - start) * progress);
      el.textContent = current.toLocaleString();
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };
    requestAnimationFrame(update);
  }

  getGoalName(type) {
    const names = {
      espresso: 'Espresso',
      croissant: 'Kruvasan',
      iced: 'Soğuk Kahve',
      beans: 'Çekirdek',
      donut: 'Donut',
      milk: 'Süt',
      latte: 'Latte'
    };
    return names[type] || 'Latte';
  }

  startParticleShower() {
    if (!this.confettiCanvas) return;
    const ctx = this.confettiCanvas.getContext('2d');
    const width = (this.confettiCanvas.width = this.confettiCanvas.offsetWidth || 360);
    const height = (this.confettiCanvas.height = this.confettiCanvas.offsetHeight || 600);

    const particles = [];
    const items = ['🎉', '✨', '🫘', '☕', '⭐', '🎊'];

    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * width,
        y: -20 - Math.random() * 100,
        size: 14 + Math.random() * 12,
        char: items[Math.floor(Math.random() * items.length)],
        speedY: 2 + Math.random() * 3,
        speedX: (Math.random() - 0.5) * 1.5,
        rot: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 4
      });
    }

    let active = true;
    this.stopParticleShower = () => { active = false; ctx.clearRect(0, 0, width, height); };

    const loop = () => {
      if (!active) return;
      ctx.clearRect(0, 0, width, height);

      particles.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.rot += p.rotSpeed;

        if (p.y > height) {
          p.y = -20;
          p.x = Math.random() * width;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rot * Math.PI) / 180);
        ctx.font = `${p.size}px sans-serif`;
        ctx.fillText(p.char, 0, 0);
        ctx.restore();
      });

      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }
}

const posReceiptEngine = new POSReceiptEngine();
window.posReceiptEngine = posReceiptEngine;
window.testWinPanel = () => {
  posReceiptEngine.showWinReceipt({
    levelNumber: 3,
    remainingMoves: 7,
    baseCoins: 250,
    completedGoals: [
      { type: 'espresso', target: 10, icon: '☕' },
      { type: 'croissant', target: 7, icon: '🥐' }
    ]
  });
};
