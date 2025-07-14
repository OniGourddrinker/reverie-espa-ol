//=============================================================================
// REVERIE Plugin - Core Stuff
// DGT_reveriefixes.js    VERSION 1.1.0
//=============================================================================

var Imported = Imported || {};
Imported.DGT_reveriefixes = true;

var Reverie = Reverie || {};
Reverie.Fixes = Reverie.Fixes || {};

var ReverieMisc = ReverieMisc || {};

//=============================================================================
 /*:
 * @plugindesc v1.1.0 Miscellaneous Reverie Specific Changes, Not for general use
 * @author Draught, ReynStahl
 * 
 * @help
 * Note: This just list important function that is put into RPGMV screen
 * This will not show the full details, for that check the actual plugin code.
 * Majority of specific IDs should be listed as a Constant variable for easy viewing.
 * 
 * Dependencies: PUT AT THE BOTTOM.
 * - Stahl_ExtendedItemDisplay
 * 
 * Versions:
 * v1.1.0 - Large refactor to not depend on block scoping for aliasing function. 
 *          Split some functionality into own plugins.
 * 
 * ================ OVERLAPPING MODS ================
 * NOMORI - Already have non Omori Actor + Actor Input Order
 * 
 * ================ IMPORTANT FUNCTIONS ================
 * Game_Party - isReverieDreamworldParty()    Return whether the party is Dreamworld
 * Game_Action - calcElementRate(target)   Alias
 * Game_Action - preCalcCrit(target)    Precalculate crits, adding "_willCrit" proprty on action
 * 
 * ================ IMPORTANT Tags ================
 * <EDF>      Extended Damage Formula
 * <CRITICAL BASE RATE: x.x%>     The base crit rate of skill. By default is 5%
 * 
 * ================ IMPORTANT Plugin Commands ================
 * syncsprite x with y        Syncs enemy sprite to be in time
 * TBA sync emotion
 * 
 * ================ IMPORTANT REGION ID ================
 * TBA Falling Star
 * 
 * ================ OTHER CHANGES ================
 * Lasting Memory Skill with Low HP Overlay
 * Plot Armor
 * Skill Cost Fail
 */

ReverieMisc.actorId = {
  DW_SUNNY: 17,
  DW_SWH: 18,
  DW_DG: 19,
  DW_SBF: 20,
  RW_SUNNY: 27,
  RW_DAPHNE: 28,
  RW_BOWEN: 29,
  RW_LUCY: 30,
  RW_MAX: 31,
  RW_HOWARD: 32,
  SP_SUNNY: 35,
  SP_SWH: 36,
  SP_DG: 37,
  SP_SBF: 38
}

ReverieMisc.partyId = {
  DW: [17, 18, 19, 20],
  RW_FILM: [27, 30, 31, 32],
  SP: [35, 36, 37, 38]
}

ReverieMisc.switchId = {
  TITLE_REVERIE: 2502,
  SKILL_COST_FAIL: 2802,
  SHOP_LOTTE: 2981,
}

ReverieMisc.varId = {
  DIFFICULTY: 1512,
  SKILL_FAIL_COUNT: 1582,
}

ReverieMisc.skillId = {
  LASTING_MEMORY: 1542
}

ReverieMisc.ailmentId = [235, 236, 237, 238, 239, 240, 241];
ReverieMisc.mainEmotionId = [6, 7, 8, 10, 11, 12, 14, 15, 16];

ReverieMisc.secondChanceActors = [1, 17, 35];

ReverieMisc.defaultDisplayActionResult = false;

ReverieMisc.isSecondChanceActor = function (id) {
  return this.secondChanceActors.contains(id);
}

// If Protagonist Death means losing, like standard Omori
ReverieMisc.isProtagLose = function () { // ONLY CHECK ACTIVE PARTY
  let members = $gameParty.members();
  if (members.some(actor => actor._equippedSkills.contains(this.skillId.LASTING_MEMORY))) {
    return false; // If have lasting memory, then false
  }
  return true;
}

ReverieMisc.isReverieTitle = function () {
  return $gameSwitches.value(ReverieMisc.switchId.TITLE_REVERIE);
}

// ================================================================ 
//               OTHER CUSTOM PLUGIN OVERRIDES
// ================================================================ 

// ================ DGT_syncsprites ================
DGT.isValidSyncState = function (id) {
  return ReverieMisc.mainEmotionId.includes(id) || ReverieMisc.ailmentId.includes(id);
}

// ================================================================ 
//                    TROOP 1 / PLOT ARMOR RELATED
//        These are made into function for easy changing
// ================================================================ 

// If the actor can do Plot Armor. If has Lasting Memory then no
Game_Actor.prototype.canPlotArmor = function() {
  if (this._equippedSkills.contains(1542)) { return false; }
  return ReverieMisc.isSecondChanceActor(this.actorId());
};

// SUNNY PLOT ARMOR
(function ($) {
  // Forced version for message immediately
  $.Process_Second_Chance_Message_Forced = function (target) {
    console.log("Attempting Process_Second_Chance_Message_Forced")
    if (!target.canPlotArmor()) { return; } // If it's not OMORI do not process;

    if (!!$gameSwitches.value(1613)) { // PLOT ARMOR MESSAGE and FORCE PLOT ARMOR ?
      $gameSwitches.setValue(1613, false); // Plot Armor Message;
      $gameTemp._secondChance = true; // Activating second chance face;
      $gameSwitches.setValue(2000, true); // Preparing Plot Armor Battle Event Switch;
      SceneManager._scene._statusWindow.refresh();
      let Bubble_Toggle = $gameSwitches.value(6);
      let endureMessage = "xx_battle_text.message_1000";
      if (target.actorId() != 1) {
        endureMessage = "00_reverie_battle.message_playerEndure";
      }

      if (!!Bubble_Toggle) {
        $gameSwitches.setValue(6, false);
        $gameMessage.showLanguageMessage(endureMessage);
        $gameSwitches.setValue(6, true);
      } else {
        $gameMessage.showLanguageMessage(endureMessage);
      }
    }
  }

  $.Process_Second_Chance_Message = function (target) {
    if (!target.canPlotArmor()) { return; } // If it's not OMORI do not process;

    if (!!$gameSwitches.value(1613)) { // PLOT ARMOR MESSAGE and FORCE PLOT ARMOR ?
      $gameSwitches.setValue(1613, false); // Plot Armor Message;
      $gameTemp._secondChance = true; // Activating second chance face;
      $gameSwitches.setValue(2000, true); // Preparing Plot Armor Battle Event Switch;
      SceneManager._scene._statusWindow.refresh();
      let Bubble_Toggle = $gameSwitches.value(6);
      let endureMessage = "xx_battle_text.message_1000";
      if (target.actorId() != 1) {
        endureMessage = "00_reverie_battle.message_playerEndure";
      }

      if (!!Bubble_Toggle) {
        $gameTemp._addToFinishActions = [
          ["EVAL", [`$gameSwitches.setValue(6, false)`]],
          ["EVAL", [`$gameMessage.showLanguageMessage("${endureMessage}")`]],
          ["EVAL", [`$gameSwitches.setValue(6, true)`]]
        ]
      } else {
        $gameTemp._addToFinishActions = [
          ["EVAL", [`$gameMessage.showLanguageMessage("${endureMessage}")`]]
        ]
      }
    }
  }

  $.Force_Clear_Plot_Armor = function() {
    $gameParty.members().forEach(actor => {
      actor.removeState(299); // First Hit;
      actor.removeState(300); // Plot Armor;
    })
    $gameTemp._secondChance = false;
  }
})(Gamefall.OmoriFixes);

// ======== LOW HP OVERLAY NOT NEEDED WHEN LASTING MEMORY ======== //
Reverie.Fixes.Sprite_BattleLowHpOverlay_update = Sprite_BattleLowHpOverlay.prototype.update;
Sprite_BattleLowHpOverlay.prototype.update = function() {
  if (!ReverieMisc.isProtagLose()) {
    Sprite.prototype.update.call(this);
    this._hidden = true;
    this.opacity = 0;
    return;
  }
  Reverie.Fixes.Sprite_BattleLowHpOverlay_update.call(this);
}

// ================================================================ 
//                    ALTER MENU - Enemy or Actor select for AOE
// ================================================================ 

Reverie.Fixes.Game_Action_needsSelection = Game_Action.prototype.needsSelection;
Game_Action.prototype.needsSelection = function() {
  // If Action can change target group
  if (this.canChangeTargetGroups()) { return true; };
  // Return Original Function
  return Reverie.Fixes.Game_Action_needsSelection.call(this);
};

// ================================================================ 
//                          MORE SKILLS
// ================================================================ 
Window_OmoMenuActorSkillEquip.prototype.maxItems = function() { return 6; }
Window_OmoMenuActorSkillEquip.prototype.maxPageRows = function() { return 4; }

// ================================================================ 
//                    MISC RPGMV RETURN FUNCTIONS 
// ================================================================ 

Game_Party.prototype.isReverieDreamworldParty = function() {
  let members = this.members();
  let party = ReverieMisc.partyId.DW;
  return members.some(actor => party.includes(actor.actorId()));
};

Game_Battler.prototype.isIgnoreElementRate = function() {
  return this.isStateCategoryAffected("IGNORE ELEMENT");
}

Reverie.Fixes.Game_Action_calcElementRate = Game_Action.prototype.calcElementRate;
Game_Action.prototype.calcElementRate = function(_target) {
  const subject = this.subject()
  if (subject && subject.isIgnoreElementRate()) {
    return 1;
  }
  return Reverie.Fixes.Game_Action_calcElementRate.call(this, _target);
}

// ATTACK AND DEFENSE STATE CHECKS
Game_Action.prototype.isBasicAttack = function () {
  return this.isSkill() && this.item().stypeId && this.item().stypeId == 3;
}

Game_Action.prototype.isPhysicalHpDamage = function (value) {
  return value > 0 && this.isHpEffect() && this.isPhysical();
}

Game_Action.prototype.canAttackBuff = function (value) {
  return this.isPhysicalHpDamage(value) && !this.isIgnoreAttackBuff();
}

Game_Action.prototype.canDefenseBuff = function (value) {
  return this.isPhysicalHpDamage(value) && !this.isIgnoreDefenseBuff();
}

Game_Action.prototype.canDefenseAsDamageBuff = function (value) {
  return this.isPhysicalHpDamage(value) && this.isUseDefenseAsDamageBuff();
}

Game_Action.prototype.isIgnoreAttackBuff = function () {
  return Boolean(this.item().meta.IgnoreAttackBuff) && !this.isUseDefenseAsDamageBuff(); // If use defense as attack instead, don't use attack as damage buff
}

Game_Action.prototype.isIgnoreDefenseBuff = function () {
  return Boolean(this.item().meta.IgnoreDefenseBuff);
}

Game_Action.prototype.isUseDefenseAsDamageBuff = function () {
  return Boolean(this.item().meta.UseDefenseAsDamageBuff);
}

Game_Action.prototype.isIgnoreDifficultyAdjust = function () {
  return Boolean(this.item().meta.IgnoreDifficultyAdjust);
}

//=============================================================================
// * Miscellaneous Fixes
//=============================================================================

//=============================================================================
// * Force to assume Null by default to avoid action result spam
//=============================================================================
Window_BattleLog.prototype.displayActionResults = function(subject, target) {
  var item = BattleManager._action._item.object();
  if (item && item.meta.BattleLogType) {
    this.displayCustomActionText(subject, target, item);
  } else if (ReverieMisc.defaultDisplayActionResult) {
    _TDS_.CustomBattleActionText.Window_BattleLog_displayActionResults.call(this, subject, target);
  }
};

// ================================================================ 
//    ALLOW CUSTOM ACTION END EFFECT TO ALSO TRIGGER AT START
//    OF MAKE ACTION / ENEMY AI TO GET RID OF STATES PROPERLY BEFORE CHECK
// ================================================================ 
Reverie.Fixes.Game_Enemy_makeActions = Game_Enemy.prototype.makeActions;
Game_Enemy.prototype.makeActions = function() {
  var states = this.states();
  for (state of states) {
    if (state && state.meta.EvalOnMakeAction) {
      console.log("EvalOnMakeAction do actionEndStateEffects", state.id)
      this.actionEndStateEffects(state.id);
    }
  }
  Reverie.Fixes.Game_Enemy_makeActions.call(this);
}

// ================================================================ 
//                  CRITICALS
// ================================================================ 

// ================ CRITICAL BASE RATE TAG ================ //
Reverie.Fixes.DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function() {
  if (!Reverie.Fixes.DataManager_isDatabaseLoaded.call(this)) return false;
  if (!Reverie._loaded_ReverieFixes) {
    this.processExtraCritNotetags1($dataSkills);
    this.processExtraCritNotetags1($dataItems);
    Reverie._loaded_ReverieFixes = true;
  }
  return true;
};

DataManager.processExtraCritNotetags1 = function(group) {
  console.log("Loaded Reverie Extra Crit")
  for (var n = 1; n < group.length; n++) {
    var obj = group[n];
    var notedata = obj.note.split(/[\r\n]+/);

    for (var i = 0; i < notedata.length; i++) {
      var line = notedata[i];
      if (line.match(/<CRITICAL BASE RATE: (\d+\.?\d+)([%％])>/i)) {
        var rate = parseFloat(RegExp.$1) * 0.01;
        obj.critRate = "var bonus = " + String(rate) + ";\n" + String(Yanfly.Param.critRate);
        obj.damage.critical = true;
      }
    }
  }
}

// ================ PRECALCULATED CRITICALS ================ //
Reverie.Fixes.Game_Action_itemCri = Game_Action.prototype.itemCri;
Game_Action.prototype.itemCri = function(target) {
  if (this.subject()._willCrit !== undefined) {
    let rate = this.subject()._willCrit ? 1 : 0;
    this.subject()._willCrit = undefined;
    return rate;
  } else {
    return Reverie.Fixes.Game_Action_itemCri.call(this, target);
  }
};

Game_Action.prototype.preCalcCrit = function (target) {
  this.subject()._willCrit = this.subject()._willCrit || (Math.random() < this.itemCri(target))
  console.log(this.subject()._willCrit);
}

Object.defineProperty(Game_Action.prototype, '_willCrit', {
  get: function () {
    let target = $gameTroop.members()[this._targetIndex]
    this.subject()._willCrit = this.subject()._willCrit || (Math.random() < this.itemCri(target))
    return this.subject()._willCrit
  },
  set: function (value) {
    //do NOTHING
    //you lose!!!!!!!
  },
});

// ================================================================ 
//                  DEATH INSTANT DISAPPEAR
// ================================================================ 
Reverie.Fixes.Sprite_Enemy_setBattler = Sprite_Enemy.prototype.setBattler;
Sprite_Enemy.prototype.setBattler = function (battler) {
  Reverie.Fixes.Sprite_Enemy_setBattler.call(this, battler)
  if (this._enemy) {
    this._dieOnDeath = this._enemy.enemy().meta.DieOnDeath;
  } else {
    this._dieOnDeath = false;
  }
}

Reverie.Fixes.Sprite_Enemy_updateCollapse = Sprite_Enemy.prototype.updateCollapse;
Sprite_Enemy.prototype.updateCollapse = function () {
  if (this._dieOnDeath) {
    // If On last frame of motion
    if (this._pattern >= this.motionFrames() - 2) {
      this._becomeKill = true;
    }
  } else {
    Reverie.Fixes.Sprite_Enemy_updateCollapse.call(this);
  };
};

Reverie.Fixes.Sprite_Enemy_updateMotionCount = Sprite_Enemy.prototype.updateMotionCount
Sprite_Enemy.prototype.updateMotionCount = function () {
  Reverie.Fixes.Sprite_Enemy_updateMotionCount.call(this)
  // if on first frame of motion
  if (this._pattern === 0 && this._becomeKill) {
    this.opacity = 0;
  }
}

// ================================================================ 
//                        MAPS AND EVENTS
// ================================================================ 

// ================ NULL EVENT FIX ================ //
// This happens when old save file go into new ones, 
// causing null event that might not exist in other version
Reverie.Fixes.Game_Event_refresh = Game_Event.prototype.refresh;
Game_Event.prototype.refresh = function () {
  if (!this.event()) { return; }

  Reverie.Fixes.Game_Event_refresh.call(this);
};

// ======== EVENT REGION ID 21 BLOCK ENEMIES NOT PLAYER ======== //
Reverie.Fixes.Game_CharacterBase_isEventRegionForbid = Game_CharacterBase.prototype.isEventRegionForbid;
Game_CharacterBase.prototype.isEventRegionForbid = function(x, y, d) {
  if (this instanceof Game_Follower) { return false }
  if (this.isPlayer()) { return false }
  const regionId = this.getRegionId(x, y, d);
  if (regionId === 21) { return true }

  return Reverie.Fixes.Game_CharacterBase_isEventRegionForbid.call(this, x, y, d)
}

Reverie.Fixes.Game_CharacterBase_canPass = Game_CharacterBase.prototype.canPass;
Game_CharacterBase.prototype.canPass = function(x, y, d) {
  if (this.isEventRegionForbid(x, y, d)) {
    return false
  }
  return Reverie.Fixes.Game_CharacterBase_canPass.call(this, x, y, d)
}

// ================================================================ 
//                             MENU 
// ================================================================ 

// ======== REVERIE TITLE SCREEN ======== //
Reverie.Fixes.DataManager_writeToFileAsync = DataManager.writeToFileAsync;
DataManager.writeToFileAsync = function(text, filename, callback) {
  if (filename === 'TITLEDATA' && ReverieMisc.isReverieTitle()) {
    text = 447
  }
  return Reverie.Fixes.DataManager_writeToFileAsync.call(this, text, filename, callback)
}

// ======== FORGET SKILL UNEQUIPS ======== //
Reverie.Fixes.Game_Actor_forgetSkill = Game_Actor.prototype.forgetSkill
Game_Actor.prototype.forgetSkill = function(skillId) {
  var index = this._equippedSkills.indexOf(skillId);
  if (index >= 0) {
    this._equippedSkills.splice(index, 1);
  }
  Reverie.Fixes.Game_Actor_forgetSkill.call(this, skillId)
}

// ======== MORE skills fix + make skill list unique ======== //
Reverie.Fixes.Game_Actor_equipSkill = Game_Actor.prototype.equipSkill;
Game_Actor.prototype.equipSkill = function(equipIndex, skillId) {
  // For each null equip, make it 0
  // Also Make sure skill list is unique
  let seen = new Set();
  for (let i = 0; i < this._equippedSkills.length; i++) {
    if (!this._equippedSkills[i] || seen.has(this._equippedSkills[i])) {
      this._equippedSkills[i] = 0;
    } else {
      seen.add(this._equippedSkills[i]);
    }
  }

  // Call function
  Reverie.Fixes.Game_Actor_equipSkill.call(this, equipIndex, skillId);
}

Reverie.Fixes.Game_Actor_initSkills = Game_Actor.prototype.initSkills;
Game_Actor.prototype.initSkills = function () {
  Reverie.Fixes.Game_Actor_initSkills.call(this);
  this._equippedSkills = [0, 0, 0, 0, 0, 0];
  this._lockedEquippedSkills = [false, false, false, false, false, false];
};

// ================================================================ 
//       PORTRAIT MENU OFFSET (SPACEBOY LONG HAIR)
// ================================================================ 
Sprite_OmoMenuStatusFace.prototype.updateBitmap = function() {
  // Get Actor
  var actor = this.actor
  // If Actor Exists and it has Battle Status Face Name
  if (actor) {
    // Face Name
    let faceName
    if (this._inMenu) {
      // Get Face Name
      faceName = actor.menuStatusFaceName();
      // Set Face Width & Height
      this._faceWidth = 125;
      this._faceHeight = 125;
      if (actor.actorId() == ReverieMisc.actorId.DW_SBF) this._faceHeight = 145;
    };
    // Set Default Face Name
    if (!faceName) {
      faceName = actor.battleStatusFaceName();
      // Set Face Width & Height
      this._faceWidth = 106;
      this._faceHeight = 106;
    };
    // Set Bitmap
    this.bitmap = ImageManager.loadFace(faceName);
  } else {
    this.bitmap = null;
  };
  // Update Frame
  this.updateFrame();
};

// ================================================================ 
//                             BATTLE 
// ================================================================ 

// ================================================================ 
//          ACTOR INPUT ORDER - ESSENTIALLY NOMORI INTEGRATED 
// ================================================================ 
Reverie.Fixes.Game_Party_getOmori = Game_Party.prototype.getOmori;
Game_Party.prototype.getOmori = function() {
  let omori = Reverie.Fixes.Game_Party_getOmori.call(this);
  if(!omori) {
    return this.leader();
  }
  return omori;
};

BattleManager.getActorInputOrder = function() {
  let members = $gameParty.members();
  let rv = ReverieMisc.actorId;
  let order = [
    1, 2, 3, 4, 8, 10, 9, 11, 
    rv.DW_SUNNY, rv.DW_DG, rv.DW_SWH, rv.DW_SBF, 
    rv.RW_SUNNY, 
    rv.SP_SUNNY, rv.SP_DG, rv.SP_SWH, rv.SP_SBF
  ];
  let list = []
  // Go through order
  for (let i = 0; i < order.length; i++) {
    let index = members.indexOf($gameActors.actor(order[i]));
    if (index > -1 && members[index].isAlive() && members[index].isBattleMember()) { list.push(index); }
  }
  // Return List
  return list;
};

// ======== STATE TURN TICKING UPDATE FIX ======== //
Reverie.Fixes.Game_Battler_onTurnEnd = Game_Battler.prototype.onTurnEnd;
Game_Battler.prototype.onTurnEnd = function() {
  this.updateStateTurns();
  Reverie.Fixes.Game_Battler_onTurnEnd.call(this);
}

// ======== SKILL COST FAIL MESSAGE ======== //
Reverie.Fixes.BattleManager_processForcedAction = BattleManager.processForcedAction;
BattleManager.processForcedAction = function() {
  const varIdCount = ReverieMisc.varId.SKILL_FAIL_COUNT;
  const varIdEnabled = ReverieMisc.switchId.SKILL_COST_FAIL;

  // If not check skill fail then continue as usual.
  if (!$gameSwitches.value(varIdEnabled)) {
    return Reverie.Fixes.BattleManager_processForcedAction.call(this)
  }

  if (this._actionForcedBattler) {
    this._preForcePhase = this._phase;
    this._processingForcedAction = true;
    this._turnForced = true;
    this._subject = this._actionForcedBattler;
    this._actionForcedBattler = null;
    let subject = this._subject;
    let action = subject.currentAction();
    if (action) {
      action.prepare();
      const canUseNormally = action.item() && action.subject().canUse(action.item()); //This is because isValid() will always return true if forced
      if (canUseNormally) {
        console.log("Plugin Forced Action: Valid action")
        this.startAction();
      } else if (action.item() && DataManager.isSkill(action.item())) {
        if (subject.mp < action.item().mpCost) { // Says this is for No MP reasons
          BattleManager.yamlText("fail_no_juice")
        } else { // Says this is for other general reasons
          BattleManager.yamlText("fail_generic")
        }
        $gameVariables.setValue(varIdCount, $gameVariables.value(varIdCount) + 1)
        console.log("Plugin Forced Action: NOT Valid action, Fail Count:", $gameVariables.value(varIdCount))
      }
      this._subject.removeCurrentAction();
    }
  }
}
