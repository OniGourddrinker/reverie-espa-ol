//alrihgt so gues what

//documentation

//<SkillPassive:stateid>
// when this skill is equipped, the actor with the skill will have the state

//note that while the state is "passive" it can still run out if it is configured to do so in rpgmaker

//,
{
  window.DGT = window.DGT || {}
  DGT.passiveSkills = {}

  let alias = (originalStorage, baseClass, funcName, usePrototype, newFunc) => {
    if (originalStorage[baseClass] == undefined) {
      originalStorage[baseClass] = {}
    }
    // note: using window here is supposedly slightly stupid and i should polyfill globalthis or something
    // but im not going to
    if (usePrototype) { // prototype solution is stupid
      originalStorage[baseClass][funcName] = window[baseClass].prototype[funcName] || (() => {}) // save original function
      window[baseClass].prototype[funcName] = function(...args) {
        return newFunc.call(this, originalStorage[baseClass][funcName], ...args)
      } // override function and pass original forward
    } else {
      originalStorage[baseClass][funcName] = window[baseClass][funcName] || (() => {}) // save original function
      window[baseClass][funcName] = newFunc.bind(window[baseClass], originalStorage[baseClass][funcName]) // override function and pass original forward
    }
  }
  alias = alias.bind(null, DGT.passiveSkills)

  //
  // datamanager database initialization pogger s
  //

  alias("DataManager", "isDatabaseLoaded", false, function(original, ...args) {
    if (!original.call(this, ...args)) {return false};
    this.processDGTPSNotetags($dataSkills)
    return true;
  })

  DataManager.processDGTPSNotetags = function(group) {
    let note1 = /<SKILL[ ]?PASSIVE:[ ]?(\d+)>/i;
    let note2 = /<SERIOUSLY ?DON'?T ?ALLOW ?(?:USE)?>/i; // this bypasses the thing that
                                                         // allows you to queue skills
                                                         // regardless of requirements

    for (let n = 1; n < group.length; n++) {
      let obj = group[n];
      let notedata = obj.note.split(/[\r\n]+/);

      obj.skillStates = [];
      obj._reallyDoNot = false

      for (let i = 0; i < notedata.length; i++) {
        let line = notedata[i];
        if (line.match(note1)) {
          obj.skillStates.push(parseInt(RegExp.$1))
        } else if (line.match(note2)) {
          obj._reallyDoNot = true
        }
      }
    }
  };


  //
  // battle system handling!!!!!!!!
  //

  alias("BattleManager", "setup", false, function(original, ...args) {
    original.call(this, ...args)
    $gameParty.battleMembers().forEach((actor) => {
      actor._equippedSkills.forEach((skillId) => {
        if (skillId != 0) {
          $dataSkills[skillId].skillStates.forEach((stateId) => {
            if ($dataStates[stateId].removeAtBattleEnd == true) {
              actor.addState(stateId)
            }
          })
        }
      })
    })
  })

  alias("Window_SkillList", "isEnabled", true, function(original, item) {
    return original.call(this, item) && !item._reallyDoNot
  })

  //
  // handle passive states out of battle
  //

  alias("Game_Actor", "equipSkill", true, function(original, ...args) {
    let skillId = args[1]
    if (skillId) { // use truthy value instead of checking != 0, could be undefined in very specific circumstances
      $dataSkills[skillId].skillStates.forEach((stateId) => {
        if ($dataStates[stateId].removeAtBattleEnd == false) {
          this.addState(stateId)
        }
      })
    }
    original.call(this, ...args)
  })

  alias("Game_Actor", "unequipSkill", true, function(original, ...args) {
    let skillId = this._equippedSkills[args[0]]
    if (skillId) { // use truthy value instead of checking != 0, could be undefined in very specific circumstances
      $dataSkills[skillId].skillStates.forEach((stateId) => {
        if ($dataStates[stateId].removeAtBattleEnd == false) {
          this.removeState(stateId)
        }
      })
    }
    original.call(this, ...args)
  })

}
