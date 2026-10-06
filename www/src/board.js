/* ==========================================================================
   MATCH-3 BOARD ENGINE (Auto-Shuffle, Valid Move Check & Clean Tile Engine)
   ========================================================================== */

class BoardEngine {
  constructor(gridElementId) {
    this.gridEl = document.getElementById(gridElementId);
    this.rows = 8;
    this.cols = 8;
    this.board = []; // 8x8 matrix of tile objects
    
    this.selectedTile = null;
    this.isAnimating = false;
    this.isGameActive = false;
    this.isInitializing = false;

    this.onMatchCallback = null;
    this.onMoveUsedCallback = null;
    this.onCompleteCallback = null;

    this.currentLevelConfig = null;
    this.remainingMoves = 25;
    this.levelScore = 0;
    this.currentGoals = {};

    this.idleSeconds = 0;
    this.idleTimerInterval = null;
    this.currentHintTiles = [];
    this.moveTurnId = 1;

    this.bindTouchEvents();
  }

  // Primary Entry Point: Initialize Level with HUD Orders & 8x8 Board
  initLevel(levelParam, onCompleteCallback = null) {
    this.isInitializing = true;
    let validLevel = 1;
    let config = null;

    if (typeof levelParam === 'object' && levelParam !== null) {
      config = levelParam;
      validLevel = config.levelTitle || 'GÜNÜN BULMACASI';
    } else {
      validLevel = parseInt(levelParam) || 1;
      config = LevelMechanicsManager.getLevelConfig(validLevel);
    }

    this.currentLevelConfig = config;
    this.remainingMoves = (config && config.moves) ? config.moves : 25;
    this.levelScore = 0;
    this.isGameActive = true;
    this.isAnimating = false;
    this.onCompleteCallback = onCompleteCallback;

    this.resetIdleTimer();
    this.startIdleChecker();

    try {
      // 1. Update HUD Header Values
      const hudLevelLabel = document.getElementById('hudLevelLabel');
      if (hudLevelLabel) hudLevelLabel.textContent = `SEVİYE ${validLevel}`;

      const hudMoves = document.getElementById('hudMoves');
      if (hudMoves) hudMoves.textContent = this.remainingMoves;

      const hudScore = document.getElementById('hudScore');
      if (hudScore) hudScore.textContent = '0';

      const mechanicIcon = document.getElementById('mechanicIcon');
      if (mechanicIcon) mechanicIcon.textContent = config?.mechanic?.icon || '💡';

      const mechanicText = document.getElementById('mechanicText');
      if (mechanicText) mechanicText.textContent = config?.mechanic?.desc || 'Hedef kahve siparişlerini tamamlamak için eşleştirme yap!';

      // 2. Render Order Goals in HUD (#hudOrdersList)
      const levelGoals = (config && Array.isArray(config.goals) && config.goals.length > 0)
        ? config.goals
        : [
            { type: 'espresso', target: 8, icon: '☕' },
            { type: 'croissant', target: 6, icon: '🥐' }
          ];

      const hudOrdersList = document.getElementById('hudOrdersList');
      if (hudOrdersList) {
        hudOrdersList.innerHTML = levelGoals.map(g => `
          <div class="hud-order-item" id="goal_${g.type}">
            <span class="order-icon">${g.icon}</span>
            <span class="order-count" id="goal_val_${g.type}">x${g.target}</span>
          </div>
        `).join('');
      }

      // Track Goal Targets
      this.currentGoals = {};
      levelGoals.forEach(g => {
        this.currentGoals[g.type] = g.target;
      });

      // 3. Create 8x8 Board & Render Tiles
      this.initLevelBoard(config, 
        (matchedCounts, matchLength, combo) => this.handleMatches(matchedCounts, matchLength, combo),
        () => this.handleMoveUsed()
      );
    } catch (err) {
      console.error('initLevel initialization error:', err);
    } finally {
      this.isInitializing = false;
    }
  }

  // Handle Match Events & Update Goals
  handleMatches(matchedCounts, matchLength, combo) {
    if (!this.isGameActive || this.isInitializing) return;

    // Score calculation
    let points = matchLength * 50;
    if (combo > 1) points *= combo;
    this.levelScore += points;

    const hudScore = document.getElementById('hudScore');
    if (hudScore) hudScore.textContent = this.levelScore.toLocaleString();

    // Update Goal Items in HUD
    Object.keys(matchedCounts).forEach(tileType => {
      if (this.currentGoals[tileType] !== undefined && this.currentGoals[tileType] > 0) {
        this.currentGoals[tileType] = Math.max(0, this.currentGoals[tileType] - matchedCounts[tileType]);
        const valEl = document.getElementById(`goal_val_${tileType}`);
        const itemEl = document.getElementById(`goal_${tileType}`);
        if (valEl) {
          valEl.textContent = this.currentGoals[tileType] === 0 ? '✓' : `x${this.currentGoals[tileType]}`;
        }
        if (itemEl && this.currentGoals[tileType] === 0) {
          itemEl.classList.add('completed');
        }
      }
    });

    // Check Win Condition Continuously
    this.checkWinCondition();
  }

  // Check if all objectives are completed
  checkWinCondition() {
    if (!this.isGameActive || this.isInitializing) return false;

    const goalKeys = Object.keys(this.currentGoals);
    if (goalKeys.length === 0) return false;

    const allObjectivesCompleted = goalKeys.every(k => this.currentGoals[k] <= 0);

    if (this.remainingMoves >= 0 && allObjectivesCompleted) {
      console.log("Objectives Completed", this.currentGoals);
      console.log("Success Triggered");
      this.pauseBoard();
      return true;
    }
    return false;
  }

  // Pause Board & Stop Input/Cascades
  async pauseBoard() {
    this.isGameActive = false;
    this.isAnimating = true; // Disable input, dragging, cascades

    try {
      if (typeof audioEngine !== 'undefined' && audioEngine.playVictory) {
        audioEngine.playVictory();
      }
    } catch (e) {
      console.warn('Audio play error:', e);
    }

    // Victory Bonus Blast: Convert remaining moves into Bombs & Lasers and detonate them!
    if (this.remainingMoves > 0) {
      if (typeof particleEngine !== 'undefined' && particleEngine.showComboPopup) {
        particleEngine.showComboPopup('🎆 ZAFER PATLAMASI! 💥', 172, 172);
      }

      const countToConvert = Math.min(this.remainingMoves, 5);
      for (let i = 0; i < countToConvert; i++) {
        const r = Math.floor(Math.random() * this.rows);
        const c = Math.floor(Math.random() * this.cols);
        const tile = this.board[r] ? this.board[r][c] : null;
        if (tile && !tile.obstacle) {
          const type = i % 2 === 0 ? 'bomb' : 'line_h';
          tile.isSpecial = type;
          tile.type = type;
          tile.icon = type === 'bomb' ? '💣' : '⚡';
        }
      }
      this.renderBoard();
      await this.delay(350);

      // Detonate special tiles
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          const t = this.board[r][c];
          if (t && t.isSpecial) {
            if (t.isSpecial === 'bomb') {
              this.triggerBombExplosionAt(r, c);
            } else if (t.isSpecial === 'line_h' || t.isSpecial === 'line_v') {
              this.triggerLineLaserAt(r, c, t.isSpecial === 'line_h');
            }
            await this.delay(200);
          }
        }
      }
    }

    const winData = {
      isWin: true,
      levelNumber: this.currentLevelConfig ? this.currentLevelConfig.level : 1,
      remainingMoves: this.remainingMoves,
      score: this.levelScore,
      completedGoals: this.currentLevelConfig ? this.currentLevelConfig.goals : []
    };

    // Trigger Application Level Complete Callback (which calls showWinReceipt exactly ONCE)
    if (this.onCompleteCallback) {
      this.onCompleteCallback(winData);
    }
  }

  // Handle Player Move Deductions
  handleMoveUsed() {
    if (!this.isGameActive || this.isInitializing) return;

    this.remainingMoves--;
    const hudMoves = document.getElementById('hudMoves');
    if (hudMoves) hudMoves.textContent = this.remainingMoves;

    // Expanding Milk Foam Mechanic: If no foam was destroyed during this move, foam spreads to 1 adjacent tile!
    if (!this.wasFoamDestroyedThisTurn) {
      this.spreadMilkFoam();
    }

    if (this.remainingMoves <= 0) {
      const isWin = Object.values(this.currentGoals).every(rem => rem <= 0);
      if (!isWin) {
        this.isGameActive = false;
        if (this.onCompleteCallback) {
          this.onCompleteCallback({
            isWin: false,
            levelNumber: this.currentLevelConfig ? this.currentLevelConfig.level : 1,
            remainingMoves: 0,
            score: this.levelScore,
            completedGoals: this.currentLevelConfig ? this.currentLevelConfig.goals : []
          });
        }
      }
    }
  }

  // Spreading Milk Foam Mechanic
  spreadMilkFoam() {
    const foamTiles = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.board[r] && this.board[r][c] && this.board[r][c].obstacle === 'foam') {
          foamTiles.push(this.board[r][c]);
        }
      }
    }

    if (foamTiles.length === 0) return;

    // Pick random foam tile and find valid non-obstacle neighbor
    const sourceFoam = foamTiles[Math.floor(Math.random() * foamTiles.length)];
    const neighbors = [
      { r: sourceFoam.row - 1, c: sourceFoam.col },
      { r: sourceFoam.row + 1, c: sourceFoam.col },
      { r: sourceFoam.row, c: sourceFoam.col - 1 },
      { r: sourceFoam.row, c: sourceFoam.col + 1 }
    ];

    const validTargetNeighbors = neighbors.filter(n => 
      n.r >= 0 && n.r < this.rows && n.c >= 0 && n.c < this.cols &&
      this.board[n.r][n.c] && !this.board[n.r][n.c].obstacle
    );

    if (validTargetNeighbors.length > 0) {
      const target = validTargetNeighbors[Math.floor(Math.random() * validTargetNeighbors.length)];
      this.board[target.r][target.c].obstacle = 'foam';
      this.board[target.r][target.c].obstacleHp = 1;
      this.renderBoard();

      if (typeof particleEngine !== 'undefined' && particleEngine.showComboPopup) {
        particleEngine.showComboPopup('🥛 SÜT KÖPÜĞÜ YAYILDI! ☁️', 172, 172);
      }
    }
  }

  // Initialize new game board for current level config
  initLevelBoard(levelConfig, onMatch, onMoveUsed) {
    this.levelConfig = levelConfig;
    this.onMatchCallback = onMatch;
    this.onMoveUsedCallback = onMoveUsed;
    this.selectedTile = null;
    this.isAnimating = false;

    this.createInitialBoard();
    this.renderBoard();
  }

  getRandomTileForLevel() {
    let pool = GAME_TILES;
    if (this.currentLevelConfig && Array.isArray(this.currentLevelConfig.allowedTiles)) {
      const allowed = this.currentLevelConfig.allowedTiles;
      const filtered = GAME_TILES.filter(t => allowed.includes(t.id));
      if (filtered.length > 0) pool = filtered;
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Generate board with guarantee: NO INITIAL MATCHES & FAST INSTANT RENDER
  createInitialBoard() {
    this.generateRandomBoard();

    // Scatter level obstacle goals onto the board (e.g. Tough 2-Hit Ice 🧊, Cabinet 🗄️, Crate 📦, Foam 🥛)
    if (this.currentLevelConfig && Array.isArray(this.currentLevelConfig.goals)) {
      this.currentLevelConfig.goals.forEach(goal => {
        if (['ice', 'crate', 'cabinet', 'foam'].includes(goal.type)) {
          const obstacleType = goal.type;
          const targetCount = goal.target || 6;
          let placed = 0;

          // Pick random inner tiles to place the obstacle
          for (let attempt = 0; attempt < 100 && placed < targetCount; attempt++) {
            const r = 1 + Math.floor(Math.random() * (this.rows - 2));
            const c = 1 + Math.floor(Math.random() * (this.cols - 2));
            if (this.board[r] && this.board[r][c] && !this.board[r][c].obstacle) {
              this.board[r][c].obstacle = obstacleType;
              this.board[r][c].obstacleHp = (obstacleType === 'ice' || obstacleType === 'cabinet') ? 2 : 1; // 2 Hits required for Ice & Cabinet!
              placed++;
            }
          }
        }
      });
    }

    // Prevent initial 3-in-a-row matches instantly in O(N) time
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        while (
          (c >= 2 && this.board[r][c].type === this.board[r][c - 1].type && this.board[r][c - 1].type === this.board[r][c - 2].type) ||
          (r >= 2 && this.board[r][c].type === this.board[r - 1][c].type && this.board[r - 1][c].type === this.board[r - 2][c].type)
        ) {
          const newRandom = this.getRandomTileForLevel();
          this.board[r][c].type = newRandom.id;
          this.board[r][c].icon = newRandom.icon;
          this.board[r][c].color = newRandom.color;
        }
      }
    }
  }

  generateRandomBoard() {
    this.board = [];
    for (let r = 0; r < this.rows; r++) {
      const row = [];
      for (let c = 0; c < this.cols; c++) {
        const randomType = this.getRandomTileForLevel();
        row.push({
          row: r,
          col: c,
          type: randomType.id,
          icon: randomType.icon,
          color: randomType.color,
          obstacle: null,
          isSpecial: null
        });
      }
      this.board.push(row);
    }
  }

  // Render 8x8 Grid elements into DOM
  renderBoard() {
    if (!this.gridEl) {
      this.gridEl = document.getElementById('gameBoardGrid');
    }
    if (!this.gridEl) return;

    if (!this.board || this.board.length === 0) {
      this.generateRandomBoard();
    }

    this.gridEl.innerHTML = '';

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const tile = this.board[r][c];
        if (!tile) continue;

        const tileDiv = document.createElement('div');
        const droppingClass = tile.isDropping ? 'tile-dropping' : '';
        const isBomb = tile.isSpecial === 'bomb' || tile.type === 'bomb';
        const isColorBomb = tile.isSpecial === 'color_bomb' || tile.type === 'color_bomb';
        const isLineLaser = tile.isSpecial === 'line_h' || tile.isSpecial === 'line_v' || tile.type === 'line_h' || tile.type === 'line_v';

        let specialClass = '';
        if (isBomb) specialClass = 'special-bomb-tile';
        else if (isColorBomb) specialClass = 'special-color-bomb-tile';
        else if (isLineLaser) {
          const isH = tile.isSpecial === 'line_h' || tile.type === 'line_h';
          specialClass = `special-laser-tile ${isH ? 'special-laser-h' : 'special-laser-v'}`;
        }

        const isCracked = tile.obstacle === 'ice' && tile.obstacleHp === 1;
        const obstacleClass = tile.obstacle ? `tile-obstacle-${tile.obstacle} ${isCracked ? 'cracked-ice' : ''}` : '';

        tile.isDropping = false;
        tileDiv.className = `tile ${specialClass} ${obstacleClass} ${droppingClass}`;
        tileDiv.dataset.row = r;
        tileDiv.dataset.col = c;

        let iconToShow = tile.icon;
        if (isBomb) iconToShow = '💣';
        else if (isColorBomb) iconToShow = '🌟';

        tileDiv.innerHTML = `<span>${iconToShow}</span>`;

        tileDiv.addEventListener('click', () => this.handleTileClick(r, c));
        this.gridEl.appendChild(tileDiv);
      }
    }
  }

  resetIdleTimer() {
    this.idleSeconds = 0;
    this.clearHintHighlight();
  }

  clearHintHighlight() {
    if (this.gridEl) {
      this.gridEl.querySelectorAll('.tile-hint').forEach(el => el.classList.remove('tile-hint'));
    }
    this.currentHintTiles = [];
  }

  startIdleChecker() {
    if (this.idleTimerInterval) clearInterval(this.idleTimerInterval);
    this.idleSeconds = 0;
    this.idleTimerInterval = setInterval(() => {
      if (!this.isGameActive || this.isAnimating || this.isInitializing) return;

      this.idleSeconds++;
      if (this.idleSeconds >= 10) {
        if (this.currentHintTiles.length === 0) {
          const hintPair = this.findValidMovePair();
          if (hintPair) {
            this.showHintHighlight(hintPair);
          } else {
            this.shuffleBoard();
          }
        }
      }
    }, 1000);
  }

  findValidMovePair() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const t1 = this.board[r][c];
        if (!t1 || !t1.type) continue;

        // Try Right Swap
        if (c + 1 < this.cols) {
          const t2 = this.board[r][c + 1];
          if (t2 && t2.type) {
            this.swapTilesData(t1, t2);
            const matches = this.findMatches();
            this.swapTilesData(t1, t2);
            if (matches.length > 0) return [t1, t2];
          }
        }

        // Try Down Swap
        if (r + 1 < this.rows) {
          const t2 = this.board[r + 1][c];
          if (t2 && t2.type) {
            this.swapTilesData(t1, t2);
            const matches = this.findMatches();
            this.swapTilesData(t1, t2);
            if (matches.length > 0) return [t1, t2];
          }
        }
      }
    }
    return null;
  }

  showHintHighlight(pair) {
    this.clearHintHighlight();
    this.currentHintTiles = pair;
    pair.forEach(tile => {
      const el = this.getTileDiv(tile.row, tile.col);
      if (el) el.classList.add('tile-hint');
    });
  }

  handleTileClick(r, c) {
    if (this.isAnimating || !this.isGameActive) return;
    this.resetIdleTimer();

    const clicked = this.board[r][c];

    // If clicked tile is a Special Bomb Tile, detonate 3x3 blast immediately!
    if (clicked && (clicked.isSpecial === 'bomb' || clicked.type === 'bomb')) {
      this.triggerBombExplosionAt(r, c);
      return;
    }

    // If clicked tile is an Ultra Gold Color Bomb (🌟), detonate all tiles across the board!
    if (clicked && (clicked.isSpecial === 'color_bomb' || clicked.type === 'color_bomb')) {
      this.triggerColorBombExplosionAt(r, c);
      return;
    }

    // If clicked tile is a Line Laser Tile (⚡), shoot laser across entire row/col!
    if (clicked && (clicked.isSpecial === 'line_h' || clicked.isSpecial === 'line_v' || clicked.type === 'line_h' || clicked.type === 'line_v')) {
      const isH = clicked.isSpecial === 'line_h' || clicked.type === 'line_h';
      this.triggerLineLaserAt(r, c, isH);
      return;
    }

    if (!this.selectedTile) {
      this.selectedTile = clicked;
      this.highlightTile(r, c, true);
      audioEngine.playSwap();
    } else {
      const prev = this.selectedTile;
      this.highlightTile(prev.row, prev.col, false);
      this.selectedTile = null;

      if (prev.row === r && prev.col === c) return;

      const isAdjacent = (Math.abs(prev.row - r) + Math.abs(prev.col - c)) === 1;
      if (isAdjacent) {
        this.attemptSwap(prev, clicked);
      } else {
        this.selectedTile = clicked;
        this.highlightTile(r, c, true);
        audioEngine.playSwap();
      }
    }
  }

  highlightTile(r, c, isSelected) {
    const tileEl = this.getTileDiv(r, c);
    if (tileEl) {
      tileEl.classList.toggle('selected', isSelected);
    }
  }

  getTileDiv(r, c) {
    return this.gridEl?.querySelector(`.tile[data-row="${r}"][data-col="${c}"]`);
  }

  async attemptSwap(tile1, tile2) {
    this.isAnimating = true;
    this.resetIdleTimer();

    const el1 = this.getTileDiv(tile1.row, tile1.col);
    const el2 = this.getTileDiv(tile2.row, tile2.col);

    if (el1 && el2) {
      const rect1 = el1.getBoundingClientRect();
      const rect2 = el2.getBoundingClientRect();
      const deltaX = rect2.left - rect1.left;
      const deltaY = rect2.top - rect1.top;

      el1.style.transition = 'transform 0.18s cubic-bezier(0.25, 1, 0.5, 1)';
      el2.style.transition = 'transform 0.18s cubic-bezier(0.25, 1, 0.5, 1)';

      el1.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.08)`;
      el2.style.transform = `translate(${-deltaX}px, ${-deltaY}px) scale(1.08)`;

      audioEngine.playSwap();
      await this.delay(180);
    }

    this.swapTilesData(tile1, tile2);
    this.renderBoard();

    const matches = this.findMatches();
    if (matches.length > 0) {
      this.moveTurnId++;
      if (this.onMoveUsedCallback) this.onMoveUsedCallback();
      await this.processMatchesAndCascades(matches);
    } else {
      // Revert swap smoothly if no match!
      const revEl1 = this.getTileDiv(tile1.row, tile1.col);
      const revEl2 = this.getTileDiv(tile2.row, tile2.col);

      if (revEl1 && revEl2) {
        const rect1 = revEl1.getBoundingClientRect();
        const rect2 = revEl2.getBoundingClientRect();
        const deltaX = rect2.left - rect1.left;
        const deltaY = rect2.top - rect1.top;

        revEl1.style.transition = 'transform 0.18s cubic-bezier(0.25, 1, 0.5, 1)';
        revEl2.style.transition = 'transform 0.18s cubic-bezier(0.25, 1, 0.5, 1)';

        revEl1.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
        revEl2.style.transform = `translate(${-deltaX}px, ${-deltaY}px)`;

        audioEngine.playSwap();
        await this.delay(180);
      }

      this.swapTilesData(tile1, tile2);
      this.renderBoard();
    }

    this.isAnimating = false;
  }

  swapTilesData(t1, t2) {
    const tempType = t1.type;
    const tempIcon = t1.icon;
    const tempColor = t1.color;
    const tempObstacle = t1.obstacle;

    t1.type = t2.type;
    t1.icon = t2.icon;
    t1.color = t2.color;
    t1.obstacle = t2.obstacle;

    t2.type = tempType;
    t2.icon = tempIcon;
    t2.color = tempColor;
    t2.obstacle = tempObstacle;
  }

  findMatches() {
    const matchedCoords = new Set();

    // Horizontal check
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols - 2; c++) {
        const t1 = this.board[r][c];
        const t2 = this.board[r][c + 1];
        const t3 = this.board[r][c + 2];
        if (t1 && t2 && t3 && t1.type && t1.type === t2.type && t2.type === t3.type) {
          matchedCoords.add(`${r},${c}`);
          matchedCoords.add(`${r},${c + 1}`);
          matchedCoords.add(`${r},${c + 2}`);
        }
      }
    }

    // Vertical check
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows - 2; r++) {
        const t1 = this.board[r][c];
        const t2 = this.board[r + 1][c];
        const t3 = this.board[r + 2][c];
        if (t1 && t2 && t3 && t1.type && t1.type === t2.type && t2.type === t3.type) {
          matchedCoords.add(`${r},${c}`);
          matchedCoords.add(`${r + 1},${c}`);
          matchedCoords.add(`${r + 2},${c}`);
        }
      }
    }

    const result = [];
    matchedCoords.forEach(coord => {
      const [r, c] = coord.split(',').map(Number);
      if (this.board[r] && this.board[r][c]) {
        result.push(this.board[r][c]);
      }
    });
    return result;
  }

  hasMatchesOnBoard() {
    return this.findMatches().length > 0;
  }

  hasValidMoves() {
    return true;
  }

  findMatchGroups() {
    const hMatchGroups = [];
    const vMatchGroups = [];

    // Horizontal groups
    for (let r = 0; r < this.rows; r++) {
      let currentGroup = [];
      for (let c = 0; c < this.cols; c++) {
        const tile = this.board[r][c];
        if (tile && tile.type) {
          if (currentGroup.length === 0 || currentGroup[0].type === tile.type) {
            currentGroup.push(tile);
          } else {
            if (currentGroup.length >= 3) hMatchGroups.push(currentGroup);
            currentGroup = [tile];
          }
        } else {
          if (currentGroup.length >= 3) hMatchGroups.push(currentGroup);
          currentGroup = [];
        }
      }
      if (currentGroup.length >= 3) hMatchGroups.push(currentGroup);
    }

    // Vertical groups
    for (let c = 0; c < this.cols; c++) {
      let currentGroup = [];
      for (let r = 0; r < this.rows; r++) {
        const tile = this.board[r][c];
        if (tile && tile.type) {
          if (currentGroup.length === 0 || currentGroup[0].type === tile.type) {
            currentGroup.push(tile);
          } else {
            if (currentGroup.length >= 3) vMatchGroups.push(currentGroup);
            currentGroup = [tile];
          }
        } else {
          if (currentGroup.length >= 3) vMatchGroups.push(currentGroup);
          currentGroup = [];
        }
      }
      if (currentGroup.length >= 3) vMatchGroups.push(currentGroup);
    }

    return { hMatchGroups, vMatchGroups };
  }

  async processMatchesAndCascades(matchedTiles, comboCount = 1, isFromSpecial = false) {
    const typeCounts = {};
    const obstacleCounts = {};

    this.wasFoamDestroyedThisTurn = false;

    const damageObstacleTile = (t) => {
      if (!t || !t.obstacle || processedObstacles.has(t)) return;
      processedObstacles.add(t);

      // GUARANTEE: Max 1 HP damage per move turn!
      if (t.lastDamagedTurn === this.moveTurnId) return;
      t.lastDamagedTurn = this.moveTurnId;

      if (t.obstacleHp === undefined || t.obstacleHp === null) {
        t.obstacleHp = (t.obstacle === 'ice' || t.obstacle === 'cabinet') ? 2 : 1;
      }

      if (t.obstacle === 'foam') {
        this.wasFoamDestroyedThisTurn = true;
      }

      t.obstacleHp--;

      if (t.obstacle === 'cabinet' && t.obstacleHp === 1) {
        // 1st Hit: Open Cabinet Doors!
        t.obstacle = 'cabinet_open';
      } else if (t.obstacleHp <= 0) {
        // Shattered & Cleared!
        const baseKey = t.obstacle === 'cabinet_open' ? 'cabinet' : t.obstacle;
        obstacleCounts[baseKey] = (obstacleCounts[baseKey] || 0) + 1;
        t.obstacle = null;
        t.obstacleHp = 0;
      }
    };

    matchedTiles.forEach(tile => {
      if (tile.type && tile.type !== 'bomb' && tile.type !== 'color_bomb' && tile.type !== 'line_h' && tile.type !== 'line_v') {
        typeCounts[tile.type] = (typeCounts[tile.type] || 0) + 1;
      }

      // 1. Damage obstacle on matched tile
      damageObstacleTile(tile);

      // 2. Damage obstacles on 4 adjacent neighbors (melt adjacent ice!)
      const neighbors = [
        { r: tile.row - 1, c: tile.col },
        { r: tile.row + 1, c: tile.col },
        { r: tile.row, c: tile.col - 1 },
        { r: tile.row, c: tile.col + 1 }
      ];

      neighbors.forEach(n => {
        if (n.r >= 0 && n.r < this.rows && n.c >= 0 && n.c < this.cols) {
          const nTile = this.board[n.r][n.c];
          damageObstacleTile(nTile);
        }
      });
    });

    // Merge obstacle counts into typeCounts so HUD order goals decrease!
    Object.keys(obstacleCounts).forEach(obs => {
      typeCounts[obs] = (typeCounts[obs] || 0) + obstacleCounts[obs];
    });

    // Detect 3 distinct Special Tile creation types:
    // 1. T/L Shape (Intersection) -> 💣 3x3 Bomb
    // 2. 5-in-a-row -> 🌟 Color Bomb
    // 3. 4-in-a-row -> ⚡ Line Laser
    let specialTargetTile = null;
    let specialTargetType = null;

    if (!isFromSpecial) {
      const { hMatchGroups, vMatchGroups } = this.findMatchGroups();

      // 1. Check T/L Intersection (3x3 Bomb)
      for (const hg of hMatchGroups) {
        for (const vg of vMatchGroups) {
          const intersect = hg.find(t1 => vg.includes(t1));
          if (intersect) {
            specialTargetTile = intersect;
            specialTargetType = 'bomb';
            break;
          }
        }
        if (specialTargetTile) break;
      }

      // 2. Check 5-in-a-row (Color Bomb)
      if (!specialTargetTile) {
        const line5 = [...hMatchGroups, ...vMatchGroups].find(g => g.length >= 5);
        if (line5) {
          specialTargetTile = line5[Math.floor(line5.length / 2)];
          specialTargetType = 'color_bomb';
        }
      }

      // 3. Check 4-in-a-row (Line Laser)
      if (!specialTargetTile) {
        const line4H = hMatchGroups.find(g => g.length === 4);
        if (line4H) {
          specialTargetTile = line4H[Math.floor(line4H.length / 2)];
          specialTargetType = 'line_h';
        } else {
          const line4V = vMatchGroups.find(g => g.length === 4);
          if (line4V) {
            specialTargetTile = line4V[Math.floor(line4V.length / 2)];
            specialTargetType = 'line_v';
          }
        }
      }
    }

    // Spawn Particle Bursts for matched tiles
    matchedTiles.forEach(tile => {
      const tileDiv = this.getTileDiv(tile.row, tile.col);
      if (tileDiv && typeof particleEngine !== 'undefined') {
        const rect = tileDiv.getBoundingClientRect();
        const canvasRect = particleEngine.canvas ? particleEngine.canvas.getBoundingClientRect() : rect;
        const x = rect.left - canvasRect.left + rect.width / 2;
        const y = rect.top - canvasRect.top + rect.height / 2;
        particleEngine.spawnBurst(x, y, tile === specialTargetTile ? '#ffe066' : '#f5b027');
      }
    });

    // Combo Banners Popup!
    if (typeof particleEngine !== 'undefined' && particleEngine.showComboPopup) {
      if (!isFromSpecial && specialTargetType === 'color_bomb') {
        particleEngine.showComboPopup('🌟 5 Lİ DÜZ: ALTIN ÇEKİRDEK! ✨', 172, 172);
      } else if (!isFromSpecial && specialTargetType === 'bomb') {
        particleEngine.showComboPopup('💣 T/L EŞLEŞME: BOMBA OLUŞTU! 💥', 172, 172);
      } else if (!isFromSpecial && (specialTargetType === 'line_h' || specialTargetType === 'line_v')) {
        particleEngine.showComboPopup('⚡ 4 LÜ EŞLEŞME: ÇİZGİLİ LAZER! 💨', 172, 172);
      } else if (comboCount > 1 && !isFromSpecial) {
        const comboTitles = ['NEFİS ESPRESSO! ☕', 'HARİKA COMBO! ✨', 'BARİSTA ŞEFİ! 👨‍🍳', 'EFSANE MASH! 🔥'];
        const text = comboTitles[Math.min(comboCount - 2, comboTitles.length - 1)];
        particleEngine.showComboPopup(text, 172, 172);
      }
    }

    if (this.onMatchCallback) {
      this.onMatchCallback(typeCounts, matchedTiles.length, comboCount);
    }

    await this.delay(250);

    // Patlayan tüm hücreleri temizle! Özel taş dönüşümü varsa sadece o hücreyi özel taşa dönüştür, diğerlerini YOK ET!
    matchedTiles.forEach(tile => {
      if (tile === specialTargetTile) {
        tile.type = specialTargetType;
        tile.icon = specialTargetType === 'color_bomb' ? '🌟' : (specialTargetType === 'bomb' ? '💣' : '⚡');
        tile.isSpecial = specialTargetType;
      } else {
        tile.type = null;
        tile.icon = '';
        tile.isSpecial = null;
      }
    });

    this.applyGravity();
    this.renderBoard();

    await this.delay(200);

    // Stop cascades immediately if objectives are completed!
    if (this.checkWinCondition()) {
      return;
    }

    const newMatches = this.findMatches();
    if (newMatches.length > 0) {
      await this.processMatchesAndCascades(newMatches, comboCount + 1, false);
    }
  }

  async triggerLineLaserAt(centerR, centerC, isHorizontal = true) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    // Trigger Laser Beam Visual FX overlay & Screen Shake
    document.body.classList.add('shake-fx');
    setTimeout(() => document.body.classList.remove('shake-fx'), 500);

    const laserTileDiv = this.getTileDiv(centerR, centerC);
    if (typeof particleEngine !== 'undefined' && particleEngine.spawnLaserBeam) {
      particleEngine.spawnLaserBeam(laserTileDiv, isHorizontal);
    }

    try {
      if (typeof audioEngine !== 'undefined' && audioEngine.playSwap) {
        audioEngine.playSwap();
      }
    } catch(e){}

    const matched = [];
    if (isHorizontal) {
      for (let c = 0; c < this.cols; c++) {
        const t = this.board[centerR][c];
        if (t && t.type) {
          matched.push(t);
          const el = this.getTileDiv(centerR, c);
          if (el) el.classList.add('laser-spin-tile');
        }
      }
    } else {
      for (let r = 0; r < this.rows; r++) {
        const t = this.board[r][centerC];
        if (t && t.type) {
          matched.push(t);
          const el = this.getTileDiv(r, centerC);
          if (el) el.classList.add('laser-spin-tile');
        }
      }
    }

    try {
      if (typeof particleEngine !== 'undefined' && particleEngine.showComboPopup) {
        particleEngine.showComboPopup('⚡ ÇİZGİLİ LAZER PATLADI! 💨', 172, 172);
      }
      await this.processMatchesAndCascades(matched, 2, true);
    } finally {
      this.isAnimating = false;
    }
  }

  async triggerBombExplosionAt(centerR, centerC) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    // Trigger Shockwave Expansion Ring Visual FX & Camera Shake
    document.body.classList.add('shake-fx');
    setTimeout(() => document.body.classList.remove('shake-fx'), 500);

    const bombTileDiv = this.getTileDiv(centerR, centerC);
    if (typeof particleEngine !== 'undefined' && particleEngine.spawnShockwaveRing) {
      particleEngine.spawnShockwaveRing(bombTileDiv);
    }

    try {
      if (typeof audioEngine !== 'undefined' && audioEngine.playVictoryFanfare) {
        audioEngine.playVictoryFanfare();
      }
    } catch(e){}

    const matched = [];
    for (let r = centerR - 1; r <= centerR + 1; r++) {
      for (let c = centerC - 1; c <= centerC + 1; c++) {
        if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
          const t = this.board[r][c];
          if (t && t.type) {
            matched.push(t);
          }
        }
      }
    }

    try {
      if (matched.length > 0) {
        if (typeof particleEngine !== 'undefined' && particleEngine.showComboPopup) {
          particleEngine.showComboPopup('💣 BOMBA PATLADI! 💥', 172, 172);
        }
        await this.processMatchesAndCascades(matched, 2, true);
      }
    } finally {
      this.isAnimating = false;
    }
  }

  async triggerColorBombExplosionAt(centerR, centerC) {
    if (this.isAnimating) return;
    this.isAnimating = true;

    // Screen Shake & Gold Fanfare
    document.body.classList.add('shake-fx');
    setTimeout(() => document.body.classList.remove('shake-fx'), 500);

    try {
      if (typeof audioEngine !== 'undefined' && audioEngine.playVictoryFanfare) {
        audioEngine.playVictoryFanfare();
      }
    } catch(e){}

    const colorBombTileDiv = this.getTileDiv(centerR, centerC);
    const colorBombRect = colorBombTileDiv ? colorBombTileDiv.getBoundingClientRect() : null;

    const matched = [];
    matched.push(this.board[centerR][centerC]);

    const sampleTile = this.board[centerR === 0 ? 1 : 0][centerC];
    const targetType = sampleTile ? sampleTile.type : 'espresso';

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const t = this.board[r][c];
        if (t && t.type && (t.type === targetType || t.type === 'espresso')) {
          matched.push(t);
          const tDiv = this.getTileDiv(r, c);
          if (tDiv && colorBombRect && typeof particleEngine !== 'undefined' && particleEngine.spawnLightningArc) {
            const tRect = tDiv.getBoundingClientRect();
            particleEngine.spawnLightningArc(colorBombRect.left + 20, colorBombRect.top + 20, tRect.left + 20, tRect.top + 20);
          }
        }
      }
    }

    try {
      if (typeof particleEngine !== 'undefined' && particleEngine.showComboPopup) {
        particleEngine.showComboPopup('🌟 ALTIN ÇEKİRDEK PATLAMASI! ✨', 172, 172);
      }
      await this.processMatchesAndCascades(matched, 2, true);
    } finally {
      this.isAnimating = false;
    }
  }

  applyGravity() {
    for (let c = 0; c < this.cols; c++) {
      let emptyRows = 0;
      for (let r = this.rows - 1; r >= 0; r--) {
        if (this.board[r][c].type === null) {
          emptyRows++;
        } else if (emptyRows > 0) {
          const target = this.board[r + emptyRows][c];
          const source = this.board[r][c];

          target.type = source.type;
          target.icon = source.icon;
          target.color = source.color;
          target.isSpecial = source.isSpecial;
          target.isDropping = true;

          source.type = null;
          source.icon = '';
          source.isSpecial = null;
        }
      }

      for (let r = 0; r < emptyRows; r++) {
        const randomType = this.getRandomTileForLevel();
        this.board[r][c].type = randomType.id;
        this.board[r][c].icon = randomType.icon;
        this.board[r][c].color = randomType.color;
        this.board[r][c].isSpecial = null;
        this.board[r][c].isDropping = true;
      }
    }
  }

  async useBombBooster() {
    if (!this.isGameActive || this.isAnimating) return false;
    this.isAnimating = true;

    const centerR = 4;
    const centerC = 4;
    const matched = [];

    for (let r = centerR - 1; r <= centerR + 1; r++) {
      for (let c = centerC - 1; c <= centerC + 1; c++) {
        if (r >= 0 && r < this.rows && c >= 0 && c < this.cols) {
          matched.push(this.board[r][c]);
        }
      }
    }

    const centerTileDiv = this.getTileDiv(centerR, centerC);
    if (typeof particleEngine !== 'undefined' && particleEngine.triggerBombExplosionFx) {
      await particleEngine.triggerBombExplosionFx(centerTileDiv);
    }

    if (this.onMoveUsedCallback) this.onMoveUsedCallback();
    await this.processMatchesAndCascades(matched, 2);
    this.isAnimating = false;
    return true;
  }

  async useSteamBooster() {
    if (!this.isGameActive || this.isAnimating) return false;
    this.isAnimating = true;

    const rowToClear = Math.floor(Math.random() * this.rows);
    const matched = [];
    const rowDivs = [];

    for (let c = 0; c < this.cols; c++) {
      matched.push(this.board[rowToClear][c]);
      const tileDiv = this.getTileDiv(rowToClear, c);
      if (tileDiv) rowDivs.push(tileDiv);
    }

    if (typeof particleEngine !== 'undefined' && particleEngine.triggerSteamSweepFx) {
      await particleEngine.triggerSteamSweepFx(rowDivs);
    }

    if (this.onMoveUsedCallback) this.onMoveUsedCallback();
    await this.processMatchesAndCascades(matched, 2);
    this.isAnimating = false;
    return true;
  }

  async useLightningBooster() {
    if (!this.isGameActive || this.isAnimating) return false;
    this.isAnimating = true;

    const availableTypes = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.board[r][c] && this.board[r][c].type && !availableTypes.includes(this.board[r][c].type)) {
          availableTypes.push(this.board[r][c].type);
        }
      }
    }

    if (availableTypes.length === 0) {
      this.isAnimating = false;
      return false;
    }

    const targetType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
    const matched = [];
    const targetDivs = [];

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.board[r][c] && this.board[r][c].type === targetType) {
          matched.push(this.board[r][c]);
          const div = this.getTileDiv(r, c);
          if (div) targetDivs.push(div);
        }
      }
    }

    if (typeof particleEngine !== 'undefined' && particleEngine.triggerLightningStormFx) {
      await particleEngine.triggerLightningStormFx(targetDivs);
    }

    if (this.onMoveUsedCallback) this.onMoveUsedCallback();
    await this.processMatchesAndCascades(matched, 3);
    this.isAnimating = false;
    return true;
  }

  shuffleBoard() {
    this.generateRandomBoard();
    this.renderBoard();
  }

  bindTouchEvents() {
    let startX = 0;
    let startY = 0;
    let startR = -1;
    let startC = -1;
    let isMouseDown = false;

    if (!this.gridEl) this.gridEl = document.getElementById('gameBoardGrid');
    if (!this.gridEl) return;

    this.gridEl.style.touchAction = 'none';

    const handleStart = (clientX, clientY) => {
      if (!this.isGameActive || this.isAnimating) return;
      const target = document.elementFromPoint(clientX, clientY)?.closest('.tile');
      if (target) {
        startX = clientX;
        startY = clientY;
        startR = parseInt(target.dataset.row);
        startC = parseInt(target.dataset.col);
        isMouseDown = true;
      }
    };

    const handleEnd = (clientX, clientY) => {
      if (startR === -1 || !isMouseDown || this.isAnimating || !this.isGameActive) return;
      isMouseDown = false;
      const diffX = clientX - startX;
      const diffY = clientY - startY;

      if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
        let targetR = startR;
        let targetC = startC;

        if (Math.abs(diffX) > Math.abs(diffY)) {
          targetC += diffX > 0 ? 1 : -1;
        } else {
          targetR += diffY > 0 ? 1 : -1;
        }

        if (targetR >= 0 && targetR < this.rows && targetC >= 0 && targetC < this.cols) {
          this.attemptSwap(this.board[startR][startC], this.board[targetR][targetC]);
        }
      }
      startR = -1;
    };

    this.gridEl.addEventListener('touchstart', (e) => {
      if (e.touches && e.touches[0]) {
        handleStart(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });

    this.gridEl.addEventListener('touchmove', (e) => {
      if (isMouseDown && e.cancelable) {
        e.preventDefault();
      }
    }, { passive: false });

    this.gridEl.addEventListener('touchend', (e) => {
      if (e.changedTouches && e.changedTouches[0]) {
        handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      }
    });

    this.gridEl.addEventListener('mousedown', (e) => handleStart(e.clientX, e.clientY));
    this.gridEl.addEventListener('mouseup', (e) => handleEnd(e.clientX, e.clientY));
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

const boardEngine = new BoardEngine('gameBoardGrid');