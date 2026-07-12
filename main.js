function canChangeActorBeforeRoll(side, index) {
  if (gameState.phase !== "roll") {
    return false;
  }

  if (!isHumanControlledSide(gameState.currentSide)) {
    return false;
  }

  if (side !== gameState.currentSide) {
    return false;
  }

  const board = getBoardBySide(side);
  const character = board[index];

  if (!character) {
    return false;
  }

  if (character.hp <= 0) {
    return false;
  }

  return canActorAct(side, character);
}

function resetSelectedActionDetails() {
  gameState.selectedAction = null;
  gameState.selectedTarget = null;
  gameState.selectedMoveDestination = null;
  gameState.rolledNumber = null;
}

function confirmTargetOrMoveToDestinationPhase(side, index) {
  gameState.selectedTarget = { side, index };
  gameState.selectedMoveDestination = null;

  if (isTwoStepMoveAction(gameState.selectedAction)) {
    const destinationCandidates = getSelectableMoveDestinationCandidatesForCurrentAction();

    if (destinationCandidates.length === 1) {
      gameState.selectedMoveDestination = destinationCandidates[0];
      gameState.phase = "confirm";
      renderAll();
      return;
    }

    if (destinationCandidates.length > 1) {
      gameState.phase = "select_move_destination";
      renderAll();
      return;
    }
  }

  gameState.phase = "confirm";
  renderAll();
}

function applyForcedSingleChoiceProgress() {
  if (
    gameState.gameOver ||
    !isHumanControlledSide(gameState.currentSide) ||
    !gameState.selectedAction ||
    !gameState.selectedActor
  ) {
    return false;
  }

  if (gameState.phase === "select_target") {
    const targetCandidates = getSelectableTargetCandidatesForCurrentAction();

    if (targetCandidates.length === 1) {
      confirmTargetOrMoveToDestinationPhase(targetCandidates[0].side, targetCandidates[0].index);
      return true;
    }

    return false;
  }

  if (gameState.phase === "select_move_destination") {
    const destinationCandidates = getSelectableMoveDestinationCandidatesForCurrentAction();

    if (destinationCandidates.length === 1) {
      gameState.selectedMoveDestination = destinationCandidates[0];
      gameState.phase = "confirm";
      renderAll();
      return true;
    }
  }

  return false;
}

function handleCellClick(side, index) {
  if (
    gameState.animation.locked ||
    !isHumanControlledSide(gameState.currentSide) ||
    gameState.gameOver
  ) {
    return;
  }

  /*
    確認フェーズ中のクリック

    ・同じ対象を再クリック → 実行
    ・別の選択可能対象をクリック → 対象変更
    ・任意移動では、別の空きマスクリック → 移動先変更
    ・対象不要行動の場合、選択中キャラを再クリック → 実行
  */
  if (gameState.phase === "confirm") {
    if (gameState.selectedAction && isTwoStepMoveAction(gameState.selectedAction) && gameState.selectedMoveDestination) {
      if (
        gameState.selectedMoveDestination.side === side &&
        gameState.selectedMoveDestination.index === index
      ) {
        handleExecuteButtonClick();
        return;
      }

      if (isSelectableMoveDestination(side, index)) {
        gameState.selectedMoveDestination = { side, index };
        renderAll();
        return;
      }

      if (isSelectableTarget(side, index)) {
        gameState.selectedTarget = { side, index };
        gameState.selectedMoveDestination = null;
        gameState.phase = isTwoStepMoveAction(gameState.selectedAction) ? "select_move_destination" : "confirm";
        renderAll();
        return;
      }

      return;
    }

    if (
      gameState.selectedTarget &&
      gameState.selectedTarget.side === side &&
      gameState.selectedTarget.index === index
    ) {
      handleExecuteButtonClick();
      return;
    }

    if (
      gameState.selectedTarget &&
      isSelectableTarget(side, index)
    ) {
      gameState.selectedTarget = { side, index };
      renderAll();
      return;
    }

    if (
      !gameState.selectedTarget &&
      gameState.selectedActor &&
      gameState.selectedActor.side === side &&
      gameState.selectedActor.index === index
    ) {
      handleExecuteButtonClick();
      return;
    }

    return;
  }

  /*
    任意移動の2段階目

    1. 動かす味方を選ぶ
    2. 移動先の空きマスを選ぶ
    3. 確認して実行
  */
  if (gameState.phase === "select_move_destination") {
    if (isSelectableMoveDestination(side, index)) {
      gameState.selectedMoveDestination = { side, index };
      gameState.phase = "confirm";
      renderAll();
      return;
    }

    if (isSelectableTarget(side, index)) {
      gameState.selectedTarget = { side, index };
      gameState.selectedMoveDestination = null;
      renderAll();
      return;
    }

    return;
  }

  /*
    ダイス前

    ・同じキャラを再クリック → ダイス
    ・別の行動可能キャラをクリック → 選択変更
  */
  if (gameState.phase === "roll" && gameState.selectedActor) {
    if (
      gameState.selectedActor.side === side &&
      gameState.selectedActor.index === index
    ) {
      handleRollButtonClick();
      return;
    }

    if (canChangeActorBeforeRoll(side, index)) {
      gameState.selectedActor = { side, index };
      resetSelectedActionDetails();
      gameState.phase = "roll";

      showDiceEffect("選択キャラクターを変更しました");
      renderAll();
      return;
    }

    return;
  }

  /*
    キャラ選択
  */
  if (gameState.phase === "select_actor" && isSelectableActor(side, index)) {
    gameState.selectedActor = { side, index };
    resetSelectedActionDetails();
    gameState.phase = "roll";

    renderAll();
    return;
  }

  /*
    対象選択

    通常行動：対象選択 → confirm
    任意移動：移動元選択 → select_move_destination
  */
  if (isSelectableTarget(side, index)) {
    confirmTargetOrMoveToDestinationPhase(side, index);
  }
}

function shouldAutoExecuteActionAfterRoll() {
  if (!gameState.selectedAction) {
    return false;
  }

  if (gameState.selectedAction.target === "self") {
    return true;
  }

  return !hasSelectableTargetForCurrentAction();
}

function scheduleHumanAutoExecuteAfterRoll() {
  gameState.animation.locked = true;
  renderAll();

  const actorSnapshot = gameState.selectedActor
    ? { side: gameState.selectedActor.side, index: gameState.selectedActor.index }
    : null;
  const actionSnapshot = gameState.selectedAction;
  const rolledSnapshot = gameState.rolledNumber;

  setTimeout(() => {
    if (
      gameState.gameOver ||
      !isHumanControlledSide(gameState.currentSide) ||
      gameState.phase !== "confirm" ||
      gameState.selectedAction !== actionSnapshot ||
      gameState.rolledNumber !== rolledSnapshot ||
      !gameState.selectedActor ||
      !actorSnapshot ||
      gameState.selectedActor.side !== actorSnapshot.side ||
      gameState.selectedActor.index !== actorSnapshot.index
    ) {
      gameState.animation.locked = false;
      renderAll();
      return;
    }

    executeCurrentActionWithVisualEffect();
  }, 500);
}

async function handleRollButtonClick(forcedRollNumber = null) {
  if (
    gameState.animation.locked ||
    gameState.phase !== "roll" ||
    !gameState.selectedActor ||
    !isHumanControlledSide(gameState.currentSide)
  ) {
    return;
  }

  const actor = getBoardBySide(gameState.selectedActor.side)[gameState.selectedActor.index];

  if (!actor || actor.hp <= 0) {
    return;
  }

  const normalizedForcedRoll = Number(forcedRollNumber);
  const rolledNumber = Number.isInteger(normalizedForcedRoll) && normalizedForcedRoll >= 1 && normalizedForcedRoll <= 6
    ? normalizedForcedRoll
    : rollDice();
  const selectedAction = actor.actions[rolledNumber];

  gameState.rolledNumber = null;
  gameState.selectedAction = null;
  gameState.selectedTarget = null;
  gameState.selectedMoveDestination = null;

  // アニメーション開始前に相手へ通知して同時スタートさせる
  if (gameState.battleMode === "online") {
    setOnlineDiceRollEvent({
      side: gameState.currentSide,
      actorName: actor.name,
      roll: rolledNumber,
      actionLabel: typeof getCompactActionLabel === "function" ? getCompactActionLabel(selectedAction) : ""
    });
    pushBattleState();
  }

  gameState.animation.locked = true;
  renderAll();

  await animateDiceRoll({
    side: gameState.currentSide,
    actorName: actor.name,
    finalNumber: rolledNumber,
    action: selectedAction
  });

  gameState.rolledNumber = rolledNumber;
  gameState.selectedAction = selectedAction;

  logMessage(
    `

【第${gameState.turnNumber}ターン】${getSideName(gameState.currentSide)}：${actor.name} の出目は ${gameState.rolledNumber}${forcedRollNumber !== null ? "（検証指定）" : ""}。
${gameState.selectedAction.label}`
  );

  if (gameState.selectedAction.type === "move_self_adjacent_empty") {
    gameState.selectedTarget = { side: gameState.selectedActor.side, index: gameState.selectedActor.index };
    const adjacentCandidates = getSelectableMoveDestinationCandidatesForCurrentAction();
    gameState.phase = adjacentCandidates.length > 0 ? "select_move_destination" : "confirm";
  } else if (gameState.selectedAction.target === "self") {
    gameState.phase = "confirm";
  } else {
    gameState.phase = "select_target";

    if (!hasSelectableTargetForCurrentAction()) {
      gameState.phase = "confirm";
    }
  }

  gameState.animation.locked = false;
  renderAll();

  if (gameState.battleMode === "online") {
    pushBattleState();
  }

  let progressedBySingleChoice = applyForcedSingleChoiceProgress();

  while (progressedBySingleChoice) {
    progressedBySingleChoice = applyForcedSingleChoiceProgress();
  }

  if (shouldAutoExecuteActionAfterRoll() || gameState.phase === "confirm") {
    scheduleHumanAutoExecuteAfterRoll();
  }
}

function beginActionResolution() {
  if (gameState.phase !== "confirm") {
    return false;
  }

  gameState.phase = "resolving";
  gameState.animation.locked = true;
  renderAll();
  return true;
}

function handleExecuteButtonClick() {
  if (
    gameState.animation.locked ||
    gameState.phase !== "confirm" ||
    !gameState.selectedActor ||
    !gameState.selectedAction ||
    !isHumanControlledSide(gameState.currentSide)
  ) {
    return;
  }

  if (
    isTwoStepMoveAction(gameState.selectedAction) &&
    hasSelectableMoveDestinationForCurrentAction() &&
    !gameState.selectedMoveDestination
  ) {
    return;
  }

  if (!beginActionResolution()) {
    return;
  }

  const actorBoard = getBoardBySide(gameState.selectedActor.side);
  const actedCharacter = actorBoard[gameState.selectedActor.index];

  const resultText = appendActionEndPoisonText(executeAction(), actedCharacter);
  logMessage(`\n${resultText}`);

  proceedAfterTurn(actedCharacter);
}

function handleCancelButtonClick() {
  if (
    gameState.animation.locked ||
    !isHumanControlledSide(gameState.currentSide) ||
    gameState.gameOver
  ) {
    return;
  }

  if (gameState.phase === "roll") {
    gameState.selectedActor = null;
    resetSelectedActionDetails();
    gameState.phase = "select_actor";

    showDiceEffect("キャラクター選択に戻りました");
    renderAll();
    return;
  }

  if (gameState.phase === "select_target") {
    gameState.selectedTarget = null;
    gameState.selectedMoveDestination = null;

    showDiceEffect(`🎲 ${gameState.rolledNumber}`);
    renderAll();
    return;
  }

  if (gameState.phase === "select_move_destination") {
    if (gameState.selectedAction && gameState.selectedAction.type === "move_self_adjacent_empty") {
      gameState.selectedTarget = null;
      gameState.selectedMoveDestination = null;
      gameState.selectedAction = null;
      gameState.rolledNumber = null;
      gameState.phase = "roll";
      showDiceEffect("ダイスを振り直してください");
      renderAll();
      return;
    }

    gameState.selectedTarget = null;
    gameState.selectedMoveDestination = null;
    gameState.phase = "select_target";

    showDiceEffect("移動元選択に戻りました");
    renderAll();
    return;
  }

  if (gameState.phase === "confirm") {
    if (isTwoStepMoveAction(gameState.selectedAction)) {
      gameState.selectedMoveDestination = null;
      gameState.phase = "select_move_destination";

      showDiceEffect("移動先選択に戻りました");
      renderAll();
      return;
    }

    if (gameState.selectedTarget || gameState.selectedMoveDestination) {
      gameState.selectedTarget = null;
      gameState.selectedMoveDestination = null;
      gameState.phase = "select_target";

      showDiceEffect(`🎲 ${gameState.rolledNumber}`);
      renderAll();
      return;
    }
  }
}

function handlePassButtonClick() {
  if (gameState.animation.locked) {
    return;
  }

  if (!(
    gameState.phase === "select_actor" &&
    !hasSelectableActor(gameState.currentSide) &&
    isHumanControlledSide(gameState.currentSide)
  )) {
    return;
  }

  passCurrentSideTurn();
  renderAll();

  if (gameState.battleMode === "online") {
    pushBattleState();
  } else if (!isHumanControlledSide(gameState.currentSide)) {
    scheduleEnemyAutoTurn();
  }
}

function applyLayoutSize() {
  const root = document.documentElement;

  root.style.setProperty("--card-panel-width", `${gameState.layout.cardWidth}px`);
  root.style.setProperty("--right-panel-width", `${gameState.layout.rightWidth}px`);
  root.style.setProperty("--control-panel-height", `${gameState.layout.controlHeight}px`);
}

function startDragResize(options) {
  const startX = options.event.clientX;
  const startY = options.event.clientY;
  const startValue = options.startValue();

  document.body.classList.add("resizing");

  function handleMouseMove(event) {
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    const nextValue = options.calculate(startValue, deltaX, deltaY);
    options.apply(nextValue);
    applyLayoutSize();
  }

  function handleMouseUp() {
    document.body.classList.remove("resizing");
    window.removeEventListener("mousemove", handleMouseMove);
    window.removeEventListener("mouseup", handleMouseUp);
  }

  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);
}

function bindResizeEvents() {
  document.getElementById("card-vertical-resizer").addEventListener("mousedown", (event) => {
    startDragResize({
      event,
      startValue: () => gameState.layout.cardWidth,
      calculate: (startValue, deltaX, deltaY) => {
        return Math.min(900, Math.max(420, startValue + deltaX));
      },
      apply: (value) => {
        gameState.layout.cardWidth = value;
      }
    });
  });

  document.getElementById("right-vertical-resizer").addEventListener("mousedown", (event) => {
    startDragResize({
      event,
      startValue: () => gameState.layout.rightWidth,
      calculate: (startValue, deltaX, deltaY) => {
        return Math.min(760, Math.max(280, startValue - deltaX));
      },
      apply: (value) => {
        gameState.layout.rightWidth = value;
      }
    });
  });

  document.getElementById("right-horizontal-resizer").addEventListener("mousedown", (event) => {
    startDragResize({
      event,
      startValue: () => gameState.layout.controlHeight,
      calculate: (startValue, deltaX, deltaY) => {
        return Math.min(520, Math.max(180, startValue + deltaY));
      },
      apply: (value) => {
        gameState.layout.controlHeight = value;
      }
    });
  });
}

function confirmBeforeResetBattle() {
  if (gameState.animation.locked) {
    return false;
  }

  if (gameState.gameOver) {
    return true;
  }

  return window.confirm("現在の戦闘を最初からやり直します。よろしいですか？");
}

function confirmBeforeBackToTitleFromBattle() {
  if (gameState.animation.locked) {
    return false;
  }

  if (gameState.gameOver) {
    return true;
  }

  return window.confirm("タイトルへ戻ります。現在の戦闘内容は失われます。よろしいですか？");
}

function hasPartyCodeBuilderProgress() {
  const selectedIds = gameState.partyCodeBuilderSelectedIds || [];
  const formation = gameState.partyCodeBuilderFormation || {};

  return selectedIds.length > 0 ||
    Object.keys(formation).length > 0 ||
    Boolean(gameState.partyCodeBuilderOutput);
}

function confirmBeforeBackToTitleFromPartyCodeBuilder() {
  if (!hasPartyCodeBuilderProgress()) {
    return true;
  }

  return window.confirm("タイトルへ戻ります。編集中のパーティコード作成内容は失われます。よろしいですか？");
}

function hasPlayerFormationProgress() {
  const selectedIds = gameState.playerFormationSelectedIds || [];
  const formation = gameState.playerFormation || {};

  return selectedIds.length > 0 || Object.keys(formation).length > 0;
}

function confirmBeforeBackToTitleFromPlayerFormation() {
  if (!hasPlayerFormationProgress()) {
    return true;
  }

  return window.confirm("タイトルへ戻ります。編集中の自陣配置は失われます。よろしいですか？");
}

const BATTLE_SNAPSHOT_KEY = "formationBattleEncounterSnapshot";
const ONLINE_SESSION_KEY = "formationBattleEncounterOnlineSession";

function isBattleScreenVisible() {
  const mainLayout = document.getElementById("main-layout");
  return Boolean(mainLayout && mainLayout.style.display === "grid");
}

function saveBattleSnapshot() {
  if (!isBattleScreenVisible()) {
    return;
  }

  const snapshot = {
    battleMode: gameState.battleMode,
    playerBoard: gameState.playerBoard,
    enemyBoard: gameState.enemyBoard,
    stageNumber: gameState.stageNumber,
    maxStage: gameState.maxStage,
    stageCleared: gameState.stageCleared,
    currentSide: gameState.currentSide,
    firstSide: gameState.firstSide,
    secondSide: gameState.secondSide,
    turnNumber: gameState.turnNumber,
    decisiveMomentStartTurn: gameState.decisiveMomentStartTurn,
    decisiveMomentDamage: gameState.decisiveMomentDamage,
    decisiveMomentActiveSince: gameState.decisiveMomentActiveSince,
    selectedActor: gameState.selectedActor,
    selectedAction: gameState.selectedAction,
    selectedTarget: gameState.selectedTarget,
    selectedMoveDestination: gameState.selectedMoveDestination,
    rolledNumber: gameState.rolledNumber,
    phase: gameState.phase,
    gameOver: gameState.gameOver,
    debugMode: gameState.debugMode,
    nextUnitId: gameState.nextUnitId,
    onlineMySide: gameState.onlineMySide,
    onlineGuestFormationEntries: gameState.onlineGuestFormationEntries
  };

  try {
    localStorage.setItem(BATTLE_SNAPSHOT_KEY, JSON.stringify(snapshot));

    if (gameState.battleMode === "online" && typeof onlineState !== "undefined" && onlineState.roomId) {
      localStorage.setItem(ONLINE_SESSION_KEY, JSON.stringify({
        roomId: onlineState.roomId,
        myId: onlineState.myId,
        mySide: onlineState.mySide,
        opponentName: onlineState.opponentName
      }));
    }
  } catch (e) {
    // localStorageが使えない環境では復帰機能なしで継続する
  }
}

function clearBattleSnapshot() {
  try {
    localStorage.removeItem(BATTLE_SNAPSHOT_KEY);
    localStorage.removeItem(ONLINE_SESSION_KEY);
  } catch (e) {
    // 何もしない
  }
}

function loadBattleSnapshot() {
  try {
    const raw = localStorage.getItem(BATTLE_SNAPSHOT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function loadOnlineSession() {
  try {
    const raw = localStorage.getItem(ONLINE_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function applyBattleSnapshotToGameState(snapshot) {
  gameState.battleMode = snapshot.battleMode;
  gameState.playerBoard = snapshot.playerBoard || [];
  gameState.enemyBoard = snapshot.enemyBoard || [];
  gameState.stageNumber = snapshot.stageNumber || 1;
  gameState.maxStage = snapshot.maxStage || 10;
  gameState.stageCleared = Boolean(snapshot.stageCleared);
  gameState.currentSide = snapshot.currentSide || "player";
  gameState.firstSide = snapshot.firstSide || null;
  gameState.secondSide = snapshot.secondSide || null;
  gameState.turnNumber = snapshot.turnNumber || 1;
  gameState.decisiveMomentStartTurn = snapshot.decisiveMomentStartTurn || 20;
  gameState.decisiveMomentDamage = snapshot.decisiveMomentDamage || 10;
  gameState.decisiveMomentActiveSince = (snapshot.decisiveMomentActiveSince != null) ? snapshot.decisiveMomentActiveSince : null;
  gameState.selectedActor = snapshot.selectedActor || null;
  gameState.selectedAction = snapshot.selectedAction || null;
  gameState.selectedTarget = snapshot.selectedTarget || null;
  gameState.selectedMoveDestination = snapshot.selectedMoveDestination || null;
  gameState.rolledNumber = (snapshot.rolledNumber != null) ? snapshot.rolledNumber : null;
  gameState.phase = snapshot.phase || "select_actor";
  gameState.gameOver = Boolean(snapshot.gameOver);
  gameState.debugMode = Boolean(snapshot.debugMode);
  gameState.nextUnitId = snapshot.nextUnitId || 1;
  gameState.onlineMySide = snapshot.onlineMySide || null;
  gameState.onlineGuestFormationEntries = snapshot.onlineGuestFormationEntries || null;
  gameState.animation.locked = false;
  gameState.animation.movingUnits = [];
  gameState.enemyAutoRunning = false;
}

function tryResumeBattleFromSnapshot() {
  const snapshot = loadBattleSnapshot();

  if (!snapshot || !snapshot.battleMode || !snapshot.playerBoard || !snapshot.playerBoard.length) {
    return false;
  }

  applyBattleSnapshotToGameState(snapshot);
  showBattleScreen();

  if (gameState.battleMode === "online") {
    resumeOnlineBattleFromSession();
  } else if (!gameState.gameOver && gameState.phase === "initiative") {
    decideInitiative();
  } else {
    renderAll();

    if (!gameState.gameOver && !isHumanControlledSide(gameState.currentSide)) {
      scheduleEnemyAutoTurn();
    }
  }

  return true;
}

function syncDebugModeFromTitle() {
  const debugCheckbox = document.getElementById("debug-mode-checkbox");

  if (!debugCheckbox) {
    gameState.debugMode = false;
    return;
  }

  gameState.debugMode = debugCheckbox.checked;
}

function bindEvents() {
  document.getElementById("start-auto-button").addEventListener("click", () => {
    syncDebugModeFromTitle();
    openPlayerFormationForBattle("auto");
  });

  document.getElementById("start-versus-button").addEventListener("click", () => {
    syncDebugModeFromTitle();
    openPlayerFormationForBattle("versus");
  });

  document.getElementById("start-online-button").addEventListener("click", () => {
    showOnlineLobbyScreen();
  });

  // オンラインロビー: ルーム作成
  document.getElementById("online-create-button").addEventListener("click", async () => {
    const name = document.getElementById("online-player-name-input").value.trim();
    if (!name) { showOnlineLobbyError("プレイヤー名を入力してください"); return; }
    showOnlineLobbyError("");
    document.getElementById("online-create-button").disabled = true;
    try {
      const roomId = await createOnlineRoom(name);
      showOnlineWaitingScreen();
      document.getElementById("online-room-code-text").textContent = roomId;
      document.getElementById("online-waiting-status").textContent = "対戦相手を待っています...";
      document.getElementById("online-waiting-setup-button").disabled = true;
      watchForGuestToJoin((guestName) => {
        document.getElementById("online-waiting-status").textContent = `${guestName} が参加しました！`;
        document.getElementById("online-waiting-setup-button").disabled = false;
        syncDebugModeFromTitle();
        openPlayerFormationForBattle("online");
      });
    } catch (e) {
      showOnlineLobbyError("エラー: " + e.message);
      document.getElementById("online-create-button").disabled = false;
    }
  });

  // オンラインロビー: ルーム参加
  document.getElementById("online-join-button").addEventListener("click", async () => {
    const name = document.getElementById("online-player-name-input").value.trim();
    const code = document.getElementById("online-join-code-input").value.trim();
    if (!name) { showOnlineLobbyError("プレイヤー名を入力してください"); return; }
    if (!code) { showOnlineLobbyError("ルームコードを入力してください"); return; }
    showOnlineLobbyError("");
    document.getElementById("online-join-button").disabled = false;
    try {
      document.getElementById("online-join-button").disabled = true;
      await joinOnlineRoom(code, name);
      syncDebugModeFromTitle();
      openPlayerFormationForBattle("online");
    } catch (e) {
      showOnlineLobbyError("エラー: " + e.message);
      document.getElementById("online-join-button").disabled = false;
    }
  });

  // 待機室: パーティ設定へ進む
  document.getElementById("online-waiting-setup-button").addEventListener("click", () => {
    syncDebugModeFromTitle();
    openPlayerFormationForBattle("online");
  });

  // 待機室: タイトルへ
  document.getElementById("online-waiting-back-button").addEventListener("click", () => {
    cleanupOnlineState();
    showTitleScreen();
  });

  // ロビー: タイトルへ
  document.getElementById("online-lobby-back-button").addEventListener("click", () => {
    showTitleScreen();
  });

  // ルームコードコピー
  document.getElementById("online-copy-room-code").addEventListener("click", () => {
    const code = document.getElementById("online-room-code-text").textContent;
    navigator.clipboard.writeText(code).then(() => {
      document.getElementById("online-copy-room-code").textContent = "コピー済";
      setTimeout(() => { document.getElementById("online-copy-room-code").textContent = "コピー"; }, 1500);
    });
  });

  document.getElementById("start-stage-button").addEventListener("click", () => {
    syncDebugModeFromTitle();
    gameState.stageNumber = 1;
    gameState.maxStage = typeof getStageCount === "function" ? getStageCount() : 10;
    gameState.stageCleared = false;
    openPlayerFormationForBattle("stage");
  });

  document.getElementById("open-party-code-button").addEventListener("click", () => {
    openPartyCodeBuilder();
  });

  const debugCheckbox = document.getElementById("debug-mode-checkbox");

  if (debugCheckbox) {
    debugCheckbox.addEventListener("change", () => {
      syncDebugModeFromTitle();
    });
  }

  document.querySelectorAll(".debug-dice-button").forEach((button) => {
    button.addEventListener("click", () => {
      const rollNumber = Number(button.dataset.debugRoll);
      handleRollButtonClick(rollNumber);
    });
  });

  document.getElementById("party-code-back-button").addEventListener("click", () => {
    if (!confirmBeforeBackToTitleFromPartyCodeBuilder()) {
      return;
    }

    showTitleScreen();
  });


  document.getElementById("party-code-copy-button").addEventListener("click", () => {
    copyPartyCodeToClipboard();
  });

  document.getElementById("party-code-clear-button").addEventListener("click", () => {
    clearPartyCodeBuilderFormation();
  });


  document.getElementById("player-formation-start-button").addEventListener("click", () => {
    startBattleWithPlayerFormation();
  });

  document.getElementById("player-formation-back-button").addEventListener("click", () => {
    if (!confirmBeforeBackToTitleFromPlayerFormation()) {
      return;
    }

    if (gameState.pendingBattleMode === "online") {
      cleanupOnlineState();
    }
    showTitleScreen();
  });

  const playerFormationCodeApplyButton = document.getElementById("player-formation-code-apply-button");

  if (playerFormationCodeApplyButton) {
    playerFormationCodeApplyButton.addEventListener("click", () => {
      applyPlayerFormationCodeInput();
    });
  }

  const playerFormationCodeClearButton = document.getElementById("player-formation-code-clear-button");

  if (playerFormationCodeClearButton) {
    playerFormationCodeClearButton.addEventListener("click", () => {
      clearPlayerFormationCodeInput();
    });
  }

  const playerFormationCodeInput = document.getElementById("player-formation-code-input");

  if (playerFormationCodeInput) {
    playerFormationCodeInput.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        applyPlayerFormationCodeInput();
      }
    });
  }

  document.getElementById("roll-button").addEventListener("click", () => {
    handleRollButtonClick();
  });

  document.getElementById("execute-button").addEventListener("click", () => {
    handleExecuteButtonClick();
  });

  document.getElementById("cancel-button").addEventListener("click", () => {
    handleCancelButtonClick();
  });

  document.getElementById("pass-button").addEventListener("click", () => {
    handlePassButtonClick();
  });

  document.getElementById("next-stage-button").addEventListener("click", () => {
    startNextStage();
  });

  document.getElementById("reset-button").addEventListener("click", () => {
    if (!confirmBeforeResetBattle()) {
      return;
    }

    resetGame();
  });

  document.getElementById("online-rematch-button").addEventListener("click", () => {
    if (gameState.animation.locked) return;
    if (!window.confirm("もう一度対戦しますか？双方がキャラ選びの画面に戻ります。")) return;
    requestOnlineRematch();
  });

  document.getElementById("back-title-button").addEventListener("click", () => {
    if (!confirmBeforeBackToTitleFromBattle()) {
      return;
    }

    if (gameState.battleMode === "online") {
      cleanupOnlineState();
    }
    clearBattleSnapshot();
    showTitleScreen();
  });

  bindResizeEvents();
  applyLayoutSize();
}

function showOnlineLobbyError(msg) {
  const el = document.getElementById("online-lobby-error");
  if (!el) return;
  el.textContent = msg;
  el.style.display = msg ? "block" : "none";
}

bindEvents();

if (!tryResumeBattleFromSnapshot()) {
  showTitleScreen();
}
