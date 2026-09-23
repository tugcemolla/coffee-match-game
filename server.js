const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];

  // Handle Mock API Auth requests for instant 100% success
  if (reqPath.startsWith('/api/auth/')) {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(JSON.stringify({
      token: 'jwt_token_' + Date.now(),
      user: {
        id: Date.now(),
        username: 'Barista',
        coins: 500,
        coffeeBeans: 0,
        lives: 5,
        currentLevel: 1
      }
    }));
    return;
  }

  // Handle Mock API Leaderboard request
  if (reqPath.startsWith('/api/leaderboard')) {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(JSON.stringify({
      leaderboard: [
        { rank: 1, username: 'Tuğçe', avatar: '👩‍🍳', level: 45, score: 14850, stars: 135, badge: '🥇 Altın Barista' },
        { rank: 2, username: 'Ahmet_Master', avatar: '👨‍🍳', level: 38, score: 12400, stars: 114, badge: '🥈 Gümüş Barista' },
        { rank: 3, username: 'CoffeeKing', avatar: '👑', level: 32, score: 10900, stars: 96, badge: '🥉 Bronz Barista' },
        { rank: 4, username: 'Zeynep_Cafe', avatar: '👩‍🍳', level: 27, score: 8750, stars: 81, badge: '☕ Espresso Ustası' },
        { rank: 5, username: 'Barista_Efe', avatar: '🦊', level: 21, score: 6800, stars: 63, badge: '🥐 Kruvasan Şefi' },
        { rank: 6, username: 'Merve_Latte', avatar: '☕', level: 18, score: 5400, stars: 54, badge: '🥛 Köpük Uzmanı' },
        { rank: 7, username: 'Can_Donut', avatar: '🍩', level: 14, score: 4100, stars: 42, badge: '🍩 Donut Aşığı' },
        { rank: 8, username: 'Elif_Coffee', avatar: '🐱', level: 10, score: 2900, stars: 30, badge: '🫘 Çekirdek Avcısı' },
        { rank: 9, username: 'Deniz_VIP', avatar: '🧙‍♂️', level: 7, score: 1850, stars: 21, badge: '☕ Yeni Çırak' },
        { rank: 10, username: 'Burak_Barista', avatar: '🐻', level: 5, score: 1200, stars: 15, badge: '☕ Çırak Barista' }
      ]
    }));
    return;
  }

  // Handle Mock API Duel request
  if (reqPath.startsWith('/api/duels')) {
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(JSON.stringify({
      success: true,
      rewardCoins: 100,
      rewardBeans: 5,
      opponent: {
        username: 'Barista_Ahmet',
        avatar: '👨‍🍳',
        targetScore: 4200
      }
    }));
    return;
  }

  let filePath = path.join(PUBLIC_DIR, reqPath === '/' ? 'index.html' : reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Sayfa Bulunamadı');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Sunucu Hatası');
      } else {
        res.writeHead(200, {
          'Content-Type': contentType,
          'Access-Control-Allow-Origin': '*'
        });
        res.end(content, 'utf-8');
      }
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Coffee Match Sunucusu Çalışıyor: http://192.168.1.103:${PORT}`);
});
