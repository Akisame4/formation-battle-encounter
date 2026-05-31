function chooseFirstAliveTarget(side) {
  const board = getBoardBySide(side);

  for (let index = 0; index < board.length; index++) {
    const character = board[index];

    if (isTargetableUnit(character)) {
      return { side, index };
    }
  }

  return null;
}

function chooseLowestHpAllyTarget(side) {
  const board = getBoardBySide(side);
  let bestTarget = null;
  let bestHpRate = Infinity;

  board.forEach((character, index) => {
    if (!isAliveRealCharacter(character)) {
      return;
    }

    const hpRate = character.hp / character.maxHp;

    if (hpRate < bestHpRate) {
      bestHpRate = hpRate;
      bestTarget = { side, index };
    }
  });

  return bestTarget;
}

function chooseFrontTarget(side) {
  const indexes = getCurrentFrontUnitIndexes(side);

  if (indexes.length === 0) {
    return null;
  }

  return { side, index: indexes[0] };
}

function chooseAnyEmptyCell(side) {
  const board = getBoardBySide(side);

  for (let index = 0; index < board.length; index++) {
    if (!board[index]) {
      return { side, index };
    }
  }

  return null;
}

function chooseMoveDestinationForTarget(action, side, fromIndex) {
  const destinationIndexes = getMoveDestinationIndexesForAction(action, side, fromIndex);

  if (destinationIndexes.length === 0) {
    return null;
  }

  return { side, index: destinationIndexes[0] };
}

function countAreaHits(side, centerIndex, range) {
  const board = getBoardBySide(side);
  const indexes = getAreaIndexes(centerIndex, range, side);
  let count = 0;

  indexes.forEach(index => {
    const character = board[index];

    if (isTargetableUnit(character)) {
      count++;
    }
  });

  return count;
}

function chooseBestAreaTarget(side, range) {
  let bestIndex = 0;
  let bestHits = -1;

  for (let index = 0; index < 9; index++) {
    const hits = countAreaHits(side, index, range);

    if (hits > bestHits) {
      bestHits = hits;
      bestIndex = index;
    }
  }

  return { side, index: bestIndex };
}

function chooseMovableTarget(side, action) {
  const board = getBoardBySide(side);

  for (let index = 0; index < board.length; index++) {
    const character = board[index];

    if (isAliveRealCharacter(character) && canMoveByAction(side, index, action)) {
      return { side, index };
    }
  }

  return chooseFirstAliveTarget(side);
}

function chooseEnemyAutoTarget(action) {
  const targetSide = getTargetSideForAction(action);

  if (!targetSide) {
    return null;
  }

  if (action.target === "enemy_front_unit") {
    return chooseFrontTarget(targetSide);
  }

  if (action.target === "enemy_front_row") {
    return chooseFrontTarget(targetSide);
  }

  if (action.target === "enemy_any_unit") {
    return chooseFirstAliveTarget(targetSide);
  }

  if (action.target === "enemy_opposite_unit") {
    const actorIndex = gameState.selectedActor ? gameState.selectedActor.index : 0;
    const oppositeIndex = getOppositeIndex(actorIndex);
    const board = getBoardBySide(targetSide);
    return isTargetableUnit(board[oppositeIndex]) ? { side: targetSide, index: oppositeIndex } : null;
  }

  if (action.target === "enemy_unit") {
    return chooseMovableTarget(targetSide, action);
  }

  if (action.target === "enemy_any_cell") {
    return chooseBestAreaTarget(targetSide, action.range);
  }

  if (action.target === "ally_unit") {
    if (
      action.type === "heal" ||
      action.type === "heal_and_guard" ||
      action.type === "guard"
    ) {
      return chooseLowestHpAllyTarget(targetSide);
    }

    if (action.type === "move") {
      return chooseMovableTarget(targetSide, action);
    }

    return chooseFirstAliveTarget(targetSide);
  }

  if (action.target === "ally_adjacent_unit") {
    const actorIndex = gameState.selectedActor ? gameState.selectedActor.index : 0;
    const board = getBoardBySide(targetSide);
    const index = getAdjacentIndexes(actorIndex).find(candidateIndex => isAliveRealCharacter(board[candidateIndex]));
    return index !== undefined ? { side: targetSide, index } : null;
  }

  if (action.target === "ally_horizontal_unit") {
    const actorIndex = gameState.selectedActor ? gameState.selectedActor.index : 0;
    const board = getBoardBySide(targetSide);
    const index = getHorizontalAdjacentIndexes(actorIndex).find(candidateIndex => isAliveRealCharacter(board[candidateIndex]));
    return index !== undefined ? { side: targetSide, index } : null;
  }

  if (action.target === "ally_empty_cell") {
    return chooseAnyEmptyCell(targetSide);
  }

  if (action.target === "ally_any_empty_cell") {
    return chooseMovableTarget(targetSide, action);
  }

  return null;
}

function scheduleEnemyAutoTurn() {
  if (
    gameState.enemyAutoRunning ||
    gameState.gameOver ||
    isHumanControlledSide(gameState.currentSide)
  ) {
    return;
  }

  gameState.enemyAutoRunning = true;

  setTimeout(async () => {
    await runEnemyAutoTurn();
    gameState.enemyAutoRunning = false;
  }, 500);
}

async function runEnemyAutoTurn() {
  if (gameState.gameOver || isHumanControlledSide(gameState.currentSide)) {
    renderAll();
    return;
  }

  if (!hasSelectableActor(gameState.currentSide)) {
    passCurrentSideTurn();
    renderAll();

    if (!isHumanControlledSide(gameState.currentSide)) {
      scheduleEnemyAutoTurn();
    }

    return;
  }

  const actorInfo = getFirstSelectableActor(gameState.currentSide);

  if (!actorInfo) {
    passCurrentSideTurn();
    renderAll();

    if (!isHumanControlledSide(gameState.currentSide)) {
      scheduleEnemyAutoTurn();
    }

    return;
  }

  gameState.selectedActor = {
    side: gameState.currentSide,
    index: actorInfo.index
  };

  const actor = getBoardBySide(gameState.currentSide)[actorInfo.index];

  const rolledNumber = rollDice();
  const selectedAction = actor.actions[rolledNumber];

  gameState.rolledNumber = null;
  gameState.selectedAction = null;
  gameState.selectedTarget = null;
  gameState.selectedMoveDestination = null;

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

【第${gameState.turnNumber}ターン】${getSideName(gameState.currentSide)}：${actor.name} の出目は ${gameState.rolledNumber}。
${gameState.selectedAction.label}`
  );

  if (gameState.selectedAction.target !== "self") {
    gameState.selectedTarget = chooseEnemyAutoTarget(gameState.selectedAction);
  }

  if (
    gameState.selectedAction &&
    isTwoStepMoveAction(gameState.selectedAction) &&
    gameState.selectedTarget
  ) {
    gameState.selectedMoveDestination = chooseMoveDestinationForTarget(
      gameState.selectedAction,
      gameState.selectedTarget.side,
      gameState.selectedTarget.index
    );
  }

  gameState.phase = "confirm";
  gameState.animation.locked = false;
  renderAll();

  setTimeout(() => {
    if (
      gameState.gameOver ||
      isHumanControlledSide(gameState.currentSide) ||
      gameState.phase !== "confirm"
    ) {
      renderAll();
      return;
    }

    executeCurrentActionWithVisualEffect();
  }, 500);
}