/*:
 * @plugindesc v1.03 Allows variables to be changes by equipment.
 * @author LadyBaskerville
 *
 * @help
 * Equipment Variables
 * Version 1.03
 * by LadyBaskerville
 *
 * ---------------------
 *       Notetag
 * ---------------------
 * Use the notetag <Add to Variable: variableId, value, actorId>
 * in the note box of a piece of equipment (weapon or armor).
 * Replace variableId with the ID of the variable you want to change,
 * value with the value you want to add to the variable and actorId
 * with the ID of the actor that has to equip the item for the change to
 * take place (use 0 for all actors).
 *
 * Examples:
 * <Add to Variable: 21, 100, 2>
 * If actor #2 has this equipped, add 100 to variable #21.
 *
 * <Add to Variable: 35, 50, 0>
 * If any actor has this equipped, add 50 to variable #35.
 *
 * ---------------------
 *       Terms
 * ---------------------
 * Free for use in both non-commercial and commercial games.
 * You may repost and edit this plugin, but do not claim you wrote the original code.
 * Please credit me as LadyBaskerville if you use this plugin or edits of it.
 * 
 * ---------------------
 *    Known Issues
 * ---------------------
 * - none at the moment.
 * 
 * ---------------------
 *      Changelog
 * ---------------------
 * Version 1.03
 * - Added compatability with HIME_EquipSlotsCore.
 * Version 1.02
 * - Fixed bugs with Change Class, Change Weapon/Armor and Seal Slot.
 * Version 1.01
 * - Added support for negative values.
 * - Fixed a bug that kept variables from resetting.
 * Version 1.00
 * - Finished the plugin.
 * 
 */

(function() {
 
 
var LB = LB || {};
LB.EquipVariables = LB.EquipVariables || {};

LB.EquipVariables.notetagsLoaded = false;

// ---------------
//  my functions
// ---------------

// get notetags from a database object and return a list of lists
LB.EquipVariables.getItemNotetags = function(item) {
	if (item == null) {
		return null
	}
	var regexp = /<Add to Variable: (\d+), (-?\d+), (\d+)>/i; // variable, value, actor
	var notes = item.note.split("\n");
	var matches = [];
	for (var i = 0; i < notes.length; i++) {
		var match = notes[i].match(regexp);
		if (match) {
			match[1] = Number(match[1]);
			match[2] = Number(match[2]);
			match[3] = Number(match[3]);
			matches.push(match);
		}
	}
	
	return matches.length > 0 ? matches : null;
};

// ---------------
//   DataManager
// ---------------

// DataManager.isDatabaseLoaded()
LB.EquipVariables.DataManager_isDatabaseLoaded = DataManager.isDatabaseLoaded;
DataManager.isDatabaseLoaded = function() {
    if (!LB.EquipVariables.DataManager_isDatabaseLoaded.call(this)) {
		return false;
	}
    // the database is loaded, we can now preload the notetags if we haven't already done it
	if (!LB.EquipVariables.notetagsLoaded) {
		// preload weapon notetags
		for (var i = 0; i < $dataWeapons.length; i++) {
			if (LB.EquipVariables.getItemNotetags($dataWeapons[i])) {
				$dataWeapons[i].LB_EquipVariables = LB.EquipVariables.getItemNotetags($dataWeapons[i]);
			}
		}
		// preload armor notetags
		for (var i = 0; i < $dataArmors.length; i++) {
			if (LB.EquipVariables.getItemNotetags($dataArmors[i])) {
				$dataArmors[i].LB_EquipVariables = LB.EquipVariables.getItemNotetags($dataArmors[i]);
			}
		}
		LB.EquipVariables.notetagsLoaded = true;
	}
	return true;
};

// ---------------
//   Game_Item
// ---------------

// Game_Item.prototype.LB_toDatabaseObject()
// return the corresponding database object
Game_Item.prototype.LB_toDatabaseObject = function() {
	if (this.isWeapon()) {
		return $dataWeapons[this._itemId];
	} else {
		return $dataArmors[this._itemId];
	}
};

// ---------------
//   Game_Actor
// ---------------

// Game_Actor.prototype.LB_updateEquipVariables(item, reset)
// item is a database object
// reset is a boolean; if true, the value is subtracted from the variable
Game_Actor.prototype.LB_updateEquipVariables = function(item, doReset) {
	if (item && item.LB_EquipVariables) {
		for (var i = 0; i < item.LB_EquipVariables.length; i++) {
			// store the three notetag "parameters" in variables for less confusion
			var variable = item.LB_EquipVariables[i][1];
			var value = item.LB_EquipVariables[i][2];
			var actor = item.LB_EquipVariables[i][3];
			// update the variable value
			if (this.actorId() == actor || actor == 0) {
				if (doReset) {
					var newValue = $gameVariables.value(variable) - value;
				} else {
					var newValue = $gameVariables.value(variable) + value;
				}
				//var newValue = reset ? $gameVariables.value(variable) - value : $gameVariables.value(variable) + value;
				$gameVariables.setValue(variable, newValue);
				
				// want to do something with the updated variables? add your code here
				
			}
		}
	}
};

// Game_Actor.prototype.initEquips(equips)
// equips is a list of numbers
// _equips is a list of Game_Items
LB.EquipVariables.Game_Actor_initEquips = Game_Actor.prototype.initEquips;
Game_Actor.prototype.initEquips = function(equips) {
	// call the original function
    LB.EquipVariables.Game_Actor_initEquips.call(this, equips);
	
	// update the variables for all pieces of equipment
	for (var i = 0; i < this._equips.length; i++) {
		this.LB_updateEquipVariables(this._equips[i].LB_toDatabaseObject(), false);
	}
};

// Game_Actor.prototype.changeEquip(slotId, item)
// slotId is the id of the slot for the equipment
// item is a database object
LB.EquipVariables.Game_Actor_changeEquip = Game_Actor.prototype.changeEquip;
Game_Actor.prototype.changeEquip = function(slotId, item) { 
	// save old equipment
	var oldEquipment = this._equips[slotId].LB_toDatabaseObject();
	
	// call the original function
	LB.EquipVariables.Game_Actor_changeEquip.call(this, slotId, item); 
	
	// reset the variables from the old equipment
	this.LB_updateEquipVariables(oldEquipment, true);
	
	// update the variables from the new equipment
	this.LB_updateEquipVariables(item, false);
};


LB.EquipVariables.Game_Actor_releaseUnequippableItems = Game_Actor.prototype.releaseUnequippableItems;
Game_Actor.prototype.releaseUnequippableItems = function(forcing) {
	var oldEquipment = [];
	for (var i = 0; i < this.equips().length; i++) {
		oldEquipment[i] = this._equips[i].LB_toDatabaseObject();
	}
	LB.EquipVariables.Game_Actor_releaseUnequippableItems.call(this, forcing);
	for (var i = 0; i < this.equips().length; i++) {
		this.LB_updateEquipVariables(oldEquipment[i], true);
		this.LB_updateEquipVariables(this._equips[i].LB_toDatabaseObject(), false);
	}
};


//LB.EquipVariables.Game_Actor_discardEquip = Game_Actor.prototype.discardEquip;
Game_Actor.prototype.discardEquip = function(item) {
    var slotId = this.equips().indexOf(item);
    if (slotId >= 0) {
        this._equips[slotId].setObject(null);
		this.LB_updateEquipVariables(item, true);
    }
};


//======================================================================
// Compatability with HIME_EquipSlotsCore
if (typeof Imported !== 'undefined' && Imported.EquipSlotsCore) {
	Game_EquipSlot.prototype.LB_toDatabaseObject = function() {
		if (this._item.isWeapon()) {
			return $dataWeapons[this._item._itemId];
		} else {
			return $dataArmors[this._item._itemId];
		}
	};
}

})();