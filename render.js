const hpNumberAnimationCache = {};

function getUnitHpKey(side, index, character = null) {
  if (character && character.unitId) {
    return character.unitId;
  }

  return `${side}-${index}`;
}

function getPreviousHpValue(side, index, character) {
  const key = getUnitHpKey(side, index, character);

  if (hpNumberAnimationCache[key] === undefined) {
    hpNumberAnimationCache[key] = character.hp;
  }

  return hpNumberAnimationCache[key];
}

function updateHpNumberCache(side, index, character) {
  const key = getUnitHpKey(side, index, character);
  hpNumberAnimationCache[key] = character.hp;
}

function animateHpNumber(element, fromValue, toValue, maxHp) {
  if (!element) {
    return;
  }

  if (fromValue === toValue) {
    element.textContent = `HP ${toValue} / ${maxHp}`;
    return;
  }

  const duration = 520;
  const startTime = performance.now();

  const animationClass = toValue > fromValue
    ? "hp-number-healed"
    : "hp-number-damaged";

  element.classList.remove("hp-number-damaged", "hp-number-healed");
  void element.offsetWidth;
  element.classList.add(animationClass);

  function step(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(1, elapsed / duration);
    const easedProgress = 1 - Math.pow(1 - progress, 3);

    const currentValue = Math.round(
      fromValue + (toValue - fromValue) * easedProgress
    );

    element.textContent = `HP ${currentValue} / ${maxHp}`;

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      element.textContent = `HP ${toValue} / ${maxHp}`;
    }
  }

  requestAnimationFrame(step);
}

function renderAll() {
  renderAllBoards();
  renderCardList();
  renderBattleTurnInfo();
  renderDecisiveMomentBanner();
  renderStatus();
  renderButtons();
  saveBattleSnapshot();
}

function getDecisiveMomentDisplayStatus() {
  const startTurn = gameState.decisiveMomentStartTurn || 20;
  const baseDamage = gameState.decisiveMomentDamage || 10;
  const damage = typeof getCurrentDecisiveMomentDamage === "function"
    ? getCurrentDecisiveMomentDamage()
    : baseDamage;
  const oneOnOne = getAliveCharacterCount("player") === 1 && getAliveCharacterCount("enemy") === 1;
  const triggerReasons = [];

  if (gameState.turnNumber >= startTurn) {
    triggerReasons.push(`第${startTurn}ターン以降`);
  }

  if (oneOnOne) {
    triggerReasons.push("両軍残り1人");
  }

  return {
    startTurn,
    baseDamage,
    damage,
    oneOnOne,
    triggerReasons,
    isActive: triggerReasons.length > 0
  };
}

function renderDecisiveMomentBanner() {
  const element = document.getElementById("decisive-moment-banner");

  if (!element) {
    return;
  }

  if (gameState.gameOver) {
    element.classList.remove("visible");
    element.textContent = "";
    return;
  }

  const status = getDecisiveMomentDisplayStatus();

  if (!status.isActive) {
    element.classList.remove("visible");
    element.textContent = "";
    return;
  }

  element.classList.add("visible");
  element.innerHTML = `
    <div class="decisive-moment-banner-title">決着の刻 発動中</div>
    <div class="decisive-moment-banner-detail">${status.triggerReasons.join("・")} / 後攻行動後、全員${status.damage}ダメージ（5ターンごとに10増加）</div>
  `;
}

function renderBattleTurnInfo() {
  const element = document.getElementById("battle-turn-info");

  if (!element) {
    return;
  }

  if (gameState.gameOver) {
    element.textContent = "現在ターン：戦闘終了";
    return;
  }

  if (gameState.phase === "stage_clear") {
    element.textContent = [
      `ステージ：${gameState.stageNumber}/${gameState.maxStage || getStageCount()} ${getStageName(gameState.stageNumber || 1)}`,
      "ステージクリア：次のステージへ進めます。"
    ].join("\n");
    return;
  }

  const decisiveStatus = getDecisiveMomentDisplayStatus();
  const currentSideText = gameState.phase === "initiative"
    ? "先攻判定中"
    : `${getSideName(gameState.currentSide)}ターン`;
  const firstSideText = gameState.firstSide ? getSideName(gameState.firstSide) : "未決定";
  const secondSideText = gameState.secondSide ? getSideName(gameState.secondSide) : "未決定";

  const decisiveText = decisiveStatus.isActive
    ? `決着の刻：発動中（${decisiveStatus.triggerReasons.join("・")}／後攻行動後、全員${decisiveStatus.damage}ダメージ・5ターンごとに10増加）`
    : `決着の刻：第${decisiveStatus.startTurn}ターン終了時から、または両軍残り1人で発動（5ターンごとに10ずつ増加）`;

  const lines = [];

  if (gameState.battleMode === "stage") {
    lines.push(`ステージ：${gameState.stageNumber}/${gameState.maxStage || getStageCount()} ${getStageName(gameState.stageNumber || 1)}`);
  }

  lines.push(
    `現在ターン：第${gameState.turnNumber}ターン`,
    `現在手番：${currentSideText}`,
    `先攻：${firstSideText} / 後攻：${secondSideText}`,
    decisiveText
  );

  element.textContent = lines.join("\n");
}

function getCompactActionLabel(action) {
  if (!action) {
    return "不明";
  }

  if (action.type === "miss") {
    return "ミス";
  }

  if (action.type === "self_defeat") {
    return "自爆";
  }

  if (action.type === "self_damage") {
    return `自傷${action.damage}`;
  }

  if (action.type === "instant_defeat") {
    if (action.target === "enemy_back_unit") {
      return "後列即死";
    }

    return "即死";
  }

  if (action.type === "damage") {
    const rangeText = action.target === "enemy_any_unit" ? "遠単" : "近単";
    return `${rangeText}${action.damage}`;
  }

  if (action.type === "sniper_damage") {
    const rangeText = action.target === "enemy_column_unit" ? "射撃" : "遠単";
    return `${rangeText}${action.damage}${action.backRowMultiplier > 1 ? "×後2" : ""}`;
  }

  if (action.type === "opposite_damage") {
    return `対応${action.damage}`;
  }

  if (action.type === "damage_and_poison") {
    const rangeText = action.target === "enemy_any_unit" ? "遠単" : "近単";
    return `${rangeText}${action.damage}+毒`;
  }

  if (action.type === "piercing_damage") {
    const rangeText = action.target === "enemy_any_unit" ? "遠貫" : "近貫";
    return `${rangeText}${action.damage}`;
  }

  if (action.type === "damage_and_self_guard") {
    const rangeText = action.target === "enemy_any_unit" ? "遠単" : "近単";
    return `${rangeText}${action.damage}+自防${action.guard}`;
  }

  if (action.type === "damage_and_ally_guard") {
    const rangeText = action.target === "enemy_any_unit" ? "遠単" : "近単";
    return `${rangeText}${action.damage}+自防${action.guard}`;
  }

  if (action.type === "damage_and_move") {
    const rangeText = action.target === "enemy_any_unit" ? "遠単" : "近単";
    const moveText = action.moveDirection === "pull" ? "引寄" : action.moveDirection === "sideways" ? "横移" : "押込";
    return `${rangeText}${action.damage}+${moveText}`;
  }

  if (action.type === "damage_and_self_immovable") {
    return `近単${action.damage}+移不可`;
  }

  if (action.type === "damage_and_self_heal") {
    const rangeText = action.target === "enemy_any_unit" ? "遠単" : "近単";
    return `${rangeText}${action.damage}+自回${action.amount}`;
  }

  if (action.type === "move_self_back") {
    return "最後列";
  }

  if (action.type === "move_self_random_empty") {
    return "乱移動";
  }

  if (action.type === "move_self_adjacent_empty") {
    return "隣移動";
  }

  if (action.type === "damage_and_debuff") {
    const rangeText = action.target === "enemy_any_unit" ? "遠単" : "近単";
    const debuffText = action.debuff === "damageTakenIncrease" ? "被増" : "与減";
    return `${rangeText}${action.damage}+${debuffText}${action.amount}`;
  }

  if (action.type === "damage_and_self_damage") {
    return `近単${action.damage}+自傷${action.selfDamage}`;
  }

  if (action.type === "area_damage") {
    const pattern = getAreaPattern(action);

    if (pattern === "front_row") {
      return `前列${action.damage}`;
    }

    if (pattern === "horizontal_3") {
      return `横列${action.damage}`;
    }

    if (pattern === "vertical_3") {
      return `縦列${action.damage}`;
    }

    if (pattern === "cross") {
      return `十字${action.damage}`;
    }

    return `単体${action.damage}`;
  }

  if (action.type === "self_guard") {
    return `自防${action.guard}`;
  }

  if (action.type === "guard") {
    return `味防${action.guard}`;
  }

  if (action.type === "guard_all") {
    return `全防${action.guard}`;
  }

  if (action.type === "guard_front") {
    return `前防${action.guard}`;
  }

  if (action.type === "guard_middle") {
    return `中防${action.guard}`;
  }

  if (action.type === "heal") {
    return `単回${action.amount}`;
  }

  if (action.type === "heal_all") {
    return `全回${action.amount}`;
  }

  if (action.type === "heal_front") {
    return `前回${action.amount}`;
  }

  if (action.type === "heal_and_guard") {
    return `単回${action.amount}+防${action.guard}`;
  }

  if (action.type === "heal_all_and_guard_all") {
    return `全回${action.amount}+全防${action.guard}`;
  }

  if (action.type === "clear_guard") {
    return "防解";
  }

  if (action.type === "clear_guard_and_damage") {
    return `防解+遠単${action.damage}`;
  }

  if (action.type === "pull_all_enemies") {
    return "敵全引寄";
  }

  if (action.type === "attack_buff") {
    if (action.target === "ally_horizontal_unit") {
      return `左右1攻強${action.amount}`;
    }

    return `隣攻強${action.amount}`;
  }

  if (action.type === "attack_buff_adjacent_all") {
    return `隣2攻強${action.amount}`;
  }

  if (action.type === "attack_buff_horizontal_all") {
    return `左右攻強${action.amount}`;
  }

  if (action.type === "attack_buff_all") {
    return `全攻強${action.amount}`;
  }

  if (action.type === "enemy_all_damage_and_self_damage") {
    return `敵全${action.damage}+自傷${action.selfDamage}`;
  }

  if (action.type === "place_decoy") {
    return "デコイ";
  }

  if (action.type === "move") {
    if (action.move === "ally_forward") {
      return "味前進";
    }

    if (action.move === "ally_backward") {
      return "味後退";
    }

    if (action.move === "enemy_forward") {
      return "敵引寄";
    }

    if (action.move === "enemy_backward") {
      return "敵押込";
    }

    if (action.move === "ally_sideways") {
      return "味横移";
    }

    if (action.move === "enemy_sideways") {
      return "敵横移";
    }

    if (action.move === "ally_any_empty_cell") {
      return "味移動";
    }

    if (action.move === "ally_adjacent_empty_cell") {
      return "味移動";
    }

    return "移動";
  }

  return action.label || "行動";
}

function isInsideBoard(row, col) {
  return row >= 0 && row <= 2 && col >= 0 && col <= 2;
}

function addCellIfInside(indexes, row, col) {
  if (!isInsideBoard(row, col)) {
    return;
  }

  const index = getIndex(row, col);

  if (!indexes.includes(index)) {
    indexes.push(index);
  }
}

function getFrontRowIndexes(side) {
  if (side === "enemy") {
    return [6, 7, 8];
  }

  return [0, 1, 2];
}

function getAreaPattern(action) {
  if (!action) {
    return "single_cell";
  }

  if (action.area) {
    return action.area;
  }

  if (action.range) {
    return action.range;
  }

  if (action.pattern) {
    return action.pattern;
  }

  if (action.target === "enemy_front_row") {
    return "front_row";
  }

  const label = action.label || "";

  if (label.includes("最前列全体") || label.includes("前列全体")) {
    return "front_row";
  }

  if (label.includes("十字")) {
    return "cross";
  }

  if (label.includes("左右")) {
    return "horizontal_3";
  }

  if (label.includes("前後") || label.includes("上下")) {
    return "vertical_3";
  }

  return "single_cell";
}

function getAffectedCellIndexesForPreview(side, index) {
  if (!gameState.selectedAction) {
    return [];
  }

  const action = gameState.selectedAction;
  const pattern = getAreaPattern(action);

  if (pattern === "front_row") {
    return getCurrentFrontUnitIndexes(side);
  }

  if (
    gameState.phase !== "confirm" &&
    gameState.phase !== "select_target"
  ) {
    return [];
  }

  if (
    !gameState.selectedTarget &&
    action.target !== "self" &&
    action.target !== "enemy_front_row"
  ) {
    return [];
  }

  const baseIndex = gameState.selectedTarget
    ? gameState.selectedTarget.index
    : index;

  if (baseIndex === null || baseIndex === undefined) {
    return [];
  }

  const row = getRow(baseIndex);
  const col = getColumn(baseIndex);
  const indexes = [];

  if (pattern === "horizontal_3") {
    addCellIfInside(indexes, row, col);
    addCellIfInside(indexes, row, col - 1);
    addCellIfInside(indexes, row, col + 1);
    return indexes;
  }

  if (pattern === "vertical_3") {
    addCellIfInside(indexes, row, col);
    addCellIfInside(indexes, row - 1, col);
    addCellIfInside(indexes, row + 1, col);
    return indexes;
  }

  if (pattern === "cross") {
    addCellIfInside(indexes, row, col);
    addCellIfInside(indexes, row - 1, col);
    addCellIfInside(indexes, row + 1, col);
    addCellIfInside(indexes, row, col - 1);
    addCellIfInside(indexes, row, col + 1);
    return indexes;
  }

  addCellIfInside(indexes, row, col);
  return indexes;
}

function isAffectedCell(side, index) {
  if (!gameState.selectedAction) {
    return false;
  }

  if (gameState.selectedAction.type !== "area_damage") {
    return false;
  }

  if (gameState.selectedAction.target === "enemy_front_row") {
    const targetSide = gameState.currentSide === "player" ? "enemy" : "player";

    if (side !== targetSide) {
      return false;
    }

    return getAffectedCellIndexesForPreview(side, index).includes(index);
  }

  if (!gameState.selectedTarget) {
    return false;
  }

  if (gameState.selectedTarget.side !== side) {
    return false;
  }

  return getAffectedCellIndexesForPreview(side, index).includes(index);
}

function isAreaCenterCell(side, index) {
  if (!gameState.selectedAction) {
    return false;
  }

  if (gameState.selectedAction.type !== "area_damage") {
    return false;
  }

  if (!gameState.selectedTarget) {
    return false;
  }

  return gameState.selectedTarget.side === side && gameState.selectedTarget.index === index;
}

function getCellBadges(character, side, index) {
  const badges = [];

  if (
    isTwoStepMoveAction(gameState.selectedAction) &&
    gameState.selectedTarget &&
    gameState.selectedTarget.side === side &&
    gameState.selectedTarget.index === index
  ) {
    badges.push({ className: "badge-center", text: "MOVE" });
  }

  if (
    isTwoStepMoveAction(gameState.selectedAction) &&
    gameState.selectedMoveDestination &&
    gameState.selectedMoveDestination.side === side &&
    gameState.selectedMoveDestination.index === index
  ) {
    badges.push({ className: "badge-hit", text: "DEST" });
  }

  if (isAreaCenterCell(side, index)) {
    badges.push({ className: "badge-center", text: "TARGET" });
  }

  if (isAffectedCell(side, index)) {
    badges.push({ className: "badge-hit", text: "HIT" });
  }

  if (character && character.hp > 0 && character.guard > 0) {
    badges.push({ className: "badge-guard", text: `防${character.guard}` });
  }

  if (character && character.hp > 0 && character.attackBuff > 0) {
    badges.push({ className: "badge-guard", text: `攻+${character.attackBuff}` });
  }

  if (character && character.hp > 0 && character.damageTakenIncrease > 0) {
    badges.push({ className: "badge-cooldown", text: `被+${character.damageTakenIncrease}` });
  }

  if (character && character.hp > 0 && character.damageDealtDecrease > 0) {
    badges.push({ className: "badge-cooldown", text: `与-${character.damageDealtDecrease}` });
  }

  if (character && character.hp > 0 && character.immovable > 0) {
    badges.push({ className: "badge-guard", text: "移不可" });
  }

  if (character && character.hp > 0 && character.poisonDamage > 0) {
    badges.push({ className: "badge-cooldown", text: `毒${character.poisonDamage}` });
  }

  if (character && character.hp > 0 && character.cooldown > 0 && !canActorAct(side, character)) {
    badges.push({ className: "badge-cooldown", text: "待" });
  }

  if (badges.length === 0) {
    return "";
  }

  return `
    <div class="cell-badge-row">
      ${badges
        .map((badge) => `<span class="cell-badge ${badge.className}">${badge.text}</span>`)
        .join("")}
    </div>
  `;
}

function getImagePlaceholderHtml(label) {
  return `<div class="image-placeholder">${label}</div>`;
}

function getCharacterImageHtml(character, className, placeholderLabel) {
  if (!character || !character.image) {
    return getImagePlaceholderHtml(placeholderLabel);
  }

  return `
    <img
      class="${className}"
      src="${character.image}"
      alt="${character.name}"
      draggable="false"
      onerror="this.classList.add('image-load-error'); this.nextElementSibling.classList.remove('hidden-placeholder');"
    >
    <div class="image-placeholder hidden-placeholder">${placeholderLabel}</div>
  `;
}

function renderBoard(board, elementId, side) {
  const boardElement = document.getElementById(elementId);
  boardElement.innerHTML = "";

  board.forEach((character, index) => {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.dataset.side = side;
    cell.dataset.index = index;

    if (isAffectedCell(side, index)) {
      cell.classList.add("affected-cell");
    }

    if (isAreaCenterCell(side, index)) {
      cell.classList.add("area-center-cell");
    }

    if (character && character.hp > 0) {
      const previousHpValue = getPreviousHpValue(side, index, character);
      const currentHpValue = character.hp;
      const hpKey = getUnitHpKey(side, index, character);

      cell.classList.add(side === "enemy" ? "enemy-cell" : "player-cell");

      if (previousHpValue > currentHpValue) {
        cell.classList.add("damage-flash");
      }

      if (character.cooldown > 0 && !canActorAct(side, character)) {
        cell.classList.add("cooldown-cell");
      }

      if (isSelectableActor(side, index)) {
        cell.classList.add("selectable-actor");
      }

      if (
        gameState.selectedActor &&
        gameState.selectedActor.side === side &&
        gameState.selectedActor.index === index
      ) {
        cell.classList.add("selected-actor");
      }

      if (isSelectableTarget(side, index) || isSelectableMoveDestination(side, index)) {
        cell.classList.add("selectable-target");
      }

      if (
        (
          gameState.selectedTarget &&
          gameState.selectedTarget.side === side &&
          gameState.selectedTarget.index === index
        ) ||
        (
          gameState.selectedMoveDestination &&
          gameState.selectedMoveDestination.side === side &&
          gameState.selectedMoveDestination.index === index
        )
      ) {
        cell.classList.add("selected-target");
      }

      const badgeHtml = getCellBadges(character, side, index);

      cell.innerHTML = `
        ${badgeHtml}
        <div class="board-character">
          <div class="board-portrait">
            ${getCharacterImageHtml(character, "board-character-image", "IMAGE")}
          </div>
          <div class="character-name">${character.name}</div>
          <div
            class="hp hp-number"
            data-hp-key="${hpKey}"
            data-previous-hp="${previousHpValue}"
            data-current-hp="${currentHpValue}"
            data-max-hp="${character.maxHp}"
          >
            HP ${previousHpValue} / ${character.maxHp}
          </div>
        </div>
      `;
    } else {
      if (isSelectableTarget(side, index) || isSelectableMoveDestination(side, index)) {
        cell.classList.add("selectable-target");
      }

      if (
        (
          gameState.selectedTarget &&
          gameState.selectedTarget.side === side &&
          gameState.selectedTarget.index === index
        ) ||
        (
          gameState.selectedMoveDestination &&
          gameState.selectedMoveDestination.side === side &&
          gameState.selectedMoveDestination.index === index
        )
      ) {
        cell.classList.add("selected-target");
      }

      const badgeHtml = getCellBadges(character, side, index);

      cell.classList.add("empty");
      cell.innerHTML = `
        ${badgeHtml}
        <div class="empty-label">空</div>
      `;
    }

    cell.addEventListener("click", () => {
      handleCellClick(side, index);
    });

    boardElement.appendChild(cell);

    if (character && character.hp > 0) {
      const hpNumber = cell.querySelector(".hp-number");

      if (hpNumber) {
        const previousHp = Number(hpNumber.dataset.previousHp);
        const currentHp = Number(hpNumber.dataset.currentHp);
        const maxHp = Number(hpNumber.dataset.maxHp);

        animateHpNumber(hpNumber, previousHp, currentHp, maxHp);
      }

      updateHpNumberCache(side, index, character);
    }
  });
}

function reorderBoardRowsForGuest(boardElement) {
  // 行2(前列=6-8)を上へ、行0(後列=0-2)を下へ移動
  // dataset.indexはそのままなのでクリック判定は正常
  const cells = Array.from(boardElement.querySelectorAll(".cell"));
  if (cells.length !== 9) return;
  boardElement.innerHTML = "";
  [
    cells[6], cells[7], cells[8],
    cells[3], cells[4], cells[5],
    cells[0], cells[1], cells[2],
  ].forEach((c) => boardElement.appendChild(c));
}

function renderAllBoards() {
  const guestView = gameState.battleMode === "online" && gameState.onlineMySide === "enemy";
  const enemyBoardEl  = document.getElementById("enemy-board");
  const playerBoardEl = document.getElementById("player-board");

  if (guestView) {
    // ゲスト視点: 自分(enemy)を下、相手(player)を上に表示
    renderBoard(gameState.playerBoard, "enemy-board", "player");
    renderBoard(gameState.enemyBoard,  "player-board", "enemy");
    // 敵ボード基準(行2=前列)をゲスト視点(行0=前列=VS寄り)に合わせる
    reorderBoardRowsForGuest(enemyBoardEl);
    reorderBoardRowsForGuest(playerBoardEl);
  } else {
    renderBoard(gameState.enemyBoard,  "enemy-board", "enemy");
    renderBoard(gameState.playerBoard, "player-board", "player");
  }

  const topLabel    = document.getElementById("board-label-top");
  const bottomLabel = document.getElementById("board-label-bottom");
  if (topLabel && bottomLabel) {
    if (guestView) {
      topLabel.textContent    = "相手の陣営 ↓";
      bottomLabel.textContent = "あなたの陣営 ↑";
    } else {
      topLabel.textContent    = "敵陣営 ↓";
      bottomLabel.textContent = "味方陣営 ↑";
    }
  }
}

function isActiveCard(side, index) {
  return gameState.selectedActor &&
    gameState.selectedActor.side === side &&
    gameState.selectedActor.index === index;
}

function renderCardList() {
  const cardListElement = document.getElementById("card-list");
  cardListElement.innerHTML = "";

  const guestView = gameState.battleMode === "online" && gameState.onlineMySide === "enemy";
  const cardSources = [
    {
      title: guestView ? "あなた" : "敵",
      side: "enemy",
      board: gameState.enemyBoard,
      className: "enemy-card"
    },
    {
      title: guestView ? "相手" : "味方",
      side: "player",
      board: gameState.playerBoard,
      className: "player-card"
    }
  ];

  if (guestView) {
    cardSources.reverse();
  }

  cardSources.forEach((source) => {
    const partyBlock = document.createElement("div");
    partyBlock.className = "party-card-block";

    const partyTitle = document.createElement("div");
    partyTitle.className = "party-card-title";
    partyTitle.textContent = `${source.title}パーティ`;

    const row = document.createElement("div");
    row.className = "party-card-row";

    source.board.forEach((character, index) => {
      if (!character || character.isDecoy) {
        return;
      }

      const card = document.createElement("div");
      card.className = `character-card ${source.className}`;

      if (isActiveCard(source.side, index)) {
        card.classList.add("active-card");
      }

      let actionHtml = "";

      for (let dice = 1; dice <= 6; dice++) {
        const action = character.actions[dice];
        const compactLabel = getCompactActionLabel(action);

        const activeActionClass =
          isActiveCard(source.side, index) &&
          gameState.rolledNumber === dice &&
          gameState.selectedAction
            ? "active-action"
            : "";

        const actionTitle = action && action.label ? action.label : compactLabel;
        actionHtml += `<li class="${activeActionClass}" title="${actionTitle}">${compactLabel}</li>`;
      }

      const guardText = character.guard > 0 ? ` / 防御 ${character.guard}` : "";
      const attackBuffText = character.attackBuff > 0 ? ` / 攻撃+${character.attackBuff}` : "";
      const damageTakenText = character.damageTakenIncrease > 0 ? ` / 被ダメ+${character.damageTakenIncrease}` : "";
      const damageDealtText = character.damageDealtDecrease > 0 ? ` / 与ダメ-${character.damageDealtDecrease}` : "";
      const immovableText = character.immovable > 0 ? " / 移動不可" : "";
      const poisonText = character.poisonDamage > 0 ? ` / 毒${character.poisonDamage}` : "";
      const cooldownText = character.cooldown > 0 && !canActorAct(source.side, character) ? " / 次回使用不可" : "";

      card.innerHTML = `
        <div class="card-main">
          <div class="portrait-box">
            ${getCharacterImageHtml(character, "card-character-image", "IMAGE<br>EMPTY")}
          </div>

          <div class="card-info">
            <div class="card-title-row"><div class="card-title">${character.name}</div></div>
            <div class="card-subtitle">${character.job}</div>
            <div class="card-status">
              HP ${character.hp} / ${character.maxHp}${guardText}${attackBuffText}${damageTakenText}${damageDealtText}${immovableText}${poisonText}${cooldownText}
            </div>
          </div>
        </div>

        <div class="action-list">
          <ol>${actionHtml}</ol>
        </div>
      `;

      if (typeof createCharacterDetailButton === "function") {
        const cardTitleRow = card.querySelector(".card-title-row");

        if (cardTitleRow) {
          cardTitleRow.appendChild(
            createCharacterDetailButton(character, `${source.title}パーティ / ${character.name}`)
          );
        }
      }

      row.appendChild(card);
    });

    partyBlock.appendChild(partyTitle);
    partyBlock.appendChild(row);
    cardListElement.appendChild(partyBlock);
  });
}

function renderStatus() {
  const status = document.getElementById("status-area");

  if (gameState.gameOver) {
    status.textContent = "戦闘終了";
    return;
  }

  if (gameState.phase === "stage_clear") {
    status.textContent = `ステージ${gameState.stageNumber}クリア。次のステージへ進んでください。`;
    return;
  }

  if (gameState.phase === "initiative") {
    status.textContent = "先攻後攻をダイスで決定しています。";
    return;
  }

  if (gameState.animation.locked) {
    status.textContent = "行動処理中です。";
    return;
  }

  if (!isHumanControlledSide(gameState.currentSide)) {
    status.textContent =
      `第${gameState.turnNumber}ターン / 敵ターン：敵が自動で行動しています。`;
    return;
  }

  if (!hasSelectableActor(gameState.currentSide) && gameState.phase === "select_actor") {
    status.textContent =
      `第${gameState.turnNumber}ターン / ${getSideName(gameState.currentSide)}ターン：行動可能なキャラクターがいません。ターン終了してください。`;
    return;
  }

  if (gameState.phase === "select_actor") {
    status.textContent =
      `第${gameState.turnNumber}ターン / ${getSideName(gameState.currentSide)}ターン：行動するキャラクターを選んでください。`;
    return;
  }

  if (gameState.phase === "roll") {
    const actor = getBoardBySide(gameState.selectedActor.side)[gameState.selectedActor.index];

    if (gameState.debugMode) {
      status.textContent =
        `第${gameState.turnNumber}ターン / ${getSideName(gameState.currentSide)}ターン：${actor.name} を選択中。検証モード中です。出目1〜6ボタンで行動を指定できます。ランダムに振ることもできます。`;
      return;
    }

    status.textContent =
      `第${gameState.turnNumber}ターン / ${getSideName(gameState.currentSide)}ターン：${actor.name} を選択中。同じキャラをもう一度クリックするとダイスを振ります。別の行動可能キャラをクリックすると選択変更できます。`;
    return;
  }

  if (gameState.phase === "select_target") {
    const actor = getBoardBySide(gameState.selectedActor.side)[gameState.selectedActor.index];

    if (gameState.selectedAction && gameState.selectedAction.type === "area_damage") {
      status.textContent =
        `第${gameState.turnNumber}ターン / ${getSideName(gameState.currentSide)}ターン：${actor.name} の出目は ${gameState.rolledNumber}。「${gameState.selectedAction.label}」対象マスを選んでください。選択後、命中範囲が表示されます。`;
      return;
    }

    if (gameState.selectedAction && gameState.selectedAction.type === "move") {
      status.textContent =
        `第${gameState.turnNumber}ターン / ${getSideName(gameState.currentSide)}ターン：${actor.name} の出目は ${gameState.rolledNumber}。「${gameState.selectedAction.label}」動かすキャラクターを選んでください。`;
      return;
    }

    if (gameState.selectedAction && gameState.selectedAction.type === "damage_and_move" && gameState.selectedAction.moveDirection === "sideways") {
      status.textContent =
        `第${gameState.turnNumber}ターン / ${getSideName(gameState.currentSide)}ターン：${actor.name} の出目は ${gameState.rolledNumber}。「${gameState.selectedAction.label}」攻撃して横移動させる対象を選んでください。`;
      return;
    }

    status.textContent =
      `第${gameState.turnNumber}ターン / ${getSideName(gameState.currentSide)}ターン：${actor.name} の出目は ${gameState.rolledNumber}。「${gameState.selectedAction.label}」対象を選んでください。`;
    return;
  }

  if (gameState.phase === "select_move_destination") {
    const actor = getBoardBySide(gameState.selectedActor.side)[gameState.selectedActor.index];
    const target = getTargetCharacter();

    status.textContent =
      `第${gameState.turnNumber}ターン / ${getSideName(gameState.currentSide)}ターン：${actor.name} の出目は ${gameState.rolledNumber}。「${gameState.selectedAction.label}」${target ? `${target.name} の移動先` : "移動先"}の空きマスを選んでください。`;
    return;
  }

  if (gameState.phase === "confirm") {
    const actor = getBoardBySide(gameState.selectedActor.side)[gameState.selectedActor.index];

    if (gameState.selectedAction && !canCurrentActorUseSelectedAction()) {
      status.textContent =
        `第${gameState.turnNumber}ターン / ${getSideName(gameState.currentSide)}ターン：${actor.name} の出目は ${gameState.rolledNumber}。「${gameState.selectedAction.label}」前列にいないため近接攻撃できません。実行ボタンでターンを進めます。`;
      return;
    }

    if (gameState.selectedAction && gameState.selectedAction.type === "move") {
      const target = getTargetCharacter();
      status.textContent =
        `第${gameState.turnNumber}ターン / ${getSideName(gameState.currentSide)}ターン：${actor.name} の出目は ${gameState.rolledNumber}。「${gameState.selectedAction.label}」${target ? `${target.name} を` : "対象を"} DEST のマスへ移動します。実行ボタンで確定します。`;
      return;
    }

    if (gameState.selectedAction && gameState.selectedAction.type === "damage_and_move" && gameState.selectedAction.moveDirection === "sideways") {
      const target = getTargetCharacter();
      status.textContent =
        `第${gameState.turnNumber}ターン / ${getSideName(gameState.currentSide)}ターン：${actor.name} の出目は ${gameState.rolledNumber}。「${gameState.selectedAction.label}」${target ? `${target.name} に攻撃し、` : "対象に攻撃し、"} DEST の横マスへ移動させます。実行ボタンで確定します。`;
      return;
    }

    if (gameState.selectedAction && gameState.selectedAction.type === "area_damage") {
      status.textContent =
        `第${gameState.turnNumber}ターン / ${getSideName(gameState.currentSide)}ターン：${actor.name} の出目は ${gameState.rolledNumber}。「${gameState.selectedAction.label}」HIT表示のマスに命中します。対象または実行ボタンで確定します。`;
      return;
    }

    if (gameState.selectedTarget) {
      status.textContent =
        `第${gameState.turnNumber}ターン / ${getSideName(gameState.currentSide)}ターン：${actor.name} の出目は ${gameState.rolledNumber}。「${gameState.selectedAction.label}」選択中の対象をもう一度クリックするか、実行ボタンで確定します。`;
      return;
    }

    status.textContent =
      `第${gameState.turnNumber}ターン / ${getSideName(gameState.currentSide)}ターン：${actor.name} の出目は ${gameState.rolledNumber}。「${gameState.selectedAction.label}」${actor.name} をもう一度クリックするか、実行ボタンで確定します。`;
  }
}

function canCancelSelection() {
  if (gameState.gameOver) {
    return false;
  }

  if (!isHumanControlledSide(gameState.currentSide)) {
    return false;
  }

  if (gameState.phase === "roll") {
    return !!gameState.selectedActor;
  }

  if (gameState.phase === "select_target") {
    return !!gameState.selectedAction;
  }

  if (gameState.phase === "select_move_destination") {
    return !!gameState.selectedTarget;
  }

  if (gameState.phase === "confirm") {
    return !!(gameState.selectedTarget || gameState.selectedMoveDestination);
  }

  return false;
}

function setRecommendedButton(buttonId, shouldRecommend) {
  const button = document.getElementById(buttonId);

  if (!button) {
    return;
  }

  if (shouldRecommend && !button.disabled) {
    button.classList.add("recommended-button");
  } else {
    button.classList.remove("recommended-button");
  }
}

function clearRecommendedButtons() {
  const buttonIds = [
    "roll-button",
    "execute-button",
    "cancel-button",
    "pass-button",
    "next-stage-button",
    "reset-button",
    "online-rematch-button",
    "back-title-button"
  ];

  buttonIds.forEach((buttonId) => {
    const button = document.getElementById(buttonId);

    if (button) {
      button.classList.remove("recommended-button");
    }
  });
}

function renderButtons() {
  const isHumanTurn =
    isHumanControlledSide(gameState.currentSide) &&
    !gameState.gameOver &&
    !gameState.animation.locked;

  const canRoll = isHumanTurn && gameState.phase === "roll";
  const canExecute = isHumanTurn && gameState.phase === "confirm";
  const canCancel = !gameState.animation.locked && canCancelSelection();
  const canPass =
    isHumanTurn &&
    gameState.phase === "select_actor" &&
    !hasSelectableActor(gameState.currentSide);

  const rollButton = document.getElementById("roll-button");
  const debugDiceArea = document.getElementById("debug-dice-area");

  if (rollButton) {
    rollButton.disabled = !canRoll;
    rollButton.textContent = gameState.debugMode ? "ランダムで振る" : "ダイスを振る";
  }

  document.getElementById("execute-button").disabled = !canExecute;
  document.getElementById("cancel-button").disabled = !canCancel;
  document.getElementById("pass-button").disabled = !canPass;

  const nextStageButton = document.getElementById("next-stage-button");

  if (nextStageButton) {
    const canGoNextStage =
      gameState.battleMode === "stage" &&
      gameState.phase === "stage_clear" &&
      gameState.stageCleared &&
      !gameState.animation.locked &&
      (gameState.stageNumber || 1) < (gameState.maxStage || getStageCount());

    nextStageButton.disabled = !canGoNextStage;
    nextStageButton.style.display = gameState.battleMode === "stage" ? "inline-block" : "none";
  }

  if (debugDiceArea) {
    debugDiceArea.classList.toggle("visible", !!gameState.debugMode);
  }

  document.querySelectorAll(".debug-dice-button").forEach((button) => {
    button.disabled = !(gameState.debugMode && canRoll);
  });

  const resetButton = document.getElementById("reset-button");
  const onlineRematchButton = document.getElementById("online-rematch-button");
  const backTitleButton = document.getElementById("back-title-button");

  if (resetButton) {
    resetButton.disabled = gameState.animation.locked;
    resetButton.style.display = gameState.battleMode === "online" ? "none" : "";
  }

  if (onlineRematchButton) {
    onlineRematchButton.style.display = gameState.battleMode === "online" ? "" : "none";
    onlineRematchButton.disabled = gameState.animation.locked;
  }

  if (backTitleButton) {
    backTitleButton.disabled = gameState.animation.locked;
    backTitleButton.textContent = gameState.battleMode === "battlefrontier" ? "中断してタイトルへ" : "タイトルへ";
  }

  clearRecommendedButtons();

  setRecommendedButton("roll-button", canRoll);
  setRecommendedButton("execute-button", canExecute);
  setRecommendedButton("pass-button", canPass);
  setRecommendedButton("next-stage-button", gameState.battleMode === "stage" && gameState.phase === "stage_clear");
}