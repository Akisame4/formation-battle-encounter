const CHARACTER_TEMPLATES = [
  {
    id: "olive",
    rank: "E",
    name: "オリーブ",
    job: "ファイター",
    role: "ミスあり高火力",
    image: "assets/olive.png",
    hp: 100,
    maxHp: 100,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "ミス", type: "miss", target: "self" },
      2: { label: "ミス", type: "miss", target: "self" },
      3: { label: "敵最前列1体に40ダメージ", type: "damage", target: "enemy_front_unit", damage: 40 },
      4: { label: "敵最前列1体に40ダメージ", type: "damage", target: "enemy_front_unit", damage: 40 },
      5: { label: "敵最前列1体に60ダメージ", type: "damage", target: "enemy_front_unit", damage: 60 },
      6: { label: "敵最前列1体に60ダメージ", type: "damage", target: "enemy_front_unit", damage: 60 }
    }
  },
  {
    id: "chaco",
    rank: "E",
    name: "チャコ",
    job: "ガーディアン",
    role: "防御・味方保護",
    image: "assets/chaco.png",
    hp: 120,
    maxHp: 120,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵最前列1体に20ダメージ", type: "damage", target: "enemy_front_unit", damage: 20 },
      2: { label: "敵最前列1体に20ダメージ", type: "damage", target: "enemy_front_unit", damage: 20 },
      3: { label: "味方前列に防御10", type: "guard_front", target: "self", guard: 10 },
      4: { label: "味方前列に防御20", type: "guard_front", target: "self", guard: 20 },
      5: { label: "味方1体に防御30", type: "guard", target: "ally_unit", guard: 30 },
      6: { label: "味方全体に防御20", type: "guard_all", target: "self", guard: 20 }
    }
  },
  {
    id: "chilchil",
    rank: "D",
    name: "チルチル",
    job: "グラップラー",
    role: "攻撃・押し込み",
    image: "assets/chilchil.png",
    hp: 110,
    maxHp: 110,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵最前列1体に20ダメージ", type: "damage", target: "enemy_front_unit", damage: 20 },
      2: { label: "敵最前列1体に20ダメージ、その敵を1列奥へ押し込む", type: "damage_and_move", target: "enemy_front_unit", damage: 20, moveDirection: "push" },
      3: { label: "敵最前列1体に30ダメージ", type: "damage", target: "enemy_front_unit", damage: 30 },
      4: { label: "敵最前列1体に30ダメージ、その敵を1列奥へ押し込む", type: "damage_and_move", target: "enemy_front_unit", damage: 30, moveDirection: "push" },
      5: { label: "敵最前列1体に40ダメージ", type: "damage", target: "enemy_front_unit", damage: 40 },
      6: { label: "敵最前列1体に40ダメージ、その敵を1列奥へ押し込む", type: "damage_and_move", target: "enemy_front_unit", damage: 40, moveDirection: "push" }
    }
  },
  {
    id: "lunaluna",
    rank: "D",
    name: "ルナルナ",
    job: "ウォリアー",
    role: "自己防御型アタッカー",
    image: "assets/lunaluna.png",
    hp: 110,
    maxHp: 110,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵最前列1体に10ダメージ", type: "damage", target: "enemy_front_unit", damage: 10 },
      2: { label: "敵最前列1体に10ダメージ、自分に防御10", type: "damage_and_self_guard", target: "enemy_front_unit", damage: 10, guard: 10 },
      3: { label: "敵最前列1体に20ダメージ", type: "damage", target: "enemy_front_unit", damage: 20 },
      4: { label: "敵最前列1体に20ダメージ、自分に防御10", type: "damage_and_self_guard", target: "enemy_front_unit", damage: 20, guard: 10 },
      5: { label: "敵最前列1体に30ダメージ", type: "damage", target: "enemy_front_unit", damage: 30 },
      6: { label: "敵最前列1体に30ダメージ、自分に防御10", type: "damage_and_self_guard", target: "enemy_front_unit", damage: 30, guard: 10 }
    }
  },
  {
    id: "jay",
    rank: "E",
    name: "ジェイ",
    job: "アサシン",
    role: "後列即死・自滅あり",
    image: "assets/jay.png",
    hp: 90,
    maxHp: 90,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "暗殺失敗。自分が即死する", type: "self_defeat", target: "self" },
      2: { label: "自分に30ダメージ", type: "self_damage", target: "self", damage: 30 },
      3: { label: "敵最前列1体に防御貫通30ダメージ", type: "piercing_damage", target: "enemy_front_unit", damage: 30 },
      4: { label: "敵最前列1体に防御貫通30ダメージ", type: "piercing_damage", target: "enemy_front_unit", damage: 30 },
      5: { label: "敵後列1体を即死させる", type: "instant_defeat", target: "enemy_back_unit" },
      6: { label: "敵後列1体を即死させる", type: "instant_defeat", target: "enemy_back_unit" }
    }
  },
  {
    id: "shinonome",
    rank: "F",
    name: "シノノメ",
    job: "炎メイジ",
    role: "遠距離・横列火力",
    image: "assets/shinonome.png",
    hp: 80,
    maxHp: 80,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵1体に10ダメージ", type: "damage", target: "enemy_any_unit", damage: 10 },
      2: { label: "敵1体に20ダメージ", type: "damage", target: "enemy_any_unit", damage: 20 },
      3: { label: "横一列に各10ダメージ", type: "area_damage", target: "enemy_any_cell", range: "horizontal_3", damage: 10 },
      4: { label: "横一列に各10ダメージ", type: "area_damage", target: "enemy_any_cell", range: "horizontal_3", damage: 10 },
      5: { label: "横一列に各20ダメージ", type: "area_damage", target: "enemy_any_cell", range: "horizontal_3", damage: 20 },
      6: { label: "横一列に各20ダメージ", type: "area_damage", target: "enemy_any_cell", range: "horizontal_3", damage: 20 }
    }
  },
  {
    id: "moni",
    rank: "F",
    name: "モニ",
    job: "トリックスター",
    role: "遠距離・位置操作",
    image: "assets/moni.png",
    hp: 80,
    maxHp: 80,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵1体に10ダメージ、その敵を1列奥へ押し込む", type: "damage_and_move", target: "enemy_any_unit", damage: 10, moveDirection: "push" },
      2: { label: "敵1体に10ダメージ、その敵を1列奥へ押し込む", type: "damage_and_move", target: "enemy_any_unit", damage: 10, moveDirection: "push" },
      3: { label: "敵1体に10ダメージ、その敵を1列奥へ押し込む", type: "damage_and_move", target: "enemy_any_unit", damage: 10, moveDirection: "push" },
      4: { label: "敵1体に10ダメージ、その敵を1列前へ引き寄せる", type: "damage_and_move", target: "enemy_any_unit", damage: 10, moveDirection: "pull" },
      5: { label: "敵1体に10ダメージ、その敵を1列前へ引き寄せる", type: "damage_and_move", target: "enemy_any_unit", damage: 10, moveDirection: "pull" },
      6: { label: "敵1体に10ダメージ、その敵を1列前へ引き寄せる", type: "damage_and_move", target: "enemy_any_unit", damage: 10, moveDirection: "pull" }
    }
  },
  {
    id: "cocon",
    rank: "E",
    name: "ココン",
    job: "シャーマン",
    role: "遠距離・全体回復",
    image: "assets/cocon.png",
    hp: 80,
    maxHp: 80,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵1体に10ダメージ", type: "damage", target: "enemy_any_unit", damage: 10 },
      2: { label: "敵1体に10ダメージ", type: "damage", target: "enemy_any_unit", damage: 10 },
      3: { label: "味方全体を10回復", type: "heal_all", target: "self", amount: 10 },
      4: { label: "味方全体を10回復", type: "heal_all", target: "self", amount: 10 },
      5: { label: "味方全体を20回復", type: "heal_all", target: "self", amount: 20 },
      6: { label: "味方全体を20回復", type: "heal_all", target: "self", amount: 20 }
    }
  },
  {
    id: "dean",
    rank: "F",
    name: "ディーン",
    job: "スカウト",
    role: "遠距離・味方移動",
    image: "assets/dean.png",
    hp: 80,
    maxHp: 80,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵1体に10ダメージ", type: "damage", target: "enemy_any_unit", damage: 10 },
      2: { label: "敵1体に20ダメージ", type: "damage", target: "enemy_any_unit", damage: 20 },
      3: { label: "敵1体に防御貫通30ダメージ", type: "piercing_damage", target: "enemy_any_unit", damage: 30 },
      4: { label: "味方1体を隣接する空きマスへ移動", type: "move", target: "ally_any_empty_cell", move: "ally_adjacent_empty_cell" },
      5: { label: "味方1体を隣接する空きマスへ移動", type: "move", target: "ally_any_empty_cell", move: "ally_adjacent_empty_cell" },
      6: { label: "味方1体を隣接する空きマスへ移動", type: "move", target: "ally_any_empty_cell", move: "ally_adjacent_empty_cell" }
    }
  },
  {
    id: "yue",
    rank: "D",
    name: "ユエ",
    job: "セージ",
    role: "遠距離・単体回復",
    image: "assets/yue.png",
    hp: 80,
    maxHp: 80,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵1体に10ダメージ", type: "damage", target: "enemy_any_unit", damage: 10 },
      2: { label: "敵1体に10ダメージ", type: "damage", target: "enemy_any_unit", damage: 10 },
      3: { label: "味方1体を20回復", type: "heal", target: "ally_unit", amount: 20 },
      4: { label: "味方1体を30回復", type: "heal", target: "ally_unit", amount: 30 },
      5: { label: "味方1体を30回復", type: "heal", target: "ally_unit", amount: 30 },
      6: { label: "味方1体を40回復", type: "heal", target: "ally_unit", amount: 40 }
    }
  },
  {
    id: "indra",
    rank: "F",
    name: "インドラ",
    job: "雷メイジ",
    role: "遠距離・縦列火力",
    image: "assets/indra.png",
    hp: 80,
    maxHp: 80,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵1体に10ダメージ", type: "damage", target: "enemy_any_unit", damage: 10 },
      2: { label: "敵1体に20ダメージ", type: "damage", target: "enemy_any_unit", damage: 20 },
      3: { label: "縦一列に各10ダメージ", type: "area_damage", target: "enemy_any_cell", range: "vertical_3", damage: 10 },
      4: { label: "縦一列に各10ダメージ", type: "area_damage", target: "enemy_any_cell", range: "vertical_3", damage: 10 },
      5: { label: "縦一列に各20ダメージ", type: "area_damage", target: "enemy_any_cell", range: "vertical_3", damage: 20 },
      6: { label: "縦一列に各20ダメージ", type: "area_damage", target: "enemy_any_cell", range: "vertical_3", damage: 20 }
    }
  },
  {
    id: "kashu",
    rank: "E",
    name: "カシュー",
    job: "バード",
    role: "左右攻撃バッファー",
    image: "assets/kashu.png",
    hp: 80,
    maxHp: 80,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵1体に10ダメージ", type: "damage", target: "enemy_any_unit", damage: 10 },
      2: { label: "敵1体に10ダメージ", type: "damage", target: "enemy_any_unit", damage: 10 },
      3: { label: "左右の味方全員の次の攻撃ダメージ+10", type: "attack_buff_horizontal_all", target: "self", amount: 10, maxTargets: 2 },
      4: { label: "左右の味方全員の次の攻撃ダメージ+10", type: "attack_buff_horizontal_all", target: "self", amount: 10, maxTargets: 2 },
      5: { label: "左右の味方全員の次の攻撃ダメージ+20", type: "attack_buff_horizontal_all", target: "self", amount: 20, maxTargets: 2 },
      6: { label: "左右の味方全員の次の攻撃ダメージ+20", type: "attack_buff_horizontal_all", target: "self", amount: 20, maxTargets: 2 }
    }
  },
  {
    id: "cafe",
    rank: "F",
    name: "カフェ",
    job: "ダンサー",
    role: "軽支援・前列支援",
    image: "assets/cafe.png",
    hp: 90,
    maxHp: 90,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵最前列1体に20ダメージ", type: "damage", target: "enemy_front_unit", damage: 20 },
      2: { label: "敵最前列1体に30ダメージ", type: "damage", target: "enemy_front_unit", damage: 30 },
      3: { label: "味方全体を20回復", type: "heal_all", target: "self", amount: 20 },
      4: { label: "味方全体に防御20", type: "guard_all", target: "self", guard: 20 },
      5: { label: "味方1体を30回復", type: "heal", target: "ally_unit", amount: 30 },
      6: { label: "味方1体を隣接する空きマスへ移動", type: "move", target: "ally_any_empty_cell", move: "ally_adjacent_empty_cell" }
    }
  },
  {
    id: "godo",
    rank: "D",
    name: "ゴドー",
    job: "ソルジャー",
    role: "移動不可前衛",
    image: "assets/godo.png",
    hp: 110,
    maxHp: 110,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵最前列1体に10ダメージ", type: "damage", target: "enemy_front_unit", damage: 10 },
      2: { label: "敵最前列1体に20ダメージ、自分に移動不可", type: "damage_and_self_immovable", target: "enemy_front_unit", damage: 20 },
      3: { label: "敵最前列1体に20ダメージ", type: "damage", target: "enemy_front_unit", damage: 20 },
      4: { label: "敵最前列1体に30ダメージ、自分に移動不可", type: "damage_and_self_immovable", target: "enemy_front_unit", damage: 30 },
      5: { label: "敵最前列1体に30ダメージ", type: "damage", target: "enemy_front_unit", damage: 30 },
      6: { label: "敵最前列1体に40ダメージ、自分に移動不可", type: "damage_and_self_immovable", target: "enemy_front_unit", damage: 40 }
    }
  },
  {
    id: "dragon",
    rank: "D",
    name: "ドラゴン",
    job: "ブラッドナイト",
    role: "吸血前衛",
    image: "assets/dragon.png",
    hp: 110,
    maxHp: 110,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵最前列1体に10ダメージ、自分を10回復", type: "damage_and_self_heal", target: "enemy_front_unit", damage: 10, amount: 10 },
      2: { label: "敵最前列1体に10ダメージ、自分を10回復", type: "damage_and_self_heal", target: "enemy_front_unit", damage: 10, amount: 10 },
      3: { label: "敵最前列1体に10ダメージ、自分を10回復", type: "damage_and_self_heal", target: "enemy_front_unit", damage: 10, amount: 10 },
      4: { label: "敵最前列1体に20ダメージ、自分を10回復", type: "damage_and_self_heal", target: "enemy_front_unit", damage: 20, amount: 10 },
      5: { label: "敵最前列1体に20ダメージ、自分を10回復", type: "damage_and_self_heal", target: "enemy_front_unit", damage: 20, amount: 10 },
      6: { label: "敵最前列1体に30ダメージ、自分を10回復", type: "damage_and_self_heal", target: "enemy_front_unit", damage: 30, amount: 10 }
    }
  },
  {
    id: "nano",
    rank: "F",
    name: "ナノ",
    job: "ウィッチ",
    role: "低火力妨害役",
    image: "assets/nano.png",
    hp: 80,
    maxHp: 80,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵1体に10ダメージ、その敵を左右どちらかへ移動", type: "damage_and_move", target: "enemy_any_unit", damage: 10, moveDirection: "sideways" },
      2: { label: "敵1体に10ダメージ、その敵を左右どちらかへ移動", type: "damage_and_move", target: "enemy_any_unit", damage: 10, moveDirection: "sideways" },
      3: { label: "敵1体に10ダメージ、被ダメージ+10", type: "damage_and_debuff", target: "enemy_any_unit", damage: 10, debuff: "damageTakenIncrease", amount: 10 },
      4: { label: "敵1体に10ダメージ、被ダメージ+10", type: "damage_and_debuff", target: "enemy_any_unit", damage: 10, debuff: "damageTakenIncrease", amount: 10 },
      5: { label: "敵1体に10ダメージ、与ダメージ-10", type: "damage_and_debuff", target: "enemy_any_unit", damage: 10, debuff: "damageDealtDecrease", amount: 10 },
      6: { label: "敵1体に10ダメージ、与ダメージ-10", type: "damage_and_debuff", target: "enemy_any_unit", damage: 10, debuff: "damageDealtDecrease", amount: 10 }
    }
  },
  {
    id: "fang",
    rank: "D",
    name: "ファング",
    job: "バーサーカー",
    role: "自傷高火力",
    image: "assets/fang.png",
    hp: 100,
    maxHp: 100,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "ミス", type: "miss", target: "none" },
      2: { label: "敵最前列1体に30ダメージ、自分に10ダメージ", type: "damage_and_self_damage", target: "enemy_front_unit", damage: 30, selfDamage: 10 },
      3: { label: "敵最前列1体に40ダメージ、自分に10ダメージ", type: "damage_and_self_damage", target: "enemy_front_unit", damage: 40, selfDamage: 10 },
      4: { label: "敵最前列1体に50ダメージ、自分に20ダメージ", type: "damage_and_self_damage", target: "enemy_front_unit", damage: 50, selfDamage: 20 },
      5: { label: "敵最前列1体に60ダメージ、自分に30ダメージ", type: "damage_and_self_damage", target: "enemy_front_unit", damage: 60, selfDamage: 30 },
      6: { label: "敵最前列1体に70ダメージ、自分に40ダメージ", type: "damage_and_self_damage", target: "enemy_front_unit", damage: 70, selfDamage: 40 }
    }
  },
  {
    id: "maiyu",
    rank: "E",
    name: "マイユ",
    job: "ウォーロック",
    role: "防御解除",
    image: "assets/maiyu.png",
    hp: 80,
    maxHp: 80,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵1体の防御を解除", type: "clear_guard", target: "enemy_any_unit" },
      2: { label: "敵1体の防御を解除し、10ダメージ", type: "clear_guard_and_damage", target: "enemy_any_unit", damage: 10 },
      3: { label: "敵1体の防御を解除し、10ダメージ", type: "clear_guard_and_damage", target: "enemy_any_unit", damage: 10 },
      4: { label: "敵1体の防御を解除し、20ダメージ", type: "clear_guard_and_damage", target: "enemy_any_unit", damage: 20 },
      5: { label: "敵1体の防御を解除し、20ダメージ", type: "clear_guard_and_damage", target: "enemy_any_unit", damage: 20 },
      6: { label: "敵1体の防御を解除し、30ダメージ", type: "clear_guard_and_damage", target: "enemy_any_unit", damage: 30 }
    }
  },
  {
    id: "ruma",
    rank: "E",
    name: "ルマ",
    job: "デモニスト",
    role: "全体攻撃＋強自傷",
    image: "assets/ruma.png",
    hp: 70,
    maxHp: 70,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "自分に30ダメージ", type: "self_damage", target: "self", damage: 30 },
      2: { label: "自分に30ダメージ", type: "self_damage", target: "self", damage: 30 },
      3: { label: "敵全体に10ダメージ、自分に10ダメージ", type: "enemy_all_damage_and_self_damage", target: "self", damage: 10, selfDamage: 10 },
      4: { label: "敵全体に20ダメージ、自分に20ダメージ", type: "enemy_all_damage_and_self_damage", target: "self", damage: 20, selfDamage: 20 },
      5: { label: "敵全体に30ダメージ、自分に30ダメージ", type: "enemy_all_damage_and_self_damage", target: "self", damage: 30, selfDamage: 30 },
      6: { label: "敵全体に40ダメージ、自分に40ダメージ", type: "enemy_all_damage_and_self_damage", target: "self", damage: 40, selfDamage: 40 }
    }
  },
  {
    id: "rock",
    rank: "F",
    name: "ロック",
    job: "エンジニア",
    role: "中列防御＋デコイ",
    image: "assets/rock.png",
    hp: 90,
    maxHp: 90,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵1体に20ダメージ", type: "damage", target: "enemy_any_unit", damage: 20 },
      2: { label: "敵1体に20ダメージ", type: "damage", target: "enemy_any_unit", damage: 20 },
      3: { label: "味方中列に防御10", type: "guard_middle", target: "self", guard: 10 },
      4: { label: "味方中列に防御10", type: "guard_middle", target: "self", guard: 10 },
      5: { label: "自軍の空きマスにHP20のデコイを置く", type: "place_decoy", target: "ally_empty_cell", hp: 20 },
      6: { label: "自軍の空きマスにHP20のデコイを置く", type: "place_decoy", target: "ally_empty_cell", hp: 20 }
    }
  },
  {
    id: "teruru",
    rank: "E",
    name: "テルル",
    job: "スナイパー",
    role: "後列狙撃",
    gender: "女",
    image: "assets/teruru.png",
    hp: 80,
    maxHp: 80,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "最後列に移動", type: "move_self_back", target: "self" },
      2: { label: "最後列に移動", type: "move_self_back", target: "self" },
      3: { label: "自分と同じ列の敵1体に10ダメージ。後列にいるときは攻撃力2倍", type: "sniper_damage", target: "enemy_column_unit", damage: 10, backRowMultiplier: 2 },
      4: { label: "自分と同じ列の敵1体に20ダメージ。後列にいるときは攻撃力2倍", type: "sniper_damage", target: "enemy_column_unit", damage: 20, backRowMultiplier: 2 },
      5: { label: "自分と同じ列の敵1体に30ダメージ。後列にいるときは攻撃力2倍", type: "sniper_damage", target: "enemy_column_unit", damage: 30, backRowMultiplier: 2 },
      6: { label: "自分と同じ列の敵1体に40ダメージ。後列にいるときは攻撃力2倍", type: "sniper_damage", target: "enemy_column_unit", damage: 40, backRowMultiplier: 2 }
    }
  },
  {
    id: "bei",
    rank: "E",
    name: "ベイ",
    job: "ゴースト",
    role: "対応マス攻撃",
    gender: "女",
    image: "assets/bei.png",
    hp: 80,
    maxHp: 80,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "隣接する空きマスに移動", type: "move_self_adjacent_empty", target: "self" },
      2: { label: "自分の対応マスの敵に50ダメージ", type: "opposite_damage", target: "enemy_opposite_unit", damage: 50 },
      3: { label: "隣接する空きマスに移動", type: "move_self_adjacent_empty", target: "self" },
      4: { label: "自分の対応マスの敵に60ダメージ", type: "opposite_damage", target: "enemy_opposite_unit", damage: 60 },
      5: { label: "隣接する空きマスに移動", type: "move_self_adjacent_empty", target: "self" },
      6: { label: "自分の対応マスの敵に70ダメージ", type: "opposite_damage", target: "enemy_opposite_unit", damage: 70 }
    }
  },
  {
    id: "sai",
    rank: "E",
    name: "サイ",
    job: "闇医者",
    role: "遠距離・毒",
    gender: "男",
    image: "assets/sai.png",
    hp: 80,
    maxHp: 80,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵1体に10ダメージ", type: "damage", target: "enemy_any_unit", damage: 10 },
      2: { label: "敵1体に10ダメージ、毒を付与", type: "damage_and_poison", target: "enemy_any_unit", damage: 10, poisonDamage: 10 },
      3: { label: "敵1体に10ダメージ", type: "damage", target: "enemy_any_unit", damage: 10 },
      4: { label: "敵1体に10ダメージ、毒を付与", type: "damage_and_poison", target: "enemy_any_unit", damage: 10, poisonDamage: 10 },
      5: { label: "敵1体に10ダメージ、自分を10回復", type: "damage_and_self_heal", target: "enemy_any_unit", damage: 10, amount: 10 },
      6: { label: "敵1体に10ダメージ、毒を付与", type: "damage_and_poison", target: "enemy_any_unit", damage: 10, poisonDamage: 10 }
    }
  },
  {
    id: "olive_prototype",
    isPrototype: true,
    rank: "D",
    name: "プロトO",
    job: "ファイター",
    role: "プロトタイプ：ミス3回・2体攻撃",
    personality: "探検家",
    image: "assets/olive.png",
    hp: 200,
    maxHp: 200,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "ミス", type: "miss", target: "self" },
      2: { label: "ミス", type: "miss", target: "self" },
      3: { label: "敵最前列1体に40ダメージ", type: "damage", target: "enemy_front_unit", damage: 40 },
      4: { label: "敵最前列1体に40ダメージ", type: "damage", target: "enemy_front_unit", damage: 40 },
      5: { label: "敵最前列1体に60ダメージ", type: "damage", target: "enemy_front_unit", damage: 60 },
      6: { label: "敵最前列1体に60ダメージ", type: "damage", target: "enemy_front_unit", damage: 60 }
    }
  },
  {
    id: "fang_prototype",
    isPrototype: true,
    rank: "C",
    name: "プロトF",
    job: "バーサーカー",
    role: "プロトタイプ：ミスなし・全力自傷高火力",
    personality: "外交官",
    image: "assets/fang.png",
    hp: 200,
    maxHp: 200,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "ミス", type: "miss", target: "none" },
      2: { label: "敵最前列1体に30ダメージ、自分に10ダメージ", type: "damage_and_self_damage", target: "enemy_front_unit", damage: 30, selfDamage: 10 },
      3: { label: "敵最前列1体に40ダメージ、自分に10ダメージ", type: "damage_and_self_damage", target: "enemy_front_unit", damage: 40, selfDamage: 10 },
      4: { label: "敵最前列1体に50ダメージ、自分に20ダメージ", type: "damage_and_self_damage", target: "enemy_front_unit", damage: 50, selfDamage: 20 },
      5: { label: "敵最前列1体に60ダメージ、自分に30ダメージ", type: "damage_and_self_damage", target: "enemy_front_unit", damage: 60, selfDamage: 30 },
      6: { label: "敵最前列1体に70ダメージ、自分に40ダメージ", type: "damage_and_self_damage", target: "enemy_front_unit", damage: 70, selfDamage: 40 }
    }
  },
  {
    id: "chilchil_prototype",
    isPrototype: true,
    rank: "A",
    name: "プロトChi",
    job: "グラップラー",
    role: "プロトタイプ：溜め込みで一撃を強化",
    personality: "番人",
    image: "assets/chilchil.png",
    hp: 220,
    maxHp: 220,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵最前列1体に20ダメージ", type: "damage", target: "enemy_front_unit", damage: 20 },
      2: { label: "敵最前列1体に20ダメージ、その敵を1列奥へ押し込む", type: "damage_and_move", target: "enemy_front_unit", damage: 20, moveDirection: "push" },
      3: { label: "敵最前列1体に30ダメージ", type: "damage", target: "enemy_front_unit", damage: 30 },
      4: { label: "敵最前列1体に30ダメージ、その敵を1列奥へ押し込む", type: "damage_and_move", target: "enemy_front_unit", damage: 30, moveDirection: "push" },
      5: { label: "敵最前列1体に40ダメージ", type: "damage", target: "enemy_front_unit", damage: 40 },
      6: { label: "敵最前列1体に40ダメージ、その敵を1列奥へ押し込む", type: "damage_and_move", target: "enemy_front_unit", damage: 40, moveDirection: "push" }
    }
  },
  {
    id: "godo_prototype",
    isPrototype: true,
    rank: "A",
    name: "プロトG",
    job: "ソルジャー",
    role: "プロトタイプ：高HP移動不可前衛",
    personality: "外交官",
    image: "assets/godo.png",
    hp: 220,
    maxHp: 220,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵最前列1体に10ダメージ", type: "damage", target: "enemy_front_unit", damage: 10 },
      2: { label: "敵最前列1体に20ダメージ、自分に移動不可", type: "damage_and_self_immovable", target: "enemy_front_unit", damage: 20 },
      3: { label: "敵最前列1体に20ダメージ", type: "damage", target: "enemy_front_unit", damage: 20 },
      4: { label: "敵最前列1体に30ダメージ、自分に移動不可", type: "damage_and_self_immovable", target: "enemy_front_unit", damage: 30 },
      5: { label: "敵最前列1体に30ダメージ", type: "damage", target: "enemy_front_unit", damage: 30 },
      6: { label: "敵最前列1体に40ダメージ、自分に移動不可", type: "damage_and_self_immovable", target: "enemy_front_unit", damage: 40 }
    }
  },
  {
    id: "lunaluna_prototype",
    isPrototype: true,
    rank: "C",
    name: "プロトL",
    job: "ウォリアー",
    role: "プロトタイプ：挑発と前列防御の切り替え",
    personality: "番人",
    image: "assets/lunaluna.png",
    hp: 220,
    maxHp: 220,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵最前列1体に10ダメージ", type: "damage", target: "enemy_front_unit", damage: 10 },
      2: { label: "敵最前列1体に10ダメージ、自分に防御10", type: "damage_and_self_guard", target: "enemy_front_unit", damage: 10, guard: 10 },
      3: { label: "敵最前列1体に20ダメージ", type: "damage", target: "enemy_front_unit", damage: 20 },
      4: { label: "敵最前列1体に20ダメージ、自分に防御10", type: "damage_and_self_guard", target: "enemy_front_unit", damage: 20, guard: 10 },
      5: { label: "敵最前列1体に30ダメージ", type: "damage", target: "enemy_front_unit", damage: 30 },
      6: { label: "敵最前列1体に30ダメージ、自分に防御10", type: "damage_and_self_guard", target: "enemy_front_unit", damage: 30, guard: 10 }
    }
  },
  {
    id: "dragon_prototype",
    isPrototype: true,
    rank: "B",
    name: "プロトDra",
    job: "ブラッドナイト",
    role: "プロトタイプ：吸血と状態回復の前衛",
    personality: "外交官",
    image: "assets/dragon.png",
    hp: 220,
    maxHp: 220,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵最前列1体に10ダメージ、自分を10回復", type: "damage_and_self_heal", target: "enemy_front_unit", damage: 10, amount: 10 },
      2: { label: "敵最前列1体に10ダメージ、自分を10回復", type: "damage_and_self_heal", target: "enemy_front_unit", damage: 10, amount: 10 },
      3: { label: "敵最前列1体に10ダメージ、自分を10回復", type: "damage_and_self_heal", target: "enemy_front_unit", damage: 10, amount: 10 },
      4: { label: "敵最前列1体に20ダメージ、自分を10回復", type: "damage_and_self_heal", target: "enemy_front_unit", damage: 20, amount: 10 },
      5: { label: "敵最前列1体に20ダメージ、自分を10回復", type: "damage_and_self_heal", target: "enemy_front_unit", damage: 20, amount: 10 },
      6: { label: "敵最前列1体に30ダメージ、自分を10回復", type: "damage_and_self_heal", target: "enemy_front_unit", damage: 30, amount: 10 }
    }
  },
  {
    id: "jay_prototype",
    isPrototype: true,
    rank: "C",
    name: "プロトJ",
    job: "アサシン",
    role: "プロトタイプ：自爆巻き込みと分身",
    personality: "分析家",
    image: "assets/jay.png",
    hp: 180,
    maxHp: 180,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "暗殺失敗。自分が即死する", type: "self_defeat", target: "self" },
      2: { label: "自分に30ダメージ", type: "self_damage", target: "self", damage: 30 },
      3: { label: "敵最前列1体に防御貫通30ダメージ", type: "piercing_damage", target: "enemy_front_unit", damage: 30 },
      4: { label: "敵最前列1体に防御貫通30ダメージ", type: "piercing_damage", target: "enemy_front_unit", damage: 30 },
      5: { label: "敵後列1体を即死させる", type: "instant_defeat", target: "enemy_back_unit" },
      6: { label: "敵後列1体を即死させる", type: "instant_defeat", target: "enemy_back_unit" }
    }
  },
  {
    id: "chaco_prototype",
    isPrototype: true,
    rank: "C",
    name: "プロトCha",
    job: "ガーディアン",
    role: "プロトタイプ：挑発を持つ防御役",
    personality: "番人",
    image: "assets/chaco.png",
    hp: 240,
    maxHp: 240,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵最前列1体に20ダメージ", type: "damage", target: "enemy_front_unit", damage: 20 },
      2: { label: "敵最前列1体に20ダメージ", type: "damage", target: "enemy_front_unit", damage: 20 },
      3: { label: "味方前列に防御10", type: "guard_front", target: "self", guard: 10 },
      4: { label: "味方前列に防御20", type: "guard_front", target: "self", guard: 20 },
      5: { label: "味方1体に防御30", type: "guard", target: "ally_unit", guard: 30 },
      6: { label: "味方全体に防御20", type: "guard_all", target: "self", guard: 20 }
    }
  },
  {
    id: "rock_prototype",
    isPrototype: true,
    rank: "D",
    name: "プロトR",
    job: "エンジニア",
    role: "プロトタイプ：デコイの数で強化",
    personality: "分析家",
    image: "assets/rock.png",
    hp: 180,
    maxHp: 180,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵1体に20ダメージ", type: "damage", target: "enemy_any_unit", damage: 20 },
      2: { label: "敵1体に20ダメージ", type: "damage", target: "enemy_any_unit", damage: 20 },
      3: { label: "味方中列に防御10", type: "guard_middle", target: "self", guard: 10 },
      4: { label: "味方中列に防御10", type: "guard_middle", target: "self", guard: 10 },
      5: { label: "自軍の空きマスにHP20のデコイを置く", type: "place_decoy", target: "ally_empty_cell", hp: 20 },
      6: { label: "自軍の空きマスにHP20のデコイを置く", type: "place_decoy", target: "ally_empty_cell", hp: 20 }
    }
  },
  {
    id: "shinonome_prototype",
    isPrototype: true,
    rank: "C",
    name: "プロトS",
    job: "炎メイジ",
    role: "プロトタイプ：やけどを付与する炎術師",
    personality: "分析家",
    image: "assets/shinonome.png",
    hp: 160,
    maxHp: 160,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵1体に10ダメージ", type: "damage", target: "enemy_any_unit", damage: 10 },
      2: { label: "敵1体に20ダメージ", type: "damage", target: "enemy_any_unit", damage: 20 },
      3: { label: "横一列に各10ダメージ", type: "area_damage", target: "enemy_any_cell", range: "horizontal_3", damage: 10 },
      4: { label: "横一列に各10ダメージ", type: "area_damage", target: "enemy_any_cell", range: "horizontal_3", damage: 10 },
      5: { label: "横一列に各20ダメージ", type: "area_damage", target: "enemy_any_cell", range: "horizontal_3", damage: 20 },
      6: { label: "横一列に各20ダメージ", type: "area_damage", target: "enemy_any_cell", range: "horizontal_3", damage: 20 }
    }
  },
  {
    id: "indra_prototype",
    isPrototype: true,
    rank: "C",
    name: "プロトI",
    job: "雷メイジ",
    role: "プロトタイプ：麻痺を付与する雷術師",
    personality: "外交官",
    image: "assets/indra.png",
    hp: 160,
    maxHp: 160,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵1体に10ダメージ", type: "damage", target: "enemy_any_unit", damage: 10 },
      2: { label: "敵1体に20ダメージ", type: "damage", target: "enemy_any_unit", damage: 20 },
      3: { label: "縦一列に各10ダメージ", type: "area_damage", target: "enemy_any_cell", range: "vertical_3", damage: 10 },
      4: { label: "縦一列に各10ダメージ", type: "area_damage", target: "enemy_any_cell", range: "vertical_3", damage: 10 },
      5: { label: "縦一列に各20ダメージ", type: "area_damage", target: "enemy_any_cell", range: "vertical_3", damage: 20 },
      6: { label: "縦一列に各20ダメージ", type: "area_damage", target: "enemy_any_cell", range: "vertical_3", damage: 20 }
    }
  },
  {
    id: "ruma_prototype",
    isPrototype: true,
    rank: "C",
    name: "プロトRu",
    job: "デモニスト",
    role: "プロトタイプ：巻き込みと全体攻撃",
    personality: "探検家",
    image: "assets/ruma.png",
    hp: 140,
    maxHp: 140,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "自分に30ダメージ", type: "self_damage", target: "self", damage: 30 },
      2: { label: "自分に30ダメージ", type: "self_damage", target: "self", damage: 30 },
      3: { label: "敵全体に10ダメージ、自分に10ダメージ", type: "enemy_all_damage_and_self_damage", target: "self", damage: 10, selfDamage: 10 },
      4: { label: "敵全体に20ダメージ、自分に20ダメージ", type: "enemy_all_damage_and_self_damage", target: "self", damage: 20, selfDamage: 20 },
      5: { label: "敵全体に30ダメージ、自分に30ダメージ", type: "enemy_all_damage_and_self_damage", target: "self", damage: 30, selfDamage: 30 },
      6: { label: "敵全体に40ダメージ、自分に40ダメージ", type: "enemy_all_damage_and_self_damage", target: "self", damage: 40, selfDamage: 40 }
    }
  },
  {
    id: "teruru_prototype",
    isPrototype: true,
    rank: "B",
    name: "プロトT",
    job: "スナイパー",
    role: "プロトタイプ：後列狙撃",
    personality: "探検家",
    gender: "女",
    image: "assets/teruru.png",
    hp: 160,
    maxHp: 160,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "最後列に移動", type: "move_self_back", target: "self" },
      2: { label: "最後列に移動", type: "move_self_back", target: "self" },
      3: { label: "自分と同じ列の敵1体に10ダメージ。後列にいるときは攻撃力2倍", type: "sniper_damage", target: "enemy_column_unit", damage: 10, backRowMultiplier: 2 },
      4: { label: "自分と同じ列の敵1体に20ダメージ。後列にいるときは攻撃力2倍", type: "sniper_damage", target: "enemy_column_unit", damage: 20, backRowMultiplier: 2 },
      5: { label: "自分と同じ列の敵1体に30ダメージ。後列にいるときは攻撃力2倍", type: "sniper_damage", target: "enemy_column_unit", damage: 30, backRowMultiplier: 2 },
      6: { label: "自分と同じ列の敵1体に40ダメージ。後列にいるときは攻撃力2倍", type: "sniper_damage", target: "enemy_column_unit", damage: 40, backRowMultiplier: 2 }
    }
  },
  {
    id: "cocon_prototype",
    isPrototype: true,
    rank: "A",
    name: "プロトCoc",
    job: "シャーマン",
    role: "プロトタイプ：全体回復＋単体追加回復",
    personality: "外交官",
    image: "assets/cocon.png",
    hp: 160,
    maxHp: 160,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵1体に10ダメージ", type: "damage", target: "enemy_any_unit", damage: 10 },
      2: { label: "敵1体に10ダメージ", type: "damage", target: "enemy_any_unit", damage: 10 },
      3: { label: "味方全体を10回復", type: "heal_all", target: "self", amount: 10 },
      4: { label: "味方全体を10回復", type: "heal_all", target: "self", amount: 10 },
      5: { label: "味方全体を20回復", type: "heal_all", target: "self", amount: 20 },
      6: { label: "味方全体を20回復", type: "heal_all", target: "self", amount: 20 }
    }
  },
  {
    id: "yue_prototype",
    isPrototype: true,
    rank: "C",
    name: "プロトY",
    job: "セージ",
    role: "プロトタイプ：全回復と引き換えの自爆",
    personality: "分析家",
    image: "assets/yue.png",
    hp: 160,
    maxHp: 160,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵1体に10ダメージ", type: "damage", target: "enemy_any_unit", damage: 10 },
      2: { label: "敵1体に10ダメージ", type: "damage", target: "enemy_any_unit", damage: 10 },
      3: { label: "味方1体を20回復", type: "heal", target: "ally_unit", amount: 20 },
      4: { label: "味方1体を30回復", type: "heal", target: "ally_unit", amount: 30 },
      5: { label: "味方1体を30回復", type: "heal", target: "ally_unit", amount: 30 },
      6: { label: "味方1体を40回復", type: "heal", target: "ally_unit", amount: 40 }
    }
  },
  {
    id: "cafe_prototype",
    isPrototype: true,
    rank: "D",
    name: "プロトCaf",
    job: "ダンサー",
    role: "プロトタイプ：自傷を伴う支援型",
    personality: "外交官",
    image: "assets/cafe.png",
    hp: 180,
    maxHp: 180,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵最前列1体に20ダメージ", type: "damage", target: "enemy_front_unit", damage: 20 },
      2: { label: "敵最前列1体に30ダメージ", type: "damage", target: "enemy_front_unit", damage: 30 },
      3: { label: "味方全体を20回復", type: "heal_all", target: "self", amount: 20 },
      4: { label: "味方全体に防御20", type: "guard_all", target: "self", guard: 20 },
      5: { label: "味方1体を30回復", type: "heal", target: "ally_unit", amount: 30 },
      6: { label: "味方1体を隣接する空きマスへ移動", type: "move", target: "ally_any_empty_cell", move: "ally_adjacent_empty_cell" }
    }
  },
  {
    id: "kashu_prototype",
    isPrototype: true,
    rank: "C",
    name: "プロトK",
    job: "バード",
    role: "プロトタイプ：前列強化を持つバッファー",
    personality: "探検家",
    image: "assets/kashu.png",
    hp: 160,
    maxHp: 160,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵1体に10ダメージ", type: "damage", target: "enemy_any_unit", damage: 10 },
      2: { label: "敵1体に10ダメージ", type: "damage", target: "enemy_any_unit", damage: 10 },
      3: { label: "左右の味方全員の次の攻撃ダメージ+10", type: "attack_buff_horizontal_all", target: "self", amount: 10, maxTargets: 2 },
      4: { label: "左右の味方全員の次の攻撃ダメージ+10", type: "attack_buff_horizontal_all", target: "self", amount: 10, maxTargets: 2 },
      5: { label: "左右の味方全員の次の攻撃ダメージ+20", type: "attack_buff_horizontal_all", target: "self", amount: 20, maxTargets: 2 },
      6: { label: "左右の味方全員の次の攻撃ダメージ+20", type: "attack_buff_horizontal_all", target: "self", amount: 20, maxTargets: 2 }
    }
  },
  {
    id: "moni_prototype",
    isPrototype: true,
    rank: "C",
    name: "プロトM",
    job: "トリックスター",
    role: "プロトタイプ：押込・引寄の2体攻撃",
    personality: "分析家",
    image: "assets/moni.png",
    hp: 160,
    maxHp: 160,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵1体に10ダメージ、その敵を1列奥へ押し込む", type: "damage_and_move", target: "enemy_any_unit", damage: 10, moveDirection: "push" },
      2: { label: "敵1体に10ダメージ、その敵を1列奥へ押し込む", type: "damage_and_move", target: "enemy_any_unit", damage: 10, moveDirection: "push" },
      3: { label: "敵（最大2体）に10ダメージ、その敵を1列奥へ押し込む", type: "damage_and_move", target: "enemy_any_unit", damage: 10, moveDirection: "push", hitCount: 2 },
      4: { label: "敵1体に10ダメージ、その敵を1列前へ引き寄せる", type: "damage_and_move", target: "enemy_any_unit", damage: 10, moveDirection: "pull" },
      5: { label: "敵1体に10ダメージ、その敵を1列前へ引き寄せる", type: "damage_and_move", target: "enemy_any_unit", damage: 10, moveDirection: "pull" },
      6: { label: "敵（最大2体）に10ダメージ、その敵を1列前へ引き寄せる", type: "damage_and_move", target: "enemy_any_unit", damage: 10, moveDirection: "pull", hitCount: 2 }
    }
  },
  {
    id: "nano_prototype",
    isPrototype: true,
    rank: "C",
    name: "プロトN",
    job: "ウィッチ",
    role: "プロトタイプ：妨害の2体攻撃",
    personality: "探検家",
    image: "assets/nano.png",
    hp: 160,
    maxHp: 160,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵1体に10ダメージ、その敵を左右どちらかへ移動", type: "damage_and_move", target: "enemy_any_unit", damage: 10, moveDirection: "sideways" },
      2: { label: "敵（最大2体）に10ダメージ、その敵を左右どちらかへ移動", type: "damage_and_move", target: "enemy_any_unit", damage: 10, moveDirection: "sideways", hitCount: 2 },
      3: { label: "敵1体に10ダメージ、被ダメージ+10", type: "damage_and_debuff", target: "enemy_any_unit", damage: 10, debuff: "damageTakenIncrease", amount: 10 },
      4: { label: "敵（最大2体）に10ダメージ、被ダメージ+10", type: "damage_and_debuff", target: "enemy_any_unit", damage: 10, debuff: "damageTakenIncrease", amount: 10, hitCount: 2 },
      5: { label: "敵1体に10ダメージ、与ダメージ-10", type: "damage_and_debuff", target: "enemy_any_unit", damage: 10, debuff: "damageDealtDecrease", amount: 10 },
      6: { label: "敵（最大2体）に10ダメージ、与ダメージ-10", type: "damage_and_debuff", target: "enemy_any_unit", damage: 10, debuff: "damageDealtDecrease", amount: 10, hitCount: 2 }
    }
  },
  {
    id: "dean_prototype",
    isPrototype: true,
    rank: "D",
    name: "プロトDe",
    job: "スカウト",
    role: "プロトタイプ：射撃と遠貫を持つスカウト",
    personality: "番人",
    image: "assets/dean.png",
    hp: 160,
    maxHp: 160,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵1体に10ダメージ", type: "damage", target: "enemy_any_unit", damage: 10 },
      2: { label: "敵1体に20ダメージ", type: "damage", target: "enemy_any_unit", damage: 20 },
      3: { label: "敵1体に防御貫通30ダメージ", type: "piercing_damage", target: "enemy_any_unit", damage: 30 },
      4: { label: "味方1体を隣接する空きマスへ移動", type: "move", target: "ally_any_empty_cell", move: "ally_adjacent_empty_cell" },
      5: { label: "味方1体を隣接する空きマスへ移動", type: "move", target: "ally_any_empty_cell", move: "ally_adjacent_empty_cell" },
      6: { label: "味方1体を隣接する空きマスへ移動", type: "move", target: "ally_any_empty_cell", move: "ally_adjacent_empty_cell" }
    }
  },
  {
    id: "maiyu_prototype",
    isPrototype: true,
    rank: "B",
    name: "プロトMa",
    job: "ウォーロック",
    role: "プロトタイプ：防御解除とランダム状態異常",
    personality: "番人",
    image: "assets/maiyu.png",
    hp: 160,
    maxHp: 160,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵1体の防御を解除", type: "clear_guard", target: "enemy_any_unit" },
      2: { label: "敵1体の防御を解除し、10ダメージ", type: "clear_guard_and_damage", target: "enemy_any_unit", damage: 10 },
      3: { label: "敵1体の防御を解除し、10ダメージ", type: "clear_guard_and_damage", target: "enemy_any_unit", damage: 10 },
      4: { label: "敵1体の防御を解除し、20ダメージ", type: "clear_guard_and_damage", target: "enemy_any_unit", damage: 20 },
      5: { label: "敵1体の防御を解除し、20ダメージ", type: "clear_guard_and_damage", target: "enemy_any_unit", damage: 20 },
      6: { label: "敵1体の防御を解除し、30ダメージ", type: "clear_guard_and_damage", target: "enemy_any_unit", damage: 30 }
    }
  },
  {
    id: "sai_prototype",
    isPrototype: true,
    rank: "C",
    name: "プロトSa",
    job: "闇医者",
    role: "プロトタイプ：毒特化・自傷毒あり",
    personality: "分析家",
    gender: "男",
    image: "assets/sai.png",
    hp: 160,
    maxHp: 160,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵1体に10ダメージ", type: "damage", target: "enemy_any_unit", damage: 10 },
      2: { label: "敵1体に10ダメージ、毒を付与", type: "damage_and_poison", target: "enemy_any_unit", damage: 10, poisonDamage: 10 },
      3: { label: "敵1体に10ダメージ", type: "damage", target: "enemy_any_unit", damage: 10 },
      4: { label: "敵1体に10ダメージ、毒を付与", type: "damage_and_poison", target: "enemy_any_unit", damage: 10, poisonDamage: 10 },
      5: { label: "敵1体に10ダメージ、自分を10回復", type: "damage_and_self_heal", target: "enemy_any_unit", damage: 10, amount: 10 },
      6: { label: "敵1体に10ダメージ、毒を付与", type: "damage_and_poison", target: "enemy_any_unit", damage: 10, poisonDamage: 10 }
    }
  },
  {
    id: "bei_prototype",
    isPrototype: true,
    rank: "C",
    name: "プロトB",
    job: "ゴースト",
    role: "プロトタイプ：対応マス横列攻撃",
    personality: "探検家",
    gender: "女",
    image: "assets/bei.png",
    hp: 160,
    maxHp: 160,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "隣接する空きマスに移動", type: "move_self_adjacent_empty", target: "self" },
      2: { label: "自分の対応マスの敵に50ダメージ", type: "opposite_damage", target: "enemy_opposite_unit", damage: 50 },
      3: { label: "隣接する空きマスに移動", type: "move_self_adjacent_empty", target: "self" },
      4: { label: "自分の対応マスの敵に60ダメージ", type: "opposite_damage", target: "enemy_opposite_unit", damage: 60 },
      5: { label: "隣接する空きマスに移動", type: "move_self_adjacent_empty", target: "self" },
      6: { label: "自分の対応マスの敵に70ダメージ", type: "opposite_damage", target: "enemy_opposite_unit", damage: 70 }
    }
  }
];

const MONSTER_TEMPLATES = [
  {
    id: "monster_slime",
    name: "スライム",
    job: "モンスター",
    role: "小型近接",
    image: "assets/monster_slime.png",
    hp: 50,
    maxHp: 50,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵最前列1体に10ダメージ", type: "damage", target: "enemy_front_unit", damage: 10 },
      2: { label: "敵最前列1体に10ダメージ", type: "damage", target: "enemy_front_unit", damage: 10 },
      3: { label: "敵最前列1体に10ダメージ", type: "damage", target: "enemy_front_unit", damage: 10 },
      4: { label: "敵最前列1体に20ダメージ", type: "damage", target: "enemy_front_unit", damage: 20 },
      5: { label: "敵最前列1体に20ダメージ", type: "damage", target: "enemy_front_unit", damage: 20 },
      6: { label: "自分に防御10", type: "self_guard", target: "self", guard: 10 }
    }
  },
  {
    id: "monster_goblin",
    name: "ゴブリン",
    job: "モンスター",
    role: "近接攻撃",
    image: "assets/monster_goblin.png",
    hp: 70,
    maxHp: 70,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵最前列1体に10ダメージ", type: "damage", target: "enemy_front_unit", damage: 10 },
      2: { label: "敵最前列1体に20ダメージ", type: "damage", target: "enemy_front_unit", damage: 20 },
      3: { label: "敵最前列1体に20ダメージ", type: "damage", target: "enemy_front_unit", damage: 20 },
      4: { label: "敵最前列1体に20ダメージ", type: "damage", target: "enemy_front_unit", damage: 20 },
      5: { label: "敵最前列1体に30ダメージ", type: "damage", target: "enemy_front_unit", damage: 30 },
      6: { label: "敵最前列1体に30ダメージ", type: "damage", target: "enemy_front_unit", damage: 30 }
    }
  },
  {
    id: "monster_bat",
    name: "コウモリ",
    job: "モンスター",
    role: "遠距離攻撃",
    image: "assets/monster_bat.png",
    hp: 60,
    maxHp: 60,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵1体に10ダメージ", type: "damage", target: "enemy_any_unit", damage: 10 },
      2: { label: "敵1体に10ダメージ", type: "damage", target: "enemy_any_unit", damage: 10 },
      3: { label: "敵1体に20ダメージ", type: "damage", target: "enemy_any_unit", damage: 20 },
      4: { label: "敵1体に20ダメージ", type: "damage", target: "enemy_any_unit", damage: 20 },
      5: { label: "敵1体に20ダメージ、与ダメージ10低下", type: "damage_and_debuff", target: "enemy_any_unit", damage: 20, debuff: "damageDealtDecrease", amount: 10 },
      6: { label: "敵1体に30ダメージ", type: "damage", target: "enemy_any_unit", damage: 30 }
    }
  },
  {
    id: "monster_orc",
    name: "オーク",
    job: "モンスター",
    role: "重近接",
    image: "assets/monster_orc.png",
    hp: 100,
    maxHp: 100,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵最前列1体に20ダメージ", type: "damage", target: "enemy_front_unit", damage: 20 },
      2: { label: "敵最前列1体に20ダメージ", type: "damage", target: "enemy_front_unit", damage: 20 },
      3: { label: "敵最前列1体に30ダメージ", type: "damage", target: "enemy_front_unit", damage: 30 },
      4: { label: "敵最前列1体に30ダメージ、押し込み", type: "damage_and_move", target: "enemy_front_unit", damage: 30, moveDirection: "push" },
      5: { label: "敵最前列1体に40ダメージ", type: "damage", target: "enemy_front_unit", damage: 40 },
      6: { label: "自分に防御20", type: "self_guard", target: "self", guard: 20 }
    }
  },
  {
    id: "monster_shade",
    name: "シェイド",
    job: "モンスター",
    role: "毒妨害",
    image: "assets/monster_shade.png",
    hp: 80,
    maxHp: 80,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵1体に10ダメージ", type: "damage", target: "enemy_any_unit", damage: 10 },
      2: { label: "敵1体に10ダメージ、毒を付与", type: "damage_and_poison", target: "enemy_any_unit", damage: 10, poisonDamage: 10 },
      3: { label: "敵1体に20ダメージ", type: "damage", target: "enemy_any_unit", damage: 20 },
      4: { label: "敵1体に20ダメージ、毒を付与", type: "damage_and_poison", target: "enemy_any_unit", damage: 20, poisonDamage: 10 },
      5: { label: "敵1体に20ダメージ、被ダメージ10増加", type: "damage_and_debuff", target: "enemy_any_unit", damage: 20, debuff: "damageTakenIncrease", amount: 10 },
      6: { label: "敵1体に30ダメージ、毒を付与", type: "damage_and_poison", target: "enemy_any_unit", damage: 30, poisonDamage: 10 }
    }
  },
  {
    id: "monster_golem",
    name: "ゴーレム",
    job: "モンスター",
    role: "高耐久",
    image: "assets/monster_golem.png",
    hp: 140,
    maxHp: 140,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "自分に防御20", type: "self_guard", target: "self", guard: 20 },
      2: { label: "敵最前列1体に20ダメージ", type: "damage", target: "enemy_front_unit", damage: 20 },
      3: { label: "敵最前列1体に30ダメージ", type: "damage", target: "enemy_front_unit", damage: 30 },
      4: { label: "敵最前列1体に30ダメージ、押し込み", type: "damage_and_move", target: "enemy_front_unit", damage: 30, moveDirection: "push" },
      5: { label: "敵最前列1体に40ダメージ", type: "damage", target: "enemy_front_unit", damage: 40 },
      6: { label: "敵最前列1体に50ダメージ", type: "damage", target: "enemy_front_unit", damage: 50 }
    }
  },
  {
    id: "monster_witch",
    name: "ウィッチ",
    job: "モンスター",
    role: "範囲火力",
    image: "assets/monster_witch.png",
    hp: 90,
    maxHp: 90,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵1体に20ダメージ", type: "damage", target: "enemy_any_unit", damage: 20 },
      2: { label: "横一列に各10ダメージ", type: "area_damage", target: "enemy_any_cell", range: "horizontal_3", damage: 10 },
      3: { label: "縦一列に各10ダメージ", type: "area_damage", target: "enemy_any_cell", range: "vertical_3", damage: 10 },
      4: { label: "横一列に各20ダメージ", type: "area_damage", target: "enemy_any_cell", range: "horizontal_3", damage: 20 },
      5: { label: "縦一列に各20ダメージ", type: "area_damage", target: "enemy_any_cell", range: "vertical_3", damage: 20 },
      6: { label: "十字範囲に各20ダメージ", type: "area_damage", target: "enemy_any_cell", range: "cross", damage: 20 }
    }
  },
  {
    id: "monster_drake",
    name: "ドレイク",
    job: "モンスター",
    role: "強襲前衛",
    image: "assets/monster_drake.png",
    hp: 130,
    maxHp: 130,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵最前列1体に20ダメージ", type: "damage", target: "enemy_front_unit", damage: 20 },
      2: { label: "敵最前列1体に30ダメージ", type: "damage", target: "enemy_front_unit", damage: 30 },
      3: { label: "敵最前列1体に30ダメージ、自分を10回復", type: "damage_and_self_heal", target: "enemy_front_unit", damage: 30, amount: 10 },
      4: { label: "敵最前列1体に40ダメージ", type: "damage", target: "enemy_front_unit", damage: 40 },
      5: { label: "敵最前列1体に40ダメージ、自分を20回復", type: "damage_and_self_heal", target: "enemy_front_unit", damage: 40, amount: 20 },
      6: { label: "敵最前列1体に50ダメージ", type: "damage", target: "enemy_front_unit", damage: 50 }
    }
  },
  {
    id: "monster_reaper",
    name: "リーパー",
    job: "モンスター",
    role: "後衛処理",
    image: "assets/monster_reaper.png",
    hp: 110,
    maxHp: 110,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵1体に20ダメージ", type: "damage", target: "enemy_any_unit", damage: 20 },
      2: { label: "敵1体に30ダメージ", type: "damage", target: "enemy_any_unit", damage: 30 },
      3: { label: "敵後列1体を即死", type: "instant_defeat", target: "enemy_back_unit" },
      4: { label: "敵1体に30ダメージ、被ダメージ10増加", type: "damage_and_debuff", target: "enemy_any_unit", damage: 30, debuff: "damageTakenIncrease", amount: 10 },
      5: { label: "敵1体に40ダメージ", type: "damage", target: "enemy_any_unit", damage: 40 },
      6: { label: "敵後列1体を即死", type: "instant_defeat", target: "enemy_back_unit" }
    }
  },
  {
    id: "monster_archdemon",
    name: "アークデーモン",
    job: "ボス",
    role: "最終ボス",
    image: "assets/monster_archdemon.png",
    hp: 180,
    maxHp: 180,
    guard: 0,
    cooldown: 0,
    actions: {
      1: { label: "敵1体に30ダメージ", type: "damage", target: "enemy_any_unit", damage: 30 },
      2: { label: "敵最前列1体に50ダメージ", type: "damage", target: "enemy_front_unit", damage: 50 },
      3: { label: "横一列に各30ダメージ", type: "area_damage", target: "enemy_any_cell", range: "horizontal_3", damage: 30 },
      4: { label: "敵1体に40ダメージ、毒を付与", type: "damage_and_poison", target: "enemy_any_unit", damage: 40, poisonDamage: 10 },
      5: { label: "敵1体に60ダメージ", type: "damage", target: "enemy_any_unit", damage: 60 },
      6: { label: "十字範囲に各30ダメージ", type: "area_damage", target: "enemy_any_cell", range: "cross", damage: 30 }
    }
  }
];

const STAGE_DEFINITIONS = [
  { stage: 1, name: "草原の小競り合い", enemyIds: ["monster_slime", "monster_slime", "monster_goblin", "monster_bat"], positions: [6, 7, 8, 4] },
  { stage: 2, name: "森の伏兵", enemyIds: ["monster_goblin", "monster_goblin", "monster_bat", "monster_slime"], positions: [6, 7, 8, 4] },
  { stage: 3, name: "毒霧の影", enemyIds: ["monster_goblin", "monster_shade", "monster_bat", "monster_bat"], positions: [6, 7, 8, 4] },
  { stage: 4, name: "オークの前線", enemyIds: ["monster_orc", "monster_goblin", "monster_orc", "monster_shade"], positions: [6, 7, 8, 4] },
  { stage: 5, name: "魔女の陣", enemyIds: ["monster_orc", "monster_witch", "monster_shade", "monster_bat"], positions: [6, 4, 8, 1] },
  { stage: 6, name: "石巨人の門", enemyIds: ["monster_golem", "monster_orc", "monster_golem", "monster_witch"], positions: [6, 7, 8, 4] },
  { stage: 7, name: "飛竜の巣", enemyIds: ["monster_drake", "monster_bat", "monster_drake", "monster_witch"], positions: [6, 4, 8, 1] },
  { stage: 8, name: "死神の回廊", enemyIds: ["monster_reaper", "monster_shade", "monster_golem", "monster_witch"], positions: [6, 4, 8, 1] },
  { stage: 9, name: "魔軍の精鋭", enemyIds: ["monster_drake", "monster_reaper", "monster_golem", "monster_witch"], positions: [6, 7, 8, 4] },
  { stage: 10, name: "最終戦：アークデーモン", enemyIds: ["monster_archdemon", "monster_reaper", "monster_drake", "monster_witch"], positions: [7, 4, 6, 8] }
];


const INITIAL_PLAYER_BOARD = CHARACTER_TEMPLATES.slice(0, 4).concat(Array(5).fill(null));
const INITIAL_ENEMY_BOARD = CHARACTER_TEMPLATES.slice(4, 10).concat(Array(3).fill(null));