/*:
 * @plugindesc v1.0.0 Reverie Display Related Tweaks / Overrides
 * @author ReynStahl
 *
 * @help
 * Reverie Display Related Tweaks / Overrides
 */

var Imported = Imported || {};
Imported.Reverie_DisplayTweak = true;

var Reverie = Reverie || {};
Reverie.DisplayTweak = Reverie.DisplayTweak || {};

// ================================================================
// * Stahl_ExtendedItemDisplay
// ================================================================
ItemDisplayManager.getLanguageData = function () {
  return LanguageManager.getTextData("XX_REVERIE", "ItemDisplay");
};

ItemDisplayManager.getItemTypeName = function (type) {
  const data = this.getLanguageData().itemType;
  return data[type] || "";
};

ItemDisplayManager.getWeaponTypeName = function (id) {
  const data = this.getLanguageData().weaponType;
  return data[id] || "";
};

ItemDisplayManager.getArmorTypeName = function (id) {
  const data = this.getLanguageData().armorType;
  return data[id] || "";
};

ItemDisplayManager.getCostText = function (item) {
  if (!item || item.mpCost == undefined) return "";
  const data = this.getLanguageData();
  // if passive return passive
  if (item.occasion === 3) {
    return data.skillPassive;
  }
  // Rest check cost like usual
  let costText = "";
  if (item.mpCost !== 0) {
    costText += item.mpCost + "\\I[9]";
  } else if (item.mpCostPer !== 0) {
    costText += (item.mpCostPer * 100) + "%\\I[9]";
  };
  if (item.hpCost !== 0) {
    costText += item.hpCost + "\\I[10]";
  } else if (item.hpCostPer !== 0) {
    costText += (item.hpCostPer * 100) + "%\\I[10]";
  };
  if (item.meta.EnergyCost !== undefined) {
    costText += item.meta.EnergyCost + "\\I[11]";
  };
  if (costText === "") {
    costText += data.skillFree;
  };
  return data.skillCost.format(costText);
};

// ================================================================
// * Stahl_EvenMoreInfo
// ================================================================
// ================ Helper functions ================
StatusDisplayManager.getLanguageData = function () {
  return LanguageManager.getTextData("XX_REVERIE", "StatusDisplay");
};

StatusDisplayManager.convertRateString = function (rate) {
  if (rate == 0) return "";
  var suffix = this.getLanguageData().status.rate;
  var rateDisplay = rate * 100 + "% " + suffix;
  if (rate > 0) return "+" + rateDisplay; //add plus sign if positive
  return rateDisplay;
};

StatusDisplayManager.convertTurnString = function (rate) {
  if (rate == 0) return "";
  var suffix = this.getLanguageData().status.turn;
  if (rate > 0) return "+" + rate + " " + suffix; //add plus sign if positive
  return rate + " " + suffix;
};

StatusDisplayManager.convertRateTurnString = function (rate, duration) {
  return this.convertRateString(rate) + " " + this.convertTurnString(duration);
};


StatusDisplayManager.reverieGetDifficultyName = function () {
  const data = this.getLanguageData();
  let diffNum = $gameVariables.value(data.id.varDiff);
  let normalOverride = $gameSwitches.value(data.id.switchDiffOverride);
  return data.difficulty[diffNum] + (normalOverride ? "*" : "");
};

StatusDisplayManager.getEscapeLine = function () {
  let data = this.getLanguageData().commandMessage;
  let escapeRatio = parseInt(Math.min(100, BattleManager._escapeRatio * 100));
  if (BattleManager.canEscape()) return data.escape.format(escapeRatio);
  return data.noEscape;
};

// ================ Overrides ================
StatusDisplayManager.getExtraInfoLines = function (battler) {
  // Assumes if no show damage, it's like real world so no extra info.
  if (!BattleManager._showDamage) return [];
  let lines = [];
  const data = this.getLanguageData();
  const gapSize = data.status.gapSize;
  const groupColor = data.status.groupColor;
  const stateColor = data.status.stateColor;
  const statusColor = data.status.statusColor;
  const immuneText = data.status.immune;

  const categoryList = BestiaryManager.getEnemyCategoryNames(battler._enemyId);
  lines.push(this.createLinePair(data.status.group + ":", categoryList.join(", "), groupColor, groupColor, gapSize));

  // Go through state key (id), these are valid displays.
  for (const id in data.states) {
    const stateId = Number(id);
    const name = data.states[stateId];
    let infoText = "";

    if (battler.isStateResist(stateId)) {
      infoText = immuneText;
    } else {
      const rateReceive = battler.getAilmentReceiveRate(stateId);
      const durationReceive = battler.getAilmentReceiveDuration(stateId);
      if (rateReceive == 0 && durationReceive == 0) continue; // no rate or duration, skip
      infoText = this.convertRateTurnString(rateReceive, durationReceive);
    }
    lines.push(this.createLinePair(name + ":", infoText, stateColor, statusColor, gapSize));
  }
  return lines;
};

StatusDisplayManager.getPartyCommandMessage = function () {
  let size = $gameParty.size();
  let promptMessage = this.getPartySizeMessage(size);
  let escapeMessage = this.getEscapeLine();
  let diffcultyName = this.reverieGetDifficultyName();
  let secondLine = "[" + escapeMessage + " | " + diffcultyName + "]";
  return [promptMessage, secondLine];
};

StatusDisplayManager.getActorActionPromptMessage = function (actor) {
  let lines = [];
  var equips = actor.equips();
  let data = this.getLanguageData().commandMessage;
  lines.push(
    LanguageManager.languageData().text.XX_GENERAL.message_104.text.format(
      actor.name()
    )
  );
  lines.push(
    data.statLine.format(
      actor.atk,
      actor.def,
      actor.agi,
      actor.luk,
      Math.round(actor.hit * 100),
      Math.round(actor.eva * 100)
    )
  );
  lines.push(
    data.equipLine.format(
      actor.level,
      equips[0] ? equips[0].name : "-",
      equips[1] ? equips[1].name : "-"
    )
  );
  return lines;
};

StatusDisplayManager.getFootnoteMessage = function (battler) {
  // Draw Level [REVERIE]
  if (!battler.enemy().meta.NoDisplayLevel) {
    var levelDisplay = battler.enemy().meta.DisplayLevel || "?";
    return this.getLanguageData().commandMessage.level.format(levelDisplay);
  }
  return "";
};

StatusDisplayManager.getSideStatLines = function (battler) {
  let statText = this.getLanguageData().stat;
  return [
    `${statText.atk}: ${battler.atk}`,
    `${statText.def}: ${battler.def}`,
    `${statText.agi}: ${battler.agi}`,
    `${statText.luk}: ${battler.luk}`,
    `${statText.hit}: ${Math.round(battler.hit * 100)}`,
    `${statText.eva}: ${Math.round(battler.eva * 100)}`,
  ];
};

//=============================================================================
// * SKILL COST DISPLAY 
// * Original by bajamaid, edited by Stahl (to YAML-ize)
//=============================================================================
Window_OmoMenuHelp.prototype.refresh = function() {
  // Clear Contents
  this.contents.clear();
  // If Item Exists
  if (this._item) {
    this.contents.textColor = ItemDisplayManager.getColor(this._item, false); // SET COLOR
    this.contents.fontSize = LanguageManager.getMessageData("XX_BLUE.Window_OmoMenuHelp").refresh_contents_fontsize;
    this.drawText(this._item.name, 6, -6, 200);
    this.contents.textColor = ItemDisplayManager.getColor(null, false); // RESET COLOR
    this.contents.fontSize = this.standardFontSize();
    let loc_position = LanguageManager.getMessageData("XX_BLUE.Window_OmoMenuHelp").refresh_position;

    // replace with drawtextex
    this.drawTextEx(this._item.description, loc_position[0], loc_position[1], 28); 
    if (!$gameParty.inBattle() && !(this._item.mpCost == undefined)) { // CHANGE: Item descriptions text
      this.drawTextEx(ItemDisplayManager.getCostText(this._item), loc_position[0], loc_position[1] + 28 * 1.5, 28);
    }

    // Get Icon width
    var width = 106 * this._iconRate;
    // Draw Item Icon
    this.drawItemIcon(this._item, this.contents.width - width, 0, this._iconRate);
    // Get Icon Name
    var iconName = this._item.meta.IconName;
    // If Icon Name Exists
    if (iconName) {
      // Get Bitmap
      // var bitmap = ImageManager.loadSystem('/items/' + iconName.trim());
      var bitmap = ImageManager.loadSystem(iconName.trim());
      // Create Icon Bitmap
      bitmap.addLoadListener(() => {
        var icon = new Bitmap(bitmap.width * this._iconRate, bitmap.height * this._iconRate);
        icon.blt(bitmap, 0, 0, bitmap.width, bitmap.height, 0, 0, icon.width, icon.height);
        var padding = this.standardPadding()
        var x = this.contents.width - icon.width;
        var y = this.contents.height - icon.height;
        this.contents.blt(icon, 0, 0, icon.width, icon.height, x, y)
      })
    }

    this.drawQuantity();
  };
};

//=============================================================================
// * BASE GAME CHANGES
//=============================================================================

//=============================================================================
// * STRESS BAR REMOVE + COMMAND WINDOW: CHANGE FOR VALUE 4
//=============================================================================
Scene_Battle.prototype.createStressBar = function () {
  // Create Stress Bar
  this._stressBar = new Sprite_StressBar();
  this._stressBar.x = 140;
  this._stressBar.y = Graphics.height - 56;
  this._stressBar.visible = !$gameSwitches.value(41);

  if ([2, 4, 5, 6].contains($gameVariables.value(22))) {
    // REVERIE add value 4
    this._stressBar.visible = false;
  }
  this.addChildAt(this._stressBar, 2);
};

Sprite_StressBar.prototype.refreshEKGBitmap = function (index = this._ekgRow) {
  let ekgName = "energy_stress_ekg_line";
  switch ($gameVariables.value(22)) {
    case 1:
      ekgName = "energy_dw_line";
      break;
    case 3:
      ekgName = "energy_stress_ekg_line";
      break;
    case 4:
      ekgName = "energy_dw_line";
      break; // REVERIE Changed image
  }
  // Get Bitmap
  var bitmap = ImageManager.loadSystem(ekgName);
  // Clear & Transfer Bitmap
  this._ekgLineBitmap.clear();
  this._ekgLineBitmap.blt(bitmap, 0, index * 28, bitmap.width, 28, 0, 0);
  // If Pending EKG Row is valid
  if (this._pendingEKGRow >= 0) {
    this._ekgLineNewBitmap.clear();
    this._ekgLineNewBitmap.blt(
      bitmap,
      0,
      this._pendingEKGRow * 28,
      bitmap.width,
      28,
      0,
      0
    );
  }
};

Sprite_StressBar.prototype.updateBackgroundImage = function () {
  // Get Background Name
  let backgroundName = "StressBar_DreamWorld";
  // Set Index to 0
  let index = 0;
  // Set Default Rows
  let rows = 5;
  // Get Stress
  let stress = $gameParty.stressEnergyCount;

  if (
    $gameParty.actorIsAffectedByState(1, 20) ||
    $gameParty.actorIsAffectedByState(8, 20)
  ) {
    stress = 10;
  }

  switch ($gameVariables.value(22)) {
    case 1:
      // Set Index
      index = Math.min(Math.max(Math.floor(stress / 2), 0), 4);
      break;
    case 3:
    case 4:
      index = Math.min(Math.max(Math.floor(stress / 2), 0), 4); // REVERIE Changed index
      break;
  }
  // Get Bitmap
  let bitmap = ImageManager.loadSystem(backgroundName);
  // Get Height
  let height = bitmap.height / rows;
  // Set Background Bitmap
  this._background.bitmap = bitmap;
  // Set Background Frame
  bitmap.addLoadListener(() =>
    this._background.setFrame(0, index * height, bitmap.width, height)
  );
};

Window_ActorCommand.prototype.makeCommandList = function () {
  // Run Original Function
  _TDS_.OmoriBattleSystem.Window_ActorCommand_makeCommandList.call(this);
  // If world index is 3
  if ($gameVariables.value(22) === 3) {
    // REVERIE: remove check value 4.
    // Remove all commands past the second one
    this._list.splice(2, 99);
  }
};

Window_ActorCommand.prototype.createCommandSprites = function () {
  // Set Command Name
  let commandName = "BattleCommands_DreamWorld";
  // Set Default Custom cursor X Offset
  this._customCursorXOffset = 12;
  // Set Default Max Columns
  this._commandMaxCols = 2;
  // Set Command
  switch ($gameVariables.value(22)) {
    case 1:
      commandName = "BattleCommands_DreamWorld";
      this._commandMaxCols = 2;
      break;
    case 2:
      commandName = "BattleCommands_Faraway";
      break;
    case 3:
      commandName = "BattleCommands_BlackSpace";
      this._customCursorXOffset = 90;
      this._commandMaxCols = 1;
    // commandName = 'BattleCommands_BS_ATK_SKILL';
    // this._commandMaxCols = 1;
    // this._customCursorXOffset = 90;
    // break;
    case 4: // REVERIE: Changed value 4 to Dreamworld
      commandName = "BattleCommands_DreamWorld";
      this._commandMaxCols = 2;
      break;
    case 5:
      commandName = "BattleCommands_BlackSpace";
      this._customCursorXOffset = 90;
      this._commandMaxCols = 1;
      break;
  }
  // Initialize Command Sprites Array
  this._commandSprites = [];
  // Get Bitmap
  var bitmap = ImageManager.loadSystem(commandName);
  var sw = bitmap.width / this._commandMaxCols;
  var sh = bitmap.height / 2;

  for (var i = 0; i < 4; i++) {
    // Create Command Sprite
    let sprite = new Sprite(bitmap);
    // Get Item Rectangle
    let rect = this.itemRect(i);

    let sx = (i % this._commandMaxCols) * sw;
    let sy = Math.floor(i / this._commandMaxCols) * sh;
    sprite.setFrame(sx, sy, sw, sh, 0, 0);
    //  sprite.x = rect.x - ((i % 2) * 2);
    sprite.x = rect.x;
    sprite.y = rect.y;
    this._commandSprites[i] = sprite;
    this.addChildToBack(sprite);
  }
};

Window_PartyCommand.prototype.createCommandSprites = function () {
  // Set Command Name
  let commandName = "party_command";
  let commandsSize = 2;
  // Set Command
  switch ($gameVariables.value(22)) {
    case 1:
      commandName = "PartyCommands_DreamWorld";
      break;
    case 2:
      commandName = "PartyCommands_Faraway";
      break;
    //   case 3: commandName = 'party_command' ;break;
    case 3:
      commandName = "PartyCommands_BlackSpace";
      break;
    case 4:
      commandName = "PartyCommands_DreamWorld";
      break; // REVERIE: Changed 4 to Dreamworld
    case 5:
      commandName = "PartyCommands_FinalBattle";
      commandsSize = 1;
      break;
  }
  // Hard code it to for simplicty sake
  //if (BattleManager._battleRetried && $gameTroop._troopId == 891) {
  if ($gameVariables.value(1220) >= 5 && $gameTroop._troopId == 891) {
    commandName = "PartyCommands_FinalBattle";
    commandsSize = 1;
  }

  // Initialize Command Sprites Array
  this._commandSprites = [];
  // Get Bitmap
  let bitmap = ImageManager.loadSystem(commandName);
  bitmap.addLoadListener(() => {
    if (commandsSize > 1) {
      let height = bitmap.height / commandsSize;
      for (var i = 0; i < commandsSize; i++) {
        var sprite = new Sprite(bitmap);
        sprite.setFrame(0, i * height, 360, height);
        sprite.y = i * (height + 3);

        this._commandSprites[i] = sprite;
        this.addChildToBack(sprite);
      }
    } else {
      let sprite = new Sprite(bitmap);
      sprite.setFrame(0, 0, 360, bitmap.height);
      sprite.y = 0;
      this._commandSprites[i] = sprite;
      this.addChildToBack(sprite);
    }
  });
};

Window_PartyCommand.prototype.processOk = function () {
  // Get World Index
  let world = $gameVariables.value(22);
  // Get Current Command symbol
  let symbol = this.currentSymbol();
  // If escape command and world is 4 or 5
  if (symbol === "escape" && world === 5) {
    // REVERIE: Remove world 4
    // If Escape Block Container has no children
    if (this._escapeBlockContainer.children.length === 0) {
      // Start Escape Block Effect
      this.startEscapeBlockEffect();
    }
    return;
  }
  // Remove Children
  this._escapeBlockContainer.removeChildren();
  // Run Original Function
  Window_Command.prototype.processOk.call(this);
};

//=============================================================================
// * BATTLE SKILL / ITEM PAGE ITEM COUNT
//=============================================================================
Window_BattleSkill.prototype.maxPageRows = function () {
  return 4;
};
Window_BattleItem.prototype.maxPageRows = function () {
  return 4;
};

Window_BattleItem.prototype.initialize = function (x, y, width, height) {
  this._arrowBitmap = new Bitmap(50, 50);
  this._arrowBitmap.fillAll("rgba(255, 0, 0, 1)");
  // Super Call
  Window_ItemList.prototype.initialize.call(
    this,
    x,
    y + 30,
    width,
    height - 10
  );
  // Create Back Window
  this._backWindow = new Window_ItemListBack(width, height);
  this.addChildToBack(this._backWindow);
  this.opacity = 0;
  this.hide();
};

Window_BattleSkill.prototype.initialize = function (x, y, width, height) {
  // Super Call
  Window_SkillList.prototype.initialize.call(
    this,
    x,
    y + 30,
    width,
    height - 10
  );
  // Create Back Window
  this._backWindow = new Window_ItemListBack(width, height);
  this.addChildToBack(this._backWindow);
  this.opacity = 0;
  this.hide();
};

Scene_Battle.prototype.createSkillWindow = function () {
  var wy = this._helpWindow.y + this._helpWindow.height;
  var wh = this._statusWindow.y - wy;
  this._skillWindow = new Window_BattleSkill(
    140,
    Graphics.height + 30,
    360,
    150
  );
  this._skillWindow.setHelpWindow(this._helpWindow);
  this._skillWindow.setHandler("ok", this.onSkillOk.bind(this));
  this._skillWindow.setHandler("cancel", this.onSkillCancel.bind(this));
  this.addWindow(this._skillWindow);
};

Scene_Battle.prototype.showSkillWindow = function () {
  // Duration
  var duration = 15;
  // Get Object
  var obj = this._skillWindow;
  // Create Movement Data
  var data = {
    obj: obj,
    properties: ["y"],
    from: { y: obj.y },
    to: { y: Graphics.height - 115 },
    durations: { y: duration },
    easing: Object_Movement.easeOutCirc,
  };
  this.move.startMove(data);
};

Scene_Battle.prototype.createItemWindow = function () {
  this._itemWindow = new Window_BattleItem(140, Graphics.height + 30, 360, 150);
  this._itemWindow.setHelpWindow(this._helpWindow);
  this._itemWindow.setHandler("ok", this.onItemOk.bind(this));
  this._itemWindow.setHandler("cancel", this.onItemCancel.bind(this));
  this.addWindow(this._itemWindow);
};

Scene_Battle.prototype.showItemWindow = function () {
  // Duration
  var duration = 15;
  // Get Object
  var obj = this._itemWindow;
  // Create Movement Data
  var data = {
    obj: obj,
    properties: ["y"],
    from: { y: obj.y },
    to: { y: Graphics.height - 115 },
    durations: { y: duration },
    easing: Object_Movement.easeOutCirc,
  };
  this.move.startMove(data);
};
