function setScreenDisplay(id, displayValue) {
  const element = document.getElementById(id);

  if (element) {
    element.style.display = displayValue;
  }
}

function hideOnlineScreens() {
  setScreenDisplay("online-lobby-screen", "none");
  setScreenDisplay("online-waiting-screen", "none");
}

function showTitleScreen() {
  hideOnlineScreens();
  if (typeof hideBattleFrontierScreens === "function") hideBattleFrontierScreens();
  setScreenDisplay("title-screen", "flex");
  setScreenDisplay("party-code-screen", "none");
  setScreenDisplay("player-formation-screen", "none");
  setScreenDisplay("main-layout", "none");

  const resumeButton = document.getElementById("battlefrontier-resume-button");
  if (resumeButton) {
    const canResume = typeof hasBattleFrontierInterrupt === "function" && hasBattleFrontierInterrupt();
    resumeButton.disabled = !canResume;
  }
}

function showPartyCodeScreen() {
  hideOnlineScreens();
  if (typeof hideBattleFrontierScreens === "function") hideBattleFrontierScreens();
  setScreenDisplay("title-screen", "none");
  setScreenDisplay("party-code-screen", "flex");
  setScreenDisplay("player-formation-screen", "none");
  setScreenDisplay("main-layout", "none");
}

function showPlayerFormationScreen() {
  // 直前の対戦の再開用スナップショットが残っていると、この画面（キャラ交換含む）
  // 滞在中にリロードした際、終了済みの対戦を誤って復元し、誰もいない対戦画面で
  // スタックしてしまうため、ここで無効化しておく。
  if (typeof clearBattleSnapshot === "function") {
    clearBattleSnapshot();
  }

  hideOnlineScreens();
  if (typeof hideBattleFrontierScreens === "function") hideBattleFrontierScreens();
  setScreenDisplay("title-screen", "none");
  setScreenDisplay("party-code-screen", "none");
  setScreenDisplay("player-formation-screen", "flex");
  setScreenDisplay("main-layout", "none");

  const codeLoadArea = document.getElementById("player-formation-code-load-area");
  const backButton = document.getElementById("player-formation-back-button");
  const isBattleFrontier = gameState.battleMode === "battlefrontier";

  if (codeLoadArea && !isBattleFrontier) {
    codeLoadArea.style.display = "";
  }

  if (backButton) {
    backButton.textContent = isBattleFrontier ? "中断してタイトルへ" : "タイトルへ戻る";
  }
}

function showBattleScreen() {
  hideOnlineScreens();
  if (typeof hideBattleFrontierScreens === "function") hideBattleFrontierScreens();
  setScreenDisplay("title-screen", "none");
  setScreenDisplay("party-code-screen", "none");
  setScreenDisplay("player-formation-screen", "none");
  setScreenDisplay("main-layout", "grid");
}

function openCharacterSelection(mode) {
  // 旧クリック選択画面は廃止し、D&D式の自陣配置画面へ統一する。
  openPlayerFormationForBattle(mode);
}

function openPlayerFormationForBattle(mode) {
  gameState.pendingBattleMode = mode;
  gameState.battleMode = mode;
  gameState.lastBattleCode = document.getElementById("battle-code-input").value.trim();
  gameState.lastVersusEnemyCode = document.getElementById("versus-enemy-code-input").value.trim();
  openPlayerFormationBuilder();
}

function startBattle(mode) {
  gameState.battleMode = mode;
  gameState.lastBattleCode = document.getElementById("battle-code-input").value.trim();

  showBattleScreen();
  resetGame();
}

function startBattleWithSelectedParty() {
  if (!gameState.selectedPlayerNames || gameState.selectedPlayerNames.length !== gameState.partySize) {
    return;
  }

  openPlayerFormationBuilder();
}

function resetGame() {
  gameState.nextUnitId = 1;
  gameState.animation.locked = false;
  gameState.animation.movingUnits = [];
  gameState.decisiveMomentActiveSince = null;

  const playerFormationEntries = getPlayerFormationEntries();

  if (isPlayerFormationReady()) {
    gameState.playerBoard = createPartyBoardFromFormation(playerFormationEntries, "player");
  } else {
    gameState.playerBoard = createPartyBoardFromSelectedNames(gameState.selectedPlayerNames, "player");
  }

  gameState.stageCleared = false;

  if (gameState.battleMode === "stage") {
    gameState.maxStage = getStageCount();
    gameState.enemyBoard = createEnemyBoardForStage(gameState.stageNumber || 1);
  } else if (gameState.battleMode === "auto") {
    gameState.enemyBoard = createEnemyBoardForAutoBattle(gameState.lastBattleCode);
  } else if (gameState.battleMode === "online") {
    // createPartyBoardFromFormation(..., "enemy") が rotatePartyFormationPositionForEnemy で
    // 行・列を180度回転するため、手動の行反転は不要（二重変換になりバグになる）
    gameState.enemyBoard = createPartyBoardFromFormation(
      gameState.onlineGuestFormationEntries || [],
      "enemy"
    );
  } else if (gameState.battleMode === "battlefrontier") {
    gameState.enemyBoard = createBattleFrontierEnemyBoard(gameState.battleFrontier.currentEnemyIds);
  } else {
    gameState.enemyBoard = createEnemyBoardForVersusBattle(gameState.lastVersusEnemyCode);
  }

  /*
    戦闘開始時点で、両陣営の前列が空なら前へ詰める。

    ここで正規化しておかないと、先攻判定の結果によっては、
    後攻側だけが「前一列を空けたまま」の陣形で表示・開始されることがある。

    戦闘中の撃破後前進とは違い、開始時の初期整列なので、
    スライド演出用の movingUnits は残さない。
  */
  applyAutoAdvance();
  gameState.animation.movingUnits = [];

  gameState.currentSide = "player";
  gameState.firstSide = null;
  gameState.secondSide = null;
  gameState.turnNumber = 1;

  gameState.selectedActor = null;
  gameState.selectedAction = null;
  gameState.selectedTarget = null;
  gameState.selectedMoveDestination = null;

  gameState.rolledNumber = null;
  gameState.phase = "initiative";

  gameState.gameOver = false;
  gameState.enemyAutoRunning = false;

  const baseModeText = getBattleModeDescriptionText();
  const modeText = gameState.debugMode
    ? `${baseModeText} 検証モード中：手動ターンでは出目を指定できます。`
    : baseModeText;

  document.getElementById("mode-description").textContent = modeText;

  const playerNames = getPlayerFormationEntries()
    .map(entry => getCharacterByIdFromPool(entry.id))
    .filter(character => character)
    .map(character => character.name);
  const partyText = `味方パーティ：${playerNames.join("、")}`;
  const codeText = getBattleStartEnemyDescriptionText();

  document.getElementById("message").textContent =
    `${partyText}\n${codeText}\n決着の刻：第${gameState.decisiveMomentStartTurn}ターン終了時から、または両軍残り1人で発動。後攻行動後に全員へ${gameState.decisiveMomentDamage}ダメージ（以降5ターンごとに10ずつ増加）。\n先攻後攻をダイスで決定します。`;

  setDiceEffectText("先攻後攻を決定します");

  renderAll();
  decideInitiative();
}


const CHARACTER_DISPLAY_ORDER = [
  "olive",
  "fang",
  "chilchil",
  "godo",
  "lunaluna",
  "dragon",
  "jay",

  "chaco",
  "rock",

  "shinonome",
  "indra",
  "ruma",
  "teruru",

  "cocon",
  "yue",
  "cafe",
  "kashu",

  "moni",
  "nano",
  "dean",
  "maiyu",
  "sai",
  "bei"
];

function getDefaultPartyPositions(side) {
  if (side === "player") {
    return [0, 1, 2, 4];
  }

  return [6, 7, 8, 4];
}

function findCharacterByName(pool, name) {
  return pool.find((character) => character && character.name === name) || null;
}

function getCharacterPool() {
  if (typeof CHARACTER_TEMPLATES !== "undefined" && Array.isArray(CHARACTER_TEMPLATES)) {
    const templateMap = new Map(
      CHARACTER_TEMPLATES.map(character => [character.id, character])
    );
    const orderedPool = CHARACTER_DISPLAY_ORDER
      .map(id => templateMap.get(id))
      .filter(character => character);
    const orderedIds = new Set(CHARACTER_DISPLAY_ORDER);
    const remainingPool = CHARACTER_TEMPLATES.filter(character => !orderedIds.has(character.id));

    return orderedPool.concat(remainingPool);
  }

  const pool = [];
  const addedNames = new Set();

  INITIAL_PLAYER_BOARD.forEach(character => {
    if (character && !addedNames.has(character.name)) {
      pool.push(character);
      addedNames.add(character.name);
    }
  });

  INITIAL_ENEMY_BOARD.forEach(character => {
    if (character && !addedNames.has(character.name)) {
      pool.push(character);
      addedNames.add(character.name);
    }
  });

  return pool;
}

function getSelectableCharacterPool() {
  return getCharacterPool().filter(character => !character.isPrototype);
}

function resetCharacterRuntimeStatus(character) {
  character.hp = character.maxHp;
  character.guard = 0;
  character.cooldown = 0;
  character.attackBuff = 0;
  character.damageTakenIncrease = 0;
  character.damageDealtDecrease = 0;
  character.immovable = 0;
  character.poisonDamage = 0;
  character.burn = false;
  character.paralysis = false;
  character.tauntedBy = null;
  character.chargeActive = false;
  character.chargeStock = 0;
  character.unitId = `unit-${gameState.nextUnitId}`;
  gameState.nextUnitId++;
}

function createPartyBoardFromSelectedNames(names, side) {
  const pool = getCharacterPool();
  const selectedCharacters = [];

  (names || []).forEach((name) => {
    const character = findCharacterByName(pool, name);

    if (character && selectedCharacters.length < gameState.partySize) {
      selectedCharacters.push(character);
    }
  });

  pool.forEach(character => {
    const alreadyExists = selectedCharacters.some(selected => selected.name === character.name);

    if (!alreadyExists && selectedCharacters.length < gameState.partySize) {
      selectedCharacters.push(character);
    }
  });

  return createPartyBoardFromCharacters(selectedCharacters, side);
}

function createPartyBoardFromBase(baseBoard, side) {
  const baseCharacters = baseBoard.filter(character => character);
  return createPartyBoardFromCharacters(baseCharacters, side);
}

function createPartyBoardFromCharacters(characters, side) {
  const board = Array(9).fill(null);
  const positions = getDefaultPartyPositions(side);

  characters.slice(0, gameState.partySize).forEach((character, index) => {
    const copiedCharacter = deepCopyBoard([character])[0];
    resetCharacterRuntimeStatus(copiedCharacter);
    board[positions[index]] = copiedCharacter;
  });

  return board;
}

function toggleSelectedCharacter(name) {
  const selectedNames = gameState.selectedPlayerNames || [];
  const index = selectedNames.indexOf(name);

  if (index >= 0) {
    selectedNames.splice(index, 1);
  } else if (selectedNames.length < gameState.partySize) {
    selectedNames.push(name);
  }

  gameState.selectedPlayerNames = selectedNames;
  renderCharacterSelectionScreen();
}

function getSelectionCardActionHtml(character) {
  let actionHtml = "";

  for (let dice = 1; dice <= 6; dice++) {
    const action = character.actions[dice];
    const compactLabel = getCompactActionLabel(action);
    actionHtml += `<li title="${action.label}">${compactLabel}</li>`;
  }

  return actionHtml;
}


function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getActionDetailRowsHtml(character) {
  if (!character || !character.actions) {
    return "";
  }

  let rowsHtml = "";

  for (let dice = 1; dice <= 6; dice++) {
    const action = character.actions[dice] || {};
    const compactLabel = typeof getCompactActionLabel === "function"
      ? getCompactActionLabel(action)
      : (action.label || "行動");

    rowsHtml += `
      <tr>
        <th>${dice}</th>
        <td class="character-detail-compact">${escapeHtml(compactLabel)}</td>
        <td>${escapeHtml(action.label || compactLabel)}</td>
      </tr>
    `;
  }

  return rowsHtml;
}

function getCharacterRuntimeStatusHtml(character) {
  if (!character) {
    return "";
  }

  const statusItems = [];

  if (Number.isFinite(character.hp) && Number.isFinite(character.maxHp)) {
    statusItems.push(`現在HP ${character.hp} / ${character.maxHp}`);
  } else if (Number.isFinite(character.maxHp)) {
    statusItems.push(`HP ${character.maxHp}`);
  }

  if (character.guard > 0) {
    statusItems.push(`防御 ${character.guard}`);
  }

  if (character.attackBuff > 0) {
    statusItems.push(`攻撃強化 +${character.attackBuff}`);
  }

  if (character.damageTakenIncrease > 0) {
    statusItems.push(`被ダメージ +${character.damageTakenIncrease}`);
  }

  if (character.damageDealtDecrease > 0) {
    statusItems.push(`与ダメージ -${character.damageDealtDecrease}`);
  }

  if (character.immovable > 0) {
    statusItems.push("移動不可");
  }

  if (character.poisonDamage > 0) {
    statusItems.push(`毒 ${character.poisonDamage}`);
  }

  if (character.burn) {
    statusItems.push("やけど");
  }

  if (character.paralysis) {
    statusItems.push("麻痺");
  }

  if (character.tauntedBy) {
    statusItems.push("挑発中");
  }

  if (character.chargeActive) {
    statusItems.push(`溜め込み中${character.chargeStock > 0 ? `(${character.chargeStock})` : ""}`);
  }

  if (character.cooldown > 0) {
    statusItems.push("次回使用不可");
  }

  return statusItems.map(item => `<span>${escapeHtml(item)}</span>`).join("");
}

function ensureCharacterDetailModal() {
  let overlay = document.getElementById("character-detail-modal");

  if (overlay) {
    return overlay;
  }

  overlay = document.createElement("div");
  overlay.id = "character-detail-modal";
  overlay.className = "character-detail-modal";
  overlay.innerHTML = `
    <div class="character-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="character-detail-title">
      <button id="character-detail-close-button" class="character-detail-close-button" type="button" aria-label="詳細を閉じる">×</button>
      <div id="character-detail-content"></div>
    </div>
  `;

  overlay.addEventListener("click", (event) => {
    if (event.target === overlay) {
      closeCharacterDetailModal();
    }
  });

  document.body.appendChild(overlay);

  const closeButton = document.getElementById("character-detail-close-button");

  if (closeButton) {
    closeButton.addEventListener("click", closeCharacterDetailModal);
  }

  if (!window.characterDetailEscapeInstalled) {
    window.characterDetailEscapeInstalled = true;
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        closeCharacterDetailModal();
      }
    });
  }

  return overlay;
}

function openCharacterDetailModal(character, contextLabel = "") {
  if (!character) {
    return;
  }

  const overlay = ensureCharacterDetailModal();
  const content = document.getElementById("character-detail-content");

  if (!content) {
    return;
  }

  const runtimeStatusHtml = getCharacterRuntimeStatusHtml(character);
  const contextHtml = contextLabel
    ? `<div class="character-detail-context">${escapeHtml(contextLabel)}</div>`
    : "";

  const dialogElement = overlay.querySelector(".character-detail-dialog");

  if (dialogElement) {
    dialogElement.classList.toggle("is-prototype-detail", !!character.isPrototype);
  }

  content.innerHTML = `
    <div class="character-detail-header">
      ${contextHtml}
      <div id="character-detail-title" class="character-detail-name">${escapeHtml(character.name)}</div>
      <div class="character-detail-job">${escapeHtml(character.job || "")}</div>
      <div class="character-detail-role">${escapeHtml(character.role || "")}</div>
    </div>

    <div class="character-detail-status">
      ${runtimeStatusHtml}
    </div>

    <div class="character-detail-section-title">ダイス効果</div>
    <table class="character-detail-action-table">
      <thead>
        <tr>
          <th>出目</th>
          <th>短縮</th>
          <th>効果全文</th>
        </tr>
      </thead>
      <tbody>
        ${getActionDetailRowsHtml(character)}
      </tbody>
    </table>
  `;

  overlay.classList.add("visible");
}

function closeCharacterDetailModal() {
  const overlay = document.getElementById("character-detail-modal");

  if (overlay) {
    overlay.classList.remove("visible");
  }
}

function createCharacterDetailButton(character, contextLabel = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "character-detail-button";
  button.textContent = "詳細";
  button.draggable = false;

  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    openCharacterDetailModal(character, contextLabel);
  });

  button.addEventListener("dragstart", (event) => {
    event.preventDefault();
    event.stopPropagation();
  });

  return button;
}

function renderCharacterSelectionScreen() {
  const listElement = document.getElementById("character-selection-list");
  const selectedListElement = document.getElementById("selected-party-list");
  const startButton = document.getElementById("selection-start-button");
  const descriptionElement = document.getElementById("select-mode-description");

  if (!listElement || !selectedListElement || !startButton || !descriptionElement) {
    return;
  }

  const pool = getCharacterPool();
  const selectedNames = gameState.selectedPlayerNames || [];
  const modeName = gameState.pendingBattleMode === "versus" ? "対人バトル" : "オートバトル";

  descriptionElement.textContent = `${modeName}で使う味方4体を選んでください。現在 ${selectedNames.length} / ${gameState.partySize} 体。`;
  startButton.disabled = selectedNames.length !== gameState.partySize;

  selectedListElement.innerHTML = "";

  for (let i = 0; i < gameState.partySize; i++) {
    const slot = document.createElement("div");
    slot.className = "selected-party-slot";
    slot.textContent = selectedNames[i] || "未選択";
    selectedListElement.appendChild(slot);
  }

  listElement.innerHTML = "";

  pool.forEach((character) => {
    const isSelected = selectedNames.includes(character.name);
    const isDisabled = !isSelected && selectedNames.length >= gameState.partySize;
    const card = document.createElement("div");
    card.className = "selection-character-card";

    if (isSelected) {
      card.classList.add("selected-selection-card");
    }

    if (isDisabled) {
      card.classList.add("disabled-selection-card");
    }

    card.innerHTML = `
      <div class="selection-card-top">
        <div class="portrait-box selection-portrait-box">
          ${getCharacterImageHtml(character, "card-character-image", "IMAGE<br>EMPTY")}
        </div>
        <div class="selection-card-info">
          <div class="selection-card-name-row"><div class="selection-card-name">${character.name}</div></div>
          <div class="selection-card-job">${character.job}</div>
          <div class="selection-card-role">${character.role}</div>
          <div class="selection-card-hp">HP ${character.maxHp}</div>
        </div>
      </div>
      <div class="selection-action-list">
        <ol>${getSelectionCardActionHtml(character)}</ol>
      </div>
      <div class="selection-card-footer">${isSelected ? "選択中" : isDisabled ? "4体選択済み" : "クリックで選択"}</div>
    `;

    card.querySelector(".selection-card-name-row").appendChild(
      createCharacterDetailButton(character, "キャラクター選択")
    );

    card.addEventListener("click", () => {
      toggleSelectedCharacter(character.name);
    });

    listElement.appendChild(card);
  });
}


function openPartyCodeBuilder() {
  ensurePartyCodeDragStyle();
  installPartyCodeOutsideDropHandlers();
  initializePartyCodeBuilderIfNeeded();
  showPartyCodeScreen();
  renderPartyCodeBuilderScreen();
}

function initializePartyCodeBuilderIfNeeded() {
  if (
    Array.isArray(gameState.partyCodeBuilderSelectedIds) &&
    gameState.partyCodeBuilderInitialized
  ) {
    return;
  }

  gameState.partyCodeBuilderSelectedIds = [];
  gameState.partyCodeBuilderFormation = {};
  gameState.partyCodeBuilderActiveId = null;
  gameState.partyCodeBuilderOutput = "";
  gameState.partyCodeBuilderInitialized = true;
  gameState.partyCodeBuilderDraggingFromBoard = false;
  gameState.partyCodeBuilderTapSelectedId = null;
}

function getCharacterByIdFromPool(id) {
  return getCharacterPool().find(character => character && character.id === id) || null;
}

function getPartyCodeBuilderEntries() {
  return (gameState.partyCodeBuilderSelectedIds || [])
    .map((id) => {
      const position = gameState.partyCodeBuilderFormation[id];

      if (!Number.isInteger(position)) {
        return null;
      }

      return { id, position };
    })
    .filter(entry => entry);
}

function ensurePartyCodeDragStyle() {
  if (document.getElementById("party-code-drag-style")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "party-code-drag-style";
  style.textContent = `
    .party-code-draggable {
      cursor: grab;
    }

    .party-code-draggable:active {
      cursor: grabbing;
    }

    .dragging-party-code-item {
      opacity: 0.55;
    }

    .drag-over-formation-cell {
      border-color: #ff9800 !important;
      background: #fff3e0 !important;
      box-shadow: 0 0 0 5px rgba(255, 152, 0, 0.28) !important;
      transform: translateY(-2px) scale(1.02);
    }

    .tap-selected-formation-item {
      outline: 3px solid #e94560 !important;
      box-shadow: 0 0 0 5px rgba(233, 69, 96, 0.3) !important;
    }

    .tap-placeable-cell {
      cursor: pointer !important;
      border-color: #0075a8 !important;
      background: #e7f7ff !important;
      animation: tapPlaceablePulse 1.1s ease-in-out infinite;
    }

    @keyframes tapPlaceablePulse {
      0%, 100% {
        box-shadow: 0 0 0 4px rgba(0, 117, 168, 0.32);
      }

      50% {
        box-shadow: 0 0 0 8px rgba(0, 117, 168, 0.12);
      }
    }
  `;
  document.head.appendChild(style);
}

function getPartyCodeBuilderOccupantId(position) {
  return Object.keys(gameState.partyCodeBuilderFormation || {}).find((id) => {
    return gameState.partyCodeBuilderFormation[id] === position;
  }) || null;
}

function clearPartyCodeDragOverStyles() {
  document.querySelectorAll(".drag-over-formation-cell").forEach((element) => {
    element.classList.remove("drag-over-formation-cell");
  });

  document.querySelectorAll(".dragging-party-code-item").forEach((element) => {
    element.classList.remove("dragging-party-code-item");
  });
}

function setPartyCodeDragData(event, id, sourcePosition = null) {
  if (!event.dataTransfer || !id) {
    return;
  }

  const payload = {
    type: "party-code-character",
    id,
    sourcePosition
  };

  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", JSON.stringify(payload));
}

function getPartyCodeDragData(event) {
  if (!event.dataTransfer) {
    return null;
  }

  try {
    const payload = JSON.parse(event.dataTransfer.getData("text/plain"));

    if (!payload || payload.type !== "party-code-character" || !payload.id) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

function addPartyCodeBuilderCharacter(id) {
  const selectedIds = gameState.partyCodeBuilderSelectedIds || [];

  if (selectedIds.includes(id)) {
    return true;
  }

  if (selectedIds.length >= gameState.partySize) {
    return false;
  }

  selectedIds.push(id);
  gameState.partyCodeBuilderSelectedIds = selectedIds;
  return true;
}

function removePartyCodeBuilderCharacter(id) {
  const selectedIds = gameState.partyCodeBuilderSelectedIds || [];
  const index = selectedIds.indexOf(id);

  if (index >= 0) {
    selectedIds.splice(index, 1);
  }

  delete gameState.partyCodeBuilderFormation[id];

  if (gameState.partyCodeBuilderActiveId === id) {
    gameState.partyCodeBuilderActiveId = null;
  }

  gameState.partyCodeBuilderSelectedIds = selectedIds;
  clearPartyCodeBuilderOutput("配置が変更されました。必要なら再生成してください。");
}

function movePartyCodeBuilderCharacterToPosition(id, position) {
  const numericPosition = Number(position);

  if (!Number.isInteger(numericPosition) || numericPosition < 0 || numericPosition > 8) {
    return false;
  }

  const formation = gameState.partyCodeBuilderFormation || {};
  const selectedIds = gameState.partyCodeBuilderSelectedIds || [];
  const isAlreadySelected = selectedIds.includes(id);
  const currentPosition = formation[id];
  const currentOccupantId = getPartyCodeBuilderOccupantId(numericPosition);

  if (!isAlreadySelected && selectedIds.length >= gameState.partySize && !currentOccupantId) {
    clearPartyCodeBuilderOutput(`パーティは${gameState.partySize}体までです。入れ替えたい場合は、配置中のキャラの上にドロップしてください。`);
    return false;
  }

  if (!isAlreadySelected && currentOccupantId) {
    removePartyCodeBuilderCharacter(currentOccupantId);
  }

  if (!addPartyCodeBuilderCharacter(id)) {
    return false;
  }

  if (currentOccupantId && currentOccupantId !== id) {
    if (Number.isInteger(currentPosition)) {
      formation[currentOccupantId] = currentPosition;
    } else {
      delete formation[currentOccupantId];
    }
  }

  formation[id] = numericPosition;
  gameState.partyCodeBuilderFormation = formation;
  gameState.partyCodeBuilderActiveId = id;
  clearPartyCodeBuilderOutput("配置が変更されました。必要なら再生成してください。");
  return true;
}

function isPartyCodeBuilderReady() {
  const selectedIds = gameState.partyCodeBuilderSelectedIds || [];
  const entries = getPartyCodeBuilderEntries();

  if (selectedIds.length !== gameState.partySize || entries.length !== gameState.partySize) {
    return false;
  }

  return validatePartyFormation(entries).ok;
}

function clearPartyCodeBuilderOutput(message) {
  gameState.partyCodeBuilderOutput = "";

  const outputElement = document.getElementById("party-code-output");
  const statusElement = document.getElementById("party-code-status");
  const copyButton = document.getElementById("party-code-copy-button");

  if (outputElement) {
    outputElement.value = "";
  }

  if (statusElement) {
    statusElement.textContent = message || "";
  }

  if (copyButton) {
    copyButton.disabled = true;
  }
}

function updatePartyCodeBuilderAutoOutput() {
  const outputElement = document.getElementById("party-code-output");
  const statusElement = document.getElementById("party-code-status");
  const copyButton = document.getElementById("party-code-copy-button");

  if (!isPartyCodeBuilderReady()) {
    gameState.partyCodeBuilderOutput = "";

    if (outputElement) {
      outputElement.value = "";
    }

    if (copyButton) {
      copyButton.disabled = true;
    }

    return;
  }

  const entries = getPartyCodeBuilderEntries();
  const code = encodePartyFormation(entries);
  gameState.partyCodeBuilderOutput = code;

  if (outputElement) {
    outputElement.value = code;
  }

  if (statusElement) {
    statusElement.textContent = "4体そろいました。コードは左下に自動生成されています。";
  }

  if (copyButton) {
    copyButton.disabled = false;
  }
}

function removePartyCodeBuilderCharacterFromField(id) {
  removePartyCodeBuilderCharacter(id);
  renderPartyCodeBuilderScreen();
}

function clearPartyCodeBuilderFormation() {
  gameState.partyCodeBuilderFormation = {};
  gameState.partyCodeBuilderActiveId = (gameState.partyCodeBuilderSelectedIds || [])[0] || null;
  clearPartyCodeBuilderOutput("盤面配置をクリアしました。");
  renderPartyCodeBuilderScreen();
}

function generatePartyCodeFromBuilder() {
  if (!isPartyCodeBuilderReady()) {
    clearPartyCodeBuilderOutput("4体を選び、全員を盤面に配置してください。");
    renderPartyCodeBuilderScreen();
    return;
  }

  updatePartyCodeBuilderAutoOutput();

  const statusElement = document.getElementById("party-code-status");

  if (statusElement) {
    statusElement.textContent = "コードを更新しました。これを対戦相手に送ってください。";
  }
}

async function copyPartyCodeToClipboard() {
  const code = gameState.partyCodeBuilderOutput || "";
  const statusElement = document.getElementById("party-code-status");

  if (!code) {
    if (statusElement) {
      statusElement.textContent = "コピーできるコードがありません。";
    }
    return;
  }

  try {
    await navigator.clipboard.writeText(code);

    if (statusElement) {
      statusElement.textContent = "コードをコピーしました。";
    }
  } catch (error) {
    const outputElement = document.getElementById("party-code-output");

    if (outputElement) {
      outputElement.focus();
      outputElement.select();
    }

    if (statusElement) {
      statusElement.textContent = "自動コピーに失敗しました。コード欄を選択してコピーしてください。";
    }
  }
}

function renderPartyCodeSelectedList() {
  const selectedListElement = document.getElementById("party-code-selected-list");

  if (!selectedListElement) {
    return;
  }

  selectedListElement.innerHTML = "";

  for (let i = 0; i < gameState.partySize; i++) {
    const id = (gameState.partyCodeBuilderSelectedIds || [])[i];
    const character = id ? getCharacterByIdFromPool(id) : null;
    const slot = document.createElement("div");
    slot.className = "selected-party-slot";

    slot.textContent = character ? character.name : "未配置";
    selectedListElement.appendChild(slot);
  }
}

function getPartyCodeBuilderRowLabel(position) {
  const row = Math.floor(position / 3);

  if (row === 0) {
    return "前列";
  }

  if (row === 1) {
    return "中列";
  }

  return "後列";
}

function renderPartyCodeFormationBoard() {
  const boardElement = document.getElementById("party-code-formation-board");

  if (!boardElement) {
    return;
  }

  boardElement.innerHTML = "";

  for (let position = 0; position < 9; position++) {
    const occupantId = getPartyCodeBuilderOccupantId(position);
    const character = occupantId ? getCharacterByIdFromPool(occupantId) : null;
    const cell = document.createElement("div");
    cell.className = "formation-cell";
    const tapSelectedId = gameState.partyCodeBuilderTapSelectedId;

    if (character) {
      cell.classList.add("filled-formation-cell");
      if (tapSelectedId === occupantId) {
        cell.classList.add("tap-selected-formation-item");
      }
      if (character.isPrototype) {
        cell.classList.add("is-prototype-card");
      }

      cell.innerHTML = `
        <div class="formation-row-label">${getPartyCodeBuilderRowLabel(position)}</div>
        <div class="formation-portrait">
          ${getCharacterImageHtml(character, "board-character-image", "IMAGE")}
        </div>
        <div class="formation-name">${character.name}</div>
      `;

      cell.draggable = true;
      cell.classList.add("party-code-draggable");

      cell.addEventListener("dragstart", (event) => {
        gameState.partyCodeBuilderDraggingFromBoard = true;
        gameState.partyCodeBuilderTapSelectedId = null;
        setPartyCodeDragData(event, occupantId, position);
        cell.classList.add("dragging-party-code-item");
      });

      cell.addEventListener("dragend", () => {
        gameState.partyCodeBuilderDraggingFromBoard = false;
        clearPartyCodeDragOverStyles();
      });

      cell.addEventListener("click", () => {
        const selectedId = gameState.partyCodeBuilderTapSelectedId;
        if (selectedId) {
          if (selectedId === occupantId) {
            gameState.partyCodeBuilderTapSelectedId = null;
          } else {
            movePartyCodeBuilderCharacterToPosition(selectedId, position);
            gameState.partyCodeBuilderTapSelectedId = null;
          }
        } else {
          gameState.partyCodeBuilderTapSelectedId = occupantId;
        }
        renderPartyCodeBuilderScreen();
      });
    } else {
      cell.classList.add("empty-formation-cell");
      if (tapSelectedId) {
        cell.classList.add("tap-placeable-cell");
      }
      cell.innerHTML = `
        <div class="formation-row-label">${getPartyCodeBuilderRowLabel(position)}</div>
        <div class="empty-label">${tapSelectedId ? "タップで配置" : "ここへドロップ"}</div>
      `;

      cell.addEventListener("click", () => {
        const selectedId = gameState.partyCodeBuilderTapSelectedId;
        if (selectedId) {
          movePartyCodeBuilderCharacterToPosition(selectedId, position);
          gameState.partyCodeBuilderTapSelectedId = null;
          renderPartyCodeBuilderScreen();
        }
      });
    }

    cell.addEventListener("dragover", (event) => {
      event.preventDefault();

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }

      cell.classList.add("drag-over-formation-cell");
    });

    cell.addEventListener("dragleave", () => {
      cell.classList.remove("drag-over-formation-cell");
    });

    cell.addEventListener("drop", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const payload = getPartyCodeDragData(event);
      clearPartyCodeDragOverStyles();

      if (!payload) {
        return;
      }

      if (movePartyCodeBuilderCharacterToPosition(payload.id, position)) {
        renderPartyCodeBuilderScreen();
      }
    });

    boardElement.appendChild(cell);
  }
}

function renderPartyCodeCharacterList() {
  const listElement = document.getElementById("party-code-character-list");

  if (!listElement) {
    return;
  }

  const selectedIds = gameState.partyCodeBuilderSelectedIds || [];
  const pool = getCharacterPool();

  listElement.innerHTML = "";

  pool.forEach((character) => {
    const isSelected = selectedIds.includes(character.id);
    const isTapSelected = gameState.partyCodeBuilderTapSelectedId === character.id;
    const card = document.createElement("div");
    card.className = "selection-character-card party-code-draggable";

    if (isSelected) {
      card.classList.add("selected-selection-card");
    }
    if (isTapSelected) {
      card.classList.add("tap-selected-formation-item");
    }
    if (character.isPrototype) {
      card.classList.add("is-prototype-card");
    }

    card.draggable = true;
    card.innerHTML = `
      <div class="selection-card-top">
        <div class="portrait-box selection-portrait-box">
          ${getCharacterImageHtml(character, "card-character-image", "IMAGE<br>EMPTY")}
        </div>
        <div class="selection-card-info">
          <div class="selection-card-name-row"><div class="selection-card-name">${character.name}</div></div>
          <div class="selection-card-job">${character.job}</div>
          <div class="selection-card-role">${character.role}</div>
          <div class="selection-card-hp">HP ${character.maxHp}</div>
        </div>
      </div>
      <div class="selection-action-list">
        <ol>${getSelectionCardActionHtml(character)}</ol>
      </div>
      <div class="selection-card-footer">${isSelected ? "配置中" : isTapSelected ? "選択中 → マスをタップ" : "タップで選択 / ドラッグ"}</div>
    `;

    card.querySelector(".selection-card-name-row").appendChild(
      createCharacterDetailButton(character, "パーティコード作成")
    );

    card.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      if (gameState.partyCodeBuilderTapSelectedId === character.id) {
        gameState.partyCodeBuilderTapSelectedId = null;
      } else {
        gameState.partyCodeBuilderTapSelectedId = character.id;
      }
      renderPartyCodeBuilderScreen();
    });

    card.addEventListener("dragstart", (event) => {
      gameState.partyCodeBuilderDraggingFromBoard = false;
      gameState.partyCodeBuilderTapSelectedId = null;
      setPartyCodeDragData(event, character.id, null);
      card.classList.add("dragging-party-code-item");
    });

    card.addEventListener("dragend", () => {
      clearPartyCodeDragOverStyles();
    });

    listElement.appendChild(card);
  });
}

function renderPartyCodeBuilderScreen() {
  const descriptionElement = document.getElementById("party-code-description");
  const outputElement = document.getElementById("party-code-output");
  const copyButton = document.getElementById("party-code-copy-button");
  const selectedIds = gameState.partyCodeBuilderSelectedIds || [];
  const placedCount = getPartyCodeBuilderEntries().length;

  if (descriptionElement) {
    descriptionElement.textContent = `キャラクターを4体、盤面へ配置してください（タップ選択 or ドラッグ＆ドロップ）。盤面外へ出すと外れます。現在 ${placedCount} / ${gameState.partySize} 体。`;
  }

  updatePartyCodeBuilderAutoOutput();


  if (outputElement) {
    outputElement.value = gameState.partyCodeBuilderOutput || "";
  }

  if (copyButton) {
    copyButton.disabled = !gameState.partyCodeBuilderOutput;
  }

  renderPartyCodeSelectedList();
  renderPartyCodeFormationBoard();
  renderPartyCodeCharacterList();
}

function installPartyCodeOutsideDropHandlers() {
  if (gameState.partyCodeBuilderOutsideDropInstalled) {
    return;
  }

  gameState.partyCodeBuilderOutsideDropInstalled = true;

  document.addEventListener("dragover", (event) => {
    const partyCodeScreen = document.getElementById("party-code-screen");

    if (
      partyCodeScreen &&
      partyCodeScreen.style.display !== "none" &&
      gameState.partyCodeBuilderDraggingFromBoard
    ) {
      event.preventDefault();
    }
  });

  document.addEventListener("drop", (event) => {
    const partyCodeScreen = document.getElementById("party-code-screen");

    if (!partyCodeScreen || partyCodeScreen.style.display === "none") {
      return;
    }

    const formationBoard = document.getElementById("party-code-formation-board");

    if (formationBoard && formationBoard.contains(event.target)) {
      return;
    }

    const payload = getPartyCodeDragData(event);

    if (!payload || !Number.isInteger(Number(payload.sourcePosition))) {
      return;
    }

    event.preventDefault();
    removePartyCodeBuilderCharacter(payload.id);
    clearPartyCodeDragOverStyles();
    renderPartyCodeBuilderScreen();
  });
}


function openPlayerFormationBuilder() {
  ensurePartyCodeDragStyle();
  installPlayerFormationOutsideDropHandlers();
  initializePlayerFormationBuilder();
  showPlayerFormationScreen();
  syncDecisiveMomentStartTurnInput();
  renderPlayerFormationScreen();
}

function initializePlayerFormationBuilder() {
  gameState.playerFormationSelectedIds = [];
  gameState.playerFormation = {};
  gameState.playerFormationDraggingFromBoard = false;
  gameState.playerFormationInitialized = true;
  gameState.playerFormationTapSelectedId = null;
}

function getPlayerFormationEntries() {
  return (gameState.playerFormationSelectedIds || [])
    .map((id) => {
      const position = gameState.playerFormation[id];

      if (!Number.isInteger(position)) {
        return null;
      }

      return { id, position };
    })
    .filter(entry => entry);
}

function getPlayerFormationOccupantId(position) {
  return Object.keys(gameState.playerFormation || {}).find((id) => {
    return gameState.playerFormation[id] === position;
  }) || null;
}

function clearPlayerFormationDragOverStyles() {
  clearPartyCodeDragOverStyles();
}

function setPlayerFormationDragData(event, id, sourcePosition = null) {
  if (!event.dataTransfer || !id) {
    return;
  }

  const payload = {
    type: "player-formation-character",
    id,
    sourcePosition
  };

  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", JSON.stringify(payload));
}

function getPlayerFormationDragData(event) {
  if (!event.dataTransfer) {
    return null;
  }

  try {
    const payload = JSON.parse(event.dataTransfer.getData("text/plain"));

    if (!payload || payload.type !== "player-formation-character" || !payload.id) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
}

function addPlayerFormationCharacter(id) {
  const selectedIds = gameState.playerFormationSelectedIds || [];

  if (selectedIds.includes(id)) {
    return true;
  }

  if (selectedIds.length >= gameState.partySize) {
    return false;
  }

  selectedIds.push(id);
  gameState.playerFormationSelectedIds = selectedIds;
  return true;
}

function removePlayerFormationCharacterFromField(id) {
  const selectedIds = gameState.playerFormationSelectedIds || [];
  const index = selectedIds.indexOf(id);

  if (index >= 0) {
    selectedIds.splice(index, 1);
  }

  delete gameState.playerFormation[id];
  gameState.playerFormationSelectedIds = selectedIds;
}

function movePlayerFormationCharacterToPosition(id, position) {
  const numericPosition = Number(position);

  if (!Number.isInteger(numericPosition) || numericPosition < 0 || numericPosition > 8) {
    return false;
  }

  const selectedIds = gameState.playerFormationSelectedIds || [];
  const isAlreadySelected = selectedIds.includes(id);
  const formation = gameState.playerFormation || {};
  const currentPosition = formation[id];
  const currentOccupantId = getPlayerFormationOccupantId(numericPosition);

  if (!isAlreadySelected && selectedIds.length >= gameState.partySize && !currentOccupantId) {
    return false;
  }

  if (!isAlreadySelected && currentOccupantId) {
    removePlayerFormationCharacterFromField(currentOccupantId);
  }

  if (!addPlayerFormationCharacter(id)) {
    return false;
  }

  if (currentOccupantId && currentOccupantId !== id) {
    if (Number.isInteger(currentPosition)) {
      formation[currentOccupantId] = currentPosition;
    } else {
      delete formation[currentOccupantId];
    }
  }

  formation[id] = numericPosition;
  gameState.playerFormation = formation;
  return true;
}

function removePlayerFormationCharacterFromBoard(id) {
  removePlayerFormationCharacterFromField(id);
}

function clearPlayerFormation() {
  gameState.playerFormation = {};
  renderPlayerFormationScreen();
}

function isPlayerFormationReady() {
  const entries = getPlayerFormationEntries();

  if (entries.length !== gameState.partySize) {
    return false;
  }

  return validatePartyFormation(entries).ok;
}

function readDecisiveMomentStartTurnInput() {
  const input = document.getElementById("decisive-moment-turn-input");
  const rawValue = input ? Number.parseInt(input.value, 10) : gameState.decisiveMomentStartTurn;

  if (!Number.isFinite(rawValue) || rawValue < 1) {
    return 20;
  }

  return Math.max(1, Math.min(99, rawValue));
}

function syncDecisiveMomentStartTurnInput() {
  const input = document.getElementById("decisive-moment-turn-input");

  if (!input) {
    return;
  }

  input.value = String(gameState.decisiveMomentStartTurn || 20);
}

function setPlayerFormationCodeStatus(message, isError = false) {
  const statusElement = document.getElementById("player-formation-code-status");

  if (!statusElement) {
    return;
  }

  statusElement.textContent = message || "";
  statusElement.classList.toggle("error-status", Boolean(isError));
}

function clearPlayerFormationCodeInput() {
  const input = document.getElementById("player-formation-code-input");

  if (input) {
    input.value = "";
  }

  setPlayerFormationCodeStatus("");
}

function applyPlayerFormationCodeInput() {
  const input = document.getElementById("player-formation-code-input");
  const codeText = input ? input.value.trim() : "";

  if (!codeText) {
    setPlayerFormationCodeStatus("パーティコードを入力してください。", true);
    return;
  }

  const decodeResult = tryDecodePartyFormation(codeText);

  if (!decodeResult.ok) {
    setPlayerFormationCodeStatus(`パーティコードを読み込めませんでした。${decodeResult.errors.join(" / ")}`, true);
    return;
  }

  const selectedIds = [];
  const formation = {};

  decodeResult.entries.forEach((entry) => {
    selectedIds.push(entry.id);
    formation[entry.id] = entry.position;
  });

  gameState.playerFormationSelectedIds = selectedIds;
  gameState.playerFormation = formation;
  gameState.playerFormationInitialized = true;

  const loadedNames = decodeResult.entries
    .map(entry => getCharacterByIdFromPool(entry.id))
    .filter(character => character)
    .map(character => character.name);

  setPlayerFormationCodeStatus(`パーティコードを反映しました：${loadedNames.join("、")}`);
  renderPlayerFormationScreen();
}

function startBattleWithPlayerFormation() {
  if (!isPlayerFormationReady()) {
    renderPlayerFormationScreen();
    return;
  }

  gameState.battleMode = gameState.pendingBattleMode || "auto";
  gameState.lastBattleCode = document.getElementById("battle-code-input").value.trim();
  gameState.lastVersusEnemyCode = document.getElementById("versus-enemy-code-input").value.trim();
  gameState.decisiveMomentStartTurn = readDecisiveMomentStartTurnInput();

  if (gameState.battleMode === "online") {
    handleOnlineFormationReady();
    return;
  }

  if (gameState.battleMode === "battlefrontier") {
    startBattleFrontierBattle();
    return;
  }

  if (gameState.battleMode === "stage") {
    gameState.stageNumber = 1;
    gameState.maxStage = getStageCount();
    gameState.stageCleared = false;
  }

  showBattleScreen();
  resetGame();
}

function renderPlayerFormationSelectedList() {
  const selectedListElement = document.getElementById("player-formation-selected-list");

  if (!selectedListElement) {
    return;
  }

  selectedListElement.innerHTML = "";

  for (let i = 0; i < gameState.partySize; i++) {
    const id = (gameState.playerFormationSelectedIds || [])[i];
    const character = id ? getCharacterByIdFromPool(id) : null;
    const isPlaced = id && Number.isInteger(gameState.playerFormation[id]);
    const slot = document.createElement("div");
    slot.className = "selected-party-slot";
    slot.textContent = character ? `${character.name}` : "未選択";
    selectedListElement.appendChild(slot);
  }
}

function renderPlayerFormationBoard() {
  const boardElement = document.getElementById("player-formation-board");

  if (!boardElement) {
    return;
  }

  boardElement.innerHTML = "";

  for (let position = 0; position < 9; position++) {
    const occupantId = getPlayerFormationOccupantId(position);
    const character = occupantId ? getCharacterByIdFromPool(occupantId) : null;
    const cell = document.createElement("div");
    cell.className = "formation-cell";

    const tapSelectedId = gameState.playerFormationTapSelectedId;

    if (character) {
      cell.classList.add("filled-formation-cell");
      if (tapSelectedId === occupantId) {
        cell.classList.add("tap-selected-formation-item");
      }
      if (character.isPrototype) {
        cell.classList.add("is-prototype-card");
      }
      cell.innerHTML = `
        <div class="formation-row-label">${getPartyCodeBuilderRowLabel(position)}</div>
        <div class="formation-portrait">
          ${getCharacterImageHtml(character, "board-character-image", "IMAGE")}
        </div>
        <div class="formation-name">${character.name}</div>
      `;

      cell.draggable = true;
      cell.classList.add("party-code-draggable");

      cell.addEventListener("dragstart", (event) => {
        gameState.playerFormationDraggingFromBoard = true;
        gameState.playerFormationTapSelectedId = null;
        setPlayerFormationDragData(event, occupantId, position);
        cell.classList.add("dragging-party-code-item");
      });

      cell.addEventListener("dragend", () => {
        gameState.playerFormationDraggingFromBoard = false;
        clearPlayerFormationDragOverStyles();
      });

      cell.addEventListener("click", () => {
        const selectedId = gameState.playerFormationTapSelectedId;
        if (selectedId) {
          if (selectedId === occupantId) {
            gameState.playerFormationTapSelectedId = null;
          } else {
            movePlayerFormationCharacterToPosition(selectedId, position);
            gameState.playerFormationTapSelectedId = null;
          }
        } else {
          gameState.playerFormationTapSelectedId = occupantId;
        }
        renderPlayerFormationScreen();
      });
    } else {
      cell.classList.add("empty-formation-cell");
      if (tapSelectedId) {
        cell.classList.add("tap-placeable-cell");
      }
      cell.innerHTML = `
        <div class="formation-row-label">${getPartyCodeBuilderRowLabel(position)}</div>
        <div class="empty-label">${tapSelectedId ? "タップで配置" : "ここへドロップ"}</div>
      `;

      cell.addEventListener("click", () => {
        const selectedId = gameState.playerFormationTapSelectedId;
        if (selectedId) {
          movePlayerFormationCharacterToPosition(selectedId, position);
          gameState.playerFormationTapSelectedId = null;
          renderPlayerFormationScreen();
        }
      });
    }

    cell.addEventListener("dragover", (event) => {
      event.preventDefault();

      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "move";
      }

      cell.classList.add("drag-over-formation-cell");
    });

    cell.addEventListener("dragleave", () => {
      cell.classList.remove("drag-over-formation-cell");
    });

    cell.addEventListener("drop", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const payload = getPlayerFormationDragData(event);
      clearPlayerFormationDragOverStyles();

      if (!payload) {
        return;
      }

      if (movePlayerFormationCharacterToPosition(payload.id, position)) {
        renderPlayerFormationScreen();
      }
    });

    boardElement.appendChild(cell);
  }
}

function renderPlayerFormationCharacterList() {
  const listElement = document.getElementById("player-formation-character-list");

  if (!listElement) {
    return;
  }

  listElement.innerHTML = "";

  const availableCharacters = gameState.battleMode === "battlefrontier"
    ? gameState.battleFrontier.availableCharacterIds.map(id => getCharacterByIdFromPool(id)).filter(character => character)
    : getSelectableCharacterPool();

  availableCharacters.forEach((character) => {
    if (!character || !character.id) {
      return;
    }

    const isPlaced = Number.isInteger(gameState.playerFormation[character.id]);
    const isTapSelected = gameState.playerFormationTapSelectedId === character.id;
    const card = document.createElement("div");
    card.className = "selection-character-card party-code-draggable";

    if (isPlaced) {
      card.classList.add("selected-selection-card");
    }
    if (isTapSelected) {
      card.classList.add("tap-selected-formation-item");
    }
    if (character.isPrototype) {
      card.classList.add("is-prototype-card");
    }

    card.draggable = true;
    card.innerHTML = `
      <div class="selection-card-top">
        <div class="portrait-box selection-portrait-box">
          ${getCharacterImageHtml(character, "card-character-image", "IMAGE<br>EMPTY")}
        </div>
        <div class="selection-card-info">
          <div class="selection-card-name-row"><div class="selection-card-name">${character.name}</div></div>
          <div class="selection-card-job">${character.job}</div>
          <div class="selection-card-role">${character.role}</div>
          <div class="selection-card-hp">HP ${character.maxHp}</div>
        </div>
      </div>
      <div class="selection-action-list">
        <ol>${getSelectionCardActionHtml(character)}</ol>
      </div>
      <div class="selection-card-footer">${isPlaced ? "配置中" : isTapSelected ? "選択中 → マスをタップ" : "タップで選択 / ドラッグ"}</div>
    `;

    card.querySelector(".selection-card-name-row").appendChild(
      createCharacterDetailButton(character, "自陣配置")
    );

    card.addEventListener("click", (event) => {
      if (event.target.closest("button")) return;
      if (gameState.playerFormationTapSelectedId === character.id) {
        gameState.playerFormationTapSelectedId = null;
      } else {
        gameState.playerFormationTapSelectedId = character.id;
      }
      renderPlayerFormationScreen();
    });

    card.addEventListener("dragstart", (event) => {
      gameState.playerFormationDraggingFromBoard = false;
      gameState.playerFormationTapSelectedId = null;
      setPlayerFormationDragData(event, character.id, null);
      card.classList.add("dragging-party-code-item");
    });

    card.addEventListener("dragend", () => {
      clearPlayerFormationDragOverStyles();
    });

    listElement.appendChild(card);
  });
}

function renderPlayerFormationScreen() {
  const descriptionElement = document.getElementById("player-formation-description");
  const startButton = document.getElementById("player-formation-start-button");
  const statusElement = document.getElementById("player-formation-status");
  const selectedCount = (gameState.playerFormationSelectedIds || []).length;
  const placedCount = getPlayerFormationEntries().length;

  const isBattleFrontier = gameState.battleMode === "battlefrontier";
  const isSwapMode = isBattleFrontier && !!gameState.battleFrontier.preSwapRosterIds;
  const swapCountValid = !isBattleFrontier || typeof isBattleFrontierSwapCountValid !== "function" || isBattleFrontierSwapCountValid();

  if (descriptionElement) {
    descriptionElement.textContent = isSwapMode
      ? `編成を交換できます（倒した敵のキャラクターとも交換可能）。交換できるのは1体まで。現在 ${placedCount} / ${gameState.partySize} 体。`
      : `キャラクターを4体、盤面へ配置してください（タップ選択 or ドラッグ）。現在 ${placedCount} / ${gameState.partySize} 体。`;
  }

  if (typeof renderBattleFrontierStreakDisplay === "function") {
    renderBattleFrontierStreakDisplay();
  }

  if (startButton) {
    startButton.disabled = !isPlayerFormationReady() || !swapCountValid;

    if (isBattleFrontier) {
      startButton.textContent = gameState.battleFrontier.preSwapRosterIds ? "この編成で次の対戦へ" : "この編成でバトル開始";
    } else {
      startButton.textContent = "この陣形で開始";
    }
  }

  if (statusElement) {
    if (isBattleFrontier && !swapCountValid) {
      statusElement.textContent = "交換できるのは1体までです。入れ替えは1体だけにしてください。";
    } else {
      statusElement.textContent = isPlayerFormationReady()
        ? "4体そろいました。この陣形で開始できます。"
        : "4体を盤面に配置すると開始できます。";
    }
  }

  renderPlayerFormationSelectedList();
  renderPlayerFormationBoard();
  renderPlayerFormationCharacterList();

  const previewElement = document.getElementById("player-formation-next-enemy-preview");

  if (isBattleFrontier && typeof renderBattleFrontierNextEnemyPreview === "function") {
    renderBattleFrontierNextEnemyPreview();
  } else if (previewElement) {
    previewElement.innerHTML = "";
  }
}

function installPlayerFormationOutsideDropHandlers() {
  if (gameState.playerFormationOutsideDropInstalled) {
    return;
  }

  gameState.playerFormationOutsideDropInstalled = true;

  document.addEventListener("dragover", (event) => {
    const playerFormationScreen = document.getElementById("player-formation-screen");

    if (
      playerFormationScreen &&
      playerFormationScreen.style.display !== "none" &&
      gameState.playerFormationDraggingFromBoard
    ) {
      event.preventDefault();
    }
  });

  document.addEventListener("drop", (event) => {
    const playerFormationScreen = document.getElementById("player-formation-screen");

    if (!playerFormationScreen || playerFormationScreen.style.display === "none") {
      return;
    }

    const formationBoard = document.getElementById("player-formation-board");

    if (formationBoard && formationBoard.contains(event.target)) {
      return;
    }

    const payload = getPlayerFormationDragData(event);

    if (!payload || !Number.isInteger(Number(payload.sourcePosition))) {
      return;
    }

    event.preventDefault();
    removePlayerFormationCharacterFromBoard(payload.id);
    clearPlayerFormationDragOverStyles();
    renderPlayerFormationScreen();
  });
}


function getStageCount() {
  return typeof STAGE_DEFINITIONS !== "undefined" && Array.isArray(STAGE_DEFINITIONS)
    ? STAGE_DEFINITIONS.length
    : 0;
}

function getStageDefinition(stageNumber) {
  if (typeof STAGE_DEFINITIONS === "undefined" || !Array.isArray(STAGE_DEFINITIONS)) {
    return null;
  }

  return STAGE_DEFINITIONS.find(stage => stage && stage.stage === stageNumber) || STAGE_DEFINITIONS[stageNumber - 1] || null;
}

function getStageName(stageNumber) {
  const stage = getStageDefinition(stageNumber);
  return stage && stage.name ? stage.name : `ステージ${stageNumber}`;
}

function getMonsterTemplateById(id) {
  if (typeof MONSTER_TEMPLATES === "undefined" || !Array.isArray(MONSTER_TEMPLATES)) {
    return null;
  }

  return MONSTER_TEMPLATES.find(monster => monster && monster.id === id) || null;
}

function getBattleModeDescriptionText() {
  if (gameState.battleMode === "stage") {
    return `ステージ攻略：全${gameState.maxStage || getStageCount()}ステージのモンスター戦です。最初に作ったパーティと陣形で連戦します。各ステージ開始時に味方は全回復します。`;
  }

  if (gameState.battleMode === "auto") {
    return "オートバトル：味方は手動、敵は自動で行動します。";
  }

  if (gameState.battleMode === "online") {
    const side = gameState.onlineMySide === "player" ? "味方側" : "敵側";
    return `オンライン対戦（あなた: ${side}）：相手とリアルタイムで対戦します。`;
  }

  if (gameState.battleMode === "battlefrontier") {
    return `バトルファクトリー：第${gameState.battleFrontier.lap}周 ${gameState.battleFrontier.winsThisLap}勝目 / 通算${gameState.battleFrontier.totalWins}勝。勝利ごとに全回復、敗北で終了です。`;
  }

  return "対人バトル：味方側も敵側も手動で操作します。";
}

function getBattleStartEnemyDescriptionText() {
  if (gameState.battleMode === "stage") {
    const stageNumber = gameState.stageNumber || 1;
    return `ステージ${stageNumber}/${gameState.maxStage || getStageCount()}「${getStageName(stageNumber)}」を開始しました。`;
  }

  if (gameState.battleMode === "auto") {
    return gameState.lastBattleCode
      ? `敵生成シード「${gameState.lastBattleCode}」から敵構成を生成しました。`
      : "敵生成シード未入力のため、完全ランダム敵構成で開始しました。";
  }

  return gameState.lastVersusEnemyCode
    ? "敵パーティコードから敵陣形を読み込みました。"
    : "敵コード未入力のため、標準敵パーティで開始しました。";
}

function createEnemyBoardForStage(stageNumber) {
  const board = Array(9).fill(null);
  const stage = getStageDefinition(stageNumber);

  if (!stage) {
    return createEnemyBoardForAutoBattle(`stage-${stageNumber}`);
  }

  const positions = Array.isArray(stage.positions) && stage.positions.length > 0
    ? stage.positions
    : getDefaultPartyPositions("enemy");

  (stage.enemyIds || []).slice(0, gameState.partySize).forEach((monsterId, index) => {
    const template = getMonsterTemplateById(monsterId);
    const position = Number.isInteger(positions[index]) ? positions[index] : getDefaultPartyPositions("enemy")[index];

    if (!template || !Number.isInteger(position) || position < 0 || position >= board.length) {
      return;
    }

    const copiedMonster = deepCopyBoard([template])[0];
    resetCharacterRuntimeStatus(copiedMonster);
    board[position] = copiedMonster;
  });

  return board;
}

function startNextStage() {
  if (gameState.battleMode !== "stage" || !gameState.stageCleared || gameState.animation.locked) {
    return;
  }

  const maxStage = gameState.maxStage || getStageCount();

  if ((gameState.stageNumber || 1) >= maxStage) {
    return;
  }

  gameState.stageNumber = (gameState.stageNumber || 1) + 1;
  gameState.stageCleared = false;
  resetGame();
}

function createEnemyBoardForVersusBattle(codeText) {
  if (!codeText) {
    return createPartyBoardFromBase(INITIAL_ENEMY_BOARD, "enemy");
  }

  const decodeResult = tryDecodePartyFormation(codeText);

  if (!decodeResult.ok) {
    alert(`敵パーティコードを読み込めませんでした。\n${decodeResult.errors.join("\n")}\n標準敵パーティで開始します。`);
    return createPartyBoardFromBase(INITIAL_ENEMY_BOARD, "enemy");
  }

  return createPartyBoardFromFormation(decodeResult.entries, "enemy");
}

function createEnemyBoardForAutoBattle(codeText) {
  if (!codeText) {
    return createRandomEnemyBoard(Math.random);
  }

  const seededRandom = createSeededRandom(codeText);
  return createRandomEnemyBoard(seededRandom);
}

function createRandomEnemyBoard(randomFunction) {
  const board = Array(9).fill(null);
  const pool = getSelectableCharacterPool();
  const shuffledCharacters = shuffleArray(pool, randomFunction).slice(0, gameState.partySize);
  const positions = getDefaultPartyPositions("enemy");

  shuffledCharacters.forEach((character, index) => {
    const copiedCharacter = deepCopyBoard([character])[0];
    resetCharacterRuntimeStatus(copiedCharacter);
    board[positions[index]] = copiedCharacter;
  });

  return board;
}

async function decideInitiative() {
  let playerRoll = 0;
  let enemyRoll = 0;
  let rollLog = "";

  gameState.phase = "initiative";
  gameState.animation.locked = true;
  renderAll();

  if (gameState.battleMode === "online") {
    startListeningBattle();
  }

  do {
    playerRoll = rollDice();
    enemyRoll = rollDice();

    if (gameState.battleMode === "online" && typeof setOnlineInitRollEvent === "function") {
      setOnlineInitRollEvent({ playerRoll, enemyRoll });
      pushBattleState();
    }

    await animateInitiativeDiceRoll({
      playerRoll,
      enemyRoll
    });

    rollLog += `
味方の先攻ダイス：${playerRoll} / 敵の先攻ダイス：${enemyRoll}`;

    if (playerRoll === enemyRoll) {
      rollLog += "\n同点のため振り直し。";
      showDiceEffect(
        `味方 ${playerRoll} - 敵 ${enemyRoll}
同点のため振り直し。`,
        true,
        null
      );
      await sleep(900);
    }
  } while (playerRoll === enemyRoll);

  gameState.currentSide = playerRoll > enemyRoll ? "player" : "enemy";
  gameState.firstSide = gameState.currentSide;
  gameState.secondSide = getEnemySide(gameState.firstSide);
  gameState.phase = "select_actor";
  gameState.animation.locked = false;

  const resultText = gameState.currentSide === "player"
    ? `味方 ${playerRoll} - 敵 ${enemyRoll}
味方が先攻です。`
    : `味方 ${playerRoll} - 敵 ${enemyRoll}
敵が先攻です。`;

  showDiceEffect(resultText, true, gameState.currentSide);

  logMessage(
    `${rollLog}
${gameState.currentSide === "player" ? "味方" : "敵"}が先攻です。`
  );

  renderAll();

  if (gameState.battleMode === "online") {
    pushBattleState();
  } else if (!isHumanControlledSide(gameState.currentSide)) {
    scheduleEnemyAutoTurn();
  }
}


