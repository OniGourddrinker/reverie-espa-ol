// Enemy Offset Z
// Allows manual layering of enemy sprites by setting Z-coordinates
// Version: 1.1.0

if (!window.isGameEnemyOffsetZLoaded) {
    // Extend Omori's existing function that adds X and Y offset in order to add Z offset
    let oldApplyBattlePositionOffsets = Game_Enemy.prototype.applyBattlePositionOffsets;
    Game_Enemy.prototype.applyBattlePositionOffsets = function() {
        oldApplyBattlePositionOffsets.call(this);
        var data = $dataEnemies[this.baseId()];
        // Set Offset if it does exist
        if (data.meta.PositionOffsetZ === undefined) {
            var match = data.note.match(/<(?:Position Offset Z):[ ]*([-]?\d+)>/i);
            data.meta.PositionOffsetZ = match ? Number(match[1]) : 0
        };
        this._offsetZ = data.meta.PositionOffsetZ;
    };

    Game_Battler.prototype.offsetZ = function() {
        var offset = this._offsetZ;
        if (isNaN(offset)) {
            offset = 0;
        }
        return offset;
    };

    // Every enemy that has "<Position Offset Z: integer>" in its notes will have
    // the Z-coordinate of its sprite set to that integer, default is 0
    // Sprites with greater Z-coordinate will show in front of ones with smaller Z-coordinate
    let oldSetBattler = Sprite_Enemy.prototype.setBattler;
    Sprite_Enemy.prototype.setBattler = function(battler) {
        oldSetBattler.call(this, battler);
        this.z = battler.offsetZ();
    };

    window.isGameEnemyOffsetZLoaded = true;
}