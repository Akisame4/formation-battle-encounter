function deepCopyBoard(board) {
  return JSON.parse(JSON.stringify(board));
}

function rollDice() {
  return Math.floor(Math.random() * 6) + 1;
}

function getBoardBySide(side) {
  return side === "player" ? gameState.playerBoard : gameState.enemyBoard;
}

function getEnemySide(side) {
  return side === "player" ? "enemy" : "player";
}

function getSideName(side) {
  if (gameState.battleMode === "online" && gameState.onlineMySide) {
    return side === gameState.onlineMySide ? "味方" : "敵";
  }
  return side === "player" ? "味方" : "敵";
}

function getDirectionMark(side) {
  return side === "player" ? "↑" : "↓";
}

function isHumanControlledSide(side) {
  if (gameState.battleMode === "online") {
    return side === gameState.onlineMySide;
  }

  if (gameState.battleMode === "versus") {
    return true;
  }

  return side === "player";
}

function isRealCharacter(character) {
  return character && !character.isDecoy;
}

function isAliveRealCharacter(character) {
  return isRealCharacter(character) && character.hp > 0;
}

function isTargetableUnit(character) {
  return character && character.hp > 0;
}

function getAliveCharactersWithIndex(board) {
  const result = [];

  board.forEach((character, index) => {
    if (isAliveRealCharacter(character)) {
      result.push({ character, index });
    }
  });

  return result;
}

function getAliveCharacters(board) {
  return getAliveCharactersWithIndex(board).map(item => item.character);
}

function getRow(index) {
  return Math.floor(index / 3);
}

function getColumn(index) {
  return index % 3;
}

function getHorizontalAdjacentIndexes(fromIndex) {
  const row = getRow(fromIndex);
  const column = getColumn(fromIndex);

  return [
    getIndex(row, column - 1),
    getIndex(row, column + 1)
  ].filter(index => index !== null);
}

function getIndex(row, column) {
  if (row < 0 || row > 2 || column < 0 || column > 2) {
    return null;
  }

  return row * 3 + column;
}

function createSeededRandom(text) {
  let seed = 0;

  for (let i = 0; i < text.length; i++) {
    seed = (seed * 31 + text.charCodeAt(i)) >>> 0;
  }

  if (seed === 0) {
    seed = 123456789;
  }

  return function() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function shuffleArray(array, randomFunction) {
  const result = array.slice();

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(randomFunction() * (i + 1));
    const temp = result[i];
    result[i] = result[j];
    result[j] = temp;
  }

  return result;
}

function extractTurnNumberFromLogText(text) {
  const match = String(text).match(/【第(\d+)ターン】/);
  return match ? Number(match[1]) : null;
}

function getTurnSeparatorText(turnNumber) {
  return `―― 第${turnNumber}ターン ――`;
}

function logMessage(text) {
  const message = document.getElementById("message");

  if (!message) {
    return;
  }

  const turnNumber = extractTurnNumberFromLogText(text);
  let logText = String(text);

  if (turnNumber !== null) {
    const separatorText = getTurnSeparatorText(turnNumber);

    if (!message.textContent.includes(separatorText)) {
      const prefix = message.textContent.endsWith("\n") ? "\n" : "\n\n";
      logText = `${prefix}${separatorText}\n${logText.replace(/^\n+/, "")}`;
    }
  }

  message.textContent += logText;
  message.scrollTop = message.scrollHeight;

  if (gameState.battleMode === "online" && typeof accumulateOnlineLog === "function") {
    accumulateOnlineLog(logText);
  }
}


function getDiceSideClass(side) {
  return side === "enemy" ? "dice-side-enemy" : "dice-side-player";
}

function getDiceSideLabel(side) {
  return side === "enemy" ? "敵" : "味方";
}

function ensureDiceRollStyle() {
  if (document.getElementById("dice-roll-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "dice-roll-style";
  style.textContent = `
    .dice-roll-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: none;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.36);
      pointer-events: none;
    }

    .dice-roll-overlay.visible {
      display: flex;
    }

    .dice-roll-box {
      min-width: 280px;
      max-width: min(92vw, 420px);
      padding: 22px 24px;
      border: 4px solid #ffffff;
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.96);
      box-shadow:
        0 18px 44px rgba(0, 0, 0, 0.36),
        inset 0 0 0 4px rgba(255, 255, 255, 0.45);
      text-align: center;
      transform-origin: center center;
    }

    .dice-roll-box.rolling {
      animation: diceRollBoxShake 0.14s infinite alternate ease-in-out;
    }

    .dice-roll-box.final {
      animation: diceRollBoxFinal 0.34s ease-out;
    }

    .dice-roll-side-label {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 80px;
      padding: 4px 14px;
      border-radius: 999px;
      color: #fff;
      font-weight: 800;
      font-size: 18px;
      letter-spacing: 2px;
      margin-bottom: 12px;
    }

    .dice-roll-number {
      width: 132px;
      height: 132px;
      margin: 0 auto 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 5px solid #222;
      border-radius: 28px;
      background: #fff;
      color: #111;
      font-size: 82px;
      font-weight: 900;
      line-height: 1;
      box-shadow:
        0 8px 0 rgba(0, 0, 0, 0.18),
        inset 0 0 0 4px rgba(0, 0, 0, 0.04);
    }

    .dice-roll-actor {
      font-size: 20px;
      font-weight: 900;
      line-height: 1.25;
      margin-top: 4px;
    }

    .dice-roll-action {
      min-height: 28px;
      margin-top: 8px;
      font-size: 24px;
      font-weight: 900;
      line-height: 1.25;
    }

    .dice-roll-caption {
      margin-top: 6px;
      font-size: 13px;
      font-weight: 700;
      color: #555;
    }


    .dice-roll-box.dice-side-player {
      border-color: #1976d2;
      box-shadow:
        0 18px 44px rgba(0, 0, 0, 0.34),
        0 0 0 8px rgba(25, 118, 210, 0.25);
    }

    .dice-roll-box.dice-side-player .dice-roll-side-label {
      background: #1976d2;
      color: #fff;
    }

    .dice-roll-box.dice-side-player .dice-roll-number {
      border-color: #1976d2;
      color: #0d47a1;
      box-shadow:
        0 8px 0 rgba(13, 71, 161, 0.24),
        inset 0 0 0 4px rgba(25, 118, 210, 0.08);
    }

    .dice-roll-box.dice-side-player .dice-roll-action {
      color: #0d47a1;
    }


    .dice-roll-box.dice-side-enemy {
      border-color: #d32f2f;
      box-shadow:
        0 18px 44px rgba(0, 0, 0, 0.34),
        0 0 0 8px rgba(211, 47, 47, 0.25);
    }

    .dice-roll-box.dice-side-enemy .dice-roll-side-label {
      background: #d32f2f;
      color: #fff;
    }

    .dice-roll-box.dice-side-enemy .dice-roll-number {
      border-color: #d32f2f;
      color: #b71c1c;
      box-shadow:
        0 8px 0 rgba(183, 28, 28, 0.24),
        inset 0 0 0 4px rgba(211, 47, 47, 0.08);
    }

    .dice-roll-box.dice-side-enemy .dice-roll-action {
      color: #b71c1c;
    }

    @keyframes diceRollBoxShake {
      from {
        transform: translateY(-2px) rotate(-3deg) scale(0.98);
      }

      to {
        transform: translateY(2px) rotate(3deg) scale(1.02);
      }
    }

    @keyframes diceRollBoxFinal {
      0% {
        transform: scale(0.82) rotate(-8deg);
      }

      55% {
        transform: scale(1.14) rotate(4deg);
      }

      100% {
        transform: scale(1) rotate(0deg);
      }
    }
  `;
  document.head.appendChild(style);
}

function ensureDiceRollOverlay() {
  ensureDiceRollStyle();

  let overlay = document.getElementById("dice-roll-overlay");

  if (overlay) {
    return overlay;
  }

  overlay = document.createElement("div");
  overlay.id = "dice-roll-overlay";
  overlay.className = "dice-roll-overlay";
  overlay.innerHTML = `
    <div id="dice-roll-box" class="dice-roll-box">
      <div id="dice-roll-side-label" class="dice-roll-side-label">味方</div>
      <div id="dice-roll-number" class="dice-roll-number">1</div>
      <div id="dice-roll-actor" class="dice-roll-actor">キャラクター</div>
      <div id="dice-roll-action" class="dice-roll-action">行動</div>
      <div id="dice-roll-caption" class="dice-roll-caption">カラカラカラ……</div>
    </div>
  `;

  document.body.appendChild(overlay);
  return overlay;
}

function ensureInitiativeDiceRollStyle() {
  ensureDiceRollStyle();

  if (document.getElementById("initiative-dice-roll-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "initiative-dice-roll-style";
  style.textContent = `
    .initiative-dice-roll-overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: none;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.36);
      pointer-events: none;
    }

    .initiative-dice-roll-overlay.visible {
      display: flex;
    }

    .initiative-dice-roll-panel {
      width: min(92vw, 720px);
      padding: 22px;
      border: 4px solid #ffffff;
      border-radius: 28px;
      background: rgba(255, 255, 255, 0.96);
      box-shadow: 0 18px 44px rgba(0, 0, 0, 0.36);
      text-align: center;
    }

    .initiative-dice-roll-title {
      margin-bottom: 14px;
      font-size: 24px;
      font-weight: 900;
      letter-spacing: 1px;
      color: #222;
    }

    .initiative-dice-roll-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
      align-items: stretch;
    }

    .initiative-dice-roll-card {
      padding: 18px 14px 16px;
      border: 4px solid #222;
      border-radius: 24px;
      background: #fff;
      transform-origin: center center;
    }

    .initiative-dice-roll-card.rolling {
      animation: diceRollBoxShake 0.14s infinite alternate ease-in-out;
    }

    .initiative-dice-roll-card.final {
      animation: diceRollBoxFinal 0.34s ease-out;
    }

    .initiative-dice-roll-card.dice-side-player {
      border-color: #1976d2;
      box-shadow: 0 0 0 7px rgba(25, 118, 210, 0.18);
    }

    .initiative-dice-roll-card.dice-side-enemy {
      border-color: #d32f2f;
      box-shadow: 0 0 0 7px rgba(211, 47, 47, 0.18);
    }

    .initiative-dice-roll-card .dice-roll-side-label {
      margin-bottom: 10px;
    }

    .initiative-dice-roll-card .dice-roll-number {
      width: 112px;
      height: 112px;
      margin-bottom: 6px;
      font-size: 72px;
    }

    .initiative-dice-roll-card.dice-side-player .dice-roll-side-label {
      background: #1976d2;
    }

    .initiative-dice-roll-card.dice-side-enemy .dice-roll-side-label {
      background: #d32f2f;
    }

    .initiative-dice-roll-card.dice-side-player .dice-roll-number {
      border-color: #1976d2;
      color: #0d47a1;
    }

    .initiative-dice-roll-card.dice-side-enemy .dice-roll-number {
      border-color: #d32f2f;
      color: #b71c1c;
    }

    .initiative-dice-roll-caption {
      min-height: 24px;
      margin-top: 14px;
      font-size: 18px;
      font-weight: 900;
      color: #333;
      white-space: pre-line;
    }

    @media (max-width: 620px) {
      .initiative-dice-roll-row {
        grid-template-columns: 1fr;
      }
    }
  `;
  document.head.appendChild(style);
}

function ensureInitiativeDiceRollOverlay() {
  ensureInitiativeDiceRollStyle();

  let overlay = document.getElementById("initiative-dice-roll-overlay");

  if (overlay) {
    return overlay;
  }

  overlay = document.createElement("div");
  overlay.id = "initiative-dice-roll-overlay";
  overlay.className = "initiative-dice-roll-overlay";
  overlay.innerHTML = `
    <div class="initiative-dice-roll-panel">
      <div class="initiative-dice-roll-title">先攻判定</div>
      <div class="initiative-dice-roll-row">
        <div id="initiative-player-card" class="initiative-dice-roll-card dice-side-player">
          <div class="dice-roll-side-label">味方</div>
          <div id="initiative-player-number" class="dice-roll-number">1</div>
        </div>
        <div id="initiative-enemy-card" class="initiative-dice-roll-card dice-side-enemy">
          <div class="dice-roll-side-label">敵</div>
          <div id="initiative-enemy-number" class="dice-roll-number">1</div>
        </div>
      </div>
      <div id="initiative-dice-roll-caption" class="initiative-dice-roll-caption">同時にダイスを振ります。</div>
    </div>
  `;

  document.body.appendChild(overlay);
  return overlay;
}

async function animateInitiativeDiceRoll(options) {
  const playerRoll = options.playerRoll;
  const enemyRoll = options.enemyRoll;
  const overlay = ensureInitiativeDiceRollOverlay();
  const playerCard = document.getElementById("initiative-player-card");
  const enemyCard = document.getElementById("initiative-enemy-card");
  const playerNumber = document.getElementById("initiative-player-number");
  const enemyNumber = document.getElementById("initiative-enemy-number");
  const caption = document.getElementById("initiative-dice-roll-caption");

  overlay.classList.add("visible");
  playerCard.className = "initiative-dice-roll-card dice-side-player rolling";
  enemyCard.className = "initiative-dice-roll-card dice-side-enemy rolling";
  caption.textContent = "同時にダイスを振ります。";
  setDiceEffectSideClass(null);
  playDiceRollSE();

  const rollFrames = 22;

  for (let i = 0; i < rollFrames; i++) {
    const temporaryPlayerNumber = rollDice();
    const temporaryEnemyNumber = rollDice();
    playerNumber.textContent = temporaryPlayerNumber;
    enemyNumber.textContent = temporaryEnemyNumber;
    showDiceEffect(`味方 🎲 ${temporaryPlayerNumber}\n敵 🎲 ${temporaryEnemyNumber}`, true, null);

    const progress = i / (rollFrames - 1);
    const easedProgress = progress * progress;
    const delay = Math.round(30 + easedProgress * 150);
    await sleep(delay);
  }

  playerNumber.textContent = playerRoll;
  enemyNumber.textContent = enemyRoll;
  playerCard.className = "initiative-dice-roll-card dice-side-player final";
  enemyCard.className = "initiative-dice-roll-card dice-side-enemy final";

  if (playerRoll === enemyRoll) {
    caption.textContent = `味方 ${playerRoll} - 敵 ${enemyRoll}\n同点のため振り直し。`;
  } else if (playerRoll > enemyRoll) {
    caption.textContent = `味方 ${playerRoll} - 敵 ${enemyRoll}\n味方が先攻です。`;
  } else {
    caption.textContent = `味方 ${playerRoll} - 敵 ${enemyRoll}\n敵が先攻です。`;
  }

  showDiceEffect(caption.textContent, true, playerRoll === enemyRoll ? null : playerRoll > enemyRoll ? "player" : "enemy");
  await sleep(2080);
  overlay.classList.remove("visible");
}

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

// ============================================================
// Audio system
// ============================================================

let _audioCtx = null;
let _masterGain = null;

function initAudio() {
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  if (_audioCtx && _audioCtx.state !== "closed") {
    if (_audioCtx.state === "suspended") _audioCtx.resume().catch(() => {});
    return;
  }
  try {
    _audioCtx = new AC();
    _masterGain = _audioCtx.createGain();
    _masterGain.gain.value = getVolumeSliderValue();
    _masterGain.connect(_audioCtx.destination);
  } catch (e) {}
}

function getVolumeSliderValue() {
  const el = document.getElementById("volume-slider");
  return el ? Number(el.value) / 100 : 0.7;
}

function setupVolumeControl() {
  const slider = document.getElementById("volume-slider");
  const icon = document.getElementById("volume-icon");
  if (!slider || !icon) return;

  const update = () => {
    const vol = Number(slider.value) / 100;
    if (_masterGain) _masterGain.gain.value = vol;
    icon.textContent = vol === 0 ? "🔇" : vol < 0.34 ? "🔈" : vol < 0.67 ? "🔉" : "🔊";
  };

  slider.addEventListener("input", update);
  update();
}

document.addEventListener("click", () => {
  initAudio();
  loadDiceRollSE();
});

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupVolumeControl);
} else {
  setupVolumeControl();
}

let _diceRollBuffer = null;

function loadDiceRollSE() {
  const ctx = _audioCtx;
  if (!ctx || _diceRollBuffer) return;
  fetch("assets/dice_roll.mp3")
    .then(res => res.arrayBuffer())
    .then(ab => ctx.decodeAudioData(ab))
    .then(buf => { _diceRollBuffer = buf; })
    .catch(() => {});
}

function playDiceRollSE() {
  if (!_audioCtx || !_masterGain) return;

  const doPlay = () => {
    if (!_diceRollBuffer) return;
    try {
      const src = _audioCtx.createBufferSource();
      src.buffer = _diceRollBuffer;
      src.connect(_masterGain);
      src.start(_audioCtx.currentTime);
    } catch (e) {}
  };

  if (_audioCtx.state === "running") {
    if (_diceRollBuffer) {
      doPlay();
    } else {
      loadDiceRollSE();
    }
  } else {
    _audioCtx.resume().then(() => {
      if (!_diceRollBuffer) loadDiceRollSE();
      setTimeout(doPlay, 150);
    }).catch(() => {});
  }
}

function setDiceEffectSideClass(side) {
  const diceEffect = document.getElementById("dice-effect");

  if (!diceEffect) {
    return;
  }

  diceEffect.classList.remove("dice-side-player", "dice-side-enemy");

  if (side) {
    diceEffect.classList.add(getDiceSideClass(side));
  }
}

async function animateDiceRoll(options) {
  const side = options.side || "player";
  const actorName = options.actorName || "";
  const finalNumber = options.finalNumber;
  const action = options.action || null;
  const actionText = options.actionText ||
    (
      action && typeof getCompactActionLabel === "function"
        ? getCompactActionLabel(action)
        : ""
    );

  const overlay = ensureDiceRollOverlay();
  const box = document.getElementById("dice-roll-box");
  const sideLabel = document.getElementById("dice-roll-side-label");
  const numberElement = document.getElementById("dice-roll-number");
  const actorElement = document.getElementById("dice-roll-actor");
  const actionElement = document.getElementById("dice-roll-action");
  const captionElement = document.getElementById("dice-roll-caption");

  overlay.classList.add("visible");
  box.className = `dice-roll-box rolling ${getDiceSideClass(side)}`;
  sideLabel.textContent = getDiceSideLabel(side);
  actorElement.textContent = actorName;
  actionElement.textContent = "";
  captionElement.textContent = "カラカラカラ……";

  setDiceEffectSideClass(side);
  playDiceRollSE();

  const rollFrames = 22;

  for (let i = 0; i < rollFrames; i++) {
    const temporaryNumber = rollDice();
    numberElement.textContent = temporaryNumber;
    showDiceEffect(`🎲 ${temporaryNumber}`, false, side);

    const progress = i / (rollFrames - 1);
    const easedProgress = progress * progress;
    const delay = Math.round(30 + easedProgress * 150);
    await sleep(delay);
  }

  numberElement.textContent = finalNumber;
  actionElement.textContent = actionText ? `出目${finalNumber}：${actionText}` : `出目${finalNumber}`;
  captionElement.textContent = "決定！";
  box.className = `dice-roll-box final ${getDiceSideClass(side)}`;
  showDiceEffect(`🎲 ${finalNumber}${actionText ? `\n${actionText}` : ""}`, true, side);

  await sleep(2080);

  overlay.classList.remove("visible");
}

function setDiceEffectText(text) {
  const diceEffect = document.getElementById("dice-effect");

  if (!diceEffect) {
    return;
  }

  diceEffect.classList.add("small-text");
  diceEffect.classList.remove("dice-side-player", "dice-side-enemy");
  diceEffect.textContent = text;
}

function showDiceEffect(text, useSmallText = false, side = null) {
  const diceEffect = document.getElementById("dice-effect");

  if (!diceEffect) {
    return;
  }

  diceEffect.classList.remove("rolling");
  void diceEffect.offsetWidth;

  if (useSmallText) {
    diceEffect.classList.add("small-text");
  } else {
    diceEffect.classList.remove("small-text");
  }

  setDiceEffectSideClass(side);

  diceEffect.textContent = text;
  diceEffect.classList.add("rolling");
}
