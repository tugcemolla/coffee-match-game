/* ==========================================================================
   STORY & CHARACTER DIALOGUE ENGINE
   ========================================================================== */

const STORY_EVENTS = {
  1: {
    char: '👨‍🍳',
    name: 'Büyükbaba Selim',
    text: 'Hoş geldin torunum! Eski dükkanımızı yeniden canlandırmak senin elinde. İlk kahve siparişlerimizi hazırlayalım!'
  },
  11: {
    char: '👩‍🍳',
    name: 'Barista Eda',
    text: 'Hava çok ısındı! Müşteriler buzlu kahve istiyor. Buz kaplı bardakları yanlarında eşleştirme yaparak çözmemiz gerek! 🧊'
  },
  21: {
    char: '🚚',
    name: 'Kurye Ahmet',
    text: 'Depoya yeni kahve kolileri geldi! Kutuları açmak için 2 kez bitişik patlatma yapmalısın. 📦'
  },
  31: {
    char: '👨‍🍳',
    name: 'Büyükbaba Selim',
    text: 'Depodaki dolabı açmamız gerekiyor evlat! İçinde eski aile espresso tariflerimiz kilitli! 🗄️'
  },
  41: {
    char: '☕',
    name: 'Usta Barista Can',
    text: 'İşte yeni Espresso Makinesi! Yanında eşleştirme yaptıkça ekstra kahve çekirdekleri üretecek! ⚙️'
  },
  51: {
    char: '🥐',
    name: 'Fırıncı Rıza',
    text: 'Fırınımız ısındı! Taze kruvasan ve hamur işi siparişlerini pişirmeye başlayabiliriz! 🔥'
  },
  61: {
    char: '☁️',
    name: 'Köpük Ustası Aslı',
    text: 'Dikkat et! İpeksi süt köpükleri her hamlede yan hücrelere yayılır. Hemen temizle! 🥛'
  },
  71: {
    char: '🏺',
    name: 'Tarihçi Faruk',
    text: 'Eski ahşap masalardaki kahve lekelerini altlarında eşleştirme yaparak silmeliyiz! ☕'
  },
  81: {
    char: '🌋',
    name: 'Kavrum Ustası',
    text: 'Dikkat! Yanık kahve taneleri yolu tıkıyor. Kahve bombası veya buhar çubuğu ile yok et!'
  },
  91: {
    char: '👑',
    name: 'Gurme VIP Müşteri',
    text: 'Kahve Şatosu VIP siparişleri kapıda! Kraliyet standartlarında kusursuz bir servis sunalım!'
  }
};

class DialogueManager {
  constructor() {
    this.dialogueModal = document.getElementById('modalDialogue');
    this.portrait = document.getElementById('dialoguePortrait');
    this.charName = document.getElementById('dialogueCharName');
    this.text = document.getElementById('dialogueText');
    this.btnNext = document.getElementById('btnDialogueNext');
    this.onCompleteCallback = null;

    if (this.btnNext) {
      this.btnNext.addEventListener('click', () => this.hide());
    }
  }

  // Check if current level has a story beat
  checkAndShowDialogue(levelNumber, onComplete) {
    this.onCompleteCallback = onComplete;

    if (STORY_EVENTS[levelNumber]) {
      const evt = STORY_EVENTS[levelNumber];
      this.portrait.textContent = evt.char;
      this.charName.textContent = evt.name;
      this.text.textContent = evt.text;

      this.dialogueModal.classList.add('active');
    } else {
      if (this.onCompleteCallback) this.onCompleteCallback();
    }
  }

  hide() {
    this.dialogueModal.classList.remove('active');
    if (this.onCompleteCallback) this.onCompleteCallback();
  }
}

const dialogueManager = new DialogueManager();
