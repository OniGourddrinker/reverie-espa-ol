//=============================================================================
// Reverie Plugin - Ailments
// Reverie_Ailments.js    VERSION 1.0.1
//=============================================================================
/*:
 * @plugindesc v1.0.1 Ailments for Reverie
 * @author ReynStahl, Draught
 * @help
 * IMPORTANT NOTETAGS:
 *  <AILMENT ADD INFLICT RATE x: y>
 *  <AILMENT ADD RECEIVE RATE x: y>
 *  x = stateId; "ALL" for all state
 *  y = rate; Decimal rate 0.5 = 50%
 * 
 * Examples:
 *  <AILMENT ADD INFLICT RATE ALL: 0.5>
 *  <AILMENT ADD INFLICT RATE 237: 0.5>
 *  <AILMENT ADD RECEIVE RATE ALL: 0.5>
 *  <AILMENT ADD RECEIVE RATE 237: 0.5>
 */

var Reverie = Reverie || {};
Reverie.Ailments = Reverie.Ailments || {};

Reverie.Ailments.getAilmentList = function() {
    return [235,236,237,238,239,240,241,242];
}

Reverie.Ailments.AILMENT_EMOTION_DICT = {
    "HAPPY": 235,
    "SAD": 236,
    "ANGRY": 237,
    "NEUTRAL": 240
}

Reverie.Ailments.getAilmentIdFromEmotion  = function(emotion) {
    return Reverie.Ailments.AILMENT_EMOTION_DICT[emotion.toUpperCase()];
}

Reverie.Ailments.isAilmentGuard = function(battler) {
    return battler.isStateAffected(2);
}

Reverie.Ailments.isCharmed = function(battler) {
    return battler.isStateCategoryAffected("CHARM");
}

Reverie.Ailments.LUCK_MULT = 1.0; // How much % change per luck difference
Reverie.Ailments.CHARM_EFFECT_CHANCE = 1.0; // 0.0 to 1.0
Reverie.Ailments.TEXT_IMMUNE = "%1 is immune to %2!";
Reverie.Ailments.TEXT_GUARD = "%1 guarded against %2!";

Reverie.Ailments.DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function() {
    if (!Reverie.Ailments.DataManager_isDatabaseLoaded.call(this)) return false;
    if (!Reverie._loaded_Ailments) {
        this.processRvAilmentNotetags1($dataStates);
        this.processRvAilmentNotetags1($dataEnemies);
        this.processRvAilmentNotetags1($dataActors);
        this.processRvAilmentNotetags1($dataWeapons);
        this.processRvAilmentNotetags1($dataArmors);
        Reverie._loaded_Ailments = true;
    }
    return true;
};

DataManager.processRvAilmentNotetags1 = function(group) {
    for (var n = 1; n < group.length; n++) {
        var obj = group[n];
        var notedata = obj.note.split(/[\r\n]+/);

        obj.ailmentAddInflictRate = {}
        obj.ailmentAddReceiveRate = {};
        obj.ailmentAddInflictDuration = {};
        obj.ailmentAddReceiveDuration = {};

        for (let id of Reverie.Ailments.getAilmentList()) {
            obj.ailmentAddInflictRate[id] = 0;
            obj.ailmentAddReceiveRate[id] = 0;
            obj.ailmentAddInflictDuration[id] = 0;
            obj.ailmentAddReceiveDuration[id] = 0;
        }

        for (var i = 0; i < notedata.length; i++) {
            var line = notedata[i]
            
            // Flat number rate that apply to all
            // Push in form of key = stateId and number = ailment
            if (line.match(/<AILMENT ADD INFLICT RATE (.*):[ ](.*)>/i)) {
                if (String(RegExp.$1).toUpperCase() == "ALL") {
                    for (let id of Reverie.Ailments.getAilmentList()) {
                        obj.ailmentAddInflictRate[id] += parseFloat(RegExp.$2)
                    }
                } else {
                    obj.ailmentAddInflictRate[parseFloat(RegExp.$1)] += parseFloat(RegExp.$2)
                }
            }
            if (line.match(/<AILMENT ADD RECEIVE RATE (.*):[ ](.*)>/i)) {
                if (String(RegExp.$1).toUpperCase() == "ALL") {
                    for (let id of Reverie.Ailments.getAilmentList()) {
                        obj.ailmentAddReceiveRate[id] += parseFloat(RegExp.$2)
                    }
                } else {
                    obj.ailmentAddReceiveRate[parseFloat(RegExp.$1)] += parseFloat(RegExp.$2)
                }
            }
            if (line.match(/<AILMENT ADD INFLICT DURATION (.*):[ ](.*)>/i)) {
                if (String(RegExp.$1).toUpperCase() == "ALL") {
                    for (let id of Reverie.Ailments.getAilmentList()) {
                        obj.ailmentAddInflictDuration[id] += parseInt(RegExp.$2)
                    }
                } else {
                    obj.ailmentAddInflictDuration[parseInt(RegExp.$1)] += parseInt(RegExp.$2)
                }
            }
            if (line.match(/<AILMENT ADD RECEIVE DURATION (.*):[ ](.*)>/i)) {
                if (String(RegExp.$1).toUpperCase() == "ALL") {
                    for (let id of Reverie.Ailments.getAilmentList()) {
                        obj.ailmentAddReceiveDuration[id] += parseInt(RegExp.$2)
                    }
                } else {
                    obj.ailmentAddReceiveDuration[parseInt(RegExp.$1)] += parseInt(RegExp.$2)
                }
            }
        }
    }
};

// Adding ailment. returns true if successful. "this" is target being added, while "user" just mean the battler luck to reference from
// Rate is in terms of percentage, 100 meaning 100%
Game_Battler.prototype.addAilment = function (user, stateId, baseRate) {
    let rateAdd = 100 * this.getAilmentTotalRate(user, stateId);
    let durationAdd = this.getAilmentTotalDuration(user, stateId);
    var rate = 100.0;

    if (this.isStateResist(stateId)) { // Resist from Immunity
        BattleManager._logWindow.push("addText", Reverie.Ailments.TEXT_IMMUNE.format(this.name(), $dataStates[stateId].name));
        this._failedAilment = stateId;
        console.log("addAilment: FAILED from Immune", stateId);
        return false;
    } 

    if (Reverie.Ailments.isAilmentGuard(this)) { // Resist from Guard
        BattleManager._logWindow.push("addText", Reverie.Ailments.TEXT_GUARD.format(this.name(), $dataStates[stateId].name));
        this._failedAilment = stateId;
        console.log("addAilment: FAILED from Guard", stateId);
        return false;
    }

    rate = (baseRate + ((user.luk - this.luk) * Reverie.Ailments.LUCK_MULT)) + rateAdd;
    
    if (Math.randomInt(100) < rate) {
        this.addState(stateId);
        this._stateTurns[stateId] += durationAdd;
        console.log("addAilment: ", stateId, " SUCCESS - rate ", rate, " - turn ", this._stateTurns[stateId], " (", durationAdd, ")");
        return true;
    }
    console.log("addAilment: ", stateId, " FAILED - rate ", rate);
    return false;
}

Game_Unit.prototype.addAilment = function(user, stateId, baseRate) {
    let members = this.members();
    for (let battler of members) { 
        battler.addAilment(user, stateId, baseRate);
    };
}

Game_Battler.prototype.addAilmentEmotion = function(user, baseRate) {
    this.addAilment(user, Reverie.Ailments.getAilmentIdFromEmotion(this.emotionStateType()), baseRate);
}

Game_Unit.prototype.addAilmentEmotion = function(user, baseRate) {
    let members = this.members();
    for (let battler of members) { 
        battler.addAilmentEmotion(user, baseRate);
    };
}

Game_Battler.prototype.getAilmentVariable = function(stateId, varSingle) {
    var output = 0;
    function check(item) {
        if (!item) {
            console.log("null item in getAilmentVariable; skipping");
            return;
        }
        output += item[varSingle] && item[varSingle][stateId] ? item[varSingle][stateId] : 0;
    }
    var battlerData = this.isEnemy() ? $dataEnemies[this.enemyId()] : $dataActors[this.actorId()]
    check(battlerData) // Check the battler
    this.states().forEach(state => check(state)) // Check all the states
    if (this.isActor()) this.equips().forEach(equip => check(equip)) // Check all the equipment
    return output;
}

Game_Battler.prototype.getAilmentTotalRate = function(user, stateId) {
    // Remember "this" is the target getting ailment, "user" is the one doing the skill
    var output = this.getAilmentReceiveRate(stateId) + user.getAilmentInflictRate(stateId)
    return output;
}

Game_Battler.prototype.getAilmentInflictRate = function(stateId) {
    return this.getAilmentVariable(stateId, "ailmentAddInflictRate");
}

Game_Battler.prototype.getAilmentReceiveRate = function(stateId) {
    return this.getAilmentVariable(stateId, "ailmentAddReceiveRate");
}

Game_Battler.prototype.getAilmentTotalDuration = function(user, stateId) {
    // Remember "this" is the target getting ailment, "user" is the one doing the skill
    var output = this.getAilmentReceiveDuration(stateId) + user.getAilmentInflictDuration(stateId)
    return output;
}

Game_Battler.prototype.getAilmentInflictDuration = function(stateId) {
    return this.getAilmentVariable(stateId, "ailmentAddInflictDuration");
}

Game_Battler.prototype.getAilmentReceiveDuration = function(stateId) {
    return this.getAilmentVariable(stateId, "ailmentAddReceiveDuration");
}

// ================================================
// CHARM EFFECT
// ================================================
Reverie.Ailments.Game_Action_makeTargets = Game_Action.prototype.makeTargets
Game_Action.prototype.makeTargets = function() {
    let targets = [];
    let user = this.subject()
    if (!Reverie.Ailments.isCharmed(user)) {
        return Reverie.Ailments.Game_Action_makeTargets.call(this)
    }
    if (this.isItem() && !this.item().meta.UseCharm) {
        return Reverie.Ailments.Game_Action_makeTargets.call(this)
    }
    if (Math.random() > Reverie.Ailments.CHARM_EFFECT_CHANCE) {
        return Reverie.Ailments.Game_Action_makeTargets.call(this)
    }
    if ((this.isForEverybody||(()=>{})).call(this)) {
        return Reverie.Ailments.Game_Action_makeTargets.call(this)
    }
    if (this.isForUser() && !this.item().meta.UseCharm) {
        return Reverie.Ailments.Game_Action_makeTargets.call(this)
    }
    if (this.item() && this.item().meta.IgnoreCharm) {
        return Reverie.Ailments.Game_Action_makeTargets.call(this)
    }
    if (this.isForFriend()) {
        console.log("CHARM: Friend to Opponent");
        targets = this.targetsForOpponents();
    } else if (this.isForOpponent()) {
        console.log("CHARM: Opponent to Friend");
        targets = this.targetsForFriendsCharmed(); 
    }
    if (this.isForEval()) {
        targets = this.makeEvalTargets();
    }
    return this.repeatTargets(targets);
}

// ================================================
// GLOW NEGATIVE LUCK
// ================================================
Reverie.Ailments.Game_BattlerBase_paramMin = Game_BattlerBase.prototype.paramMin;
Game_BattlerBase.prototype.paramMin = function (paramId) {
    if (paramId == 7) return -999; // Luck
    return Reverie.Ailments.Game_BattlerBase_paramMin.call(this, paramId);
};

Reverie.Ailments.Game_BattlerBase_param = Game_BattlerBase.prototype.param;
Game_BattlerBase.prototype.param = function (paramId) {
    var value = Reverie.Ailments.Game_BattlerBase_param.call(this, paramId);
    if (paramId == 7 && this.isStateCategoryAffected("NEGLUCK")) { value = value - 100 }

    var maxValue = this.paramMax(paramId);
    var minValue = this.paramMin(paramId);
    return Math.round(value.clamp(minValue, maxValue));
};

// Make YEP note tag ai check proper opposite target as well
Reverie.Ailments.BattleManager_makeActionTargets = BattleManager.makeActionTargets
BattleManager.makeActionTargets = function(string) {
    let charmed_target = string
    if (Reverie.Ailments.isCharmed(this._subject)) {
        string = string.toUpperCase()
        if (['FRIEND', 'FRIENDS', 'ALLIES'].contains(string)) {
            charmed_target = "OPPONENT"
        }
        if (['ALL FRIENDS', 'ALL ALLIES'].contains(string)) {
            charmed_target = "ALL OPPONENTS"
        }
        if (['DEAD FRIEND', 'DEAD FRIENDS', 'DEAD ALLIES'].contains(string)) {
            charmed_target = "DEAD OPPONENT"
        }
        if (['OPPONENT', 'OPPONENTS', 'RIVALS', 'FOES'].contains(string)) {
            charmed_target = "FRIEND"
        }
        if (['ALL OPPONENTS', 'ALL RIVALS', 'ALL FOES'].contains(string)) {
            charmed_target = "ALL FRIENDS"
        }
        if (['DEAD OPPONENT', 'DEAD OPPONENTS', 'DEAD RIVALS',
        'DEAD FOES'].contains(string)) {
            charmed_target = "DEAD FRIEND"
        }
        if (['FRIENDS NOT USER', 'ALLIES NOT USER'].contains(string)) {
            charmed_target = "OPPONENT"
        }
        if (string.match(/(?:FRIEND|ALLY)[ ](\d+)/i)) {
            charmed_target = `OPPONENT ${RegExp.$1}`
        }
        if (string.match(/(?:OPPONENT|FOE|RIVAL)[ ](\d+)/i)) {
            charmed_target = `FRIEND ${RegExp.$1}`
        }
        console.log("CHARM YEP TARGET FROM:", string, charmed_target)
    }
    return Reverie.Ailments.BattleManager_makeActionTargets.call(this, charmed_target)
}

// No need for lias listing here, since makeTargets() already calls the original function incase user isn't charmed
Game_Action.prototype.targetsForFriendsCharmed = function() {
    var targets = [];
    var unit = this.friendsUnit();
    if (this.isForUser()) {
        return [this.subject()];
    } else if (this.isForDeadFriend()) {
        if (this.isForOne()) {
            targets.push(unit.smoothDeadTarget(this._targetIndex));
        } else {
            targets = unit.deadMembers();
        }
    } else if (this.isForRandom())  {
        for (var i = 0; i < this.numTargets(); i++) {
            targets.push(unit.randomTarget());
        }
    } else if (this.isForOne()) {
        if (this._targetIndex < 0) {
            targets.push(unit.randomTarget());
        } else {
            targets.push(unit.smoothTarget(this._targetIndex));
        }
    } else {
        targets = unit.aliveMembers();
    };
    return targets;
};

// =============================================================================================== //
//                                   YEP ACTION SEQUENCE
// =============================================================================================== //
Reverie.Ailments.ailment_processActionSequence = BattleManager.processActionSequence
BattleManager.processActionSequence = function(actionName, actionArgs) {
    // ADD AILMENT stateID chance
    if (actionName.match(/ADD AILMENT (\d+) (\d+)/i)) {
        return this.actionAddAilment(actionName, actionArgs);
    }
    if (actionName.match(/ADD AILMENT EMOTION (\d+)/i)) {
        return this.actionAddAilmentEmotion(actionName, actionArgs);
    }

    return Reverie.Ailments.ailment_processActionSequence.call(this, actionName, actionArgs);
};

// Adds Ailment: ADD AILMENT type chance: target, (user)
BattleManager.actionAddAilment = function(actionName, actionArgs) {
    var targets = this.makeActionTargets(actionArgs[0]);
    // if no second argument, assume the user caster
    var user = actionArgs[1] ? this.makeActionTargets(actionArgs[1]) : this._subject;
    if (targets.length < 1) return false;

    if (actionName.match(/ADD AILMENT (\d+) (\d+)/i)) {
        var stateId = Number(RegExp.$1);
        var baseRate = Number(RegExp.$2);
        targets.forEach(target => target.addAilment(user[0], stateId, baseRate), this);
    }
    
    return true;
};

// Adds Ailment: ADD AILMENT EMOTION chance: target, (user)
BattleManager.actionAddAilmentEmotion = function(actionName, actionArgs) {
    var targets = this.makeActionTargets(actionArgs[0]);
    // if no second argument, assume the user caster
    var user = actionArgs[1] ? this.makeActionTargets(actionArgs[1]) : this._subject;
    if (targets.length < 1) return false;

    if (actionName.match(/ADD AILMENT EMOTION (\d+)/i)) {
        var baseRate = Number(RegExp.$1);
        targets.forEach(target => target.addAilmentEmotion(user[0], baseRate), this);
    }
    
    return true;
};