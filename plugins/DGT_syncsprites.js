 /*:
 * @plugindesc v1.0.0 Sync enemy sprite to animate same time and get same states
 * @author Draught, ReynStahl
 * 
 * @help
 * Plugin Command: syncsprite x with y
 * Plugin Command: syncstate x with y
 * 
 * x and y are enemy index numbers
 */

var DGT = DGT || {};
DGT.SyncSprites = DGT.SyncSprites || {};

DGT.isValidSyncState = function (id) {
    return [6, 7, 8, 10, 11, 12, 14, 15, 16].includes(id);
}

{
    _getThisSprite = function (enemy) {
        let spriteset = SceneManager._scene._spriteset;
        if (spriteset && spriteset._enemySprites) {
            return SceneManager._scene._spriteset._enemySprites.find(sprite => sprite._actor === enemy);
        }
        return null;
    }

    _pluginSyncSprite = function(args) {
        if (!$gameParty.inBattle()) { return }
        let first = parseInt(args[0])
        let second = parseInt(args[1]) || parseInt(args[2])
        if (!(first && second)) { return }

        first--; second--; // 1 index to 0 index
        first = $gameTroop.members()[first]
        second = $gameTroop.members()[second]
        if (!(first && second)) { return }

        let first_S = _getThisSprite(first)
        let second_S = _getThisSprite(second)
        let first_old_usf = first_S.updateSideviewFrame
        first_S.updateSideviewFrame = function () {
            if (second && !second.isStateAffected(1)) {
                first_S._pattern = second_S._pattern
            }
            first_old_usf.call(first_S)
        }
    }

    _pluginSyncState = function(args) {
        if (!$gameParty.inBattle()) { return }
            
        let first = parseInt(args[0])
        let second = parseInt(args[1]) || parseInt(args[2])
        if (!(first && second)) { return }

        first--; second--; // 1 index to 0 index
        first = $gameTroop.members()[first]
        second = $gameTroop.members()[second]
        if (!(first && second)) { return }

        let first_addState = first.addState
        let second_addState = second.addState
        let first_removeState = first.removeState
        let second_removeState = second.removeState
        // Add a tracker on who called the state sync
        if (!first._calledAddStateSync)
            first._calledAddStateSync = false;
        if (!second._calledAddStateSync)
            second._calledAddStateSync = false;
        if (!first._calledRemoveStateSync)
            first._calledRemoveStateSync = false;
        if (!second._calledRemoveStateSync)
            second._calledRemoveStateSync = false;
        // if not the caller / other called it, then don't call them back.
        first.addState = function (id) {
            if (DGT.isValidSyncState(id) && !second._calledAddStateSync) {
                console.log("Sync State: First called to addState Second")
                first._calledAddStateSync = true; // set the caller, so other know to not call back
                second_addState.call(second, id)
            }
            first._calledAddStateSync = false; // finished; reset
            return first_addState.call(this, id)
        }
        second.addState = function (id) {
            if (DGT.isValidSyncState(id) && !first._calledAddStateSync) {
                console.log("Sync State: Second called to addState First")
                second._calledAddStateSync = true;
                first_addState.call(first, id)
            }
            second._calledAddStateSync = false;
            return second_addState.call(this, id)
        }
        first.removeState = function (id) {
            if (DGT.isValidSyncState(id) && !second._calledRemoveStateSync) {
                console.log("Sync State: First called to removeState Second")
                first._calledRemoveStateSync = true; // set the caller, so other know to not call back
                second_removeState.call(second, id)
            }
            first._calledRemoveStateSync = false; // finished; reset
            return first_removeState.call(this, id)
        }
        second.removeState = function (id) {
            if (DGT.isValidSyncState(id) && !first._calledRemoveStateSync) {
                console.log("Sync State: Second called to removeState First")
                second._calledRemoveStateSync = true;
                first_removeState.call(first, id)
            }
            second._calledRemoveStateSync = false;
            return second_removeState.call(this, id)
        }
    }

    const _old_pluginCommand = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(command, args) {
        if (/syncsprite/i.test(command)) {
            _pluginSyncSprite(args);
        } else if (/syncstate/i.test(command)) {
            _pluginSyncState(args);
        } else {
            _old_pluginCommand.call(this, command, args)
        }
    };
}