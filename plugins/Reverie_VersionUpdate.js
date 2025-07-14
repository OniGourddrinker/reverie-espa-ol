 /*:
 * @plugindesc v1.0.0 Reverie Functions related to changing version / chapters
 * @author ReynStahl
 * 
 * @help
 * Reverie Functions related to changing version / chapters
 */

var Imported = Imported || {};
Imported.Reverie_VersionUpdate = true;

var Reverie = Reverie || {};
Reverie.VersionUpdate = Reverie.VersionUpdate || {};

// ================================================================ 
// * VARIABLES
// ================================================================
class RvUpdater {
}
/**
 * A dictionary of numbers, in form of Old ID: New ID
 * Converts from CH3 to CH4 IDs due to Change to Single Enemy
 * CH4 Enemies are not needed. It just breaks only Playtest, saves does not have it
 */
RvUpdater.BESTIARY_ID_CONVERT = {
    // Metro B1
    1508: 1508, // Conductor Bunny
    1512: 1509, // Conehead Mole
    1516: 1510, // Metro Rat
    1520: 1511, // Scarred Rat
    1524: 1512, // Golden Mole
    1528: 1513, // Rare Bear
    1532: 1514, // Life Jam Guy
    1536: 1515, // TV Girl
    19: 1516, // Forest Bunny
    23: 1517, // Forest Bunny?
    27: 1518, // Lost Sprout Mole
    // Fallen World
    1552: 1521, // Cattail Bunny
    1556: 1522, // Crocodile Clip
    1560: 1523, // Mouse
    1564: 1524, // Broken Tape
    1568: 1525, // Tapeworm
    1572: 1526, // Fallen Star
    1576: 1527, // Shooting Star
    1580: 1528, // Spam Mail
    1584: 1529, // Adware
    1588: 1530, // Zip Bomb!!
    1592: 1531, // Trojan Horse
    1596: 1532, // Space Fangirl
    1600: 1533, // Planet X
    1604: 1534, // Planet X (Wig)
    1608: 1535, // Kite Kid
    1612: 1536, // Kite Kid's Kite
    1616: 1537, // Doombox EX
    1620: 1538, // Dial Up EX
    1624: 1539, // Shark Plane EX
    // Ch3 Real World - Technically doesn't appear in foe facts but just in case
    1641: 1546, // Lucy
    1645: 1547, // Mint-Dono
    1649: 1548, // Choco-Chan
    1661: 1549, // Wendyheart
    1665: 1550, // Pancake Bunny
    1669: 1551, // Milkshake Bunny
    1673: 1552, // Cupcake Bunny
    1677: 1553, // Capt. Luna
}

// Turn on a switch on load, for on load common event
Reverie.VersionUpdate.Scene_OmoriFile_loadGame = Scene_OmoriFile.prototype.loadGame;
Scene_OmoriFile.prototype.loadGame = function() {
    Reverie.VersionUpdate.Scene_OmoriFile_loadGame.call(this);
    console.log("Load Game Set Value Switch")
    $gameSwitches.setValue(2807, true);
}

// ================================================================ 
// * FUNCTIONS
// ================================================================
Game_Party.prototype.rvUpdateBestiary = function() {
    let newList = [];
    for (let oldId of this._defeatedEnemies) {
        let newId = RvUpdater.BESTIARY_ID_CONVERT[oldId] || oldId;
        console.log("REVERIE Update Bestiary ID", oldId, newId)
        newList.push(newId)
    }
    this._defeatedEnemies = newList;
};

Game_Party.prototype.relearnLevelSkills = function() {
    this.members().forEach(x => x.relearnLevelSkills());
};

Game_Actor.prototype.relearnLevelSkills = function() {
    this.currentClass().learnings.forEach(function(learning) {
        if (learning.level <= this._level) {
            this.learnSkill(learning.skillId);
            console.log("Relearn Level Skill:", learning.skillId)
        }
    }, this);
}

//Transfer real world media item to dream world
Game_Party.prototype.reverieMediaTransfer = function() {
    var itemKeys = Object.keys(this._worldItemsContainer[2].items); // Keys of list is item Id
    this._mediaItemAdded = false;
    for (const itemId of itemKeys) {
        let item = $dataItems[itemId];
        if (item && item.meta.MediaTransfer) {
            let transferId = Number(item.meta.MediaTransfer);
            let transferItem = $dataItems[transferId]
            if (!this.hasItem(transferItem)) { // Only add if doesnt have one yet
                this.gainItem(transferItem, 1);
                this._mediaItemAdded = true;
                console.log("Added Media:", transferId);
            }
        }
    }
}