/* ==========================================================================
   POS RECEIPT RESULT PANEL CONTROLLER (BÖLÜM SONU ÖZGÜN FİŞ EKRANI)
   ========================================================================== */

class PosReceiptManager {
  constructor() {
    this.modalOverlay = document.getElementById('modalPosReceipt');
    this.statusTitle = document.getElementById('receiptStatusTitle');
    this.receiptItems = document.getElementById('receiptItems');
    this.receiptCoins = document.getElementById('receiptCoins');
    this.receiptBeans = document.getElementById('receiptBeans');
    this.movesBonusRow = document.getElementById('receiptMovesBonusRow');
    this.movesBonusVal = document.getElementById('receiptMovesBonus');
    this.footerMsg = document.getElementById('receiptFooterMsg');
    
    this.btnHome = document.getElementById('btnReceiptHome');
    this.btnNext = document.getElementById('btnReceiptNext');
    
    this.onHomeCallback = null;
    this.onNextCallback = null;

    this.bindEvents();
  }

  bindEvents() {
    if (this.btnHome) {
      this.btnHome.addEventListener('click', () => {
        this.hide();
        if (this.onHomeCallback) this.onHomeCallback();
      });
    }

    if (this.btnNext) {
      this.btnNext.addEventListener('click', () => {
        this.hide();
        if (this.onNextCallback) this.onNextCallback();
      });
    }
  }

  // Calculate Coffee Beans (🫘) based on remaining moves rule:
  // 10+ moves -> 3 beans
  // 5-9 moves -> 2 beans
  // 1-4 moves -> 1 bean
  calculateBeans(remainingMoves) {
    if (remainingMoves >= 10) return 3;
    if (remainingMoves >= 5) return 2;
    if (remainingMoves >= 1) return 1;
    return 0;
  }

  // Show POS Receipt for Win State
  showWin(levelConfig, score, remainingMoves, onHome, onNext) {
    this.onHomeCallback = onHome;
    this.onNextCallback = onNext;

    audioEngine.playReceiptPrint();
    audioEngine.playVictory();

    const beansEarned = this.calculateBeans(remainingMoves);
    const coinsEarned = 100 + (remainingMoves * 10);

    // Title & Header
    this.statusTitle.textContent = '☕ Sipariş Başarıyla Teslim Edildi';
    this.statusTitle.style.color = '#27ae60';

    // Populate completed order items
    this.receiptItems.innerHTML = '';
    levelConfig.goals.forEach(g => {
      const row = document.createElement('div');
      row.className = 'receipt-item-row';
      row.innerHTML = `
        <span>${g.icon} ${g.type.toUpperCase()} x${g.target}</span>
        <strong>TAMAMLANDI ✓</strong>
      `;
      this.receiptItems.appendChild(row);
    });

    // Totals & Rewards
    this.receiptCoins.textContent = `+${coinsEarned} 🪙`;

    // Render Coffee Beans (🫘)
    this.receiptBeans.innerHTML = '';
    for (let i = 0; i < 3; i++) {
      const beanSpan = document.createElement('span');
      beanSpan.className = `bean-icon ${i < beansEarned ? 'lit' : 'dim'}`;
      beanSpan.textContent = '🫘';
      if (i >= beansEarned) beanSpan.style.opacity = '0.25';
      this.receiptBeans.appendChild(beanSpan);
    }

    // Moves Bonus
    this.movesBonusRow.style.display = 'flex';
    this.movesBonusVal.textContent = `+${remainingMoves * 50} SKOR (${remainingMoves} Hamle)`;

    // Footer & Buttons
    this.footerMsg.textContent = 'Tekrar Bekleriz ☕';
    this.btnNext.textContent = '➡ Sonraki Sipariş';
    this.btnNext.className = 'btn-receipt primary';

    this.modalOverlay.classList.add('active');

    return { beansEarned, coinsEarned };
  }

  // Show POS Receipt for Lose State
  showLose(levelConfig, currentGoals, onRetry, onHome) {
    this.onNextCallback = onRetry;
    this.onHomeCallback = onHome;

    audioEngine.playReceiptPrint();

    // Title & Header
    this.statusTitle.textContent = '❌ Sipariş Tamamlanamadı';
    this.statusTitle.style.color = '#e74c3c';

    // Populate missing order items
    this.receiptItems.innerHTML = '';
    levelConfig.goals.forEach(g => {
      const remaining = currentGoals[g.type] || 0;
      const row = document.createElement('div');
      row.className = 'receipt-item-row';
      row.innerHTML = `
        <span>${g.icon} ${g.type.toUpperCase()}</span>
        <strong style="color:#e74c3c;">Eksik: ${remaining} adet</strong>
      `;
      this.receiptItems.appendChild(row);
    });

    // Totals & Rewards
    this.receiptCoins.textContent = '0 🪙';
    this.receiptBeans.innerHTML = '<span style="font-size:0.8rem; color:#888;">0 🫘 (Başarısız)</span>';
    this.movesBonusRow.style.display = 'none';

    // Footer & Buttons
    this.footerMsg.textContent = 'Üzgünüz, Sipariş Zamanında Yetişmedi ☕';
    this.btnNext.textContent = '🔄 Tekrar Dene';
    this.btnNext.className = 'btn-receipt secondary';

    this.modalOverlay.classList.add('active');
  }

  hide() {
    this.modalOverlay.classList.remove('active');
  }
}

const posReceiptManager = new PosReceiptManager();
