 /*:
 * @plugindesc v1.0.0 All Custom Quests and Badges value tracking
 * @author ReynStahl
 * 
 * @help
 * Keeps track of custom values for quests
 */

var Imported = Imported || {};
Imported.Reverie_QuestsBadges = true;

var Reverie = Reverie || {};
Reverie.QuestsBadges = Reverie.QuestsBadges || {};

// ================================================================
// * Helper Class
// ================================================================

class RvQuests {
    static playBadgeSound() {
        AudioManager.playSe(this.badgeSound);
    }

    static rvUnlockBadge(badgeName) {
        let added = DGT.UnlockBadge(this.modId, badgeName);
        console.log("Add reverie badge - new added:", badgeName, added)
        if (added) {
            this.playBadgeSound();
        }
    }

    static unlockAllBadges() {
        let badgesData = DGT.Badges._data[this.modId];
        for (let badgeKey in badgesData) {
            DGT.UnlockBadge(this.modId, badgeKey);
        }
        this.playBadgeSound();
    }

    static lockAllBadges() {
        let badgeKeys = DGT.Badges._userData[this.modId];
        badgeKeys.forEach(badgeName => DGT.LockBadge(this.modId, badgeName));
        this.playBadgeSound();
    }

    static addActorStates(id) {
        this.actorStatesSet.add(id);
    }

    static addEnemyStates(id) {
        this.enemyStatesSet.add(id);
    }

    static hasActorState(id) {
        return this.actorStatesSet.has(id);
    }

    static hasEnemyState(id) {
        return this.enemyStatesSet.has(id);
    }

    static initBothStates() {
        this.actorStatesSet = new Set();
        this.enemyStatesSet = new Set();
    }

    static initKillCounts() {
        this.enemyKills = new Map();
    }

    static addKillCounts(id, amount = 1) {
        let setAmount = this.enemyKills.has(id) ? this.enemyKills.get(id) + amount : amount;
        this.enemyKills.set(id, setAmount)
    }

    static getKillCount(id) {
        return this.enemyKills.has(id) ? this.enemyKills.get(id) : 0;
    }
}

RvQuests.modId = "reverie";

RvQuests.badgeSound = {
    name: "GEN_item_get",
    volume: 90,
    pitch: 100,
    pan: 0
};

RvQuests.varId = {
    LEAFY_KILL: 615,
    ALICE_HAPPY: 1584,
    ALICE_INSTA: 1585,
    ALICE_BURN: 1586,
}

RvQuests.stateId = {
    GLOW: 235,
    WEEP: 236,
    BURN: 237,
    SLEEP: 238,
    CHARM: 239,
    FREEZE: 240,
    SICK: 241,
    INSTAKILL: 242,
}

RvQuests.enemyBaseId = {
    TAILISRAT: 1564,
    FIERY: 1598,
    WIDOW_SPIDER: 1601,
}

RvQuests.actorStatesSet = new Set();
RvQuests.enemyStatesSet = new Set();
RvQuests.enemyKills = new Map();

// ================================================================
// * Adding Reverie Quest badge. Makes adding badge play a sound too
// ================================================================
Reverie.QuestsBadges.GameInterpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;
Game_Interpreter.prototype.pluginCommand = function (command, args) {
    switch (command.toLowerCase()) {
        case 'rvunlockbadge':
            return RvQuests.rvUnlockBadge(args[0])
        default:
            return Reverie.QuestsBadges.GameInterpreter_pluginCommand.call(this, command, args)
    }
}

// ================================================================
// * Adding Badge to command window
// ================================================================
Scene_Menu.prototype.createCommandWindow = function() {
    // If Command Window Does Not Exist
    if (!this._commandWindow) {
      // Create Command Window
      this._commandWindow = new Window_MenuCommand(10, 10);
    } else {
      this._commandWindow.refresh();
    };
    this._commandWindow.activate();
    this._commandWindow.setHandler('talk',    this.commandTalk.bind(this));
    this._commandWindow.setHandler('item',    this.onPersonalOk.bind(this));
    this._commandWindow.setHandler('skill',   this.commandPersonal.bind(this));
    this._commandWindow.setHandler('equip',   this.commandPersonal.bind(this));
    this._commandWindow.setHandler('options', this.commandOptions.bind(this));
    this._commandWindow.setHandler('badge',   this.commandBadge.bind(this));
    this._commandWindow.setHandler('cancel',  this.popScene.bind(this));
    this.addWindow(this._commandWindow);
};

Scene_Menu.prototype.commandBadge = function() {
    SceneManager.push(DGT.BadgeScene);
};

Reverie.QuestsBadges.Window_MenuCommand_makeCommandList = Window_MenuCommand.prototype.makeCommandList;
Window_MenuCommand.prototype.makeCommandList = function() {
    Reverie.QuestsBadges.Window_MenuCommand_makeCommandList.call(this);
    this.addCommand('BADGES', 'badge');
};

Window_MenuCommand.prototype.spacing = function() { return 10; };

// ================================================================
// * Functions
// ================================================================
Reverie.QuestsBadges.Scene_Battle_start = Scene_Battle.prototype.start;
Scene_Battle.prototype.start = function() {
    Reverie.QuestsBadges.Scene_Battle_start.call(this);
    RvQuests.initBothStates() // Reset States on start
    RvQuests.initKillCounts();
};

/*Reverie.QuestsBadges.BattleManager_endBattle = BattleManager.endBattle;
BattleManager.endBattle = function(result) {
    Reverie.QuestsBadges.BattleManager_endBattle.call(this, result);
};*/

// Keep track states
Reverie.QuestsBadges.Game_Actor_addState = Game_Actor.prototype.addState;
Game_Actor.prototype.addState = function(stateId) {
    Reverie.QuestsBadges.Game_Actor_addState.call(this, stateId);
    RvQuests.addActorStates(stateId);
};

Reverie.QuestsBadges.Game_Enemy_addState = Game_Enemy.prototype.addState;
Game_Enemy.prototype.addState = function(stateId) {
    // Checks before actually adding state, to check before resist remove things
    var baseId = this.enemy().meta.TransformBaseID;

    // If enemy is a TAILISRAT, receiving CHARM
    if (baseId == RvQuests.enemyBaseId.TAILISRAT 
        && stateId == RvQuests.stateId.CHARM
    ) {
        RvQuests.rvUnlockBadge("necro");
    }

    // If enemy is a FIERY, receiving CHARM, and had GLOW at the moment
    if (baseId == RvQuests.enemyBaseId.FIERY 
        && stateId == RvQuests.stateId.CHARM 
        && this.isStateAffected(RvQuests.stateId.GLOW)
    ) {
        RvQuests.rvUnlockBadge("rose");
    }

    Reverie.QuestsBadges.Game_Enemy_addState.call(this, stateId);
    RvQuests.addEnemyStates(stateId);
};

// ================================================================
// * KILL CONDITION QUESTS - ALICE
// ================================================================
Reverie.QuestsBadges.Game_Enemy_die = Game_Enemy.prototype.die;
Game_Enemy.prototype.die = function() {
    // Check before Doing the dying, to get states before it's removed.
    // Check with Enemy Category Plugin
    if (this.isEnemyCategory("BUNNY")) {
        // Add to leafy bunny killer count quest.
        if (true) {
            const varId = RvQuests.varId.LEAFY_KILL;
            $gameVariables.setValue(varId, $gameVariables.value(varId) + 1);
            console.log("Leafy - Bunny Kill Count:", $gameVariables.value(varId));
        }
        // ALICE special conditions
        if (this.isStateCategoryAffected("HAPPY")) {
            const varId = RvQuests.varId.ALICE_HAPPY;
            $gameVariables.setValue(varId, $gameVariables.value(varId) + 1);
            console.log("Alice - HAPPY Bunny Kill Count:", $gameVariables.value(varId));
        }
        if (this.isStateCategoryAffected("INSTAKILL")) {
            const varId = RvQuests.varId.ALICE_INSTA;
            $gameVariables.setValue(varId, $gameVariables.value(varId) + 1);
            console.log("Alice - INSTA Bunny Kill Count:", $gameVariables.value(varId));
        }
        if (this.isStateAffected(RvQuests.stateId.BURN)) {
            const varId = RvQuests.varId.ALICE_BURN;
            $gameVariables.setValue(varId, $gameVariables.value(varId) + 1);
            console.log("Alice - BURN Bunny Kill Count:", $gameVariables.value(varId));
        }
    }
    
    // Count amount of kills in the battle.
    let baseId = Number.parseInt(this.enemy().meta.TransformBaseID);
    RvQuests.addKillCounts(baseId);

    // Spider Kills, just count any battle since no other troop have many spiders.
    if (RvQuests.getKillCount(RvQuests.enemyBaseId.WIDOW_SPIDER) >= 20) {
        RvQuests.rvUnlockBadge("lordfly");
    }

    Reverie.QuestsBadges.Game_Enemy_die.call(this);
};

Reverie.QuestsBadges.Game_Battler_addAilment = Game_Battler.prototype.addAilment;
Game_Battler.prototype.addAilment = function (user, stateId, baseRate) {
    Reverie.QuestsBadges.Game_Battler_addAilment.call(this, user, stateId, baseRate);
    // If using Charm with 70 Luck or more on First turn
    if (stateId == RvQuests.stateId.CHARM && user.isActor() && user.luk >= 80 && $gameTroop.turnCount() <= 1) {
        console.log("Speed Date Badge")
        RvQuests.rvUnlockBadge("speeddate");
    }
}