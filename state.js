const gameState = {
  playerBoard: [],
  enemyBoard: [],

  battleMode: "auto",
  pendingBattleMode: "auto",
  lastBattleCode: "",
  lastVersusEnemyCode: "",

  stageNumber: 1,
  maxStage: 10,
  stageCleared: false,

  currentSide: "player",
  firstSide: null,
  secondSide: null,
  turnNumber: 1,

  decisiveMomentStartTurn: 20,
  decisiveMomentDamage: 10,

  selectedActor: null,
  selectedAction: null,
  selectedTarget: null,
  selectedMoveDestination: null,

  rolledNumber: null,
  phase: "select_actor",

  gameOver: false,
  enemyAutoRunning: false,

  debugMode: false,

  partySize: 4,
  selectedPlayerNames: ["ディーン", "ユエ", "チャコ", "オリーブ"],

  partyCodeBuilderSelectedIds: [],
  partyCodeBuilderFormation: {},
  partyCodeBuilderActiveId: null,
  partyCodeBuilderOutput: "",

  playerFormationSelectedIds: [],
  playerFormation: {},
  playerFormationDraggingFromBoard: false,
  playerFormationInitialized: false,

  onlineMySide: null,
  onlineGuestFormationEntries: null,

  nextUnitId: 1,

  animation: {
    locked: false,
    hpDuration: 560,
    defeatDuration: 320,
    slideDuration: 360,
    movingUnits: []
  },

  layout: {
    cardWidth: 760,
    rightWidth: 600,
    controlHeight: 360
  }
};
