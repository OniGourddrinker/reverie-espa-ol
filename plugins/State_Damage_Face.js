// Custom State Damage Face
// Allows setting custom damage face on states
// Version: 1.1.0

if (!window.isStateDamageFaceLoaded) {
    // Every state that has "<StateDamageFaceIndex: integer>" in its notes will use
    // that index as the row on the sprite sheet to look up for the damage face
    // Set it to -1 to not change the face
    let oldUpdateDamage = Window_OmoriBattleActorStatus.prototype.updateDamage;
    Window_OmoriBattleActorStatus.prototype.updateDamage = function() {
        let faceOverride = -1;

        let actor = this.actor();
        if (actor && actor.isDamagePopupRequested()) {
            // Get Main State
            let state = actor.states()[0];
            let result = actor._damagePopup[0] || actor.result();

            if (state && state.meta.StateDamageFaceIndex !== undefined && result.hpDamage > 0) {
                let face = Number(state.meta.StateDamageFaceIndex);
                if (face === -1) {
                    // Just set to same face as before
                    faceOverride = this._faceSprite._animRow;
                } else {
                    faceOverride = face;
                }
            }
        }

        oldUpdateDamage.call(this);

        if (faceOverride !== -1) {
            this._faceSprite.setAnimRow(faceOverride);
        }
    };

    window.isStateDamageFaceLoaded = true;
}
