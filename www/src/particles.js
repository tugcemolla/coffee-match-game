/* ==========================================================================
   PARTICLE & VISUAL EFFECTS ENGINE (Canvas FX)
   ========================================================================== */

class ParticleEngine {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.steamParticles = [];
    this.isLooping = false;
    
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    this.initBackgroundSteam();
  }

  resizeCanvas() {
    if (!this.canvas) this.canvas = document.getElementById('fxCanvas');
    if (!this.canvas) return;
    if (!this.ctx) this.ctx = this.canvas.getContext('2d');
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      if (this.canvas.width !== Math.floor(rect.width) || this.canvas.height !== Math.floor(rect.height)) {
        this.canvas.width = Math.floor(rect.width);
        this.canvas.height = Math.floor(rect.height);
      }
    }
  }

  // Create Steam Effect for Background
  initBackgroundSteam() {
    const steamContainer = document.getElementById('bgSteam');
    if (!steamContainer) return;
    steamContainer.innerHTML = '';
    
    for (let i = 0; i < 8; i++) {
      const steam = document.createElement('div');
      steam.className = 'steam-puff';
      steam.style.cssText = `
        position: absolute;
        bottom: -50px;
        left: ${10 + (i * 12)}%;
        width: ${40 + Math.random() * 60}px;
        height: ${40 + Math.random() * 60}px;
        background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 70%);
        border-radius: 50%;
        filter: blur(12px);
        animation: floatSteam ${6 + Math.random() * 4}s infinite linear;
        animation-delay: ${Math.random() * 5}s;
      `;
      steamContainer.appendChild(steam);
    }

    // Add Keyframe for Steam Floating
    if (!document.getElementById('steamStyle')) {
      const style = document.createElement('style');
      style.id = 'steamStyle';
      style.textContent = `
        @keyframes floatSteam {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          30% { opacity: 0.6; }
          100% { transform: translateY(-80vh) scale(2.5); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }

  // Tile Burst Particles (Coffee Sparks & Stars)
  spawnBurst(x, y, color = '#e5a93c') {
    this.resizeCanvas();
    if (!this.ctx) return;
    const sparkles = ['✨', '🫘', '⭐', '💫'];
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16;
      const speed = 2.5 + Math.random() * 4.5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3 + Math.random() * 4,
        color: color,
        symbol: Math.random() > 0.6 ? sparkles[Math.floor(Math.random() * sparkles.length)] : null,
        alpha: 1,
        life: 0.91 + Math.random() * 0.05
      });
    }
    this.startLoop();
  }

  // Floating Combo Banner Popup Animation
  showComboPopup(text, x, y) {
    const popup = document.createElement('div');
    popup.className = 'combo-banner-popup';
    popup.textContent = text;
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;

    const boardContainer = document.querySelector('.board-container') || document.body;
    boardContainer.appendChild(popup);

    setTimeout(() => {
      popup.remove();
    }, 1250);
  }

  // Draw Electric Lightning Arc Zap on Canvas
  spawnLightningArc(x1, y1, x2, y2) {
    if (!this.ctx) return;
    const steps = 8;
    const points = [{ x: x1, y: y1 }];

    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const nx = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 30;
      const ny = y1 + (y2 - y1) * t + (Math.random() - 0.5) * 30;
      points.push({ x: nx, y: ny });
    }
    points.push({ x: x2, y: y2 });

    this.ctx.save();
    this.ctx.strokeStyle = '#ffe066';
    this.ctx.shadowColor = '#f5b027';
    this.ctx.shadowBlur = 15;
    this.ctx.lineWidth = 3.5;
    this.ctx.beginPath();
    this.ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      this.ctx.lineTo(points[i].x, points[i].y);
    }
    this.ctx.stroke();
    this.ctx.restore();

  spawnShockwaveRing(tileDiv) {
    if (!tileDiv) return;
    const rect = tileDiv.getBoundingClientRect();
    const boardGrid = document.querySelector('.game-board-grid') || document.body;
    const gridRect = boardGrid.getBoundingClientRect();

    const ring = document.createElement('div');
    ring.className = 'fx-shockwave-ring';
    ring.style.left = `${rect.left - gridRect.left + rect.width / 2}px`;
    ring.style.top = `${rect.top - gridRect.top + rect.height / 2}px`;

    boardGrid.appendChild(ring);
    setTimeout(() => ring.remove(), 600);
  }

  spawnLaserBeam(tileDiv, isHorizontal = true) {
    if (!tileDiv) return;
    const rect = tileDiv.getBoundingClientRect();
    const boardGrid = document.querySelector('.game-board-grid') || document.body;
    const gridRect = boardGrid.getBoundingClientRect();

    const beam = document.createElement('div');
    beam.className = `laser-beam-fx ${isHorizontal ? 'horizontal' : 'vertical'}`;

    if (isHorizontal) {
      beam.style.top = `${rect.top - gridRect.top + rect.height / 2 - 9}px`;
    } else {
      beam.style.left = `${rect.left - gridRect.left + rect.width / 2 - 9}px`;
    }

    boardGrid.appendChild(beam);
    setTimeout(() => beam.remove(), 500);
  }

  // Flying Coins & Beans Animation across screen
  flyRewardIcon(startX, startY, endX, endY, emoji = '🪙', count = 8) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        const el = document.createElement('div');
        el.className = 'flying-reward-icon';
        el.textContent = emoji;

        const jitterX = (Math.random() - 0.5) * 40;
        const jitterY = (Math.random() - 0.5) * 40;

        el.style.left = `${startX + jitterX}px`;
        el.style.top = `${startY + jitterY}px`;
        document.body.appendChild(el);

        requestAnimationFrame(() => {
          el.style.left = `${endX}px`;
          el.style.top = `${endY}px`;
          el.style.transform = 'scale(0.5)';
          el.style.opacity = '0.3';
        });

        setTimeout(() => {
          el.remove();
        }, 800);
      }, i * 65);
    }
  }

  startLoop() {
    if (this.isLooping) return;
    this.isLooping = true;
    const animate = () => {
      if (!this.ctx) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha *= p.life;
        p.radius *= 0.96;

        this.ctx.save();
        this.ctx.globalAlpha = p.alpha;
        if (p.symbol) {
          this.ctx.font = '16px serif';
          this.ctx.fillText(p.symbol, p.x, p.y);
        } else {
          this.ctx.fillStyle = p.color;
          this.ctx.beginPath();
          this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          this.ctx.fill();
        }
        this.ctx.restore();

        if (p.alpha < 0.02 || p.radius < 0.5) {
          this.particles.splice(i, 1);
        }
      }

      if (this.particles.length > 0) {
        requestAnimationFrame(animate);
      } else {
        this.isLooping = false;
      }
    };
  // 💣 1. BOMB EXPLOSION FX (3x3 Bomb Drop & Screen Shake Explosion)
  async triggerBombExplosionFx(targetEl) {
    if (!targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Drop Bomb Icon Overlay
    const bombOverlay = document.createElement('div');
    bombOverlay.className = 'fx-bomb-overlay';
    bombOverlay.innerHTML = '💣<span class="bomb-fuse-spark">✨</span>';
    bombOverlay.style.left = `${centerX}px`;
    bombOverlay.style.top = `${centerY}px`;
    document.body.appendChild(bombOverlay);

    // Screen Shake Container
    const boardContainer = document.querySelector('.board-container');
    if (boardContainer) {
      boardContainer.classList.add('shake-fx');
      setTimeout(() => boardContainer.classList.remove('shake-fx'), 600);
    }

    await new Promise(r => setTimeout(r, 400));

    // Shockwave Ring & Particles Explosion
    const shockwave = document.createElement('div');
    shockwave.className = 'fx-shockwave-ring';
    shockwave.style.left = `${centerX}px`;
    shockwave.style.top = `${centerY}px`;
    document.body.appendChild(shockwave);

    this.spawnBurst(centerX, centerY, '#f39c12');
    this.spawnBurst(centerX, centerY, '#e74c3c');

    await new Promise(r => setTimeout(r, 550));

    bombOverlay.remove();
    shockwave.remove();
  }

  // 💨 2. STEAM SWEEP FX (Horizontal Steam Wand Jet Blast across Row)
  async triggerSteamSweepFx(rowDivs) {
    if (!rowDivs || rowDivs.length === 0) return;

    rowDivs.forEach((div, idx) => {
      setTimeout(() => {
        div.classList.add('steam-blast-tile');
        const rect = div.getBoundingClientRect();
        this.spawnBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, '#ffffff');
      }, idx * 45);
    });

    const firstRect = rowDivs[0].getBoundingClientRect();
    const lastRect = rowDivs[rowDivs.length - 1].getBoundingClientRect();

    const jetStream = document.createElement('div');
    jetStream.className = 'fx-steam-jetstream';
    jetStream.style.left = `${firstRect.left}px`;
    jetStream.style.top = `${firstRect.top + firstRect.height / 2}px`;
    jetStream.style.width = `${lastRect.right - firstRect.left}px`;
    document.body.appendChild(jetStream);

    await new Promise(r => setTimeout(r, 600));

    jetStream.remove();
    rowDivs.forEach(div => div.classList.remove('steam-blast-tile'));
  }

  // ⚡ 3. EPIC LIGHTNING STORM FX (Fullscreen Strobe & Sky-to-Tile Jagged SVG Lightning Strikes)
  async triggerLightningStormFx(targetDivs) {
    if (!targetDivs || targetDivs.length === 0) return;

    // 1. Fullscreen Thunder Strobe Flash
    const strobe = document.getElementById('lightningScreenStrobe');
    if (strobe) {
      strobe.classList.add('flash-active');
      setTimeout(() => strobe.classList.remove('flash-active'), 600);
    }

    // 2. Screen Shake FX
    const boardContainer = document.querySelector('.board-container');
    if (boardContainer) {
      boardContainer.classList.add('shake-fx');
      setTimeout(() => boardContainer.classList.remove('shake-fx'), 700);
    }

    // 3. Drop Sky-to-Tile Jagged SVG Lightning Bolts onto target coffee tiles
    const activeSvgs = [];
    targetDivs.forEach((div) => {
      div.classList.add('lightning-zap-tile');
      const rect = div.getBoundingClientRect();
      const targetX = rect.left + rect.width / 2;
      const targetY = rect.top + rect.height / 2;

      // Create Jagged Sky-to-Tile SVG Lightning Bolt
      const svg = this.createJaggedLightningSVG(targetX, 0, targetX, targetY);
      document.body.appendChild(svg);
      activeSvgs.push(svg);

      // Impact Explosive Burst
      this.spawnBurst(targetX, targetY, '#ffea00');
      this.spawnBurst(targetX, targetY, '#00f2fe');
    });

    // WAIT for 750ms so player clearly sees the thunderbolt strike before tiles cascade!
    await new Promise(resolve => setTimeout(resolve, 750));

    activeSvgs.forEach(s => s.remove());
    targetDivs.forEach(div => div.classList.remove('lightning-zap-tile'));
  }

  createJaggedLightningSVG(x1, y1, x2, y2) {
    const steps = 12;
    let pointsStr = `${x1},${y1} `;
    
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const currX = x1 + (x2 - x1) * t + (Math.random() - 0.5) * 45;
      const currY = y1 + (y2 - y1) * t;
      pointsStr += `${currX},${currY} `;
    }
    pointsStr += `${x2},${y2}`;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'lightning-bolt-svg');
    svg.setAttribute('width', window.innerWidth);
    svg.setAttribute('height', window.innerHeight);
    svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);
    svg.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 9999999;
      filter: drop-shadow(0 0 12px #ffea00) drop-shadow(0 0 25px #00f2fe);
    `;

    const glowPolyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    glowPolyline.setAttribute('points', pointsStr);
    glowPolyline.setAttribute('fill', 'none');
    glowPolyline.setAttribute('stroke', '#00f2fe');
    glowPolyline.setAttribute('stroke-width', '14');
    glowPolyline.setAttribute('opacity', '0.9');

    const corePolyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    corePolyline.setAttribute('points', pointsStr);
    corePolyline.setAttribute('fill', 'none');
    corePolyline.setAttribute('stroke', '#ffffff');
    corePolyline.setAttribute('stroke-width', '6');
    corePolyline.setAttribute('stroke-linecap', 'round');
    corePolyline.setAttribute('stroke-linejoin', 'round');

    svg.appendChild(glowPolyline);
    svg.appendChild(corePolyline);
    return svg;
  }
}

const particleEngine = new ParticleEngine('fxCanvas');
