// ============================================================
// online.js - Firebase integration for online multiplayer
// ============================================================

const ONLINE_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDKW1ulf_DNKHNI4eSO2e73iT3YPpzKh8A",
  authDomain: "tetris-narabe.firebaseapp.com",
  databaseURL: "https://tetris-narabe-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "tetris-narabe",
  storageBucket: "tetris-narabe.firebasestorage.app",
  messagingSenderId: "1029967428629",
  appId: "1:1029967428629:web:d12a318e1cbe438d21e21c"
};

let fbeApp = null;
let fbeDb = null;

function initOnlineFirebase() {
  if (fbeDb) return;
  try {
    fbeApp = firebase.app("fbe");
  } catch (e) {
    fbeApp = firebase.initializeApp(ONLINE_FIREBASE_CONFIG, "fbe");
  }
  fbeDb = firebase.database(fbeApp);
}

function generateShortId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

const onlineState = {
  roomId: null,
  myId: null,
  mySide: null,
  opponentName: null,
  roomListener: null,
  battleListener: null,
  setupListener: null
};

// ============================================================
// Screen helpers
// ============================================================

function showOnlineLobbyScreen() {
  setScreenDisplay("title-screen", "none");
  setScreenDisplay("party-code-screen", "none");
  setScreenDisplay("player-formation-screen", "none");
  setScreenDisplay("main-layout", "none");
  setScreenDisplay("online-waiting-screen", "none");
  setScreenDisplay("online-lobby-screen", "flex");
}

function showOnlineWaitingScreen() {
  setScreenDisplay("title-screen", "none");
  setScreenDisplay("party-code-screen", "none");
  setScreenDisplay("player-formation-screen", "none");
  setScreenDisplay("main-layout", "none");
  setScreenDisplay("online-lobby-screen", "none");
  setScreenDisplay("online-waiting-screen", "flex");
}

function setOnlineWaitingOverlay(visible, message) {
  const overlay = document.getElementById("online-waiting-overlay");
  if (!overlay) return;
  if (visible) {
    overlay.style.display = "flex";
    const msgEl = overlay.querySelector(".online-waiting-msg");
    if (msgEl && message) msgEl.textContent = message;
  } else {
    overlay.style.display = "none";
  }
}

// ============================================================
// Room management
// ============================================================

async function createOnlineRoom(playerName) {
  initOnlineFirebase();
  const roomId = generateShortId();
  const myId = generateShortId();

  await fbeDb.ref(`fbe/rooms/${roomId}`).set({
    status: "waiting",
    hostId: myId,
    guestId: null,
    hostName: playerName,
    guestName: null,
    createdAt: Date.now()
  });

  onlineState.roomId = roomId;
  onlineState.myId = myId;
  onlineState.mySide = "player";

  return roomId;
}

async function joinOnlineRoom(roomId, playerName) {
  initOnlineFirebase();
  const myId = generateShortId();
  const trimmedRoomId = roomId.trim().toUpperCase();

  const snap = await fbeDb.ref(`fbe/rooms/${trimmedRoomId}`).once("value");
  const room = snap.val();

  if (!room) throw new Error("ルームが見つかりません");
  if (room.status !== "waiting") throw new Error("このルームには参加できません（すでに開始中）");
  if (room.guestId) throw new Error("ルームは満員です");

  await fbeDb.ref(`fbe/rooms/${trimmedRoomId}`).update({
    guestId: myId,
    guestName: playerName,
    status: "setup"
  });

  onlineState.roomId = trimmedRoomId;
  onlineState.myId = myId;
  onlineState.mySide = "enemy";
  onlineState.opponentName = room.hostName;

  return room.hostName;
}

// ============================================================
// Waiting screen - host watches for guest joining
// ============================================================

function watchForGuestToJoin(onGuestJoined) {
  if (onlineState.roomListener) {
    fbeDb.ref(`fbe/rooms/${onlineState.roomId}`).off("value", onlineState.roomListener);
  }
  const handler = (snap) => {
    const room = snap.val();
    if (!room) return;
    if (room.guestId && room.guestName) {
      onlineState.opponentName = room.guestName;
      onGuestJoined(room.guestName);
    }
  };
  onlineState.roomListener = handler;
  fbeDb.ref(`fbe/rooms/${onlineState.roomId}`).on("value", handler);
}

// ============================================================
// Setup phase sync
// ============================================================

function pushMySetup(entries, decisiveMomentTurn) {
  const data = { entries, ready: true };
  if (onlineState.mySide === "player") {
    data.decisiveMomentTurn = decisiveMomentTurn || 20;
  }
  return fbeDb.ref(`fbe/rooms/${onlineState.roomId}/setup/${onlineState.myId}`).set(data);
}

function watchBothSetupReady(onBothReady) {
  if (onlineState.setupListener) {
    fbeDb.ref(`fbe/rooms/${onlineState.roomId}`).off("value", onlineState.setupListener);
    onlineState.setupListener = null;
  }
  const ref = fbeDb.ref(`fbe/rooms/${onlineState.roomId}`);
  const handler = ref.on("value", (snap) => {
    const room = snap.val();
    if (!room || !room.hostId || !room.guestId || !room.setup) return;
    const hostSetup = room.setup[room.hostId];
    const guestSetup = room.setup[room.guestId];
    if (hostSetup && hostSetup.ready && guestSetup && guestSetup.ready) {
      ref.off("value", handler);
      onlineState.setupListener = null;
      onBothReady(room, hostSetup, guestSetup);
    }
  });
  onlineState.setupListener = handler;
}

// ============================================================
// Called when player clicks "この陣形で開始" in online mode
// ============================================================

function handleOnlineFormationReady() {
  const entries = getPlayerFormationEntries();
  const decisiveMomentTurn = readDecisiveMomentStartTurnInput();

  setOnlineWaitingOverlay(true, "対戦相手の準備を待っています...");

  // pushより先にリスナーを登録することで、自分の書き込みが
  // Firebase に届いた瞬間にリスナーが確実に発火する順序を保証する。
  // push後に登録すると、書き込み完了イベントがすでに処理済みになって
  // リスナーが不完全なキャッシュで初回発火し、その後発火しないケースがある。
  watchBothSetupReady((room, hostSetup, guestSetup) => {
    setOnlineWaitingOverlay(false);

    if (onlineState.mySide === "player") {
      gameState.onlineGuestFormationEntries = guestSetup.entries;
      gameState.decisiveMomentStartTurn = hostSetup.decisiveMomentTurn || 20;
      gameState.battleMode = "online";
      gameState.onlineMySide = "player";
      showBattleScreen();
      resetGame();
    } else {
      gameState.battleMode = "online";
      gameState.onlineMySide = "enemy";
      setOnlineWaitingOverlay(true, "ホストが対戦を開始しています...");
      startListeningBattle();
    }
  });

  pushMySetup(entries, decisiveMomentTurn).catch((err) => {
    setOnlineWaitingOverlay(false);
    alert("セットアップの送信に失敗しました: " + err.message);
  });
}

// ============================================================
// Battle state serialization
// ============================================================

function serializeBoard(board) {
  // nullを含む配列はFirebaseが疎オブジェクトに変換するため、
  // インデックスをキーにした plain object として送る
  const obj = {};
  (board || []).forEach((char, i) => {
    if (!char) return;
    obj[i] = {
      tid: char.id,
      hp: char.hp,
      mhp: char.maxHp,
      g: char.guard || 0,
      cd: char.cooldown || 0,
      ab: char.attackBuff || 0,
      dti: char.damageTakenIncrease || 0,
      ddd: char.damageDealtDecrease || 0,
      im: char.immovable || 0,
      pd: char.poisonDamage || 0,
      uid: char.unitId || ""
    };
  });
  return obj;
}

function deserializeBoard(serialized) {
  const result = Array(9).fill(null);
  if (!serialized) return result;

  const entries = Array.isArray(serialized)
    ? serialized.map((v, i) => [i, v])
    : Object.entries(serialized).map(([k, v]) => [parseInt(k, 10), v]);

  entries.forEach(([i, data]) => {
    if (!data || isNaN(i) || i < 0 || i >= 9) return;
    const template = CHARACTER_TEMPLATES.find((t) => t.id === data.tid);
    if (!template) return;
    const char = JSON.parse(JSON.stringify(template));
    char.hp = data.hp;
    char.maxHp = data.mhp || template.maxHp;
    char.guard = data.g || 0;
    char.cooldown = data.cd || 0;
    char.attackBuff = data.ab || 0;
    char.damageTakenIncrease = data.dti || 0;
    char.damageDealtDecrease = data.ddd || 0;
    char.immovable = data.im || 0;
    char.poisonDamage = data.pd || 0;
    char.unitId = data.uid || "";
    result[i] = char;
  });
  return result;
}

// ============================================================
// Battle sync
// ============================================================

let onlinePendingLogEntry = null;
let _onlineReceivingLog = false;

function setOnlinePendingLog(msg) {
  onlinePendingLogEntry = onlinePendingLogEntry ? onlinePendingLogEntry + msg : msg;
}

function accumulateOnlineLog(text) {
  if (_onlineReceivingLog) return;
  setOnlinePendingLog(text);
}

function pushBattleState() {
  if (gameState.battleMode !== "online" || !onlineState.roomId || !fbeDb) return;

  const data = {
    pb: serializeBoard(gameState.playerBoard),
    eb: serializeBoard(gameState.enemyBoard),
    tn: gameState.turnNumber,
    cs: gameState.currentSide,
    ph: gameState.phase,
    sa: gameState.selectedActor || null,
    sk: gameState.selectedAction ? {
      label: gameState.selectedAction.label,
      type: gameState.selectedAction.type,
      target: gameState.selectedAction.target
    } : null,
    st: gameState.selectedTarget || null,
    smd: gameState.selectedMoveDestination || null,
    rn: (gameState.rolledNumber != null) ? gameState.rolledNumber : null,
    go: gameState.gameOver || false,
    dm: gameState.decisiveMomentStartTurn,
    fs: gameState.firstSide || null,
    ss: gameState.secondSide || null,
    nu: gameState.nextUnitId || 1,
    by: onlineState.myId,
    log: onlinePendingLogEntry || null
  };

  onlinePendingLogEntry = null;
  fbeDb.ref(`fbe/rooms/${onlineState.roomId}/battle`).set(data);
}

function startListeningBattle() {
  if (onlineState.battleListener) {
    fbeDb.ref(`fbe/rooms/${onlineState.roomId}/battle`).off("value", onlineState.battleListener);
  }
  const handler = fbeDb.ref(`fbe/rooms/${onlineState.roomId}/battle`)
    .on("value", (snap) => {
      const data = snap.val();
      if (!data) return;
      if (data.by === onlineState.myId) return;
      applyRemoteBattleState(data);
    });
  onlineState.battleListener = handler;
}

function applyRemoteBattleState(data) {
  if (gameState.animation.locked) {
    setTimeout(() => applyRemoteBattleState(data), 150);
    return;
  }

  const mainLayout = document.getElementById("main-layout");
  const isHidden = !mainLayout || mainLayout.style.display === "none" || mainLayout.style.display === "";
  if (isHidden) {
    setOnlineWaitingOverlay(false);
    showBattleScreen();
    const modeDesc = document.getElementById("mode-description");
    if (modeDesc) {
      const side = gameState.onlineMySide === "player" ? "味方側" : "敵側";
      modeDesc.textContent = `オンライン対戦（あなた: ${side}）`;
    }
    const msgEl = document.getElementById("message");
    if (msgEl) msgEl.textContent = "";
  }

  gameState.playerBoard = deserializeBoard(data.pb);
  gameState.enemyBoard = deserializeBoard(data.eb);
  gameState.turnNumber = data.tn || 1;
  gameState.currentSide = data.cs || "player";
  gameState.phase = data.ph || "select_actor";
  gameState.selectedActor = data.sa || null;
  gameState.selectedAction = data.sk || null;
  gameState.selectedTarget = data.st || null;
  gameState.selectedMoveDestination = data.smd || null;
  gameState.rolledNumber = (data.rn != null) ? data.rn : null;
  gameState.gameOver = data.go || false;
  gameState.decisiveMomentStartTurn = data.dm || gameState.decisiveMomentStartTurn;
  gameState.firstSide = data.fs || null;
  gameState.secondSide = data.ss || null;
  if (data.nu) gameState.nextUnitId = data.nu;

  if (data.log) {
    _onlineReceivingLog = true;
    logMessage(data.log);
    _onlineReceivingLog = false;
  }

  gameState.animation.locked = false;
  renderAll();

  if (data.cs === onlineState.mySide && data.ph === "select_actor" && !data.go) {
    flashOnlineTurnBanner();
  }
}

function flashOnlineTurnBanner() {
  const el = document.getElementById("online-turn-banner");
  if (!el) return;
  el.textContent = "あなたのターンです！";
  el.classList.add("visible");
  setTimeout(() => el.classList.remove("visible"), 2500);
}

// ============================================================
// Cleanup
// ============================================================

function cleanupOnlineState() {
  if (fbeDb && onlineState.roomId) {
    if (onlineState.battleListener) {
      fbeDb.ref(`fbe/rooms/${onlineState.roomId}/battle`).off("value", onlineState.battleListener);
    }
    if (onlineState.roomListener) {
      fbeDb.ref(`fbe/rooms/${onlineState.roomId}`).off("value", onlineState.roomListener);
    }
    if (onlineState.setupListener) {
      fbeDb.ref(`fbe/rooms/${onlineState.roomId}`).off("value", onlineState.setupListener);
    }
  }
  onlineState.roomId = null;
  onlineState.myId = null;
  onlineState.mySide = null;
  onlineState.opponentName = null;
  onlineState.battleListener = null;
  onlineState.roomListener = null;
  onlineState.setupListener = null;
  gameState.battleMode = "auto";
  gameState.onlineMySide = null;
  gameState.onlineGuestFormationEntries = null;
  setOnlineWaitingOverlay(false);
}
