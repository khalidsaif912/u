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

  // --- الأصوات ---
  const clickSound = new Audio('./click.mp3');
  clickSound.volume = 0.8;
  const winSound = new Audio('./fireworks.mp3');
  winSound.volume = 0.7;
  const silverMedalSound = new Audio('./silver.mp3');
  silverMedalSound.volume = 0.6;
  const goldMedalSound = new Audio('./gold.mp3');
  const victoryJingleSound = new Audio('./cup.mp3');
  goldMedalSound.volume = 0.6;
  victoryJingleSound.volume = 0.6;

  const ALL_CHARACTERS = [
    "images/uno1.png","images/uno2.png","images/uno3.png","images/uno4.png","images/uno5.png",
    "images/uno6.png","images/uno7.png","images/uno8.png","images/uno9.png","images/uno10.png","images/uno11.png"
  ];

  const CARD_COLORS = ["#8e44ad", "#e67e22", "#c0392b", "#2980b9", "#27ae60", "#f39c12", "#16a085"];

  const makeId = () => Math.random().toString(36).slice(2, 8);
  const todayTag = () => new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short'}).replace(/ /g,'').toUpperCase();

  function hexToRgba(hex, alpha = 1) {
    const [r, g, b] = hex.match(/\w\w/g).map(x => parseInt(x, 16));
    return `rgba(${r},${g},${b},${alpha})`;
  }

  function getMedals(score) {
    const gold = Math.floor((score || 0) / 5);
    const silver = (score || 0) % 5;
    return "🥇".repeat(gold) + "🥈".repeat(silver);
  }

  function playerCard(p, index){
    const cardColor = p.color || CARD_COLORS[index % CARD_COLORS.length];
    return `<div class="card" data-player-id="${p.id}" style="background-color: ${hexToRgba(cardColor, 0.8)};">
      <div class="card-body">
        <div class="score-area">
          <div class="score-card" data-act="left" data-value="${p.left||0}">${p.left||0}</div>
          <div class="arrow-group">
            <div class="arrow" data-act="left:+1">▲</div>
            <div class="arrow" data-act="left:-1">▼</div>
          </div>
        </div>
        <div class="center-col">
          <div class="emoji"><img src="${p.character||'images/uno1.png'}" class="avatar" alt="char"></div>
          <div class="name">${p.name||'لاعب'}</div>
        </div>
        <div class="score-area">
          <div class="score-card" data-act="right" data-value="${p.right||0}">${p.right||0}</div>
          <div class="arrow-group">
            <div class="arrow" data-act="right:+1">▲</div>
            <div class="arrow" data-act="right:-1">▼</div>
          </div>
        </div>
      </div>
      <div class="badges"><span>${getMedals(p.left)}</span><span>${"🏆".repeat(p.right||0)}</span></div>
    </div>`;
  }

  async function addPlayers() {
    const modal = document.getElementById('addPlayerModal');
    const input = document.getElementById('playerNamesInput');
    const addButton = document.getElementById('doAddPlayers');
    const cancelButton = document.getElementById('closeAddPlayerModal');

    input.value = '';
    modal.classList.add("active");

    cancelButton.onclick = () => modal.classList.remove("active");

    addButton.onclick = async () => {
      if (!roomId || !isAdmin) { alert("يجب أن تكون مشرفاً لإضافة لاعب."); return; }
      const names = input.value.trim().split(/[\s\n]+/).filter(Boolean);
      if (!names.length) { modal.classList.remove("active"); return; }

      const playersSnap = await get(ref(db, `rooms/${roomId}/players`));
      const players = playersSnap.exists() ? playersSnap.val() : {};
      let usedChars = Object.values(players).map(p => p.character);
      let usedColors = Object.values(players).map(p => p.color);

      for (const name of names) {
        let availableChars = ALL_CHARACTERS.filter(c => !usedChars.includes(c));
        if (!availableChars.length) availableChars = ALL_CHARACTERS;
        const char = availableChars[Math.floor(Math.random() * availableChars.length)];
        usedChars.push(char);

        let availableColors = CARD_COLORS.filter(c => !usedColors.includes(c));
        if (!availableColors.length) availableColors = CARD_COLORS;
        const color = availableColors[Math.floor(Math.random() * availableColors.length)];
        usedColors.push(color);

        await set(child(ref(db, `rooms/${roomId}/players`), makeId()), { name, left: 0, right: 0, character: char, color });
      }

      modal.classList.remove("active");
    };
  }
</script>
