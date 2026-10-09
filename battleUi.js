// ============================================================
// battleUi.js - バトル画面の上部バー・行動パネル・キャラ能力のポップアップ
// 盤面中心のレイアウトで、能力はマスにマウスを乗せる（スマホはタップ）と見られる。
// ============================================================

// 出目の種類（色分け用）。近距離・遠距離・支援・ミス・特殊の5種類
function getActionKind(action) {
  if (!action || action.type === "miss") {
    return "miss";
  }

  if (["instant_defeat", "self_defeat", "self_damage", "place_decoy"].includes(action.type)) {
    return "special";
  }

  const target = action.target || "";

  if (target === "enemy_front_unit" || target === "enemy_opposite_unit") {
    return "melee";
  }

  if (target.startsWith("enemy")) {
    return "ranged";
  }

  return "support";
}

function getActionFacesHtml(character, highlightNumber) {
  let html = "";

  for (let dice = 1; dice <= 6; dice++) {
    const action = character.actions ? character.actions[dice] : null;
    const hit = highlightNumber === dice ? " hit" : "";
    const title = action && action.label ? action.label : "";
    html += `
      <div class="face k-${getActionKind(action)}${hit}" title="${title}">
        <span class="face-n">${dice}</span><span class="face-t">${getCompactActionLabel(action)}</span>
      </div>`;
  }

  return `<div class="faces6">${html}</div>`;
}

function getHpPercent(character) {
  if (!character || !character.maxHp) {
    return 0;
  }

  return Math.max(0, Math.min(100, (character.hp / character.maxHp) * 100));
}

// 盤面のマスに出しているバッジの意味
function getCharacterStatusLines(character, side) {
  const lines = [];

  if (!character || character.hp <= 0) {
    return lines;
  }

  if (character.cooldown > 0 && !canActorAct(side, character)) {
    lines.push(["待", "前の番に行動したので、次の自分の番は休み"]);
  }
  if (character.guard > 0) lines.push([`防${character.guard}`, `受けるダメージを${character.guard}減らす`]);
  if (character.attackBuff > 0) lines.push([`攻+${character.attackBuff}`, `与えるダメージ+${character.attackBuff}`]);
  if (character.damageTakenIncrease > 0) lines.push([`被+${character.damageTakenIncrease}`, `受けるダメージ+${character.damageTakenIncrease}`]);
  if (character.damageDealtDecrease > 0) lines.push([`与-${character.damageDealtDecrease}`, `与えるダメージ-${character.damageDealtDecrease}`]);
  if (character.immovable > 0) lines.push(["移不可", "移動できない状態"]);
  if (character.poisonDamage > 0) lines.push([`毒${character.poisonDamage}`, `毒状態（${character.poisonDamage}ダメージ）`]);
  if (character.burn) lines.push(["やけど", "やけど状態"]);
  if (character.paralysis) lines.push(["麻痺", "麻痺状態"]);
  if (character.tauntedBy) lines.push(["挑発", "挑発されている"]);
  if (character.chargeActive) lines.push([`溜込${character.chargeStock > 0 ? character.chargeStock : ""}`, "力を溜め込んでいる"]);

  return lines;
}

// ---------------- 上部バー ----------------

function getHudModeTexts() {
  const mode = gameState.battleMode;

  if (mode === "stage") {
    const stageNumber = gameState.stageNumber || 1;
    return { sub: `ステージ ${stageNumber}/${gameState.maxStage || getStageCount()}`, name: getStageName(stageNumber) };
  }

  if (mode === "auto") return { sub: "", name: "チュートリアル" };
  if (mode === "online") return { sub: gameState.onlineTestMode ? "試験モード" : "", name: "オンライン対戦" };
  if (mode === "battlefrontier") return { sub: "", name: "エンカウント・ドラフト" };

  return { sub: "", name: "ローカル対戦" };
}

// 視点から見て「自分側」か（オンラインのゲストは enemy 側が自分）
function isViewerSide(side) {
  if (gameState.battleMode === "online" && gameState.onlineMySide) {
    return side === gameState.onlineMySide;
  }

  return side === "player";
}

function renderBattleHud() {
  const modeTexts = getHudModeTexts();
  const subElement = document.getElementById("hud-mode-sub");
  const nameElement = document.getElementById("hud-mode-name");

  if (!subElement || !nameElement) {
    return;
  }

  subElement.textContent = modeTexts.sub;
  subElement.style.display = modeTexts.sub ? "" : "none";
  nameElement.textContent = modeTexts.name;

  const turnNumberElement = document.getElementById("hud-turn-number");
  const pill = document.getElementById("hud-turn-pill");
  turnNumberElement.textContent = gameState.turnNumber ? `第${gameState.turnNumber}ターン` : "";

  let pillText = "";
  let pillSide = "";

  if (gameState.gameOver || gameState.phase === "stage_clear") {
    pillText = "決着";
  } else if (gameState.phase === "initiative") {
    pillText = "先攻を決めています";
  } else if (gameState.currentSide) {
    const side = gameState.currentSide;
    pillSide = isViewerSide(side) ? "ally" : "enemy";

    if (gameState.battleMode === "versus") {
      pillText = `${getSideName(side)}の番`;
    } else if (isViewerSide(side)) {
      pillText = "あなたの番";
    } else {
      pillText = gameState.battleMode === "online" ? "相手の番" : "敵の番";
    }
  }

  pill.textContent = pillText;
  pill.className = `hud-turn-pill ${pillSide}`;
  pill.style.display = pillText ? "" : "none";

  const doom = document.getElementById("hud-doom");
  const status = getDecisiveMomentDisplayStatus();

  if (gameState.gameOver || !gameState.turnNumber) {
    doom.innerHTML = "";
  } else if (status.isActive) {
    doom.className = "hud-doom active";
    doom.innerHTML = `<b>決着の刻 発動中</b><span>後攻の行動後、全員に${status.damage}ダメージ</span>`;
  } else {
    const rest = Math.max(0, status.startTurn - gameState.turnNumber + 1);
    const percent = Math.min(100, ((gameState.turnNumber - 1) / status.startTurn) * 100);
    doom.className = "hud-doom";
    doom.title = `第${status.startTurn}ターン終了時から、または両軍残り1人で発動`;
    doom.innerHTML = `<span>決着の刻まで</span><span class="doom-bar"><i style="width:${percent}%"></i></span><span>あと${rest}ターン</span>`;
  }
}

// ---------------- 行動パネル ----------------

function getPanelActor() {
  if (gameState.phase === "select_second_hit_target" && gameState.pendingMultiHit) {
    const pending = gameState.pendingMultiHit;
    return { side: pending.actorSide, index: pending.actorIndex };
  }

  return gameState.selectedActor || null;
}

function renderActorPanel() {
  const panel = document.getElementById("actor-panel");

  if (!panel) {
    return;
  }

  const actorRef = getPanelActor();
  const actor = actorRef ? getBoardBySide(actorRef.side)[actorRef.index] : null;

  if (!actor || gameState.gameOver || gameState.phase === "initiative" || gameState.phase === "stage_clear") {
    let headline = "";

    if (gameState.gameOver) {
      const winner = getAliveCharacterCount("enemy") === 0 ? "player" : getAliveCharacterCount("player") === 0 ? "enemy" : null;

      if (!winner) {
        headline = "バトル終了";
      } else if (gameState.battleMode === "versus") {
        headline = `${getSideName(winner)}の勝利！`;
      } else {
        headline = isViewerSide(winner) ? "勝利！" : "敗北…";
      }
    } else if (gameState.phase === "stage_clear") {
      headline = "ステージクリア！";
    } else if (gameState.phase === "initiative") {
      headline = "先攻・後攻をサイコロで決めています";
    } else if (!isHumanControlledSide(gameState.currentSide)) {
      headline = gameState.battleMode === "online" ? "相手が行動を選んでいます" : "敵が行動しています";
    } else {
      // 「行動できるキャラがいない」などの案内もここに出し、下の案内文とは重ねない
      const statusText = document.getElementById("status-area").textContent.trim();
      headline = statusText || "行動するキャラを盤面から選んでください";
    }

    panel.className = "actor-panel empty";
    panel.innerHTML = `
      <div class="actor-empty-headline">${headline}</div>
      <div class="actor-empty-hint">キャラにマウスを乗せる（スマホはタップ）と、能力が見られます</div>`;
    return;
  }

  const rolled = gameState.rolledNumber && gameState.selectedAction ? gameState.rolledNumber : null;
  const action = rolled ? actor.actions[rolled] : null;
  const sideClass = isViewerSide(actorRef.side) ? "ally" : "enemy";

  panel.className = `actor-panel ${sideClass}`;
  panel.innerHTML = `
    <div class="actor-who">
      <div class="actor-portrait">${getCharacterImageHtml(actor, "board-character-image", "IMAGE")}</div>
      <div class="actor-who-text">
        <div><b>${actor.name}</b><span class="actor-job">${actor.job || ""}</span></div>
        <div class="hp-bar"><i style="width:${getHpPercent(actor)}%"></i></div>
        <div class="actor-hp">HP ${actor.hp} / ${actor.maxHp}</div>
      </div>
    </div>
    <div class="actor-roll${rolled ? "" : " waiting"}">
      <div class="actor-die">${rolled || "?"}</div>
      <div class="actor-roll-text">
        ${rolled
          ? `<b class="k-${getActionKind(action)}">${getCompactActionLabel(action)}</b><p>${action && action.label ? action.label : ""}</p>`
          : isHumanControlledSide(actorRef.side)
            ? "<b>サイコロを振ってください</b><p>出た目の行動をします</p>"
            : "<b>サイコロを振っています…</b><p>出た目の行動をします</p>"}
      </div>
    </div>
    ${getActionFacesHtml(actor, rolled)}`;
}

// 状態表示の文から、上部バーと重なる「第Nターン / 味方ターン：」を外す
function trimStatusAreaPrefix() {
  const status = document.getElementById("status-area");

  if (status) {
    status.textContent = status.textContent.replace(/^第\d+ターン \/ [^：]+：/, "");
  }
}

function renderBattleUi() {
  trimStatusAreaPrefix();
  renderBattleHud();
  renderActorPanel();
  refreshUnitPopover();
}

// ---------------- 能力ポップアップ ----------------

const unitPopoverState = { side: null, index: null, anchor: null, touch: false };

function isTouchUi() {
  return window.matchMedia && window.matchMedia("(hover: none)").matches;
}

function getUnitPopoverHtml(character, side, index, withAction) {
  const isActor = (() => {
    const ref = getPanelActor();
    return ref && ref.side === side && ref.index === index;
  })();
  const highlight = isActor && gameState.rolledNumber && gameState.selectedAction ? gameState.rolledNumber : null;
  const sideClass = isViewerSide(side) ? "ally" : "enemy";
  const statusLines = getCharacterStatusLines(character, side);
  const role = typeof getRoleDisplayText === "function" ? getRoleDisplayText(character) : (character.role || "");

  return `
    <button class="unit-popover-close" type="button" aria-label="閉じる">×</button>
    <div class="unit-popover-head">
      <div class="unit-popover-portrait">${getCharacterImageHtml(character, "board-character-image", "IMAGE")}</div>
      <div class="unit-popover-title">
        <div><b>${character.name}</b><span class="unit-popover-side ${sideClass}">${getSideName(side)}</span></div>
        <div class="unit-popover-job">${character.job || ""}　HP ${character.hp} / ${character.maxHp}</div>
        <div class="hp-bar ${sideClass}"><i style="width:${getHpPercent(character)}%"></i></div>
      </div>
    </div>
    ${role ? `<p class="unit-popover-role">${role}</p>` : ""}
    ${getActionFacesHtml(character, highlight)}
    ${statusLines.length ? `<div class="unit-popover-status">${statusLines.map(([badge, text]) => `<div><span class="unit-popover-badge">${badge}</span>${text}</div>`).join("")}</div>` : ""}
    ${withAction ? `<div class="unit-popover-cta"><button class="unit-popover-pick" type="button">ここを選ぶ</button><small>もう一度このマスをタップしても選べます</small></div>` : ""}`;
}

function showUnitPopover(side, index, anchor, options = {}) {
  const popover = document.getElementById("unit-popover");
  const character = getBoardBySide(side)[index];

  if (!popover || !character || character.hp <= 0) {
    hideUnitPopover();
    return;
  }

  unitPopoverState.side = side;
  unitPopoverState.index = index;
  unitPopoverState.anchor = anchor;
  unitPopoverState.touch = !!options.touch;

  popover.className = `unit-popover visible ${isViewerSide(side) ? "ally" : "enemy"}${options.touch ? " touch" : ""}`;
  popover.innerHTML = getUnitPopoverHtml(character, side, index, !!options.withAction);
  popover.setAttribute("aria-hidden", "false");

  popover.querySelector(".unit-popover-close").addEventListener("click", hideUnitPopover);

  const pickButton = popover.querySelector(".unit-popover-pick");

  if (pickButton) {
    pickButton.addEventListener("click", () => {
      hideUnitPopover();
      handleCellClick(side, index);
    });
  }

  if (!options.touch) {
    positionUnitPopover(popover, anchor);
  } else {
    popover.style.left = "";
    popover.style.top = "";
  }
}

function positionUnitPopover(popover, anchor) {
  if (!anchor) {
    return;
  }

  const rect = anchor.getBoundingClientRect();
  const width = popover.offsetWidth;
  const height = popover.offsetHeight;
  let left = rect.right + 12;

  if (left + width > window.innerWidth - 8) {
    left = rect.left - width - 12;
  }

  let top = Math.min(rect.top, window.innerHeight - height - 8);
  popover.style.left = `${Math.max(8, left)}px`;
  popover.style.top = `${Math.max(8, top)}px`;
}

function hideUnitPopover() {
  const popover = document.getElementById("unit-popover");
  unitPopoverState.side = null;
  unitPopoverState.index = null;
  unitPopoverState.anchor = null;

  if (popover) {
    popover.className = "unit-popover";
    popover.setAttribute("aria-hidden", "true");
  }
}

// 盤面が描き直されるとマスの要素も作り直されるので、開いているポップアップを新しいマスに付け直す
function refreshUnitPopover() {
  if (unitPopoverState.side === null) {
    return;
  }

  const { side, index, touch } = unitPopoverState;
  const cell = document.querySelector(`#main-layout .cell[data-side="${side}"][data-index="${index}"]`);
  const character = getBoardBySide(side)[index];

  if (!cell || !character || character.hp <= 0 || (!touch && !cell.matches(":hover"))) {
    hideUnitPopover();
    return;
  }

  showUnitPopover(side, index, cell, { touch, withAction: touch && cell.classList.contains("selectable-target") });
}

function isUnitPopoverOpenFor(side, index) {
  return unitPopoverState.side === side && unitPopoverState.index === index;
}

// マスのクリック。スマホは「1回目で能力を見る、2回目で選ぶ」
function onBoardCellClick(side, index, cell) {
  const character = getBoardBySide(side)[index];
  const hasUnit = character && character.hp > 0;

  if (!isTouchUi() || !hasUnit) {
    hideUnitPopover();
    handleCellClick(side, index);
    return;
  }

  // 自分が動かすキャラの選択・サイコロ・決定は、行動パネルに能力が出るのでそのまま進める
  const isActorChoice = cell.classList.contains("selectable-actor") || cell.classList.contains("selected-actor");
  const isConfirmTap = cell.classList.contains("selected-target");

  if (isActorChoice || isConfirmTap) {
    hideUnitPopover();
    handleCellClick(side, index);
    return;
  }

  const actionable = cell.classList.contains("selectable-target");

  if (isUnitPopoverOpenFor(side, index)) {
    hideUnitPopover();

    if (actionable) {
      handleCellClick(side, index);
    }

    return;
  }

  showUnitPopover(side, index, cell, { touch: true, withAction: actionable });
}

function bindBoardCellUi(cell, side, index) {
  cell.addEventListener("click", () => onBoardCellClick(side, index, cell));

  cell.addEventListener("mouseenter", () => {
    if (isTouchUi()) {
      return;
    }

    showUnitPopover(side, index, cell);
  });

  cell.addEventListener("mouseleave", () => {
    if (isTouchUi()) {
      return;
    }

    hideUnitPopover();
  });
}

function bindBattleUiEvents() {
  const layout = document.getElementById("main-layout");
  const logButton = document.getElementById("hud-log-button");
  const logClose = document.getElementById("log-close-button");

  if (logButton) {
    logButton.addEventListener("click", () => {
      layout.classList.toggle("show-log");
      const message = document.getElementById("message");
      if (message) message.scrollTop = message.scrollHeight;
    });
  }

  if (logClose) {
    logClose.addEventListener("click", () => layout.classList.remove("show-log"));
  }

  // スマホ：ポップアップとマス以外をタップしたら閉じる
  document.addEventListener("click", (event) => {
    if (unitPopoverState.side === null) {
      return;
    }

    const popover = document.getElementById("unit-popover");

    if (popover.contains(event.target) || event.target.closest("#main-layout .cell")) {
      return;
    }

    hideUnitPopover();
  });
}

bindBattleUiEvents();
