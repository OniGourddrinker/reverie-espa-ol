
// Reverie modifies this to:
// - Fade in and out opacity when the state has only 1 turn left
// - Be toggleable

class RvStateIcons {
    static doStateIcons() {
        return true;
    }
}

{
    function getAlpha(sprite) {
    	if (sprite._stateSpriteTurnsLeft <= 1) {
    	    return 0.75 + (Math.sin(Graphics.frameCount * 0.2) * 0.25)
        } else {
        	return 1
        }
    }

    function getNc(battler, nc) {
        let states = battler.states();
        for (let state of states) {
            let stateId = state.id;
            stateData = $dataStates[stateId];
            if (stateData && stateData.meta && stateData.meta.StateIcon) {
                let turns = battler._stateTurns && battler._stateTurns[stateId] ? battler._stateTurns[stateId] : 0;
                if (stateData.autoRemovalTiming == 0)
                    turns = 99; // Never removed by Turn; assume long turns.
                nc.push([stateId, turns]);
            }
        }
    }

    let sceneBootOld = Scene_Boot;
    window.stateIconReservations = [];
    window.Scene_Boot = class extends sceneBootOld {
        start() {
            super.start();
            for (let i = 0; i < $dataStates.length; i++) {
                let entry = $dataStates[i];
                if (entry && entry.meta && entry.meta.StateIcon) {
                    let icon = entry.meta.StateIcon.trim();
                    window.stateIconReservations.push(icon);
                }
            }
        }
    }

    let _old_scene_battle_load_reserved_bitmaps = Scene_Battle.prototype.loadReservedBitmaps;
    Scene_Battle.prototype.loadReservedBitmaps = function() {
        _old_scene_battle_load_reserved_bitmaps.call(this);

        for (let img of window.stateIconReservations) {
            ImageManager.reserveSystem(img, 0, this._imageReservationId);
        }
    };

    let _old_window_battle_actor_status_createSprites = Window_OmoriBattleActorStatus.prototype.createACSBubbleSprites;
    let _old_window_battle_actor_status_updatePositions = Window_OmoriBattleActorStatus.prototype.updatePositions;
    Window_OmoriBattleActorStatus.prototype.createACSBubbleSprites = function() {
        this._stateIcons = new Sprite(new Bitmap(96, 16));
        this._stateIcons.x = 0;
        this._stateIcons.y = this.y < 240 ? this.y + this.height : this.y;
        this._stateIconCache = [];
        this.addChild(this._stateIcons);

        _old_window_battle_actor_status_createSprites.call(this, ...arguments);
    }

    Window_OmoriBattleActorStatus.prototype.updatePositions = function() {
        _old_window_battle_actor_status_updatePositions.call(this, ...arguments);

        this._stateIcons.x = (this.width - 96) / 2;
        this._stateIcons.y = this.y < 240 ? this.height : -16;

        if (!RvStateIcons.doStateIcons()) {
            return;
        }

        // Determine if we need to update
        let nc = [];
        let actor = this.actor();
        if (actor) {
            getNc(actor, nc);
        }
        if (JSON.stringify(nc) !== JSON.stringify(this._stateIconCache)) {
            this._stateIcons.bitmap.fillAll('rgba(0, 0, 0, 0)')
            while(this._stateIcons.children[0]) {
                this._stateIcons.removeChild(this._stateIcons.children[0]);
            }
            let totalLength = nc.length;
            let elapsed = 0;
            for (let [s, t] of nc) {
                icon = $dataStates[s].meta.StateIcon.trim();
                let sprite = new Sprite(ImageManager.loadSystem(icon));
                this._stateIcons.addChild(sprite);
                sprite.anchor.set(0, 0);
                sprite.y = 0;
                sprite.x = ((96 - (totalLength * 16)) / 2) + elapsed * 16;
                sprite._stateSpriteTurnsLeft = t;
                elapsed++;
            }

            this._stateIconCache = nc;
        }
        // Update alpha separately
        for (let sprite of this._stateIcons.children) {
            sprite.alpha = getAlpha(sprite);
        }
        this._stateIcons.update();
        //if ($gameScreen._brightness === 255) debugger;
        
    }

    let _old_sprite_enemybattlerstatus_refreshBitmap = Sprite_EnemyBattlerStatus.prototype.refreshBitmap;
    Sprite_EnemyBattlerStatus.prototype.refreshBitmap = function(battler) {
        _old_sprite_enemybattlerstatus_refreshBitmap.call(this, ...arguments);
        if (!this._stateIcons) {
            this._stateIcons = new Sprite(new Bitmap(96, 16));
        }
        let nc = [];
        if (battler) {
            this._stateIcons.x = (this.bitmap.width - 96) / 2;
            this._stateIcons.y = -16;
            this._stateIcons.bitmap.fillAll('rgba(0, 0, 0, 0)');
            this.addChild(this._stateIcons);
            getNc(battler, nc);
        }
        while(this._stateIcons.children[0]) {
            this._stateIcons.removeChild(this._stateIcons.children[0]);
        }
        let totalLength = nc.length;
        let elapsed = 0;
        for (let [s, t] of nc) {
            icon = $dataStates[s].meta.StateIcon.trim();
            let sprite = new Sprite(ImageManager.loadSystem(icon));
            this._stateIcons.addChild(sprite);
            sprite.anchor.set(0, 0);
            sprite.y = 0;
            sprite.x = ((96 - (totalLength * 16)) / 2) + elapsed * 16;
            sprite._stateSpriteTurnsLeft = t;
            elapsed++;
        }
        this._stateIcons.update();
    }

    Sprite_EnemyBattlerStatus.prototype.refreshBitmapVisible = function(battler) {
        // Update alpha separately
        if (this._stateIcons) {
            for (let sprite of this._stateIcons.children) {
                sprite.alpha = getAlpha(sprite);
            }
            this._stateIcons.update();
        }
    }
    
    // This function creates separate function that always update,
    // as updateBitmap is only called when there's a new selection once
    let _old_sprite_enemy_updateStatusSprite = Sprite_Enemy.prototype.updateStatusSprite;
    Sprite_Enemy.prototype.updateStatusSprite = function() {
        _old_sprite_enemy_updateStatusSprite.call(this, ...arguments);
        if (this._enemy) {
            var selected = this._enemy.isSelected()
            if (selected && this._statusSprite.visible) {
                this._statusSprite.refreshBitmapVisible(this._enemy);
            }
        };
    };
}