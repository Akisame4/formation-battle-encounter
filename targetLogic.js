function getFrontRowIndexes(side) {
  return side === "player" ? [0, 1, 2] : [6, 7, 8];
}

function getBackRowIndexes(side) {
  return side === "player" ? [6, 7, 8] : [0, 1, 2];
}

function getRowsFromFront(side) {
  if (side === "player") {
    return [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8]
    ];
  }

  return [
    [6, 7, 8],
    [3, 4, 5],
    [0, 1, 2]
  ];
}

function getOppositeIndex(index) {
  const row = getRow(index);
  const column = getColumn(index);
  return getIndex(2 - row, column);
}

function getCurrentFrontUnitIndexes(side) {
  const board = getBoardBySide(side);
  const rows = getRowsFromFront(side);

  for (const row of rows) {
    const aliveIndexes = row.filter((index) => {
      const character = board[index];
      return isTargetableUnit(character);
    });

    if (aliveIndexes.length > 0) {
      return aliveIndexes;
    }
  }

  return [];
}

function getCurrentBackUnitIndexes(side) {
  const board = getBoardBySide(side);
  const backIndexes = getBackRowIndexes(side);

  return backIndexes.filter((index) => {
    const character = board[index];
    return isAliveRealCharacter(character);
  });
}

function isEnemyTargetType(targetType) {
  return [
    "enemy_front_unit",
    "enemy_back_unit",
    "enemy_any_unit",
    "enemy_any_cell",
    "enemy_front_row",
    "enemy_unit",
    "enemy_opposite_unit"
  ].includes(targetType);
}

function isAllyTargetType(targetType) {
  return [
    "ally_unit",
    "ally_any_empty_cell",
    "ally_empty_cell",
    "ally_adjacent_unit",
    "ally_horizontal_unit"
  ].includes(targetType);
}

function getTargetSideForAction(action) {
  if (!action) {
    return null;
  }

  if (isEnemyTargetType(action.target)) {
    return getEnemySide(gameState.currentSide);
  }

  if (isAllyTargetType(action.target)) {
    return gameState.currentSide;
  }

  return null;
}

function getAliveCharacterCount(side) {
  return getAliveCharacters(getBoardBySide(side)).length;
}

function canActorAct(side, character) {
  if (!isAliveRealCharacter(character)) {
    return false;
  }

  if (getAliveCharacterCount(side) <= 1) {
    return true;
  }

  return character.cooldown === 0;
}

function isFrontRowPosition(side, index) {
  return getFrontRowIndexes(side).includes(index);
}

function isMeleeAction(action) {
  if (!action) {
    return false;
  }

  const meleeTypes = [
    "damage",
    "piercing_damage",
    "damage_and_self_guard",
    "damage_and_ally_guard",
    "damage_and_move",
    "clear_guard_and_damage",
    "damage_and_self_immovable",
    "damage_and_self_heal",
    "damage_and_debuff",
    "damage_and_self_damage",
    "damage_and_poison"
  ];

  return meleeTypes.includes(action.type) && action.target === "enemy_front_unit";
}

function canUseActionFromActorPosition(action, actorSide, actorIndex) {
  if (!isMeleeAction(action)) {
    return true;
  }

  return isFrontRowPosition(actorSide, actorIndex);
}

function canCurrentActorUseSelectedAction() {
  if (!gameState.selectedAction || !gameState.selectedActor) {
    return false;
  }

  return canUseActionFromActorPosition(
    gameState.selectedAction,
    gameState.selectedActor.side,
    gameState.selectedActor.index
  );
}

function isSelectableActor(side, index) {
  if (
    gameState.gameOver ||
    gameState.phase !== "select_actor" ||
    side !== gameState.currentSide ||
    !isHumanControlledSide(side)
  ) {
    return false;
  }

  const board = getBoardBySide(side);
  const character = board[index];

  return canActorAct(side, character);
}

function hasSelectableActor(side) {
  const board = getBoardBySide(side);

  return board.some((character) => {
    return canActorAct(side, character);
  });
}

function getFirstSelectableActor(side) {
  const board = getBoardBySide(side);

  for (let index = 0; index < board.length; index++) {
    const character = board[index];

    if (canActorAct(side, character)) {
      return { side, index, character };
    }
  }

  return null;
}

function isTwoStepMoveAction(action) {
  if (!action) {
    return false;
  }

  if (action.type === "move") {
    return (
      action.move === "ally_any_empty_cell" ||
      action.move === "ally_adjacent_empty_cell" ||
      action.move === "ally_sideways" ||
      action.move === "enemy_sideways"
    );
  }

  if (action.type === "damage_and_move") {
    return action.moveDirection === "sideways";
  }

  return false;
}

function isTargetSelectionPhase() {
  return gameState.phase === "select_target" || gameState.phase === "confirm";
}

function isMoveDestinationSelectionPhase() {
  return gameState.phase === "select_move_destination" || gameState.phase === "confirm";
}

function isSelectableTarget(side, index) {
  if (
    gameState.gameOver ||
    !isTargetSelectionPhase() ||
    !gameState.selectedAction ||
    !gameState.selectedActor ||
    !isHumanControlledSide(gameState.currentSide)
  ) {
    return false;
  }

  if (!canCurrentActorUseSelectedAction()) {
    return false;
  }

  const action = gameState.selectedAction;
  const board = getBoardBySide(side);
  const character = board[index];
  const targetSide = getTargetSideForAction(action);

  if (side !== targetSide) {
    return false;
  }

  if (action.target === "ally_empty_cell") {
    return !character;
  }

  if (action.target === "ally_adjacent_unit") {
    if (!isAliveRealCharacter(character) || !gameState.selectedActor) {
      return false;
    }

    return side === gameState.selectedActor.side && getAdjacentIndexes(gameState.selectedActor.index).includes(index);
  }

  if (action.target === "ally_horizontal_unit") {
    if (!isAliveRealCharacter(character) || !gameState.selectedActor) {
      return false;
    }

    return side === gameState.selectedActor.side && getHorizontalAdjacentIndexes(gameState.selectedActor.index).includes(index);
  }

  if (action.target === "enemy_opposite_unit") {
    const oppositeIndex = getOppositeIndex(gameState.selectedActor.index);
    return index === oppositeIndex && isTargetableUnit(character);
  }

  if (action.target === "enemy_front_unit" || action.target === "enemy_front_row") {
    const frontIndexes = getCurrentFrontUnitIndexes(side);
    return frontIndexes.includes(index) && isTargetableUnit(character);
  }

  if (action.target === "enemy_back_unit") {
    const backIndexes = getCurrentBackUnitIndexes(side);
    return backIndexes.includes(index) && isTargetableUnit(character);
  }

  if (action.target === "enemy_any_unit" || action.target === "enemy_unit") {
    if (action.type === "move") {
      return isAliveRealCharacter(character) && canMoveByAction(side, index, action);
    }

    return isTargetableUnit(character);
  }

  if (action.target === "enemy_any_cell") {
    return true;
  }

  if (action.target === "ally_unit") {
    if (action.type === "move") {
      return isAliveRealCharacter(character) && canMoveByAction(side, index, action);
    }

    return isAliveRealCharacter(character);
  }

  if (action.target === "ally_any_empty_cell") {
    return isAliveRealCharacter(character) && canMoveByAction(side, index, action);
  }

  return false;
}

function hasEmptyCellOnSide(side) {
  const board = getBoardBySide(side);
  return board.some((character) => !character);
}

function isSelectableMoveDestination(side, index) {
  if (
    gameState.gameOver ||
    !isMoveDestinationSelectionPhase() ||
    !gameState.selectedAction ||
    !isTwoStepMoveAction(gameState.selectedAction) ||
    !gameState.selectedActor ||
    !gameState.selectedTarget ||
    !isHumanControlledSide(gameState.currentSide)
  ) {
    return false;
  }

  if (side !== gameState.selectedTarget.side) {
    return false;
  }

  return getMoveDestinationIndexesForAction(
    gameState.selectedAction,
    side,
    gameState.selectedTarget.index
  ).includes(index);
}

function hasSelectableMoveDestinationForCurrentAction() {
  if (
    !gameState.selectedAction ||
    !isTwoStepMoveAction(gameState.selectedAction) ||
    !gameState.selectedTarget
  ) {
    return false;
  }

  return getMoveDestinationIndexesForAction(
    gameState.selectedAction,
    gameState.selectedTarget.side,
    gameState.selectedTarget.index
  ).length > 0;
}

function hasSelectableTargetForCurrentAction() {
  if (!gameState.selectedAction) {
    return false;
  }

  if (!canCurrentActorUseSelectedAction()) {
    return false;
  }

  if (gameState.selectedAction.target === "self") {
    return true;
  }

  if (gameState.selectedAction.target === "ally_empty_cell") {
    return hasEmptyCellOnSide(gameState.currentSide);
  }

  for (const side of ["player", "enemy"]) {
    for (let index = 0; index < 9; index++) {
      if (isSelectableTarget(side, index)) {
        return true;
      }
    }
  }

  return false;
}



function getAreaTargetRepresentativeIndex(range, key) {
  if (range === "horizontal_3") {
    return getIndex(Number(key), 1);
  }

  if (range === "vertical_3") {
    return getIndex(1, Number(key));
  }

  return Number(key);
}

function getAreaChoiceKey(range, centerIndex) {
  if (range === "horizontal_3") {
    return String(getRow(centerIndex));
  }

  if (range === "vertical_3") {
    return String(getColumn(centerIndex));
  }

  return String(centerIndex);
}

function getSelectableAreaTargetCandidates(action, side) {
  if (!action || action.target !== "enemy_any_cell") {
    return [];
  }

  const board = getBoardBySide(side);
  const choiceMap = new Map();

  for (let index = 0; index < 9; index++) {
    const indexes = getAreaIndexes(index, action.range, side);
    const hitIndexes = indexes.filter((areaIndex) => {
      return isTargetableUnit(board[areaIndex]);
    });

    if (hitIndexes.length === 0) {
      continue;
    }

    const key = getAreaChoiceKey(action.range, index);

    if (!choiceMap.has(key)) {
      choiceMap.set(key, {
        side,
        index: getAreaTargetRepresentativeIndex(action.range, key),
        hitCount: hitIndexes.length
      });
    }
  }

  return Array.from(choiceMap.values());
}

function getSelectableTargetCandidatesForCurrentAction() {
  if (!gameState.selectedAction) {
    return [];
  }

  if (!canCurrentActorUseSelectedAction()) {
    return [];
  }

  if (gameState.selectedAction.target === "self" || gameState.selectedAction.target === "none") {
    return [];
  }

  const targetSide = getTargetSideForAction(gameState.selectedAction);

  if (targetSide && gameState.selectedAction.target === "enemy_any_cell") {
    return getSelectableAreaTargetCandidates(gameState.selectedAction, targetSide);
  }

  const candidates = [];

  for (const side of ["player", "enemy"]) {
    for (let index = 0; index < 9; index++) {
      if (isSelectableTarget(side, index)) {
        candidates.push({ side, index });
      }
    }
  }

  return candidates;
}

function getSelectableMoveDestinationCandidatesForCurrentAction() {
  if (
    !gameState.selectedAction ||
    !isTwoStepMoveAction(gameState.selectedAction) ||
    !gameState.selectedTarget
  ) {
    return [];
  }

  return getMoveDestinationIndexesForAction(
    gameState.selectedAction,
    gameState.selectedTarget.side,
    gameState.selectedTarget.index
  ).map((index) => ({
    side: gameState.selectedTarget.side,
    index
  }));
}

function getAreaIndexes(centerIndex, range, sideForFrontRow) {
  const row = getRow(centerIndex);
  const column = getColumn(centerIndex);

  if (range === "single_cell") {
    return [centerIndex];
  }

  if (range === "horizontal_3") {
    return [
      getIndex(row, 0),
      getIndex(row, 1),
      getIndex(row, 2)
    ].filter((index) => index !== null);
  }

  if (range === "vertical_3") {
    return [
      getIndex(0, column),
      getIndex(1, column),
      getIndex(2, column)
    ].filter((index) => index !== null);
  }

  if (range === "cross") {
    return [
      getIndex(row, column),
      getIndex(row - 1, column),
      getIndex(row + 1, column),
      getIndex(row, column - 1),
      getIndex(row, column + 1)
    ].filter((index) => index !== null);
  }

  if (range === "front_row") {
    return getCurrentFrontUnitIndexes(sideForFrontRow);
  }

  return [];
}

function getTargetCharacter() {
  if (!gameState.selectedTarget) {
    return null;
  }

  return getBoardBySide(gameState.selectedTarget.side)[gameState.selectedTarget.index];
}
