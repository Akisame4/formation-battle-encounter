const PARTY_CODE_VERSION = 1;
const PARTY_CODE_PREFIX = "DBP1";
const PARTY_CODE_XOR_KEY = "dice-battle-party-code-v1";
const PARTY_CHARACTER_CODE_MAP = {
  olive: "0",
  chaco: "1",
  chilchil: "2",
  lunaluna: "3",
  jay: "4",
  shinonome: "5",
  moni: "6",
  cocon: "7",
  dean: "8",
  yue: "9",
  indra: "A",
  kashu: "B",
  cafe: "C",
  godo: "D",
  dragon: "E",
  nano: "F",
  fang: "G",
  maiyu: "H",
  ruma: "I",
  rock: "J",
  teruru: "K",
  bei: "L",
  sai: "M"
};

function getCharacterIdFromPartyCodeSymbol(symbol) {
  const targetSymbol = String(symbol);

  return Object.keys(PARTY_CHARACTER_CODE_MAP).find((id) => {
    return PARTY_CHARACTER_CODE_MAP[id] === targetSymbol;
  }) || "";
}

function normalizePartyFormationEntries(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }

  return entries.map((entry) => {
    if (!entry) {
      return null;
    }

    if (Array.isArray(entry)) {
      return {
        id: String(entry[0] || ""),
        position: Number(entry[1])
      };
    }

    return {
      id: String(entry.id || ""),
      position: Number(entry.position)
    };
  }).filter(entry => entry && entry.id);
}

function getAllCharacterTemplatesById() {
  const result = {};

  getCharacterPool().forEach((character) => {
    if (character && character.id && !result[character.id]) {
      result[character.id] = character;
    }
  });

  return result;
}

function getCharacterTemplateById(id) {
  const templates = getAllCharacterTemplatesById();
  return templates[id] || null;
}


function rotatePartyFormationPositionForEnemy(position) {
  const numericPosition = Number(position);

  if (!Number.isInteger(numericPosition) || numericPosition < 0 || numericPosition > 8) {
    return numericPosition;
  }

  const row = Math.floor(numericPosition / 3);
  const column = numericPosition % 3;
  const rotatedRow = 2 - row;
  const rotatedColumn = 2 - column;

  return rotatedRow * 3 + rotatedColumn;
}

function getPartyFormationFromBoard(board) {
  const entries = [];

  board.forEach((character, position) => {
    if (character && character.id) {
      entries.push({
        id: character.id,
        position
      });
    }
  });

  return entries;
}

function getPartyFormationFromNames(names, side) {
  const board = createPartyBoardFromSelectedNames(names, side);
  return getPartyFormationFromBoard(board);
}

function validatePartyFormation(entries) {
  const normalizedEntries = normalizePartyFormationEntries(entries);
  const errors = [];
  const templates = getAllCharacterTemplatesById();
  const usedIds = new Set();
  const usedPositions = new Set();

  if (normalizedEntries.length !== gameState.partySize) {
    errors.push(`パーティは${gameState.partySize}体である必要があります。`);
  }

  normalizedEntries.forEach((entry) => {
    if (!templates[entry.id]) {
      errors.push(`不明なキャラクターIDです：${entry.id}`);
    }

    if (!Number.isInteger(entry.position) || entry.position < 0 || entry.position > 8) {
      errors.push(`配置マスが不正です：${entry.position}`);
    }

    if (usedIds.has(entry.id)) {
      errors.push(`同じキャラクターが重複しています：${entry.id}`);
    }

    if (usedPositions.has(entry.position)) {
      errors.push(`同じ配置マスが重複しています：${entry.position}`);
    }

    usedIds.add(entry.id);
    usedPositions.add(entry.position);
  });

  return {
    ok: errors.length === 0,
    errors,
    entries: normalizedEntries
  };
}

function createPartyBoardFromFormation(entries, side) {
  const validation = validatePartyFormation(entries);

  if (!validation.ok) {
    throw new Error(validation.errors.join("\n"));
  }

  const board = Array(9).fill(null);

  validation.entries.forEach((entry) => {
    const template = getCharacterTemplateById(entry.id);
    const copiedCharacter = deepCopyBoard([template])[0];
    const boardPosition = side === "enemy"
      ? rotatePartyFormationPositionForEnemy(entry.position)
      : entry.position;

    resetCharacterRuntimeStatus(copiedCharacter);
    board[boardPosition] = copiedCharacter;
  });

  return board;
}

function createPartyCodePayload(entries) {
  const validation = validatePartyFormation(entries);

  if (!validation.ok) {
    throw new Error(validation.errors.join("\n"));
  }

  return {
    v: PARTY_CODE_VERSION,
    p: validation.entries.map(entry => [PARTY_CHARACTER_CODE_MAP[entry.id], entry.position])
  };
}

function calculatePartyCodeChecksum(text) {
  let checksum = 0;

  for (let i = 0; i < text.length; i++) {
    checksum = (checksum + text.charCodeAt(i) * (i + 1)) % 4096;
  }

  return checksum.toString(36).toUpperCase().padStart(3, "0");
}

function xorString(text, key) {
  let result = "";

  for (let i = 0; i < text.length; i++) {
    const keyCode = key.charCodeAt(i % key.length);
    result += String.fromCharCode(text.charCodeAt(i) ^ keyCode);
  }

  return result;
}

function encodeBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let binaryText = "";

  bytes.forEach((byte) => {
    binaryText += String.fromCharCode(byte);
  });

  return btoa(binaryText)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(base64UrlText) {
  const base64Text = base64UrlText
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const paddedBase64Text = base64Text + "===".slice((base64Text.length + 3) % 4);
  const binaryText = atob(paddedBase64Text);
  const bytes = new Uint8Array(binaryText.length);

  for (let i = 0; i < binaryText.length; i++) {
    bytes[i] = binaryText.charCodeAt(i);
  }

  return new TextDecoder().decode(bytes);
}

function splitPartyCodeIntoBlocks(text) {
  const blocks = text.match(/.{1,4}/g) || [];

  /*
    以前は区切り文字に「-」を使っていたが、Base64URL本体にも「-」が出るため、
    入力時に区切りと本文を区別できず、特定のコードだけ読み取れない原因になっていた。
    新規生成分は、Base64URLに出ない「.」で区切る。
    読み取り側では、旧「-」区切りコードも救済する。
  */
  return blocks.join(".");
}

function removeLegacyHyphenSeparators(text) {
  let result = "";
  let blockCount = 0;

  for (let i = 0; i < text.length; i++) {
    const character = text[i];

    if (character === "-" && blockCount === 4) {
      blockCount = 0;
      continue;
    }

    result += character;
    blockCount++;
  }

  return result;
}

function normalizePartyCodeText(codeText) {
  const compactText = String(codeText || "")
    .trim()
    .replace(/\s+/g, "");

  if (compactText.includes(".")) {
    return compactText.replace(/\./g, "");
  }

  if (compactText.includes("-")) {
    return removeLegacyHyphenSeparators(compactText);
  }

  return compactText;
}

function encodePartyFormation(entries) {
  const validation = validatePartyFormation(entries);

  if (!validation.ok) {
    throw new Error(validation.errors.join("\n"));
  }

  const compactText = `${PARTY_CODE_VERSION}:` + validation.entries
    .map(entry => `${PARTY_CHARACTER_CODE_MAP[entry.id]}${entry.position}`)
    .join("");
  const hiddenText = xorString(compactText, PARTY_CODE_XOR_KEY);
  const encodedText = encodeBase64Url(hiddenText);
  const checksum = calculatePartyCodeChecksum(encodedText);
  const rawCode = `${PARTY_CODE_PREFIX}${encodedText}${checksum}`;

  return splitPartyCodeIntoBlocks(rawCode);
}

function decodePartyFormation(codeText) {
  const normalizedCode = normalizePartyCodeText(codeText);

  if (normalizedCode.slice(0, PARTY_CODE_PREFIX.length).toUpperCase() !== PARTY_CODE_PREFIX) {
    throw new Error("パーティコードの形式が違います。");
  }

  const bodyWithChecksum = normalizedCode.slice(PARTY_CODE_PREFIX.length);

  if (bodyWithChecksum.length <= 3) {
    throw new Error("パーティコードが短すぎます。");
  }

  const encodedText = bodyWithChecksum.slice(0, -3);
  const checksum = bodyWithChecksum.slice(-3).toUpperCase();
  const expectedChecksum = calculatePartyCodeChecksum(encodedText);

  if (checksum !== expectedChecksum) {
    throw new Error("パーティコードの検査値が一致しません。入力ミスの可能性があります。");
  }

  const hiddenText = decodeBase64Url(encodedText);
  const compactText = xorString(hiddenText, PARTY_CODE_XOR_KEY);
  const separatorIndex = compactText.indexOf(":");

  if (separatorIndex < 0) {
    throw new Error("パーティコードを読み取れませんでした。");
  }

  const version = Number(compactText.slice(0, separatorIndex));
  const partyText = compactText.slice(separatorIndex + 1);

  if (version !== PARTY_CODE_VERSION) {
    throw new Error("対応していないパーティコードです。");
  }

  if (partyText.length !== gameState.partySize * 2) {
    throw new Error("パーティコード内の人数が不正です。");
  }

  const entries = [];

  for (let i = 0; i < partyText.length; i += 2) {
    entries.push({
      id: getCharacterIdFromPartyCodeSymbol(partyText[i]),
      position: Number(partyText[i + 1])
    });
  }

  const validation = validatePartyFormation(entries);

  if (!validation.ok) {
    throw new Error(validation.errors.join("\n"));
  }

  return validation.entries;
}

function tryDecodePartyFormation(codeText) {
  try {
    return {
      ok: true,
      entries: decodePartyFormation(codeText),
      errors: []
    };
  } catch (error) {
    return {
      ok: false,
      entries: [],
      errors: [error.message]
    };
  }
}
