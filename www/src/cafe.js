/* ==========================================================================
   CAFE RENOVATION ENGINE ("KAFEM")
   ========================================================================== */

const RENOVATION_ITEMS = {
  sign: {
    id: 'sign',
    name: 'Dış Tabela',
    icon: '🪧',
    cost: 1,
    desc: 'Yıllardır solmuş eski ahşap tabelayı yenile.',
    options: [
      { id: 'sign_classic', name: 'Ahşap Oyma Tabela', icon: '🪵', desc: 'Sıcak geleneksel meşe oyması.' },
      { id: 'sign_neon', name: 'Retro Neon Kahve Tabela', icon: '💡', desc: 'Gece parıldayan sıcak neon ışıklar.' },
      { id: 'sign_modern', name: 'Minimalist Metal Tabela', icon: '✨', desc: 'Şık ve modern mat siyah çelik.' }
    ]
  },
  furniture: {
    id: 'furniture',
    name: 'Masa & Sandalyeler',
    icon: '🪑',
    cost: 1,
    desc: 'Kırık ve gıcırdayan eski masaları değiştir.',
    options: [
      { id: 'furn_mahogany', name: 'Maun Ağacı Masa Takımı', icon: '🪑', desc: 'Koyu renkli cilalı antik maun ahşap.' },
      { id: 'furn_nordic', name: 'İskandinav Açık Meşe', icon: '🛋️', desc: 'Ferah ve modern açık renk ahşap.' },
      { id: 'furn_bistro', name: 'Fransız Bistro Döküm Masa', icon: '☕', desc: 'Nostaljik döküm demir ve mermer.' }
    ]
  },
  machine: {
    id: 'machine',
    name: 'Espresso Makinesi',
    icon: '☕',
    cost: 2,
    desc: 'Paslanmış eski makine yerine profesyonel espresso canavarı kur.',
    options: [
      { id: 'mach_brass', name: 'Pirinç Gövdeli İtalyan Klasik', icon: '🎺', desc: 'Koleksiyonluk pirinç ve buhar vanaları.' },
      { id: 'mach_chrome', name: 'Krom Çift Gruplu Barista', icon: '⚡', desc: 'Yüksek basınçlı hızlı krom makine.' },
      { id: 'mach_digital', name: 'Dokunmatik Akıllı Espresso', icon: '🤖', desc: 'Hassas sıcaklık kontrollü dijital teknoloji.' }
    ]
  },
  wall: {
    id: 'wall',
    name: 'Duvar Dekorasyon & Raflar',
    icon: '🖼️',
    cost: 1,
    desc: 'Tozlu raflar ve dökülen boyaları yenile.',
    options: [
      { id: 'wall_brick', name: 'Tuğla Kaplama & Kahve Çuvalları', icon: '🧱', desc: 'Endüstriyel otantik tuğla dokusu.' },
      { id: 'wall_art', name: 'Kahve Sanatı Tablo Galerisi', icon: '🎨', desc: 'Usta baristaların el yapımı eserleri.' },
      { id: 'wall_shelf', name: 'Işıklı Kahve Çekirdeği Rafları', icon: '📚', desc: 'Dünyadan çekirdek tüplerinin sergisi.' }
    ]
  },
  plants: {
    id: 'plants',
    name: 'Bitkiler & Canlılık',
    icon: '🪴',
    cost: 1,
    desc: 'Solmuş yapraklar yerine canlı kahve fidanları yerleştir.',
    options: [
      { id: 'plant_arabica', name: 'Gerçek Arabica Kahve Fidanı', icon: '🌿', desc: 'Taze yeşil kahve meyveleri.' },
      { id: 'plant_monstera', name: 'Dev Deve Tabanı & Sarmaşık', icon: '🍃', desc: 'Tropik yeşillik ve huzur veren atmosfer.' },
      { id: 'plant_bonsai', name: 'Bodur Kahve Bonsaisi', icon: '🪴', desc: 'Zarif ve dinlendirici bonsai köşesi.' }
    ]
  }
};

class CafeManager {
  constructor() {
    this.renovationList = document.getElementById('renovationList');
    this.beanCounterTag = document.getElementById('renovationBeanCount');
    this.designModal = document.getElementById('modalDesignSelect');
    this.designModalTitle = document.getElementById('designModalTitle');
    this.designModalSub = document.getElementById('designModalSub');
    this.designGrid = document.getElementById('designOptionsGrid');
    this.btnConfirm = document.getElementById('btnConfirmDesign');
    this.btnCloseModal = document.getElementById('btnCloseDesignModal');

    this.activeItemToUpgrade = null;
    this.selectedOptionId = null;

    this.initCanvasEngine();
    this.bindEvents();
  }

  initCanvasEngine() {
    this.canvas = document.getElementById('cafeCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.steamParticles = [];
    this.cloudX = 0;
    this.npcX = 50;
    this.npcDir = 1;

    for (let i = 0; i < 15; i++) {
      this.steamParticles.push({
        x: 0, y: 0,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.8 - Math.random() * 0.8,
        alpha: Math.random(),
        size: 8 + Math.random() * 12
      });
    }

    const resize = () => {
      const rect = this.canvas.parentElement.getBoundingClientRect();
      this.canvas.width = rect.width || 360;
      this.canvas.height = rect.height || 480;
    };
    resize();
    window.addEventListener('resize', resize);

    this.startCanvasLoop();
  }

  startCanvasLoop() {
    const render = () => {
      this.drawCanvasFrame();
      requestAnimationFrame(render);
    };
    requestAnimationFrame(render);
  }

  drawCanvasFrame() {
    if (!this.ctx || !this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;

    // 1. Draw Warm Ambient Room Background
    const bgGrad = this.ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#2d180c');
    bgGrad.addColorStop(0.4, '#3d2417');
    bgGrad.addColorStop(1, '#1a0c06');
    this.ctx.fillStyle = bgGrad;
    this.ctx.fillRect(0, 0, w, h);

    // 2. Draw Glass Arch Window with Moving Light Rays
    this.ctx.save();
    this.ctx.fillStyle = 'rgba(255, 235, 190, 0.15)';
    this.ctx.beginPath();
    this.ctx.arc(w * 0.3, h * 0.25, 45, Math.PI, 0);
    this.ctx.rect(w * 0.3 - 45, h * 0.25, 90, 70);
    this.ctx.fill();
    
    // Window Light Beam Rays
    this.ctx.fillStyle = 'rgba(255, 235, 180, 0.08)';
    this.ctx.beginPath();
    this.ctx.moveTo(w * 0.3, h * 0.2);
    this.ctx.lineTo(w * 0.05, h * 0.7);
    this.ctx.lineTo(w * 0.45, h * 0.7);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.restore();

    // 3. Draw Parquet Wooden Floor
    const floorY = h * 0.65;
    const floorGrad = this.ctx.createLinearGradient(0, floorY, 0, h);
    floorGrad.addColorStop(0, '#4a2c1b');
    floorGrad.addColorStop(1, '#221208');
    this.ctx.fillStyle = floorGrad;
    this.ctx.fillRect(0, floorY, w, h - floorY);

    // Floor Planks Lines
    this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
    this.ctx.lineWidth = 2;
    for (let y = floorY; y < h; y += 18) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(w, y);
      this.ctx.stroke();
    }

    // 4. Draw Coffee Bar Counter & Espresso Machine
    this.ctx.fillStyle = '#5c3823';
    this.ctx.fillRect(w * 0.55, h * 0.48, w * 0.4, h * 0.2);
    this.ctx.fillStyle = '#f5b027';
    this.ctx.fillRect(w * 0.53, h * 0.47, w * 0.44, 6);

    // Coffee Machine Icon & Steam
    const machX = w * 0.75;
    const machY = h * 0.44;
    this.ctx.font = '28px sans-serif';
    this.ctx.fillText('☕', machX, machY);

    // Steam FX
    this.steamParticles.forEach(p => {
      p.y += p.vy;
      p.x += p.vx;
      p.alpha -= 0.015;
      if (p.alpha <= 0) {
        p.x = machX + 10;
        p.y = machY - 15;
        p.alpha = 1;
      }
      this.ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.5})`;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
      this.ctx.fill();
    });

    // 5. Draw Table Set & Plants
    this.ctx.font = '36px sans-serif';
    this.ctx.fillText('🪑', w * 0.18, h * 0.62);
    this.ctx.fillText('🪴', w * 0.42, h * 0.78);
    this.ctx.fillText('🪧', w * 0.48, h * 0.18);

    // 6. Draw Moving NPC Customer
    this.npcX += 0.4 * this.npcDir;
    if (this.npcX > w * 0.35 || this.npcX < 20) this.npcDir *= -1;
    this.ctx.font = '32px sans-serif';
    this.ctx.fillText('👨‍💻', this.npcX, h * 0.65);
    
    // NPC Speech Bubble
    if (Math.floor(Date.now() / 1500) % 2 === 0) {
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      this.ctx.beginPath();
      this.ctx.roundRect(this.npcX - 10, h * 0.65 - 45, 90, 22, 8);
      this.ctx.fill();
      this.ctx.fillStyle = '#3b1d03';
      this.ctx.font = 'bold 10px sans-serif';
      this.ctx.fillText('☕ Taze espresso!', this.npcX - 5, h * 0.65 - 30);
    }
  }

  bindEvents() {
    if (this.btnCloseModal) {
      this.btnCloseModal.addEventListener('click', () => this.hideDesignModal());
    }

    if (this.btnConfirm) {
      this.btnConfirm.addEventListener('click', () => this.confirmUpgrade());
    }

    // Attach click events to scene hotspots, Royal Match building pin bubbles & SVG ISO pins
    document.querySelectorAll('.upgrade-hotspot, .building-pin-bubble, .iso-hotspot-pin').forEach(pin => {
      pin.addEventListener('click', () => {
        const itemKey = pin.dataset.item;
        if (itemKey && RENOVATION_ITEMS[itemKey]) {
          this.openDesignModal(itemKey);
        }
      });
    });
  }

  // Render list of renovation tasks in Kafem tab
  renderRenovationTasks(currentBeans, userCafeState, onUpgrade) {
    this.onUpgradeComplete = onUpgrade;
    this.beanCounterTag.textContent = currentBeans;

    if (!this.renovationList) return;
    this.renovationList.innerHTML = '';

    Object.values(RENOVATION_ITEMS).forEach(item => {
      const isUpgraded = userCafeState && userCafeState[item.id];
      const canAfford = currentBeans >= item.cost;

      let designName = 'Özel Tasarım';
      if (isUpgraded) {
        const selectedId = (typeof userCafeState[item.id] === 'object') ? userCafeState[item.id].id : userCafeState[item.id];
        const foundOpt = item.options.find(o => o.id === selectedId);
        if (foundOpt) designName = foundOpt.name;
      }

      const card = document.createElement('div');
      card.className = 'renovation-card';
      card.innerHTML = `
        <div class="renovation-info">
          <span class="r-icon">${item.icon}</span>
          <div class="r-text">
            <h4>${item.name} ${isUpgraded ? '✓' : ''}</h4>
            <p>${isUpgraded ? `Tasarım: ${designName}` : item.desc}</p>
          </div>
        </div>
        <button class="btn-renovate" ${(!canAfford && !isUpgraded) ? 'disabled' : ''} data-item="${item.id}">
          ${isUpgraded ? 'Değiştir 🔄' : `${item.cost} 🫘 Yenile`}
        </button>
      `;

      card.querySelector('.btn-renovate').addEventListener('click', () => {
        this.openDesignModal(item.id);
      });

      this.renovationList.appendChild(card);
    });
  }

  // Open 3-Design Options Modal
  openDesignModal(itemKey) {
    const item = RENOVATION_ITEMS[itemKey];
    if (!item) return;

    this.activeItemToUpgrade = item;
    this.selectedOptionId = null;

    this.designModalTitle.textContent = `${item.icon} ${item.name} Tasarımı`;
    this.designModalSub.textContent = `Kafenin havasını değiştirecek tasarımı seç! (Maliyet: ${item.cost} 🫘)`;
    this.btnConfirm.disabled = true;

    this.designGrid.innerHTML = '';
    item.options.forEach(opt => {
      const optCard = document.createElement('div');
      optCard.className = 'design-option-card';
      optCard.dataset.id = opt.id;
      optCard.innerHTML = `
        <span class="d-opt-icon">${opt.icon}</span>
        <div class="d-opt-info">
          <h4>${opt.name}</h4>
          <p>${opt.desc}</p>
        </div>
      `;

      optCard.addEventListener('click', () => {
        document.querySelectorAll('.design-option-card').forEach(c => c.classList.remove('selected'));
        optCard.classList.add('selected');
        this.selectedOptionId = opt.id;
        this.btnConfirm.disabled = false;
      });

      this.designGrid.appendChild(optCard);
    });

    this.designModal.classList.add('active');
  }

  confirmUpgrade() {
    if (!this.activeItemToUpgrade || !this.selectedOptionId) return;

    const chosenOption = this.activeItemToUpgrade.options.find(o => o.id === this.selectedOptionId);
    
    // Trigger callback to update game state & subtract Coffee Beans
    if (this.onUpgradeComplete) {
      this.onUpgradeComplete(this.activeItemToUpgrade, chosenOption);
    }

    // Play visual feedback on cafe layer
    this.updateCafeLayerVisual(this.activeItemToUpgrade.id, chosenOption);

    this.hideDesignModal();
  }

  updateCafeLayerVisual(itemId, chosenOption) {
    const layerEl = document.getElementById(`layer${itemId.charAt(0).toUpperCase() + itemId.slice(1)}`);
    const fxOverlay = document.getElementById('constructionFxOverlay');
    const toastPill = document.getElementById('constructionToastPill');

    if (toastPill && chosenOption) {
      toastPill.textContent = `🔨 KAFE YENİLENDİ! ${chosenOption.name} Yerleştirildi! ✨`;
    }

    if (fxOverlay) {
      fxOverlay.classList.remove('active');
      void fxOverlay.offsetWidth; // Force reflow
      fxOverlay.classList.add('active');

      if (typeof audioEngine !== 'undefined' && audioEngine.playVictoryFanfare) {
        audioEngine.playVictoryFanfare();
      }

      setTimeout(() => {
        fxOverlay.classList.remove('active');
      }, 1400);
    }

    if (layerEl) {
      layerEl.style.opacity = '1';
      if (typeof particleEngine !== 'undefined' && particleEngine.spawnBurst) {
        particleEngine.spawnBurst(window.innerWidth / 2, window.innerHeight / 3, '#f5b027', 30);
      }
    }
  }

  hideDesignModal() {
    this.designModal.classList.remove('active');
  }
}

const cafeManager = new CafeManager();
