// ============================================================
// battleFrontier.js - バトルフロンティアモード
// 6体の候補（またはロースター＋倒した相手）から4体を自陣配置画面で
// 直接選んで盤面に配置し、7連戦(1周)勝ち抜く。勝利後は倒した相手の
// キャラを自陣配置画面にドラッグして1体まで入れ替えられる。
// 周を重ねるごとに高ランクのキャラが出やすくなる。
// 負けたら終了、連勝数・周回数を記録する。
// ============================================================

const BATTLE_FRONTIER_BEST_RECORD_KEY = "formationBattleEncounterFrontierBestRecord";
const BATTLE_FRONTIER_INTERRUPT_KEY = "formationBattleEncounterFrontierInterrupt";
const BATTLE_FRONTIER_WINS_PER_LAP = 7;

// A〜Fの6段階。Fが最も出現しやすく（既存キャラの主な帯）、
// A〜Cは今後追加予定のバトルフロンティア専用キャラ向けの上位帯。
// 周を重ねるごとに下位ランクの重みが下がり、上位ランクの重みが上がる。
const BATTLE_FRONTIER_RANK_BASE_WEIGHT = { F: 60, E: 40, D: 20, C: 10, B: 5, A: 2 };
const BATTLE_FRONTIER_RANK_LAP_GROWTH = { F: -4, E: -2, D: 1, C: 2, B: 3, A: 4 };

function getBattleFrontierRankWeight(rank, lap) {
  const base = BATTLE_FRONTIER_RANK_BASE_WEIGHT[rank] || 1;
  const growth = BATTLE_FRONTIER_RANK_LAP_GROWTH[rank] || 0;
  const extraLaps = Math.max(0, (lap || 1) - 1);

  return Math.max(1, base + growth * extraLaps);
}

function drawWeightedCharacterIds(count, lap, excludeIds, allowedRanks) {
  const excludeSet = new Set(excludeIds || []);
  const allowedRankSet = allowedRanks ? new Set(allowedRanks) : null;
  const pool = CHARACTER_TEMPLATES.filter((character) => {
    if (!character.rank || excludeSet.has(character.id)) {
      return false;
    }

    return !allowedRankSet || allowedRankSet.has(character.rank);
  });
  const picked = [];

  for (let i = 0; i < count && pool.length > 0; i++) {
    const weights = pool.map((character) => getBattleFrontierRankWeight(character.rank, lap));
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let roll = Math.random() * totalWeight;
    let selectedIndex = pool.length - 1;

    for (let j = 0; j < weights.length; j++) {
      roll -= weights[j];

      if (roll <= 0) {
        selectedIndex = j;
        break;
      }
    }

    picked.push(pool[selectedIndex].id);
    pool.splice(selectedIndex, 1);
  }

  return picked;
}

// ============================================================
// 記録の保存
// ============================================================

function loadBattleFrontierBestRecord() {
  try {
    const raw = localStorage.getItem(BATTLE_FRONTIER_BEST_RECORD_KEY);
    return raw ? JSON.parse(raw) : { totalWins: 0, lap: 1 };
  } catch (e) {
    return { totalWins: 0, lap: 1 };
  }
}

function saveBattleFrontierBestRecord() {
  try {
    localStorage.setItem(BATTLE_FRONTIER_BEST_RECORD_KEY, JSON.stringify(gameState.battleFrontier.bestRecord));
  } catch (e) {
    // 何もしない
  }
}

// ============================================================
// 中断・再開（localStorageに保存し、ブラウザを閉じても復帰可能）
// ============================================================

function hasBattleFrontierInterrupt() {
  try {
    return !!localStorage.getItem(BATTLE_FRONTIER_INTERRUPT_KEY);
  } catch (e) {
    return false;
  }
}

function clearBattleFrontierInterrupt() {
  try {
    localStorage.removeItem(BATTLE_FRONTIER_INTERRUPT_KEY);
  } catch (e) {
    // 何もしない
  }
}

function loadBattleFrontierInterrupt() {
  try {
    const raw = localStorage.getItem(BATTLE_FRONTIER_INTERRUPT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function getBattleFrontierCurrentScreen() {
  if (typeof isBattleScreenVisible === "function" && isBattleScreenVisible()) {
    return "battle";
  }

  const formationScreen = document.getElementById("player-formation-screen");

  if (formationScreen && formationScreen.style.display !== "none" && gameState.battleMode === "battlefrontier") {
    return "formation";
  }

  return null;
}

function saveBattleFrontierInterrupt() {
  const screen = getBattleFrontierCurrentScreen();

  if (!screen) {
    return;
  }

  const data = {
    screen,
    battleFrontier: JSON.parse(JSON.stringify(gameState.battleFrontier)),
    battleSnapshot: null,
    playerFormationSelectedIds: null,
    playerFormation: null
  };

  if (screen === "battle" && typeof buildBattleSnapshotData === "function") {
    data.battleSnapshot = buildBattleSnapshotData();
  }

  if (screen === "formation") {
    data.playerFormationSelectedIds = gameState.playerFormationSelectedIds || [];
    data.playerFormation = gameState.playerFormation || {};
  }

  try {
    localStorage.setItem(BATTLE_FRONTIER_INTERRUPT_KEY, JSON.stringify(data));
  } catch (e) {
    // 何もしない
  }
}

function interruptBattleFrontier() {
  saveBattleFrontierInterrupt();
  showTitleScreen();
}

function resumeBattleFrontierFromInterrupt() {
  const data = loadBattleFrontierInterrupt();
  clearBattleFrontierInterrupt();

  if (!data || !data.battleFrontier) {
    return;
  }

  gameState.battleFrontier = data.battleFrontier;
  gameState.battleMode = "battlefrontier";

  if (data.screen === "battle" && data.battleSnapshot) {
    applyBattleSnapshotToGameState(data.battleSnapshot);
    showBattleScreen();

    if (!gameState.gameOver && gameState.phase === "initiative") {
      decideInitiative();
    } else {
      renderAll();

      if (!gameState.gameOver && !isHumanControlledSide(gameState.currentSide)) {
        scheduleEnemyAutoTurn();
      }
    }

    return;
  }

  if (data.screen === "formation") {
    ensurePartyCodeDragStyle();
    installPlayerFormationOutsideDropHandlers();

    gameState.pendingBattleMode = "battlefrontier";
    gameState.playerFormationSelectedIds = data.playerFormationSelectedIds || [];
    gameState.playerFormation = data.playerFormation || {};
    gameState.playerFormationDraggingFromBoard = false;
    gameState.playerFormationInitialized = true;
    gameState.playerFormationTapSelectedId = null;

    hideBattleFrontierScreens();
    showPlayerFormationScreen();
    syncDecisiveMomentStartTurnInput();

    const codeLoadArea = document.getElementById("player-formation-code-load-area");

    if (codeLoadArea) {
      codeLoadArea.style.display = "none";
    }

    renderPlayerFormationScreen();
    return;
  }

  showTitleScreen();
}

// ============================================================
// 画面表示ヘルパー
// ============================================================

function hideBattleFrontierScreens() {
  setScreenDisplay("battlefrontier-result-screen", "none");
}

function renderBattleFrontierStreakDisplay() {
  const isActive = gameState.battleMode === "battlefrontier" && !!gameState.battleFrontier;
  const text = isActive ? `現在${gameState.battleFrontier.totalWins || 0}連勝中` : "";

  ["battlefrontier-streak-display", "player-formation-battlefrontier-streak"].forEach((elementId) => {
    const element = document.getElementById(elementId);

    if (!element) {
      return;
    }

    if (isActive) {
      element.textContent = text;
      element.style.display = "";
    } else {
      element.style.display = "none";
    }
  });
}

function createBattleFrontierSelectableCard(character, isSelected, onClick) {
  const card = document.createElement("div");
  card.className = "selection-character-card";

  if (isSelected) {
    card.classList.add("selected-selection-card");
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
  `;

  card.addEventListener("click", onClick);
  return card;
}

// ============================================================
// 開始・自陣配置（ドラフトと交換を自陣配置画面に統合）
// ============================================================

function startBattleFrontier() {
  clearBattleFrontierInterrupt();

  gameState.battleFrontier.lap = 1;
  gameState.battleFrontier.winsThisLap = 0;
  gameState.battleFrontier.totalWins = 0;
  gameState.battleFrontier.rosterIds = [];
  gameState.battleFrontier.rosterPositions = {};
  gameState.battleFrontier.currentEnemyIds = [];
  gameState.battleFrontier.nextEnemyIds = [];
  gameState.battleFrontier.nextEnemyPreviewId = null;
  gameState.battleFrontier.preSwapRosterIds = null;
  gameState.battleFrontier.availableCharacterIds = [];
  gameState.battleFrontier.bestRecord = loadBattleFrontierBestRecord();
  gameState.battleMode = "battlefrontier";

  gameState.battleFrontier.draftCandidateIds = drawWeightedCharacterIds(6, gameState.battleFrontier.lap, [], ["D", "E", "F"]);

  openBattleFrontierFormationBuilder(false);
}

function isBattleFrontierSwapCountValid() {
  if (!gameState.battleFrontier || !gameState.battleFrontier.preSwapRosterIds) {
    return true;
  }

  const preSet = new Set(gameState.battleFrontier.preSwapRosterIds);
  const entries = getPlayerFormationEntries();
  const swapCount = entries.filter((entry) => !preSet.has(entry.id)).length;

  return swapCount <= 1;
}

function openBattleFrontierFormationBuilder(isSwapMode) {
  ensurePartyCodeDragStyle();
  installPlayerFormationOutsideDropHandlers();

  gameState.battleMode = "battlefrontier";
  gameState.pendingBattleMode = "battlefrontier";

  if (isSwapMode) {
    gameState.battleFrontier.preSwapRosterIds = gameState.battleFrontier.rosterIds.slice();
    gameState.battleFrontier.availableCharacterIds = gameState.battleFrontier.rosterIds.concat(
      gameState.battleFrontier.currentEnemyIds || []
    );

    gameState.playerFormationSelectedIds = gameState.battleFrontier.rosterIds.slice();
    gameState.playerFormation = {};

    gameState.battleFrontier.rosterIds.forEach((id) => {
      const savedPosition = gameState.battleFrontier.rosterPositions[id];

      if (Number.isInteger(savedPosition)) {
        gameState.playerFormation[id] = savedPosition;
      }
    });
  } else {
    gameState.battleFrontier.preSwapRosterIds = null;
    gameState.battleFrontier.availableCharacterIds = gameState.battleFrontier.draftCandidateIds.slice();

    gameState.playerFormationSelectedIds = [];
    gameState.playerFormation = {};
  }

  gameState.playerFormationDraggingFromBoard = false;
  gameState.playerFormationInitialized = true;
  gameState.playerFormationTapSelectedId = null;

  hideBattleFrontierScreens();
  showPlayerFormationScreen();
  syncDecisiveMomentStartTurnInput();

  const codeLoadArea = document.getElementById("player-formation-code-load-area");

  if (codeLoadArea) {
    codeLoadArea.style.display = "none";
  }

  renderPlayerFormationScreen();
}

function startBattleFrontierBattle() {
  if (!isBattleFrontierSwapCountValid()) {
    return;
  }

  const entries = getPlayerFormationEntries();

  gameState.battleFrontier.rosterIds = entries.map((entry) => entry.id);
  gameState.battleFrontier.rosterPositions = {};
  entries.forEach((entry) => {
    gameState.battleFrontier.rosterPositions[entry.id] = entry.position;
  });

  gameState.decisiveMomentStartTurn = readDecisiveMomentStartTurnInput();

  if (gameState.battleFrontier.nextEnemyIds && gameState.battleFrontier.nextEnemyIds.length === gameState.partySize) {
    gameState.battleFrontier.currentEnemyIds = gameState.battleFrontier.nextEnemyIds;
  } else {
    gameState.battleFrontier.currentEnemyIds = drawWeightedCharacterIds(
      gameState.partySize,
      gameState.battleFrontier.lap,
      gameState.battleFrontier.rosterIds
    );
  }

  gameState.battleFrontier.nextEnemyIds = [];
  gameState.battleFrontier.nextEnemyPreviewId = null;
  gameState.battleFrontier.preSwapRosterIds = null;

  showBattleScreen();
  resetGame();
}

function pickRandomAndRemove(array) {
  const index = Math.floor(Math.random() * array.length);
  return array.splice(index, 1)[0];
}

function isBattleFrontierMeleeCharacter(id) {
  const template = getCharacterTemplateById(id);

  if (!template || !template.actions) {
    return false;
  }

  return Object.values(template.actions).some((action) => isMeleeAction(action));
}

function createBattleFrontierEnemyBoard(enemyIds) {
  const ids = (enemyIds || []).slice();

  // 敵側は前列=[6,7,8]、後ろ6マス=中列[3,4,5]＋後列[0,1,2]
  const availableFront = [6, 7, 8];
  const availableBackRow = [0, 1, 2];
  const availableBackSix = [0, 1, 2, 3, 4, 5];

  const entries = [];

  // テルルは特別扱いで必ず後列（[0,1,2]）に配置する
  const teruruIndex = ids.indexOf("teruru");

  if (teruruIndex >= 0) {
    ids.splice(teruruIndex, 1);

    const position = pickRandomAndRemove(availableBackRow);
    const sixIndex = availableBackSix.indexOf(position);

    if (sixIndex >= 0) {
      availableBackSix.splice(sixIndex, 1);
    }

    // createPartyBoardFromFormationが敵側の座標を180度回転（行のみ反転）させるため、
    // 先に同じ回転を適用しておくことで最終的に意図した位置に配置されるようにする
    entries.push({ id: "teruru", position: rotatePartyFormationPositionForEnemy(position) });
  }

  ids.forEach((id) => {
    let position = null;

    if (isBattleFrontierMeleeCharacter(id) && availableFront.length > 0) {
      // 近距離攻撃を持つキャラは可能な限り前列へ
      position = pickRandomAndRemove(availableFront);
    } else if (availableBackSix.length > 0) {
      // 遠距離攻撃を持つキャラ（および前列が埋まった近距離キャラ）は後ろ6マスからランダム
      position = pickRandomAndRemove(availableBackSix);
    } else if (availableFront.length > 0) {
      position = pickRandomAndRemove(availableFront);
    }

    if (position !== null) {
      entries.push({ id, position: rotatePartyFormationPositionForEnemy(position) });
    }
  });

  return createPartyBoardFromFormation(entries, "enemy");
}

// ============================================================
// 次の対戦相手プレビュー（自陣配置画面に表示）
// ============================================================

function renderBattleFrontierNextEnemyPreview() {
  const previewElement = document.getElementById("player-formation-next-enemy-preview");

  if (!previewElement) {
    return;
  }

  const previewId = gameState.battleFrontier.nextEnemyPreviewId;
  const character = previewId ? getCharacterTemplateById(previewId) : null;

  if (!character) {
    previewElement.innerHTML = "";
    return;
  }

  previewElement.innerHTML = `
    <div class="selected-party-title">次の対戦相手に、このキャラがいます（残り3体はお楽しみ）</div>
  `;

  const card = createBattleFrontierSelectableCard(character, false, () => {});
  card.style.cursor = "default";
  card.style.maxWidth = "260px";
  previewElement.appendChild(card);
}

// ============================================================
// 勝敗フック（battleLogic.js から呼ばれる）
// ============================================================

function handleBattleFrontierGameEnd() {
  if (gameState.battleMode !== "battlefrontier") {
    return;
  }

  if (gameState.phase === "battlefrontier_victory") {
    setTimeout(() => {
      advanceBattleFrontierAfterVictory();
    }, 1200);
  } else if (gameState.gameOver) {
    setTimeout(() => {
      showBattleFrontierResultScreen();
    }, 1200);
  }
}

function advanceBattleFrontierAfterVictory() {
  gameState.battleFrontier.winsThisLap++;
  gameState.battleFrontier.totalWins++;

  if (gameState.battleFrontier.totalWins > gameState.battleFrontier.bestRecord.totalWins) {
    gameState.battleFrontier.bestRecord = {
      totalWins: gameState.battleFrontier.totalWins,
      lap: gameState.battleFrontier.lap
    };
    saveBattleFrontierBestRecord();
  }

  if (gameState.battleFrontier.winsThisLap >= BATTLE_FRONTIER_WINS_PER_LAP) {
    gameState.battleFrontier.lap++;
    gameState.battleFrontier.winsThisLap = 0;
    gameState.battleFrontier.rosterIds = [];
    gameState.battleFrontier.rosterPositions = {};
    gameState.battleFrontier.nextEnemyIds = [];
    gameState.battleFrontier.nextEnemyPreviewId = null;
    gameState.battleFrontier.draftCandidateIds = drawWeightedCharacterIds(6, gameState.battleFrontier.lap, []);

    openBattleFrontierFormationBuilder(false);
    return;
  }

  gameState.battleFrontier.nextEnemyIds = drawWeightedCharacterIds(
    gameState.partySize,
    gameState.battleFrontier.lap,
    gameState.battleFrontier.rosterIds
  );
  gameState.battleFrontier.nextEnemyPreviewId =
    gameState.battleFrontier.nextEnemyIds[Math.floor(Math.random() * gameState.battleFrontier.nextEnemyIds.length)] || null;

  openBattleFrontierFormationBuilder(true);
}

// ============================================================
// 結果画面
// ============================================================

function showBattleFrontierResultScreen() {
  clearBattleFrontierInterrupt();

  hideOnlineScreens();
  hideBattleFrontierScreens();
  setScreenDisplay("title-screen", "none");
  setScreenDisplay("party-code-screen", "none");
  setScreenDisplay("player-formation-screen", "none");
  setScreenDisplay("main-layout", "none");
  setScreenDisplay("battlefrontier-result-screen", "flex");

  renderBattleFrontierResultScreen();
}

function renderBattleFrontierResultScreen() {
  const summaryElement = document.getElementById("battlefrontier-result-summary");
  const bestElement = document.getElementById("battlefrontier-result-best");

  if (summaryElement) {
    summaryElement.textContent =
      `今回の記録：第${gameState.battleFrontier.lap}周・通算${gameState.battleFrontier.totalWins}連勝でストップしました。`;
  }

  if (bestElement) {
    const best = gameState.battleFrontier.bestRecord;
    bestElement.textContent = `自己ベスト：第${best.lap}周・通算${best.totalWins}連勝`;
  }
}

function retryBattleFrontier() {
  startBattleFrontier();
}
