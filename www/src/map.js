/* ==========================================================================
   COFFEE MATCH ☕ - CHAPTER-BASED REGION MAP ENGINE (Perfect Spacing & Auto Scroll)
   ========================================================================== */

class LevelMapManager {
  constructor() {
    this.nodesContainer = document.getElementById('chapterNodesContainer');
    this.pathSvg = document.getElementById('chapterSvg');
    this.pillBadge = document.getElementById('chapterPillBadge');
    this.biomeDesc = document.getElementById('chapterBiomeDesc');
    this.progressVal = document.getElementById('chapterProgressVal');
    this.progressBar = document.getElementById('chapterBarFill');
    this.biomeCard = document.getElementById('chapterBiomeCard');
    this.destBar = document.getElementById('chapterDestBar');

    this.selectedRegionId = 1; // Default to Chapter 1: Eski Kafe
    this.currentCompletedLevel = 0;
    this.levelStarsMap = {};
    this.onLevelSelectCallback = null;
    this.previewSelectedLevel = 1;

    this.bindDestTabEvents();
    this.bindPreviewModalEvents();
  }

  bindDestTabEvents() {
    if (!this.destBar) return;
    this.destBar.addEventListener('click', (e) => {
      const tab = e.target.closest('.chapter-tab');
      if (!tab) return;

      const regionId = parseInt(tab.dataset.region);
      if (regionId) {
        this.selectedRegionId = regionId;
        this.renderMap(this.currentCompletedLevel, this.levelStarsMap, this.onLevelSelectCallback, this.selectedRegionId);
      }
    });
  }

  bindPreviewModalEvents() {
    document.getElementById('btnCloseLevelPreview')?.addEventListener('click', () => {
      document.getElementById('modalLevelPreview')?.classList.remove('active');
    });

    document.getElementById('btnStartLevelMatch')?.addEventListener('click', () => {
      document.getElementById('modalLevelPreview')?.classList.remove('active');
      if (this.onLevelSelectCallback) {
        this.onLevelSelectCallback(this.previewSelectedLevel);
      }
    });
  }

  showLevelPreview(levelNumber) {
    this.previewSelectedLevel = levelNumber;
    const config = LevelMechanicsManager.getLevelConfig(levelNumber);

    document.getElementById('previewLevelTitle').textContent = `Seviye ${levelNumber}`;
    document.getElementById('previewRegionName').textContent = `${config.region.icon} Bölge ${config.region.id}: ${config.region.name}`;
    document.getElementById('previewMovesVal').textContent = `${config.moves} Hamle`;

    const goalsList = document.getElementById('previewGoalsList');
    if (goalsList) {
      goalsList.innerHTML = config.goals.map(g => `
        <div class="p-goal-item">
          <span class="p-goal-icon">${g.icon}</span>
          <span class="p-goal-count">x${g.target}</span>
        </div>
      `).join('');
    }

    document.getElementById('modalLevelPreview')?.classList.add('active');
  }

  // Render Active Chapter Region Map with Spacious 1100px Canvas
  renderMap(currentCompletedLevel, levelStarsMap, onSelectLevel, forcedRegionId = null) {
    this.currentCompletedLevel = currentCompletedLevel;
    this.levelStarsMap = levelStarsMap;
    this.onLevelSelectCallback = onSelectLevel;

    if (!this.nodesContainer || !this.pathSvg) return;

    if (forcedRegionId !== null) {
      this.selectedRegionId = forcedRegionId;
    } else {
      const activeLvl = currentCompletedLevel + 1;
      const matchedRegion = MAP_REGIONS.find(r => activeLvl >= r.levels[0] && activeLvl <= r.levels[1]);
      if (matchedRegion) this.selectedRegionId = matchedRegion.id;
    }

    const currentRegion = MAP_REGIONS.find(r => r.id === this.selectedRegionId) || MAP_REGIONS[0];

    // 1. Update Chapter Tabs Bar Active State & Lock Badges
    const tabs = this.destBar?.querySelectorAll('.chapter-tab');
    tabs?.forEach(t => {
      const regId = parseInt(t.dataset.region);
      const regObj = MAP_REGIONS.find(r => r.id === regId);
      
      let isRegUnlocked = false;
      if (regId === 1) isRegUnlocked = true;
      else if (regObj && currentCompletedLevel >= (regObj.levels[0] - 1)) isRegUnlocked = true;

      t.classList.toggle('active', regId === this.selectedRegionId);
      t.classList.toggle('locked', !isRegUnlocked);

      if (regId === this.selectedRegionId) {
        t.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    });

    // 2. Update Top Chapter Header & Progress
    const [startLvl, endLvl] = currentRegion.levels;
    const regionTotalLevels = (endLvl - startLvl + 1);
    const regionCompletedCount = Math.max(0, Math.min(regionTotalLevels, currentCompletedLevel - startLvl + 1));
    const progressPercent = Math.round((regionCompletedCount / regionTotalLevels) * 100);

    if (this.progressVal) this.progressVal.textContent = `${regionCompletedCount} / ${regionTotalLevels} Bölüm`;
    if (this.progressBar) this.progressBar.style.width = `${Math.max(4, progressPercent)}%`;

    // 3. Update Biome Card Style & Environmental Floating Icons
    if (this.pillBadge) this.pillBadge.innerHTML = `${currentRegion.icon} Bölge ${currentRegion.id} — ${currentRegion.name}`;
    if (this.biomeDesc) this.biomeDesc.textContent = currentRegion.desc;

    if (this.biomeCard) {
      this.biomeCard.style.borderColor = currentRegion.borderColor;
      this.biomeCard.style.background = currentRegion.bg;
    }

    const envWave = this.biomeCard?.querySelector('.env-wave');
    const envFlower = this.biomeCard?.querySelector('.env-flower');
    const envBench = this.biomeCard?.querySelector('.env-bench');
    const envDuck = this.biomeCard?.querySelector('.env-duck');
    const envTulip = this.biomeCard?.querySelector('.env-tulip');

    if (currentRegion.envIcons && currentRegion.envIcons.length >= 5) {
      if (envWave) envWave.textContent = currentRegion.envIcons[0];
      if (envFlower) envFlower.textContent = currentRegion.envIcons[1];
      if (envBench) envBench.textContent = currentRegion.envIcons[2];
      if (envDuck) envDuck.textContent = currentRegion.envIcons[3];
      if (envTulip) envTulip.textContent = currentRegion.envIcons[4];
    }

    // 4. Render 20 Level Nodes inside Spacious 1100px Canvas (55px Y-spacing)
    this.nodesContainer.innerHTML = '';
    this.pathSvg.innerHTML = '';

    const points = [];
    const cardWidth = 310;
    const totalAreaHeight = 1100; // Spacious height so NO node EVER overlaps!

    let idx = 0;
    for (let i = startLvl; i <= endLvl; i++) {
      // Level startLvl starts at top (y = 60px), Level endLvl goes down to bottom (y = 1040px)
      const y = 60 + (idx * (totalAreaHeight - 120) / (regionTotalLevels - 1));
      const wave = Math.sin((idx / 1.5)) * 90;
      const x = (cardWidth / 2) + wave;
      points.push({ level: i, x: x, y: y });
      idx++;
    }

    // Draw SVG Curved Path Line
    let dStr = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cx1 = prev.x;
      const cy1 = (prev.y + curr.y) / 2;
      const cx2 = curr.x;
      const cy2 = (prev.y + curr.y) / 2;
      dStr += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${curr.x} ${curr.y}`;
    }

    const outerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    outerPath.setAttribute('d', dStr);
    outerPath.setAttribute('stroke', '#1a0d07');
    outerPath.setAttribute('stroke-width', '14');
    outerPath.setAttribute('fill', 'none');
    this.pathSvg.appendChild(outerPath);

    const innerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    innerPath.setAttribute('d', dStr);
    innerPath.setAttribute('stroke', currentRegion.borderColor);
    innerPath.setAttribute('stroke-width', '6');
    innerPath.setAttribute('stroke-dasharray', '8 4');
    innerPath.setAttribute('fill', 'none');
    this.pathSvg.appendChild(innerPath);

    // Render Round 3D Level Nodes
    points.forEach(pt => {
      const isCompleted = pt.level <= currentCompletedLevel;
      const isActive = pt.level === currentCompletedLevel + 1;
      const isLocked = pt.level > currentCompletedLevel + 1;
      const starsEarned = levelStarsMap[pt.level] || (isCompleted ? 3 : 0);
      const isChestMilestone = (pt.level % 5 === 0);
      const isSuperHard = pt.level > 5 && pt.level % 10 === 0;
      const isHard = !isSuperHard && pt.level > 5 && pt.level % 5 === 0;

      const node = document.createElement('div');
      node.className = `chapter-node-btn ${isCompleted ? 'unlocked' : ''} ${isActive ? 'active' : ''} ${isLocked ? 'locked' : ''} ${isChestMilestone ? 'milestone' : ''} ${isHard ? 'hard-level-node' : ''} ${isSuperHard ? 'super-hard-level-node' : ''}`;
      node.style.left = `${pt.x}px`;
      node.style.top = `${pt.y}px`;

      let iconText = pt.level;
      if (isLocked) iconText = isChestMilestone ? '🎁' : '🔒';
      else if (isChestMilestone && !isCompleted) iconText = '🎁';

      let difficultyBadge = '';
      if (isSuperHard) {
        difficultyBadge = `<div class="hard-tag-badge super">👑 SÜPER ZOR</div>`;
      } else if (isHard) {
        difficultyBadge = `<div class="hard-tag-badge">💥 ZOR</div>`;
      }

      node.innerHTML = `
        <span>${iconText}</span>
        ${difficultyBadge}
        ${isCompleted ? `<div class="node-stars">${'⭐'.repeat(starsEarned)}</div>` : ''}
      `;

      if (isActive) {
        const avatarBox = document.createElement('div');
        avatarBox.className = 'active-barista-avatar';
        avatarBox.innerHTML = `
          <div class="avatar-speech">Oyna! ☕</div>
          <div class="avatar-char">👨‍🍳</div>
        `;
        node.appendChild(avatarBox);
      }

      if (!isLocked) {
        node.addEventListener('click', () => {
          this.showLevelPreview(pt.level);
        });
      }

      this.nodesContainer.appendChild(node);
    });

    // Auto-scroll inside Biome Card to Active Level Node
    setTimeout(() => {
      const activeNode = this.nodesContainer.querySelector('.chapter-node-btn.active');
      if (activeNode && this.biomeCard) {
        const nodeY = activeNode.offsetTop;
        this.biomeCard.scrollTop = nodeY - (this.biomeCard.clientHeight / 2);
      }
    }, 100);
  }
}

const levelMapManager = new LevelMapManager();
