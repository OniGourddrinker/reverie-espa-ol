/*:
 * @plugindesc [v1.0.0] Makes eneme chase at only certain map level.
 * 
 * @author StahlReyn
 *
 * @help
 * Set _chaseLevel variable to a number will make enemy only chase at that specific level.
 * In movement route, add Script block, this._chaseLevel = num
 * 
 * Example (chase only when player is on level 0):
 * this._chaseLevel = 0
 */

var Stahl = Stahl || {};
Stahl.ChaseLevel = Stahl.ChaseLevel || {};

Stahl.ChaseLevel.getLevel = function() {
    return $gameVariables.value(44);
};

Stahl.ChaseLevel.Game_Event_chaseConditions = Game_Event.prototype.chaseConditions;
Game_Event.prototype.chaseConditions = function(dis) {
	let level = Stahl.ChaseLevel.getLevel();
	let sameLevel = this._chaseLevel == null ? true : this._chaseLevel == level;
	if (!sameLevel) return false;
	
    return Stahl.ChaseLevel.Game_Event_chaseConditions.call(this, dis);
};
