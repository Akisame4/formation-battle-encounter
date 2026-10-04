// ============================================================
// tutorial.js - チュートリアル（遊びながらポップアップで説明する）
// 中身はオートバトル（battleMode "auto"）で、タイトルの「チュートリアル」から始めたときだけ説明を出す。
// 各説明は1回の対戦で1度だけ表示する。
// ============================================================

// チュートリアルの敵は、短く終わるよう弱いモンスター2体だけにする（盤面の 6〜8 が敵の前列）
const TUTORIAL_ENEMIES = [
  { id: "monster_slime", position: 6 },
  { id: "monster_goblin", position: 8 }
];

const tutorialState = {
  active: false,
  disabled: false,
  shown: new Set(),
  popupOpen: false
};

const TUTORIAL_STEPS = {
  formation: {
    title: "ようこそ！まずは陣形づくり",
    body: [
      "このゲームは、3×3の盤面に4体のキャラクターを置いて戦います。",
      "右のキャラクターカードをタップしてから、左の盤面のマスをタップすると配置できます（ドラッグでもOK）。",
      "上段が「前列」です。カードの「近」は近接攻撃で、前列にいないと使えません。「遠」は遠距離攻撃で、どこからでも使えます。",
      "4体置いたら、右上の「この陣形で開始」を押しましょう。"
    ]
  },
  battleStart: {
    title: "バトル開始！",
    body: [
      "先攻・後攻はサイコロで決まりました。",
      "画面の左はキャラクターカード、真ん中が盤面（下が味方、上が敵）、右が操作とログです。",
      "カードに並んでいる 1〜6 は、サイコロの出目ごとの行動です。どの出目で何が起きるか確認してみましょう。"
    ]
  },
  selectActor: {
    title: "行動するキャラを選ぼう",
    body: [
      "あなたのターンです。1ターンに行動できるのは1体だけです。",
      "盤面で光っている味方キャラクターをタップして選びましょう。"
    ]
  },
  roll: {
    title: "サイコロを振ろう",
    body: [
      "同じキャラクターをもう一度タップすると、サイコロを振ります（右の「ダイスを振る」ボタンでもOK）。",
      "別のキャラクターをタップすれば、選び直すこともできます。"
    ]
  },
  selectTarget: {
    title: "相手を選ぼう",
    body: [
      "出目で行動が決まりました。",
      "選べる相手のマスが光っています。タップして対象を選び、もう一度タップするか「実行」で決定します。"
    ]
  },
  secondHit: {
    title: "2撃目の相手を選ぼう",
    body: [
      "「2撃」や「最大2体」と書かれた技は、2体目の相手も選べます。",
      "光っているマスから、2体目をタップしましょう。"
    ]
  },
  meleeBlocked: {
    title: "近接攻撃は前列から",
    body: [
      "このキャラクターは前列にいないので、出た「近」の攻撃は使えず、今回は空振りになります。",
      "近接攻撃が多いキャラクターは、陣形づくりのときに前列（敵に近い列）に置くのがおすすめです。"
    ]
  },
  enemyTurn: {
    title: "敵のターン",
    body: [
      "今度は敵のターンです。敵は自動でキャラクターを選び、サイコロを振って行動します。",
      "ログ（右下）に何が起きたか表示されるので、見てみましょう。"
    ]
  },
  cooldown: {
    title: "行動したキャラはひと休み",
    body: [
      "前のターンに行動したキャラクターは、次の自分のターンはお休みで選べません（味方が1体だけのときを除く）。",
      "毎ターン違うキャラクターを使って戦いましょう。"
    ]
  },
  decisiveMoment: {
    title: "決着の刻",
    body: [
      "決着の刻が発動しました！盤面が赤くなっている間は、後攻の行動のあとに全員へダメージが入ります。",
      "ダメージは5ターンごとに増えていきます。長引くほど危険なので、早めに決着をつけましょう。"
    ]
  },
  win: {
    title: "勝利！",
    body: [
      "相手を全員倒せば勝ちです。チュートリアルはこれで終わりです。",
      "次は「ステージ攻略」や「エンカウント・ドラフト」、友だちとの「オンライン対戦」で遊んでみましょう！"
    ]
  },
  lose: {
    title: "負けてしまった…",
    body: [
      "味方が全員倒されると負けです。チュートリアルはこれで終わりです。",
      "陣形やキャラクターを変えて、もう一度挑戦してみましょう。慣れたら「ステージ攻略」や「オンライン対戦」もどうぞ！"
    ]
  }
};

function setTutorialActive(active) {
  tutorialState.active = !!active;
  tutorialState.disabled = false;
  tutorialState.shown = new Set();
  closeTutorialPopup();
}

function isTutorialRunning() {
  return tutorialState.active && !tutorialState.disabled && gameState.battleMode === "auto";
}

// 説明を閉じても、チュートリアル用の敵構成はそのまま使う
function isTutorialMode() {
  return tutorialState.active && gameState.battleMode === "auto";
}

function createTutorialEnemyBoard() {
  const board = Array(9).fill(null);

  TUTORIAL_ENEMIES.forEach(({ id, position }) => {
    const template = getMonsterTemplateById(id);

    if (!template) {
      return;
    }

    const monster = deepCopyBoard([template])[0];
    resetCharacterRuntimeStatus(monster);
    board[position] = monster;
  });

  return board;
}

function isTutorialPopupOpen() {
  return tutorialState.popupOpen;
}

function ensureTutorialPopupElement() {
  let overlay = document.getElementById("tutorial-popup-overlay");

  if (overlay) {
    return overlay;
  }

  overlay = document.createElement("div");
  overlay.id = "tutorial-popup-overlay";
  overlay.className = "tutorial-popup-overlay";
  overlay.innerHTML = `
    <div class="tutorial-popup" role="dialog" aria-modal="true" aria-labelledby="tutorial-popup-title">
      <div class="tutorial-popup-label">チュートリアル</div>
      <h2 id="tutorial-popup-title" class="tutorial-popup-title"></h2>
      <div class="tutorial-popup-body"></div>
      <div class="tutorial-popup-buttons">
        <button type="button" class="tutorial-popup-skip">説明を閉じる</button>
        <button type="button" class="primary-button tutorial-popup-ok">OK</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  overlay.querySelector(".tutorial-popup-ok").addEventListener("click", () => {
    closeTutorialPopup();
    tutorialOnRender();
  });

  overlay.querySelector(".tutorial-popup-skip").addEventListener("click", () => {
    tutorialState.disabled = true;
    closeTutorialPopup();
  });

  return overlay;
}

function showTutorialStep(stepKey) {
  const step = TUTORIAL_STEPS[stepKey];

  if (!step || tutorialState.shown.has(stepKey) || tutorialState.popupOpen) {
    return false;
  }

  tutorialState.shown.add(stepKey);
  tutorialState.popupOpen = true;

  const overlay = ensureTutorialPopupElement();
  overlay.querySelector(".tutorial-popup-title").textContent = step.title;
  const body = overlay.querySelector(".tutorial-popup-body");
  body.innerHTML = "";
  step.body.forEach(text => {
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    body.appendChild(paragraph);
  });
  overlay.classList.add("visible");
  overlay.querySelector(".tutorial-popup-ok").focus();
  return true;
}

function closeTutorialPopup() {
  tutorialState.popupOpen = false;
  const overlay = document.getElementById("tutorial-popup-overlay");

  if (overlay) {
    overlay.classList.remove("visible");
  }
}

function tutorialOnFormationOpen() {
  if (!isTutorialRunning()) {
    return;
  }

  showTutorialStep("formation");
}

// renderAll のたびに呼ばれ、今の状況に合う説明があれば1つだけ出す
function tutorialOnRender() {
  if (!isTutorialRunning() || tutorialState.popupOpen) {
    return;
  }

  const mainLayout = document.getElementById("main-layout");

  if (!mainLayout || mainLayout.style.display === "none") {
    return;
  }

  if (gameState.animation.locked || gameState.phase === "initiative") {
    return;
  }

  if (gameState.gameOver) {
    const playerAlive = getAliveCharacterCount("player") > 0;
    showTutorialStep(playerAlive ? "win" : "lose");
    return;
  }

  if (showTutorialStep("battleStart")) {
    return;
  }

  if (typeof getDecisiveMomentDisplayStatus === "function" && getDecisiveMomentDisplayStatus().isActive) {
    if (showTutorialStep("decisiveMoment")) {
      return;
    }
  }

  if (gameState.currentSide !== "player") {
    showTutorialStep("enemyTurn");
    return;
  }

  if (gameState.phase === "select_actor") {
    if (showTutorialStep("selectActor")) {
      return;
    }

    const playerHasResting = getBoardBySide("player").some(
      character => character && character.hp > 0 && character.cooldown > 0
    );

    if (playerHasResting) {
      showTutorialStep("cooldown");
    }
    return;
  }

  if (gameState.phase === "roll") {
    showTutorialStep("roll");
    return;
  }

  if (gameState.phase === "confirm" && gameState.selectedActor && gameState.selectedAction && !canCurrentActorUseSelectedAction()) {
    showTutorialStep("meleeBlocked");
    return;
  }

  if (gameState.phase === "select_target" || gameState.phase === "confirm") {
    showTutorialStep("selectTarget");
    return;
  }

  if (gameState.phase === "select_second_hit_target") {
    showTutorialStep("secondHit");
  }
}
