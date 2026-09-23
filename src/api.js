/* ==========================================================================
   SPRING BOOT REST API CLIENT (JWT Auth & Database Synchronization)
   ========================================================================== */

class CoffeeMatchApiClient {
  constructor() {
    this.baseUrl = 'http://localhost:8080/api';
    this.jwtToken = localStorage.getItem('coffeematch_jwt') || null;
    this.currentUser = JSON.parse(localStorage.getItem('coffeematch_user') || 'null');
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    if (this.jwtToken) {
      headers['Authorization'] = `Bearer ${this.jwtToken}`;
    }
    return headers;
  }

  // Register User with BCrypt backend hashing & instant demo fallback
  async register(username, email, password) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.token) {
          this.saveAuth(data.token, data.user);
          return { success: true, user: data.user, token: data.token };
        }
      }
    } catch (err) {
      console.warn('Backend connection, using instant local auth:', err);
    }

    // Guaranteed 100% Instant Offline & Demo Registration Mode
    const newUser = {
      id: Date.now(),
      username: username || 'Barista',
      email: email || '',
      coins: 500,
      coffeeBeans: 0,
      lives: 5,
      currentLevel: 1
    };
    const token = 'demo_jwt_token_' + Date.now();
    this.saveAuth(token, newUser);
    return { success: true, user: newUser, token: token, isOffline: true };
  }

  // Login User
  async login(username, password) {
    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.token) {
          this.saveAuth(data.token, data.user);
          return { success: true, user: data.user, token: data.token };
        }
      }
    } catch (err) {
      console.warn('Backend connection, using instant local auth:', err);
    }

    // Guaranteed 100% Instant Offline & Demo Login Mode
    const loggedUser = {
      id: Date.now(),
      username: username || 'Barista',
      coins: 500,
      coffeeBeans: 0,
      lives: 5,
      currentLevel: 1
    };
    const token = 'demo_jwt_token_' + Date.now();
    this.saveAuth(token, loggedUser);
    return { success: true, user: loggedUser, token: token, isOffline: true };
  }

  saveAuth(token, user) {
    this.jwtToken = token;
    this.currentUser = user;
    localStorage.setItem('coffeematch_jwt', token);
    localStorage.setItem('coffeematch_user', JSON.stringify(user));
  }

  // Sync Level Complete to Spring Boot Backend
  async completeLevel(levelNumber, beansEarned, coinsEarned, score) {
    try {
      if (!this.jwtToken || this.jwtToken === 'offline_token') return;
      await fetch(`${this.baseUrl}/player/complete-level`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ levelNumber, beansEarned, coinsEarned, score })
      });
    } catch (err) {
      console.warn('Failed to sync level completion with backend:', err);
    }
  }

  // Sync Cafe Renovation State to Spring Boot Backend
  async saveCafeRenovation(itemId, chosenOptionId) {
    try {
      if (!this.jwtToken || this.jwtToken === 'offline_token') return;
      await fetch(`${this.baseUrl}/cafe/renovate`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ itemId, chosenOptionId })
      });
    } catch (err) {
      console.warn('Failed to sync cafe renovation state:', err);
    }
  }

  // Get Global Barista Leaderboard
  async getLeaderboard() {
    try {
      const response = await fetch(`${this.baseUrl}/leaderboard`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        if (data && data.leaderboard) return data.leaderboard;
      }
    } catch (err) {
      console.warn('Leaderboard API fetch error, using local fallback:', err);
    }
    return [
      { rank: 1, username: 'Tuğçe', avatar: '👩‍🍳', level: 45, score: 14850, stars: 135, badge: '🥇 Altın Barista' },
      { rank: 2, username: 'Ahmet_Master', avatar: '👨‍🍳', level: 38, score: 12400, stars: 114, badge: '🥈 Gümüş Barista' },
      { rank: 3, username: 'CoffeeKing', avatar: '👑', level: 32, score: 10900, stars: 96, badge: '🥉 Bronz Barista' },
      { rank: 4, username: 'Zeynep_Cafe', avatar: '👩‍🍳', level: 27, score: 8750, stars: 81, badge: '☕ Espresso Ustası' },
      { rank: 5, username: 'Barista_Efe', avatar: '🦊', level: 21, score: 6800, stars: 63, badge: '🥐 Kruvasan Şefi' }
    ];
  }

  // Start 1v1 Online Barista Duel Match
  async startDuel() {
    try {
      const response = await fetch(`${this.baseUrl}/duels/start`, {
        method: 'POST',
        headers: this.getHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        if (data) return data;
      }
    } catch (err) {
      console.warn('Duel start error, using fallback:', err);
    }
    return {
      success: true,
      rewardCoins: 100,
      rewardBeans: 5,
      opponent: {
        username: 'Barista_Ahmet',
        avatar: '👨‍🍳',
        targetScore: 4200
      }
    };
  }
}

const apiClient = new CoffeeMatchApiClient();
