function applyGuard(character, guardValue) {
  if (!character || character.hp <= 0) {
    return;
  }

  character.guard = Math.max(character.guard || 0, guardValue);
}

function clearGuard(character) {
  if (!character || character.hp <= 0) {
    return 0;
  }

  const cleared = character.guard || 0;
  character.guard = 0;
  return cleared;
}

function applyAttackBuff(character, amount) {
  if (!isAliveRealCharacter(character)) {
    return false;
  }

  character.attackBuff = Math.max(character.attackBuff || 0, amount);
  return true;
}

function applyDebuff(character, key, amount) {
  if (!isTargetableUnit(character)) {
    return false;
  }

  character[key] = Math.max(character[key] || 0, amount);
  return true;
}

function applyPoison(character, amount) {
  if (!isAliveRealCharacter(character)) {
    return false;
  }

  character.poisonDamage = Math.max(character.poisonDamage || 0, amount || 10);
  return true;
}

function applyActionEndPoison(character) {
  if (!isAliveRealCharacter(character) || !character.poisonDamage) {
    return "";
  }

  const result = directDamageCharacter(character, character.poisonDamage);

  if (result.actualDamage <= 0) {
    return "";
  }

  return `${character.name} は行動終了時の毒により${result.actualDamage}ダメージを受けた。`;
}

function appendActionEndPoisonText(resultText, character) {
  const poisonText = applyActionEndPoison(character);

  if (!poisonText) {
    return resultText;
  }

  return `${resultText}
${poisonText}`;
}

function applyImmovable(character) {
  if (!isAliveRealCharacter(character)) {
    return false;
  }

  character.immovable = 1;
  return true;
}

function calculateActionDamage(actor, baseDamage) {
  const detail = {
    baseDamage: baseDamage || 0,
    damageDealtDecrease: actor && actor.damageDealtDecrease > 0 ? actor.damageDealtDecrease : 0,
    attackBuff: actor && actor.attackBuff > 0 ? actor.attackBuff : 0,
    damageAfterActorModifiers: baseDamage || 0,
    finalDamage: baseDamage || 0
  };

  let damage = detail.baseDamage;

  if (detail.damageDealtDecrease > 0) {
    damage = Math.max(0, damage - detail.damageDealtDecrease);
    actor.damageDealtDecrease = 0;
  }

  if (detail.attackBuff > 0) {
    damage += detail.attackBuff;
    actor.attackBuff = 0;
  }

  detail.damageAfterActorModifiers = damage;
  detail.finalDamage = damage;
  return detail;
}

function getActionDamage(actor, baseDamage) {
  return calculateActionDamage(actor, baseDamage).finalDamage;
}

function applyIncomingDamageIncrease(target, damage) {
  if (target && target.damageTakenIncrease > 0) {
    damage += target.damageTakenIncrease;
    target.damageTakenIncrease = 0;
  }

  return damage;
}

function applyIncomingDamageIncreaseWithDetail(target, damageDetail) {
  const incomingIncrease = target && target.damageTakenIncrease > 0 ? target.damageTakenIncrease : 0;

  if (incomingIncrease > 0) {
    target.damageTakenIncrease = 0;
  }

  damageDetail.incomingDamageIncrease = incomingIncrease;
  damageDetail.finalDamage = damageDetail.damageAfterActorModifiers + incomingIncrease;
  return damageDetail.finalDamage;
}

function attachDamageDetail(result, damageDetail) {
  return Object.assign(result, damageDetail);
}

function performDamage(actor, target, baseDamage) {
  const damageDetail = calculateActionDamage(actor, baseDamage);
  const finalDamage = applyIncomingDamageIncreaseWithDetail(target, damageDetail);
  return attachDamageDetail(damageCharacter(target, finalDamage), damageDetail);
}

function performDirectDamage(actor, target, baseDamage) {
  const damageDetail = calculateActionDamage(actor, baseDamage);
  const finalDamage = applyIncomingDamageIncreaseWithDetail(target, damageDetail);
  return attachDamageDetail(directDamageCharacter(target, finalDamage), damageDetail);
}

function getDamageDetailText(result) {
  if (!gameState.debugMode || !result || typeof result.finalDamage !== "number") {
    return "";
  }

  const parts = [`基礎${result.baseDamage}`];

  if (result.damageDealtDecrease > 0) {
    parts.push(`与ダメ減-${result.damageDealtDecrease}`);
  }

  if (result.attackBuff > 0) {
    parts.push(`攻撃強化+${result.attackBuff}`);
  }

  if (result.incomingDamageIncrease > 0) {
    parts.push(`被ダメ増+${result.incomingDamageIncrease}`);
  }

  if (result.reduced > 0) {
    parts.push(`防御軽減-${result.reduced}`);
  }

  parts.push(`実ダメージ${result.actualDamage}`);
  return `［計算：${parts.join(" / ")}］`;
}

function healCharacter(character, amount) {
  if (!character || character.hp <= 0) {
    return 0;
  }

  const beforeHp = character.hp;
  character.hp += amount;

  if (character.hp > character.maxHp) {
    character.hp = character.maxHp;
  }

  return character.hp - beforeHp;
}

function damageCharacter(character, damage) {
  if (!character || character.hp <= 0) {
    return { actualDamage: 0, reduced: 0 };
  }

  const guardValue = character.guard || 0;
  const reduced = Math.min(guardValue, damage);
  const actualDamage = Math.max(0, damage - reduced);

  character.guard = 0;
  character.hp -= actualDamage;

  if (character.hp < 0) {
    character.hp = 0;
  }

  return { actualDamage, reduced };
}

function directDamageCharacter(character, damage) {
  if (!character || character.hp <= 0) {
    return { actualDamage: 0 };
  }

  const beforeHp = character.hp;
  character.hp -= damage;

  if (character.hp < 0) {
    character.hp = 0;
  }

  return { actualDamage: beforeHp - character.hp };
}

function defeatCharacter(character) {
  if (!character || character.hp <= 0) {
    return false;
  }

  character.hp = 0;
  character.guard = 0;
  return true;
}

function getForwardIndex(side, index) {
  const nextIndex = side === "player" ? index - 3 : index + 3;
  return nextIndex >= 0 && nextIndex <= 8 ? nextIndex : null;
}

function getBackwardIndex(side, index) {
  const nextIndex = side === "player" ? index + 3 : index - 3;
  return nextIndex >= 0 && nextIndex <= 8 ? nextIndex : null;
}

function getPushIndex(side, index) {
  return getBackwardIndex(side, index);
}

function getPullIndex(side, index) {
  return getForwardIndex(side, index);
}

function tryMoveUnit(side, fromIndex, toIndex) {
  const board = getBoardBySide(side);

  if (toIndex === null || toIndex < 0 || toIndex > 8) {
    return false;
  }

  if (board[toIndex]) {
    return false;
  }

  const movingCharacter = board[fromIndex];

  if (movingCharacter && movingCharacter.immovable > 0) {
    movingCharacter.immovable = 0;
    return false;
  }

  board[toIndex] = board[fromIndex];
  board[fromIndex] = null;
  return true;
}

function moveSideways(side, fromIndex) {
  const board = getBoardBySide(side);
  const row = getRow(fromIndex);
  const column = getColumn(fromIndex);
  const leftIndex = getIndex(row, column - 1);
  const rightIndex = getIndex(row, column + 1);

  if (leftIndex !== null && !board[leftIndex]) {
    return tryMoveUnit(side, fromIndex, leftIndex);
  }

  if (rightIndex !== null && !board[rightIndex]) {
    return tryMoveUnit(side, fromIndex, rightIndex);
  }

  return false;
}

function getAdjacentIndexes(fromIndex) {
  const row = getRow(fromIndex);
  const column = getColumn(fromIndex);

  return [
    getIndex(row - 1, column),
    getIndex(row + 1, column),
    getIndex(row, column - 1),
    getIndex(row, column + 1)
  ].filter(index => index !== null);
}

function getMoveDestinationIndexesForAction(action, side, fromIndex) {
  if (!action) {
    return [];
  }

  const isMoveAction = action.type === "move";
  const isSidewaysDamageMoveAction = action.type === "damage_and_move" && action.moveDirection === "sideways";
  const isSelfAdjacentMove = action.type === "move_self_adjacent_empty";

  if (!isMoveAction && !isSidewaysDamageMoveAction && !isSelfAdjacentMove) {
    return [];
  }

  const board = getBoardBySide(side);

  if (!board[fromIndex]) {
    return [];
  }

  if (isSelfAdjacentMove) {
    return getAdjacentIndexes(fromIndex).filter(index => !board[index]);
  }

  if (action.move === "ally_any_empty_cell") {
    return board
      .map((character, index) => character ? null : index)
      .filter(index => index !== null && index !== fromIndex);
  }

  if (action.move === "ally_adjacent_empty_cell") {
    return getAdjacentIndexes(fromIndex).filter((index) => {
      return !board[index];
    });
  }

  if (
    action.move === "ally_sideways" ||
    action.move === "enemy_sideways" ||
    isSidewaysDamageMoveAction
  ) {
    const row = getRow(fromIndex);
    const column = getColumn(fromIndex);
    const destinationIndexes = [
      getIndex(row, column - 1),
      getIndex(row, column + 1)
    ];

    return destinationIndexes.filter((index) => {
      return index !== null && !board[index];
    });
  }

  if (action.move === "ally_forward" || action.move === "enemy_forward") {
    const toIndex = getForwardIndex(side, fromIndex);
    return toIndex !== null && !board[toIndex] ? [toIndex] : [];
  }

  if (action.move === "ally_backward" || action.move === "enemy_backward") {
    const toIndex = getBackwardIndex(side, fromIndex);
    return toIndex !== null && !board[toIndex] ? [toIndex] : [];
  }

  return [];
}

function canMoveByAction(side, fromIndex, action) {
  return getMoveDestinationIndexesForAction(action, side, fromIndex).length > 0;
}

function moveSelfToBackRow(side, fromIndex) {
  const board = getBoardBySide(side);
  const backIndexes = getBackRowIndexes(side);

  if (!board[fromIndex]) {
    return false;
  }

  if (backIndexes.includes(fromIndex)) {
    return false;
  }

  const sameColumnBackIndex = backIndexes.find(index => getColumn(index) === getColumn(fromIndex) && !board[index]);
  const destinationIndex = sameColumnBackIndex !== undefined
    ? sameColumnBackIndex
    : backIndexes.find(index => !board[index]);

  if (destinationIndex === undefined) {
    return false;
  }

  return tryMoveUnit(side, fromIndex, destinationIndex);
}

function moveSelfToRandomEmptyCell(side, fromIndex) {
  const board = getBoardBySide(side);
  const emptyIndexes = board
    .map((character, index) => !character && index !== fromIndex ? index : null)
    .filter(index => index !== null);

  if (emptyIndexes.length === 0) {
    return false;
  }

  const destinationIndex = emptyIndexes[Math.floor(Math.random() * emptyIndexes.length)];
  return tryMoveUnit(side, fromIndex, destinationIndex);
}

function moveSelfToAdjacentEmptyCell(side, fromIndex) {
  const board = getBoardBySide(side);
  const emptyIndexes = getAdjacentIndexes(fromIndex).filter(index => !board[index]);

  if (emptyIndexes.length === 0) {
    return false;
  }

  const destinationIndex = emptyIndexes[Math.floor(Math.random() * emptyIndexes.length)];
  return tryMoveUnit(side, fromIndex, destinationIndex);
}

function getActorBackRowDamage(actor, action) {
  if (!gameState.selectedActor || !action) {
    return action && action.damage ? action.damage : 0;
  }

  const multiplier = getBackRowIndexes(gameState.selectedActor.side).includes(gameState.selectedActor.index)
    ? (action.backRowMultiplier || 1)
    : 1;

  return (action.damage || 0) * multiplier;
}

function executeMove(action) {
  if (!gameState.selectedTarget) {
    return "移動対象が選ばれていません。";
  }

  const targetSide = gameState.selectedTarget.side;
  const fromIndex = gameState.selectedTarget.index;
  const targetBoard = getBoardBySide(targetSide);
  const target = targetBoard[fromIndex];

  if (!target || target.hp <= 0) {
    return "移動対象がいません。";
  }

  if (gameState.selectedMoveDestination) {
    if (gameState.selectedMoveDestination.side !== targetSide) {
      return "移動先が不正です。";
    }

    const destinationIndex = gameState.selectedMoveDestination.index;
    const destinationIndexes = getMoveDestinationIndexesForAction(action, targetSide, fromIndex);

    if (!destinationIndexes.includes(destinationIndex)) {
      return "そのマスへは移動できません。";
    }

    const targetName = target.name;
    const successByDrag = tryMoveUnit(targetSide, fromIndex, destinationIndex);

    if (!successByDrag) {
      return `${targetName} は移動できなかった。`;
    }

    if (
      gameState.selectedActor &&
      gameState.selectedActor.side === targetSide &&
      gameState.selectedActor.index === fromIndex
    ) {
      gameState.selectedActor.index = destinationIndex;
    }

    return `${targetName} は指定したマスへ移動した。`;
  }

  if (
    action.move === "ally_any_empty_cell" ||
    action.move === "ally_adjacent_empty_cell" ||
    action.move === "ally_sideways" ||
    action.move === "enemy_sideways"
  ) {
    return "移動先が選ばれていません。";
  }

  let success = false;

  if (action.move === "ally_forward" || action.move === "enemy_forward") {
    success = tryMoveUnit(targetSide, fromIndex, getForwardIndex(targetSide, fromIndex));
  }

  if (action.move === "ally_backward" || action.move === "enemy_backward") {
    success = tryMoveUnit(targetSide, fromIndex, getBackwardIndex(targetSide, fromIndex));
  }

  if (success) {
    return `${target.name} は移動した。`;
  }

  return `${target.name} は移動できなかった。`;
}

function chooseLowestHpAliveCharacter(side) {
  const board = getBoardBySide(side);
  let best = null;
  let bestRate = Infinity;

  board.forEach((character) => {
    if (!character || character.hp <= 0) {
      return;
    }

    const rate = character.hp / character.maxHp;

    if (rate < bestRate) {
      bestRate = rate;
      best = character;
    }
  });

  return best;
}

function chooseFacingAllyForGuard(targetIndex) {
  const allySide = gameState.currentSide;
  const allyBoard = getBoardBySide(allySide);
  const targetColumn = getColumn(targetIndex);
  const rowsFromFront = getRowsFromFront(allySide);

  for (const row of rowsFromFront) {
    const sameColumnIndex = row.find((index) => {
      return getColumn(index) === targetColumn;
    });

    const character = allyBoard[sameColumnIndex];

    if (character && character.hp > 0) {
      return character;
    }
  }

  return chooseLowestHpAliveCharacter(allySide);
}

function getAliveCharactersOnSide(side) {
  return getAliveCharacters(getBoardBySide(side));
}

function healAllCharacters(side, amount) {
  let totalHealed = 0;

  getAliveCharactersOnSide(side).forEach((character) => {
    totalHealed += healCharacter(character, amount);
  });

  return totalHealed;
}

function guardAllCharacters(side, guardValue) {
  let count = 0;

  getAliveCharactersOnSide(side).forEach((character) => {
    applyGuard(character, guardValue);
    count++;
  });

  return count;
}

function guardFrontRowCharacters(side, guardValue) {
  const board = getBoardBySide(side);
  let count = 0;

  getFrontRowIndexes(side).forEach((index) => {
    const character = board[index];

    if (character && character.hp > 0) {
      applyGuard(character, guardValue);
      count++;
    }
  });

  return count;
}

function moveTargetByDirection(side, index, direction) {
  if (direction === "push") {
    return tryMoveUnit(side, index, getPushIndex(side, index));
  }

  if (direction === "pull") {
    return tryMoveUnit(side, index, getPullIndex(side, index));
  }

  if (direction === "sideways") {
    return moveSideways(side, index);
  }

  return false;
}

function pullAllUnits(side) {
  const board = getBoardBySide(side);
  const rows = getRowsFromFront(side);
  let movedCount = 0;

  rows.forEach((row) => {
    row.forEach((index) => {
      const character = board[index];

      if (!isTargetableUnit(character)) {
        return;
      }

      const destination = getPullIndex(side, index);

      if (tryMoveUnit(side, index, destination)) {
        movedCount++;
      }
    });
  });

  return movedCount;
}

function guardMiddleRowCharacters(side, guardValue) {
  const board = getBoardBySide(side);
  const middleIndexes = [3, 4, 5];
  let count = 0;

  middleIndexes.forEach(index => {
    const character = board[index];

    if (isAliveRealCharacter(character)) {
      applyGuard(character, guardValue);
      count++;
    }
  });

  return count;
}

function healFrontRowCharacters(side, amount) {
  const board = getBoardBySide(side);
  const frontIndexes = getFrontRowIndexes(side);
  let totalHealed = 0;

  frontIndexes.forEach(index => {
    const character = board[index];

    if (isAliveRealCharacter(character)) {
      totalHealed += healCharacter(character, amount);
    }
  });

  return totalHealed;
}

function buffAdjacentCharacters(side, centerIndex, amount, maxTargets) {
  const board = getBoardBySide(side);
  const targets = getAdjacentIndexes(centerIndex)
    .map(index => board[index])
    .filter(character => isAliveRealCharacter(character));
  let count = 0;

  targets.slice(0, maxTargets || targets.length).forEach(character => {
    if (applyAttackBuff(character, amount)) {
      count++;
    }
  });

  return count;
}

function buffHorizontalAdjacentCharacters(side, centerIndex, amount, maxTargets) {
  const board = getBoardBySide(side);
  const targets = getHorizontalAdjacentIndexes(centerIndex)
    .map(index => board[index])
    .filter(character => isAliveRealCharacter(character));
  let count = 0;

  targets.slice(0, maxTargets || targets.length).forEach(character => {
    if (applyAttackBuff(character, amount)) {
      count++;
    }
  });

  return count;
}

function placeDecoy(side, index, hp) {
  const board = getBoardBySide(side);

  if (index === null || index < 0 || index > 8 || board[index]) {
    return null;
  }

  const decoy = {
    id: "decoy",
    name: "デコイ",
    job: "デコイ",
    role: "攻撃対象になるお邪魔マス",
    image: "assets/decoy.png",
    hp,
    maxHp: hp,
    guard: 0,
    cooldown: 0,
    isDecoy: true,
    unitId: `unit-${gameState.nextUnitId}`,
    actions: {}
  };

  gameState.nextUnitId++;
  board[index] = decoy;
  return decoy;
}

function executeAction() {
  const actorBoard = getBoardBySide(gameState.selectedActor.side);
  const actor = actorBoard[gameState.selectedActor.index];
  const action = gameState.selectedAction;

  if (!actor || actor.hp <= 0 || !action) {
    return "行動できません。";
  }

  const actionStartPrefix = "";

  if (!canUseActionFromActorPosition(action, gameState.selectedActor.side, gameState.selectedActor.index)) {
    return `${actionStartPrefix}${actor.name} は前列にいないため、近接攻撃できなかった。`;
  }

  if (action.type === "miss") {
    return `${actionStartPrefix}${actor.name} の行動は失敗した。`;
  }

  if (action.type === "self_defeat") {
    defeatCharacter(actor);
    return actionStartPrefix + `${actor.name} は暗殺に失敗し、倒れてしまった。`;
  }

  if (action.type === "self_damage") {
    const result = directDamageCharacter(actor, action.damage);
    return actionStartPrefix + `${actor.name} は無理な攻撃姿勢で、自分に${result.actualDamage}ダメージを受けた。${getDamageDetailText(result)}`;
  }

  if (action.type === "damage") {
    const target = getTargetCharacter();

    if (!target) {
      return actionStartPrefix + "対象がいません。";
    }

    const result = performDamage(actor, target, action.damage);
    return actionStartPrefix + `${actor.name} は ${target.name} に ${result.actualDamage} ダメージを与えた。${result.reduced > 0 ? ` 防御で${result.reduced}軽減。` : ""}${getDamageDetailText(result)}`;
  }

  if (action.type === "sniper_damage") {
    const target = getTargetCharacter();

    if (!target) {
      return actionStartPrefix + "対象がいません。";
    }

    const baseDamage = getActorBackRowDamage(actor, action);
    const result = performDamage(actor, target, baseDamage);
    const backRowText = baseDamage > action.damage ? " 後列効果で攻撃力2倍。" : "";
    return actionStartPrefix + `${actor.name} は ${target.name} に ${result.actualDamage} ダメージを与えた。${backRowText}${result.reduced > 0 ? ` 防御で${result.reduced}軽減。` : ""}${getDamageDetailText(result)}`;
  }

  if (action.type === "opposite_damage") {
    const target = getTargetCharacter();

    if (!target) {
      return actionStartPrefix + `${actor.name} の対応マス攻撃は、対応する位置に敵がいないため失敗した。`;
    }

    const result = performDamage(actor, target, action.damage);
    return actionStartPrefix + `${actor.name} は対応マスの ${target.name} に ${result.actualDamage} ダメージを与えた。${result.reduced > 0 ? ` 防御で${result.reduced}軽減。` : ""}${getDamageDetailText(result)}`;
  }

  if (action.type === "damage_and_poison") {
    const target = getTargetCharacter();

    if (!target) {
      return actionStartPrefix + "対象がいません。";
    }

    const result = performDamage(actor, target, action.damage);
    const poisoned = target.hp > 0 && applyPoison(target, action.poisonDamage || 10);
    return actionStartPrefix + `${actor.name} は ${target.name} に ${result.actualDamage} ダメージを与えた。${poisoned ? ` ${target.name} に毒を付与した。` : ""}${result.reduced > 0 ? ` 防御で${result.reduced}軽減。` : ""}${getDamageDetailText(result)}`;
  }

  if (action.type === "piercing_damage") {
    const target = getTargetCharacter();

    if (!target) {
      return actionStartPrefix + "対象がいません。";
    }

    const result = performDirectDamage(actor, target, action.damage);
    return actionStartPrefix + `${actor.name} は ${target.name} に防御を貫通して ${result.actualDamage} ダメージを与えた。${getDamageDetailText(result)}`;
  }

  if (action.type === "damage_and_self_guard") {
    const target = getTargetCharacter();

    if (!target) {
      return actionStartPrefix + "対象がいません。";
    }

    const result = performDamage(actor, target, action.damage);
    applyGuard(actor, action.guard);
    return actionStartPrefix + `${actor.name} は ${target.name} に ${result.actualDamage} ダメージを与え、自分に防御${action.guard}を得た。${result.reduced > 0 ? ` 防御で${result.reduced}軽減。` : ""}${getDamageDetailText(result)}`;
  }

  if (action.type === "damage_and_ally_guard") {
    const target = getTargetCharacter();

    if (!target) {
      return actionStartPrefix + "対象がいません。";
    }

    const result = performDamage(actor, target, action.damage);
    const guardedAlly = chooseFacingAllyForGuard(gameState.selectedTarget.index);

    if (guardedAlly) {
      applyGuard(guardedAlly, action.guard);
      return actionStartPrefix + `${actor.name} は ${target.name} に ${result.actualDamage} ダメージを与え、${target.name} と向かい合う ${guardedAlly.name} に防御${action.guard}を付与した。${result.reduced > 0 ? ` 防御で${result.reduced}軽減。` : ""}${getDamageDetailText(result)}`;
    }

    return actionStartPrefix + `${actor.name} は ${target.name} に ${result.actualDamage} ダメージを与えた。${result.reduced > 0 ? ` 防御で${result.reduced}軽減。` : ""}${getDamageDetailText(result)}`;
  }

  if (action.type === "damage_and_move") {
    const target = getTargetCharacter();

    if (!target || !gameState.selectedTarget) {
      return actionStartPrefix + "対象がいません。";
    }

    const targetName = target.name;
    const targetSide = gameState.selectedTarget.side;
    const targetIndex = gameState.selectedTarget.index;
    const result = performDamage(actor, target, action.damage);
    let moved = false;

    if (target.hp > 0) {
      if (action.moveDirection === "sideways") {
        if (gameState.selectedMoveDestination) {
          const destinationIndex = gameState.selectedMoveDestination.index;
          const destinationIndexes = getMoveDestinationIndexesForAction(action, targetSide, targetIndex);

          if (
            gameState.selectedMoveDestination.side === targetSide &&
            destinationIndexes.includes(destinationIndex)
          ) {
            moved = tryMoveUnit(targetSide, targetIndex, destinationIndex);
          }
        }
      } else {
        moved = moveTargetByDirection(targetSide, targetIndex, action.moveDirection);
      }
    }

    return actionStartPrefix + `${actor.name} は ${targetName} に ${result.actualDamage} ダメージを与えた。${moved ? ` ${targetName} は指定した横マスへ移動した。` : ` ${targetName} は移動しなかった。`}${result.reduced > 0 ? ` 防御で${result.reduced}軽減。` : ""}${getDamageDetailText(result)}`;
  }



  if (action.type === "damage_and_self_immovable") {
    const target = getTargetCharacter();

    if (!target) {
      return actionStartPrefix + "対象がいません。";
    }

    const result = performDamage(actor, target, action.damage);
    applyImmovable(actor);
    return actionStartPrefix + `${actor.name} は ${target.name} に ${result.actualDamage} ダメージを与え、自分に移動不可を得た。${result.reduced > 0 ? ` 防御で${result.reduced}軽減。` : ""}${getDamageDetailText(result)}`;
  }

  if (action.type === "damage_and_self_heal") {
    const target = getTargetCharacter();

    if (!target) {
      return actionStartPrefix + "対象がいません。";
    }

    const result = performDamage(actor, target, action.damage);
    const healed = healCharacter(actor, action.amount);
    return actionStartPrefix + `${actor.name} は ${target.name} に ${result.actualDamage} ダメージを与え、自分を${healed}回復した。${result.reduced > 0 ? ` 防御で${result.reduced}軽減。` : ""}${getDamageDetailText(result)}`;
  }

  if (action.type === "damage_and_debuff") {
    const target = getTargetCharacter();

    if (!target) {
      return actionStartPrefix + "対象がいません。";
    }

    const result = performDamage(actor, target, action.damage);
    applyDebuff(target, action.debuff, action.amount);
    const debuffText = action.debuff === "damageTakenIncrease" ? `次に受けるダメージ+${action.amount}` : `次の攻撃ダメージ-${action.amount}`;
    return actionStartPrefix + `${actor.name} は ${target.name} に ${result.actualDamage} ダメージを与え、${debuffText}を付与した。${result.reduced > 0 ? ` 防御で${result.reduced}軽減。` : ""}${getDamageDetailText(result)}`;
  }

  if (action.type === "damage_and_self_damage") {
    const target = getTargetCharacter();

    if (!target) {
      return actionStartPrefix + "対象がいません。";
    }

    const result = performDamage(actor, target, action.damage);
    const selfResult = directDamageCharacter(actor, action.selfDamage);
    return actionStartPrefix + `${actor.name} は ${target.name} に ${result.actualDamage} ダメージを与え、自分に${selfResult.actualDamage}ダメージを受けた。${result.reduced > 0 ? ` 防御で${result.reduced}軽減。` : ""}${getDamageDetailText(result)}`;
  }

  if (action.type === "instant_defeat") {
    const target = getTargetCharacter();

    if (!target) {
      return actionStartPrefix + `${actor.name} の暗殺は対象がいないため失敗した。`;
    }

    defeatCharacter(target);
    return actionStartPrefix + `${actor.name} は ${target.name} を一撃で倒した。`;
  }

  if (action.type === "clear_guard") {
    const target = getTargetCharacter();

    if (!target) {
      return actionStartPrefix + "対象がいません。";
    }

    const cleared = clearGuard(target);
    return actionStartPrefix + `${actor.name} は ${target.name} の防御${cleared}を解除した。`;
  }

  if (action.type === "clear_guard_and_damage") {
    const target = getTargetCharacter();

    if (!target) {
      return actionStartPrefix + "対象がいません。";
    }

    const cleared = clearGuard(target);
    const result = performDirectDamage(actor, target, action.damage);
    return actionStartPrefix + `${actor.name} は ${target.name} の防御${cleared}を解除し、${result.actualDamage} ダメージを与えた。${getDamageDetailText(result)}`;
  }

  if (action.type === "move_self_back") {
    const moved = moveSelfToBackRow(gameState.selectedActor.side, gameState.selectedActor.index);
    return actionStartPrefix + (moved ? `${actor.name} は最後列へ移動した。` : `${actor.name} は最後列へ移動できなかった。`);
  }

  if (action.type === "move_self_random_empty") {
    const moved = moveSelfToRandomEmptyCell(gameState.selectedActor.side, gameState.selectedActor.index);
    return actionStartPrefix + (moved ? `${actor.name} はランダムな空き地へ移動した。` : `${actor.name} は移動できる空き地がなかった。`);
  }

  if (action.type === "move_self_adjacent_empty") {
    let moved = false;
    if (gameState.selectedMoveDestination) {
      moved = tryMoveUnit(
        gameState.selectedActor.side,
        gameState.selectedActor.index,
        gameState.selectedMoveDestination.index
      );
    } else {
      moved = moveSelfToAdjacentEmptyCell(gameState.selectedActor.side, gameState.selectedActor.index);
    }
    return actionStartPrefix + (moved ? `${actor.name} は隣接する空きマスへ移動した。` : `${actor.name} は隣接する空きマスへ移動できなかった。`);
  }

  if (action.type === "self_guard") {
    applyGuard(actor, action.guard);
    return actionStartPrefix + `${actor.name} は自分に防御${action.guard}を得た。`;
  }

  if (action.type === "heal") {
    const target = getTargetCharacter();

    if (!target) {
      return actionStartPrefix + "対象がいません。";
    }

    const healed = healCharacter(target, action.amount);
    return actionStartPrefix + `${actor.name} は ${target.name} を ${healed} 回復した。`;
  }

  if (action.type === "guard") {
    const target = getTargetCharacter();

    if (!target) {
      return actionStartPrefix + "対象がいません。";
    }

    applyGuard(target, action.guard);
    return actionStartPrefix + `${actor.name} は ${target.name} に防御${action.guard}を付与した。`;
  }

  if (action.type === "heal_and_guard") {
    const target = getTargetCharacter();

    if (!target) {
      return actionStartPrefix + "対象がいません。";
    }

    const healed = healCharacter(target, action.amount);
    applyGuard(target, action.guard);
    return actionStartPrefix + `${actor.name} は ${target.name} を ${healed} 回復し、防御${action.guard}を付与した。`;
  }

  if (action.type === "heal_all") {
    const healed = healAllCharacters(gameState.currentSide, action.amount);
    return actionStartPrefix + `${actor.name} は味方全体を合計${healed}回復した。`;
  }

  if (action.type === "guard_all") {
    const count = guardAllCharacters(gameState.currentSide, action.guard);
    return actionStartPrefix + `${actor.name} は味方${count}体に防御${action.guard}を付与した。`;
  }

  if (action.type === "guard_front") {
    const count = guardFrontRowCharacters(gameState.currentSide, action.guard);
    return actionStartPrefix + `${actor.name} は味方前列${count}体に防御${action.guard}を付与した。`;
  }

  if (action.type === "guard_middle") {
    const count = guardMiddleRowCharacters(gameState.currentSide, action.guard);
    return actionStartPrefix + `${actor.name} は味方中列${count}体に防御${action.guard}を付与した。`;
  }

  if (action.type === "heal_front") {
    const healed = healFrontRowCharacters(gameState.currentSide, action.amount);
    return actionStartPrefix + `${actor.name} は味方前列を合計${healed}回復した。`;
  }

  if (action.type === "attack_buff") {
    const target = getTargetCharacter();

    if (!target) {
      return actionStartPrefix + "対象がいません。";
    }

    applyAttackBuff(target, action.amount);
    return actionStartPrefix + `${actor.name} は ${target.name} の次の攻撃ダメージを+${action.amount}した。`;
  }

  if (action.type === "attack_buff_adjacent_all") {
    const count = buffAdjacentCharacters(gameState.currentSide, gameState.selectedActor.index, action.amount, action.maxTargets);
    return actionStartPrefix + `${actor.name} は隣接する味方${count}体の次の攻撃ダメージを+${action.amount}した。`;
  }

  if (action.type === "attack_buff_horizontal_all") {
    const count = buffHorizontalAdjacentCharacters(gameState.currentSide, gameState.selectedActor.index, action.amount, action.maxTargets);
    return actionStartPrefix + `${actor.name} は左右の味方${count}体の次の攻撃ダメージを+${action.amount}した。`;
  }

  if (action.type === "attack_buff_all") {
    let count = 0;
    getAliveCharactersOnSide(gameState.currentSide).forEach(character => {
      if (applyAttackBuff(character, action.amount)) {
        count++;
      }
    });
    return actionStartPrefix + `${actor.name} は味方${count}体の次の攻撃ダメージを+${action.amount}した。`;
  }

  if (action.type === "place_decoy") {
    if (!gameState.selectedTarget) {
      return actionStartPrefix + "配置先が選ばれていません。";
    }

    const decoy = placeDecoy(gameState.currentSide, gameState.selectedTarget.index, action.hp || 20);
    return actionStartPrefix + (decoy ? `${actor.name} はデコイを配置した。` : `${actor.name} はデコイを配置できなかった。`);
  }

  if (action.type === "heal_all_and_guard_all") {
    const healed = healAllCharacters(gameState.currentSide, action.amount);
    const count = guardAllCharacters(gameState.currentSide, action.guard);
    return actionStartPrefix + `${actor.name} は味方全体を合計${healed}回復し、味方${count}体に防御${action.guard}を付与した。`;
  }

  if (action.type === "pull_all_enemies") {
    const targetSide = getEnemySide(gameState.currentSide);
    const movedCount = pullAllUnits(targetSide);
    return actionStartPrefix + `${actor.name} は敵全体を引き寄せた。${movedCount}体が移動した。`;
  }

  if (action.type === "enemy_all_damage_and_self_damage") {
    const targetSide = getEnemySide(gameState.currentSide);
    const damagedNames = [];
    const damage = getActionDamage(actor, action.damage);

    getBoardBySide(targetSide).forEach(target => {
      if (isTargetableUnit(target)) {
        const result = damageCharacter(target, applyIncomingDamageIncrease(target, damage));
        damagedNames.push(`${target.name}に${result.actualDamage}`);
      }
    });

    const selfResult = directDamageCharacter(actor, action.selfDamage);

    if (damagedNames.length === 0) {
      return actionStartPrefix + `${actor.name} の全体攻撃は誰にも当たらず、自分に${selfResult.actualDamage}ダメージを受けた。`;
    }

    return actionStartPrefix + `${actor.name} の全体攻撃。${damagedNames.join("、")} ダメージ。自分に${selfResult.actualDamage}ダメージ。`;
  }

  if (action.type === "area_damage") {
    const targetSide = getTargetSideForAction(action);
    const targetBoard = getBoardBySide(targetSide);
    const centerIndex = gameState.selectedTarget ? gameState.selectedTarget.index : 0;
    const indexes = getAreaIndexes(centerIndex, action.range, targetSide);
    const damagedNames = [];

    const damage = getActionDamage(actor, action.damage);

    indexes.forEach(index => {
      const target = targetBoard[index];

      if (isTargetableUnit(target)) {
        const result = damageCharacter(target, applyIncomingDamageIncrease(target, damage));
        damagedNames.push(`${target.name}に${result.actualDamage}`);
      }
    });

    if (damagedNames.length === 0) {
      return actionStartPrefix + `${actor.name} の範囲攻撃は誰にも当たらなかった。`;
    }

    return actionStartPrefix + `${actor.name} の範囲攻撃。${damagedNames.join("、")} ダメージ。`;
  }

  if (action.type === "move") {
    return actionStartPrefix + executeMove(action);
  }

  return actionStartPrefix + "何も起こらなかった。";
}

function removeDefeatedCharacters(board) {
  const removedUnits = [];

  board.forEach((character, index) => {
    if (character && character.hp <= 0) {
      removedUnits.push({
        unitId: character.unitId,
        name: character.name,
        index
      });
      board[index] = null;
    }
  });

  return removedUnits;
}

function removeDefeatedCharactersFromSide(side) {
  const board = getBoardBySide(side);
  const removedUnits = removeDefeatedCharacters(board);

  removedUnits.forEach(unit => {
    unit.side = side;
  });

  return removedUnits;
}

function createMovementRecord(side, character, fromIndex, toIndex) {
  if (!character || fromIndex === toIndex || fromIndex === null || toIndex === null) {
    return null;
  }

  return {
    side,
    unitId: character.unitId,
    fromIndex,
    toIndex
  };
}

function autoAdvanceSide(side) {
  const board = getBoardBySide(side);
  const movements = [];

  while (getAliveCharacters(board).length > 0) {
    const frontIndexes = getFrontRowIndexes(side);
    const hasFrontUnit = frontIndexes.some(index => board[index] && board[index].hp > 0);

    if (hasFrontUnit) {
      break;
    }

    const nextBoard = Array(9).fill(null);
    const stepMovements = [];

    board.forEach((character, index) => {
      if (!character || character.hp <= 0) {
        return;
      }

      const destination = getForwardIndex(side, index);

      if (destination !== null) {
        nextBoard[destination] = character;

        const movement = createMovementRecord(side, character, index, destination);

        if (movement) {
          stepMovements.push(movement);
        }
      }
    });

    for (let i = 0; i < 9; i++) {
      board[i] = nextBoard[i];
    }

    movements.push(...stepMovements);
  }

  return movements;
}

function applyAutoAdvance() {
  const movements = [];

  movements.push(...autoAdvanceSide("player"));
  movements.push(...autoAdvanceSide("enemy"));

  gameState.animation.movingUnits = movements;
  return movements;
}

function isAllDefeated(board) {
  return getAliveCharacters(board).length === 0;
}

function checkGameEnd() {
  if (isAllDefeated(gameState.enemyBoard)) {
    if (gameState.battleMode === "stage") {
      const currentStage = gameState.stageNumber || 1;
      const maxStage = gameState.maxStage || getStageCount();
      const stageName = getStageName(currentStage);

      if (currentStage >= maxStage) {
        gameState.gameOver = true;
        gameState.stageCleared = false;
        gameState.phase = "game_over";
        return `全${maxStage}ステージ制覇！ 最終ステージ「${stageName}」を突破した。`;
      }

      gameState.stageCleared = true;
      gameState.phase = "stage_clear";
      return `ステージ${currentStage}「${stageName}」クリア！ 次のステージへ進めます。`;
    }

    gameState.gameOver = true;
    gameState.phase = "game_over";
    return "勝利！ 敵をすべて倒した。";
  }

  if (isAllDefeated(gameState.playerBoard)) {
    gameState.gameOver = true;
    gameState.stageCleared = false;
    gameState.phase = "game_over";

    if (gameState.battleMode === "stage") {
      const currentStage = gameState.stageNumber || 1;
      const stageName = getStageName(currentStage);
      return `敗北……。ステージ${currentStage}「${stageName}」で味方が倒された。`;
    }

    return "敗北……。味方が倒された。";
  }

  return "";
}

function isSecondSideTurnEnding() {
  return !!gameState.secondSide && gameState.currentSide === gameState.secondSide;
}

function isDecisiveMomentTurnReached() {
  const startTurn = gameState.decisiveMomentStartTurn || 20;
  return gameState.turnNumber >= startTurn;
}

function isDecisiveMomentOneOnOne() {
  return getAliveCharacterCount("player") === 1 && getAliveCharacterCount("enemy") === 1;
}

function getDecisiveMomentTriggerText() {
  const reasons = [];

  if (isDecisiveMomentTurnReached()) {
    reasons.push(`第${gameState.decisiveMomentStartTurn || 20}ターン以降`);
  }

  if (isDecisiveMomentOneOnOne()) {
    reasons.push("両軍残り1人");
  }

  return reasons.length > 0 ? `（${reasons.join("・")}）` : "";
}

function shouldTriggerDecisiveMoment() {
  if (gameState.gameOver) {
    return false;
  }

  if (!isSecondSideTurnEnding()) {
    return false;
  }

  return isDecisiveMomentTurnReached() || isDecisiveMomentOneOnOne();
}

function applyDecisiveMomentDamage() {
  if (!shouldTriggerDecisiveMoment()) {
    return "";
  }

  const damage = gameState.decisiveMomentDamage || 10;
  const triggerText = getDecisiveMomentTriggerText();
  const damagedTexts = [];

  [
    { side: "player", board: gameState.playerBoard },
    { side: "enemy", board: gameState.enemyBoard }
  ].forEach(group => {
    group.board.forEach(character => {
      if (!isTargetableUnit(character)) {
        return;
      }

      const result = directDamageCharacter(character, damage);

      if (result.actualDamage > 0) {
        damagedTexts.push(`${getSideName(group.side)} ${character.name}に${result.actualDamage}`);
      }
    });
  });

  if (damagedTexts.length === 0) {
    return `決着の刻${triggerText}。全員に${damage}ダメージが降り注いだが、対象はいなかった。`;
  }

  return `決着の刻${triggerText}。全員に${damage}ダメージ。${damagedTexts.join("、")}。`;
}

function clearSelection() {
  gameState.selectedActor = null;
  gameState.selectedAction = null;
  gameState.selectedTarget = null;
  gameState.selectedMoveDestination = null;
  gameState.rolledNumber = null;
}

function reduceCooldownsForSide(side, actedCharacter) {
  const board = getBoardBySide(side);
  const aliveCount = getAliveCharacterCount(side);

  board.forEach(character => {
    if (!character || character.hp <= 0) {
      return;
    }

    if (character === actedCharacter) {
      character.cooldown = aliveCount <= 1 ? 0 : 2;
    }

    if (character.cooldown > 0) {
      character.cooldown -= 1;
    }
  });
}

function advanceToNextSideAfterTurn(endingSide) {
  gameState.currentSide = getEnemySide(endingSide);

  if (gameState.secondSide && endingSide === gameState.secondSide) {
    gameState.turnNumber++;
  }

  clearSelection();
  gameState.phase = "select_actor";
}

function endTurn(actedCharacter) {
  const endingSide = gameState.currentSide;

  reduceCooldownsForSide(endingSide, actedCharacter);
  advanceToNextSideAfterTurn(endingSide);
}

function passCurrentSideTurn() {
  if (gameState.animation.locked) {
    return;
  }

  const passingSide = gameState.currentSide;
  const board = getBoardBySide(gameState.currentSide);

  board.forEach(character => {
    if (character && character.cooldown > 0) {
      character.cooldown -= 1;
    }
  });

  const decisiveText = applyDecisiveMomentDamage();

  if (decisiveText) {
    logMessage(`\n${decisiveText}`);
    removeDefeatedCharactersFromSide("player");
    removeDefeatedCharactersFromSide("enemy");

    const gameEndText = checkGameEnd();

    if (gameEndText) {
      gameState.animation.locked = false;
      gameState.animation.movingUnits = [];
      logMessage(`\n\n${gameEndText}`);
      renderAll();
      return;
    }

    applyAutoAdvance();
  }

  advanceToNextSideAfterTurn(passingSide);

  logMessage(`\n${getSideName(passingSide)}はターンを終了した。`);
}

function handleActionProgressError(error) {
  console.error("Action progression error:", error);

  gameState.animation.locked = false;
  gameState.animation.movingUnits = [];

  logMessage("\n行動処理中にエラーが発生したため、操作ロックを解除しました。コンソールのエラー内容を確認してください。");

  try {
    renderAll();
  } catch (renderError) {
    console.error("Render error after action progression error:", renderError);
  }
}

function completeTurnTransition(actedCharacter) {
  endTurn(actedCharacter);
  gameState.animation.locked = false;
  gameState.animation.movingUnits = [];
  renderAll();

  if (gameState.battleMode === "online") {
    pushBattleState();
  } else if (!isHumanControlledSide(gameState.currentSide)) {
    scheduleEnemyAutoTurn();
  }
}

function finishTurnAfterAnimations(actedCharacter) {
  try {
    const gameEndText = checkGameEnd();

    if (gameEndText) {
      gameState.animation.locked = false;
      gameState.animation.movingUnits = [];
      logMessage(`

${gameEndText}`);
      renderAll();
      if (gameState.battleMode === "online") pushBattleState();
      return;
    }

    const decisiveText = applyDecisiveMomentDamage();

    if (!decisiveText) {
      completeTurnTransition(actedCharacter);
      return;
    }

    logMessage(`
${decisiveText}`);
    renderAll();

    setTimeout(() => {
      try {
        removeDefeatedCharactersFromSide("player");
        removeDefeatedCharactersFromSide("enemy");

        const decisiveGameEndText = checkGameEnd();

        if (decisiveGameEndText) {
          gameState.animation.locked = false;
          gameState.animation.movingUnits = [];
          logMessage(`

${decisiveGameEndText}`);
          renderAll();
          if (gameState.battleMode === "online") pushBattleState();
          return;
        }

        const movements = applyAutoAdvance();
        renderAll();

        const slideWait = movements.length > 0 ? gameState.animation.slideDuration : 0;

        setTimeout(() => {
          completeTurnTransition(actedCharacter);
        }, slideWait);
      } catch (error) {
        handleActionProgressError(error);
      }
    }, gameState.animation.hpDuration + gameState.animation.defeatDuration);
  } catch (error) {
    handleActionProgressError(error);
  }
}

function proceedAfterTurn(actedCharacter) {
  gameState.animation.locked = true;
  renderAll();

  setTimeout(() => {
    try {
      removeDefeatedCharactersFromSide("player");
      removeDefeatedCharactersFromSide("enemy");

      const gameEndText = checkGameEnd();

      if (gameEndText) {
        gameState.animation.locked = false;
        gameState.animation.movingUnits = [];
        logMessage(`

${gameEndText}`);
        renderAll();
        return;
      }

      const movements = applyAutoAdvance();
      renderAll();

      const slideWait = movements.length > 0 ? gameState.animation.slideDuration : 0;

      setTimeout(() => {
        finishTurnAfterAnimations(actedCharacter);
      }, slideWait);
    } catch (error) {
      handleActionProgressError(error);
    }
  }, gameState.animation.hpDuration + gameState.animation.defeatDuration);
}

function executeCurrentActionWithVisualEffect() {
  if (!gameState.selectedActor || !gameState.selectedAction) {
    return;
  }

  if (typeof beginActionResolution === "function" && !beginActionResolution()) {
    return;
  }

  try {
    const actorBoard = getBoardBySide(gameState.selectedActor.side);
    const actedCharacter = actorBoard[gameState.selectedActor.index];
    const resultText = appendActionEndPoisonText(executeAction(), actedCharacter);

    logMessage(`
${resultText}`);
    proceedAfterTurn(actedCharacter);
  } catch (error) {
    handleActionProgressError(error);
  }
}

