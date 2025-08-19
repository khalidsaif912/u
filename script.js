  <script src="https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js"></script>
  <script type="module">
    import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-app.js";
    import { getDatabase, ref, set, onValue, update, get, child, remove } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-database.js";

    const firebaseConfig = {
      apiKey: "AIzaSyBGuiMxffwcm_P8zY-I6hMUG1hUY1akpFA",
      authDomain: "uno-game-live.firebaseapp.com",
      databaseURL: "https://uno-game-live-default-rtdb.firebaseio.com",
      projectId: "uno-game-live",
      storageBucket: "uno-game-live.appspot.com",
      messagingSenderId: "973862287578",
      appId: "1:973862287578:web:0bac6d3788c78666e48de3"
    };

    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);

    const qs = new URLSearchParams(location.search);
    let roomId = qs.get("room") || localStorage.getItem("uno-room-id") || "";
    let adminToken = qs.get("admin") || JSON.parse(localStorage.getItem("uno-admin-tokens") || '{}')[roomId];
    let isAdmin = false;

    const headerContainer = document.getElementById("header-container");
    const playersEl = document.getElementById("players");
    const modalRoomId = document.getElementById("modalRoomId");
    let currentTargetPlayerId = null;

// --- الأصوات يتم تحميلها من نفس المجلد الرئيسي ---

// صوت النقر العام
const clickSound = new Audio('./click.mp3');
clickSound.volume = 0.8;

// صوت الفوز بالكأس والألعاب النارية
const winSound = new Audio('./fireworks.mp3');
winSound.volume = 0.7;

// صوت الميدالية الفضية
const silverMedalSound = new Audio('./silver.mp3');
silverMedalSound.volume = 0.6;

// صوت الميدالية الذهبية
const goldMedalSound = new Audio('./gold.mp3');
const victoryJingleSound = new Audio('./cup.mp3');
goldMedalSound.volume = 0.6;
victoryJingleSound.volume = 0.6;

// ▼▼▼ أضف هذه الدالة الجديدة والمهمة ▼▼▼
let soundsUnlocked = false;
function unlockSounds() {
    if (soundsUnlocked) return;
    
    // نقوم بتحميل الأصوات بدلاً من تشغيلها وإيقافها
    // هذا الإجراء كافٍ لمعظم المتصفحات الحديثة "لفتح القفل"
    winSound.load();
    silverMedalSound.load();
    goldMedalSound.load();
    clickSound.load();

    soundsUnlocked = true;
    console.log("Audio context unlocked by user interaction.");
}

// ▲▲▲ انتهت الدالة الجديدة ▲▲▲



    
    clickSound.volume = 0.8; winSound.volume = 0.7; silverMedalSound.volume = 0.6; goldMedalSound.volume = 0.6;

    const ALL_EMOJIS = ['🤠','😎','🥷','🤡','🦸','🦹','👽','🤖','👑','🦁','🐯','🐺','🐲','🦊','🐸','🐵','🦉','🐨','👨‍🚀','👩‍🚀','👨‍🎨','👩‍🎨','👨‍💻','👩‍💻','👨‍🔬','👩‍🔬'];
    const CARD_COLORS = ["#8e44ad", "#e67e22", "#c0392b", "#2980b9", "#27ae60", "#f39c12", "#16a085"];




const ALL_CHARACTERS = [
  "images/uno1.png",
  "images/uno2.png",
  "images/uno3.png",
  "images/uno4.png",
  "images/uno5.png",
  "images/uno6.png",
  "images/uno7.png",
  "images/uno8.png",
  "images/uno9.png",
  "images/uno10.png",
  "images/uno11.png"
];






    const makeId = () => Math.random().toString(36).slice(2, 8);
    const todayTag = () => new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short'}).replace(/ /g,'').toUpperCase();

const openModal = (m)=> m.classList.add("active");
const closeModal = (m)=> m.classList.remove("active");


    function setRandomGradientBackground() {
      const gradients = [
        "linear-gradient(135deg, #0f2027, #203a43, #2c5364)", "linear-gradient(135deg, #13192e, #232d4b, #3e4a6d)",
        "linear-gradient(135deg, #23074d, #cc5333)", "linear-gradient(135deg, #1f1c2c, #928dab)",
        "linear-gradient(135deg, #16222a, #3a6073)", "linear-gradient(135deg, #373b44, #4286f4)",
        "linear-gradient(135deg, #000000, #434343)", "radial-gradient(circle, #2c3e50, #000000)"
      ];
      document.body.style.background = gradients[Math.floor(Math.random() * gradients.length)];
    }

    function hexToRgba(hex, alpha = 1) {
        const [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));
        return `rgba(${r},${g},${b},${alpha})`;
    }

    function getMedals(score) {
        const gold = Math.floor((score || 0) / 5);
        const silver = (score || 0) % 5;
        return "🥇".repeat(gold) + "🥈".repeat(silver);
    }

    function renderHeader() {
        const roomStatusText = isAdmin ? 'مشرف' : 'مشاهد';
        const bannerHtml = `
            <div class="header" id="roomBanner">
              <img id="bannerImage" src="./banner.jpg" alt="UNO Live Banner" class="banner-img">
              <div class="title">
                <span>🎮</span>
                <span class="badge" id="roomStatus">${roomStatusText}</span>
              </div>
            </div>`;
        headerContainer.innerHTML = bannerHtml;
        document.getElementById("roomBanner").onclick = () => {
            const roomModal = document.getElementById("roomModal");
            const roomManagementView = document.getElementById('roomManagementView');
            const joinView = document.getElementById('joinView');
            const roomInfoBlock = document.getElementById('roomInfoBlock');
            roomManagementView.style.display = 'block';
            joinView.style.display = 'none';
            const hasRoom = !!roomId;
            roomInfoBlock.style.display = hasRoom ? 'block' : 'none';
            document.getElementById('openLog').style.display = hasRoom ? 'block' : 'none';
            document.getElementById('copyLinkBtn').style.display = hasRoom ? 'block' : 'none';
            openModal(roomModal);
        };
    }

    function playerCard(p, index){
      const cardColor = p.color || CARD_COLORS[index % CARD_COLORS.length];
      return `<div class="card" data-player-id="${p.id}" style="background-color: ${hexToRgba(cardColor, 0.8)};"><div class="card-body"><div class="score-area"><div class="score-card" data-act="left" data-value="${p.left||0}">${p.left||0}</div><div class="arrow-group"><div class="arrow" data-act="left:+1">▲</div><div class="arrow" data-act="left:-1">▼</div></div></div><div class="center-col"><div class="emoji"><img src="${p.character||'images/uno1.png'}" class="avatar" alt="char"></div>
<div class="name">${p.name||'لاعب'}</div></div><div class="score-area"><div class="score-card" data-act="right" data-value="${p.right||0}">${p.right||0}</div><div class="arrow-group"><div class="arrow" data-act="right:+1">▲</div><div class="arrow" data-act="right:-1">▼</div></div></div></div><div class="badges"><span>${getMedals(p.left)}</span><span>${"🏆".repeat(p.right||0)}</span></div></div>`;
    }

    function renderPlayers(list){
      renderHeader();
      playersEl.innerHTML = list.map((p, i) => playerCard(p, i)).join("");
    }

function triggerFireworks(winData) {
    const flashElement = document.getElementById('screen-flash');
    const canvas = document.getElementById('confetti-canvas');

    // --- (1) دالة الوميض المنفصلة (لإعادة الاستخدام) ---
    function runFlashEffect() {
        const flashCount = 3; 
        const flashInterval = 120;
        for (let i = 0; i < flashCount; i++) {
            setTimeout(() => {
                flashElement.classList.add('active');
                setTimeout(() => { flashElement.classList.remove('active'); }, 60);
            }, i * flashInterval);
        }
    }

    // --- (2) تشغيل التأثيرات ---

    // الوميض الأول والألعاب النارية يبدآن فورًا
    runFlashEffect();
    
    canvas.classList.add('active');
    const winnerColor = winData.color || '#FFFFFF';
    
    // تشغيل الصوتين معًا
    winSound.play().catch(e => {});
    victoryJingleSound.play().catch(e => {});

    const fire = confetti.create(canvas, { resize: true, useWorker: true });
    const duration = 5000;
    const end = Date.now() + duration;

    // --- (3) جدولة الوميض الثاني ---
    // سيتم تشغيله بعد 3000 مللي ثانية (3 ثوانٍ)
    setTimeout(runFlashEffect, 3000);

    // إخفاء لوحة الألعاب النارية بعد انتهاء المدة الكاملة
    setTimeout(() => {
        canvas.classList.remove('active');
    }, duration);

    // حلقة إطلاق الصواريخ (تبقى كما هي)
    (function frame() {
        if (Date.now() > end) return;
        const bannerRect = document.getElementById('roomBanner')?.getBoundingClientRect() || { bottom: 0 };
        fire({
            particleCount: 50, angle: 90, spread: 45, startVelocity: 55,
            origin: { x: Math.random(), y: 1 }, ticks: 150, gravity: 1,
            shapes: ['circle'], scalar: 0.6, colors: ['#FFFFFF', winnerColor]
        }).then(result => {
            if (!result || (bannerRect.bottom > 0 && (result.origin.y * window.innerHeight) < bannerRect.bottom)) return;
            fire({
                particleCount: 800, spread: 360, startVelocity: 40, origin: result.origin,
                gravity: 0.4, ticks: 500, decay: 0.94, shapes: ['circle'],
                scalar: 2.0, colors: [winnerColor, '#FFFFFF', '#FFD700']
            });
        });
        setTimeout(frame, 500 + Math.random() * 300);
    }());
}


    async function ensureAdminStatus(){
      if(!roomId || !adminToken) { isAdmin = false; return false; }
      const snap = await get(child(ref(db, `rooms/${roomId}`), 'adminKey'));
      isAdmin = !!(snap.exists() && adminToken === snap.val());
      document.getElementById('addPlayerFab').style.display = isAdmin ? 'flex' : 'none';
    }

    function handleScoreUpdate(id, side, delta) {
        if (!isAdmin) return;
        const playerRef = ref(db, `rooms/${roomId}/players/${id}`);
        get(playerRef).then(pSnap => {
            if(!pSnap.exists()) return;
            const p = pSnap.val();
            const oldValue = p[side] || 0;
            const newValue = Math.max(0, oldValue + delta);
            let updates = {};
            updates[`players/${id}/${side}`] = newValue;
            const date = todayTag();
            updates[`scoreLog/${date}_${p.name}`] = { date, name: p.name, wins: side === 'right' ? newValue : p.right || 0, medals: side === 'left' ? newValue : p.left || 0 };
            if (delta > 0) {
                if (side === 'left') {
                    const oldGoldCount = Math.floor(oldValue / 5);
                    const newGoldCount = Math.floor(newValue / 5);
                    if (newGoldCount > oldGoldCount) { goldMedalSound.play().catch(e => {}); }
                    else { silverMedalSound.play().catch(e => {}); }
                } else {
                    winSound.play().catch(e => {});
                    updates['lastWin'] = { timestamp: Date.now(), color: p.color || '#FFFFFF' };
                }
            }
            update(ref(db, `rooms/${roomId}`), updates);
        });
    }



// استبدل دالة addPlayers القديمة بهذه النسخة الكاملة
async function addPlayers() {
    // (1) تحديد عناصر النافذة الجديدة
    const modal = document.getElementById('addPlayerModal');
    const input = document.getElementById('playerNamesInput');
    const addButton = document.getElementById('doAddPlayers');
    const cancelButton = document.getElementById('closeAddPlayerModal');

    // (2) إظهار النافذة للمستخدم
    input.value = ''; // نفرغ حقل الإدخال عند كل مرة نفتح فيها النافذة
    openModal(modal);

    // (3) وظيفة زر الإلغاء
    cancelButton.onclick = () => {
        closeModal(modal);
    };

    // (4) وظيفة زر الإضافة الرئيسي
    addButton.onclick = async () => {
        if (!roomId || !isAdmin) {
            alert("يجب أن تكون مشرفاً في غرفة لإضافة لاعب.");
            return;
        }

        const namesInput = input.value; // نأخذ القيمة من حقل الإدخال الجديد
        if (!namesInput) {
            closeModal(modal); // إذا كان فارغًا، أغلق النافذة فقط
            return;
        }

        // هذا الكود السحري يفصل الأسماء سواء كانت مفصولة بمسافة أو بسطر جديد
        const names = namesInput.trim().split(/[\s\n]+/).filter(name => name.length > 0);
        
        if (names.length === 0) {
            closeModal(modal);
            return;
        }

        // --- هذا الجزء من الكود يبقى كما هو (منطق إضافة اللاعبين إلى Firebase) ---
        const playersSnap = await get(ref(db, `rooms/${roomId}/players`));
        const players = playersSnap.exists() ? playersSnap.val() : {};
        let usedEmojis = Object.values(players).map(p => p.character);
        let usedColors = Object.values(players).map(p => p.color);

        for (const name of names) {
            let availableChars = ALL_CHARACTERS.filter(c => !usedEmojis.includes(c));
if (availableChars.length === 0) availableChars = ALL_CHARACTERS;
const char = availableChars[Math.floor(Math.random() * availableChars.length)];

            usedEmojis.push(char);

            let availableColors = CARD_COLORS.filter(c => !usedColors.includes(c));
            if (availableColors.length === 0) availableColors = CARD_COLORS;
            const color = availableColors[0];
            usedColors.push(color);

            await set(child(ref(db, `rooms/${roomId}/players`), makeId()), { name, left: 0, right: 0, character: char, color });
        }
        // --- نهاية الجزء الذي لم يتغير ---

        // (5) في النهاية، أغلق النافذة
        closeModal(modal);
    };
}




    function initializeStaticEventListeners() {
        document.getElementById('addPlayerFab').addEventListener('click', () => { clickSound.play().catch(e => {}); addPlayers(); });
        document.getElementById('devInfoBtn').addEventListener('click', () => { clickSound.play().catch(e => {}); openModal(document.getElementById('devInfoModal')); });
        document.getElementById('refreshBtn').addEventListener('click', () => { clickSound.play().catch(e => {}); location.reload(); });
        document.getElementById("closeRoomModal").addEventListener('click', () => { clickSound.play().catch(e => {}); closeModal(document.getElementById('roomModal')); });
        document.getElementById("openLog").addEventListener('click', () => {
            clickSound.play().catch(e => {});
            closeModal(document.getElementById('roomModal'));
            const tbody = document.getElementById("logTbody");
            onValue(ref(db, `rooms/${roomId}/scoreLog`), (snap) => {
                if(!snap.exists()){ tbody.innerHTML = `<tr><td colspan="4" class="subtle">لا توجد سجلات بعد</td></tr>`; return; }
                const list = Object.values(snap.val());
                list.sort((a,b)=> (b.date||'').localeCompare(a.date||''));
                tbody.innerHTML = list.map(e=>`<tr><td>${e.date}</td><td>${e.name}</td><td>${e.wins||0}</td><td>${e.medals||0}</td></tr>`).join("");
            }, { onlyOnce: true });
            openModal(document.getElementById('logModal'));
        });
        document.getElementById("closeLog").addEventListener('click', () => { clickSound.play().catch(e => {}); closeModal(document.getElementById('logModal')); });
        document.getElementById("closeDeleteModal").addEventListener('click', () => { clickSound.play().catch(e => {}); closeModal(document.getElementById('deleteModal')); });
        document.getElementById("closeDevInfoModal").addEventListener('click', () => { clickSound.play().catch(e => {}); closeModal(document.getElementById('devInfoModal')); });
        document.getElementById('showJoinView').addEventListener('click', () => { clickSound.play().catch(e => {}); document.getElementById('roomManagementView').style.display = 'none'; document.getElementById('joinView').style.display = 'block'; });
        document.getElementById('backToManagement').addEventListener('click', () => { clickSound.play().catch(e => {}); document.getElementById('joinView').style.display = 'none'; document.getElementById('roomManagementView').style.display = 'block'; });
        document.getElementById("doCreate").addEventListener('click', async () => {
          clickSound.play().catch(e => {});
          const newRoomId = makeId(), newAdminKey = makeId();
          await set(ref(db, `rooms/${newRoomId}`), { createdAt: Date.now(), adminKey: newAdminKey });
          const adminTokens = JSON.parse(localStorage.getItem("uno-admin-tokens") || '{}');
          adminTokens[newRoomId] = newAdminKey;
          localStorage.setItem("uno-admin-tokens", JSON.stringify(adminTokens));
          history.replaceState({}, "", `${location.origin}${location.pathname}?room=${newRoomId}&admin=${newAdminKey}`);
          location.reload();
        });
        document.getElementById("doJoin").addEventListener('click', async () => {
          clickSound.play().catch(e => {});
          const joinRoomId = document.getElementById("joinId").value.trim();
          if(!joinRoomId){ alert("اكتب رمز الغرفة"); return; }
          const exists = (await get(child(ref(db, 'rooms'), joinRoomId))).exists();
          if(!exists){ alert("الغرفة غير موجودة"); return; }
          const adminTokens = JSON.parse(localStorage.getItem("uno-admin-tokens") || '{}');
          const newAdminToken = adminTokens[joinRoomId] || '';
          const url = new URL(location.href);
          url.searchParams.set('room', joinRoomId);
          if (newAdminToken) { url.searchParams.set('admin', newAdminToken); }
          else { url.searchParams.delete('admin'); }
          history.replaceState({}, "", url.toString());
          location.reload();
        });
        document.getElementById('copyLinkBtn').addEventListener('click', () => {
            clickSound.play().catch(e => {});
            const viewUrl = new URL(location.href);
            viewUrl.searchParams.delete('admin');
            navigator.clipboard.writeText(viewUrl.toString()).then(() => alert('تم نسخ رابط المشاهدة!'), () => alert('فشل نسخ الرابط.'));
        });
        document.getElementById('deletePlayerBtn').addEventListener('click', () => {
            clickSound.play().catch(e => {});
            if (currentTargetPlayerId) { remove(ref(db, `rooms/${roomId}/players/${currentTargetPlayerId}`)); }
            closeModal(document.getElementById('deleteModal'));
        });
        document.getElementById('deleteAllBtn').addEventListener('click', () => {
            clickSound.play().catch(e => {});
            if (confirm('تحذير: سيتم حذف جميع اللاعبين نهائياً. هل أنت متأكد؟')) {
                remove(ref(db, `rooms/${roomId}/players`));
            }
            closeModal(document.getElementById('deleteModal'));
        });
    }

        function initializeDynamicEventListeners() {
        let longPressTimer, isLongPress = false, touchEventDetected = false;
        const handlePress = (target) => {
            if (!isAdmin) return;
            const emojiEl = target.closest('.emoji');
            if (emojiEl) {
                isLongPress = false;
                const card = emojiEl.closest('.card');
                currentTargetPlayerId = card.dataset.playerId;
                longPressTimer = setTimeout(() => { isLongPress = true; openModal(document.getElementById('deleteModal')); }, 800);
            }
        };
        const handleRelease = (target) => {
            clearTimeout(longPressTimer);
            const arrow = target.closest('.arrow');
            const scoreCard = target.closest('.score-card');
            
            if (arrow && !isLongPress) {
                const card = arrow.closest('.card');
                const playerId = card.dataset.playerId;
                const { act } = arrow.dataset;
                const [side, deltaStr] = act.split(":");
                handleScoreUpdate(playerId, side, parseInt(deltaStr, 10));
            } else if (scoreCard && !isLongPress) {
                // النقر على الرقم نفسه - تحديد الاتجاه بناءً على موقع النقر
                const card = scoreCard.closest('.card');
                const playerId = card.dataset.playerId;
                const side = scoreCard.dataset.act;
                const rect = scoreCard.getBoundingClientRect();
                const clickY = event.clientY || event.touches[0].clientY;
                const isUpperHalf = (clickY - rect.top) < (rect.height / 2);
                const delta = isUpperHalf ? 1 : -1;
                handleScoreUpdate(playerId, side, delta);
            }
        };
        playersEl.addEventListener('touchstart', (e) => { touchEventDetected = true; handlePress(e.target); }, { passive: true });
        playersEl.addEventListener('touchend', (e) => { if (!touchEventDetected) return; handleRelease(e.target); });
        playersEl.addEventListener('mousedown', (e) => { if (touchEventDetected || e.button !== 0) return; handlePress(e.target); });
        playersEl.addEventListener('mouseup', (e) => { if (touchEventDetected || e.button !== 0) return; handleRelease(e.target); });
        const cancelPress = () => clearTimeout(longPressTimer);
        playersEl.addEventListener('touchcancel', cancelPress);
        playersEl.addEventListener('mouseleave', cancelPress);
    }

    (async function boot(){
      setRandomGradientBackground();
      initializeStaticEventListeners();
      await ensureAdminStatus();

      if(!roomId){
        renderHeader();
        document.getElementById('addPlayerFab').style.display = 'none';
        openModal(document.getElementById('roomModal'));
      } else {
        modalRoomId.textContent = roomId;
        localStorage.setItem("uno-room-id", roomId);

        onValue(ref(db, `rooms/${roomId}/players`), (snap) => {
            const playersData = snap.exists() ? snap.val() : {};
            const players = Object.entries(playersData).map(([id, v]) => ({ id, ...v }));
            players.sort((a, b) => (b.right || 0) - (a.right || 0) || (b.left || 0) - (a.left || 0));
            renderPlayers(players);
        });

        onValue(ref(db, `rooms/${roomId}/lastWin`), (snap) => {
            if (snap.exists()) {
                const winData = snap.val();
                triggerFireworks(winData); 
                if (isAdmin) {
                    remove(ref(db, `rooms/${roomId}/lastWin`));
                }
            }
        });
      }
      
      initializeDynamicEventListeners();
    })();
