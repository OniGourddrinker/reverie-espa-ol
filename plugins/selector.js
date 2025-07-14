{
    let _old_scene_battle_start = Scene_Battle.prototype.start;
    let prefs = {
        active: false,
        perActor: {}
    };

    Scene_Battle.prototype.start = function() {
        _old_scene_battle_start.call(this, ...arguments);
        prefs = {
            active: false,
            perActor: {}
        };
    };

    Game_Interpreter.prototype._hoverstate_activate = function() {
        prefs.active = true;
    }

    Game_Interpreter.prototype._hoverstate_set = function(actor, state) {
        prefs.perActor[actor] = state;
    }

    let _old_ = Window_OmoriBattleActorStatus.prototype.update;
    Window_OmoriBattleActorStatus.prototype.update = function() {
        _old_.call(this, ...arguments);
        if (prefs.active) {
            if (this._selected) {
                let actor = this.actor();
                if (actor) {
                    if (prefs.perActor[actor._actorId] && !actor._states.includes(prefs.perActor[actor._actorId])) {
                        actor.addState(prefs.perActor[actor._actorId]);
                        this.mangledRefresh(prefs.perActor[actor._actorId]);
                    }
                }
            } else {
                let actor = this.actor();
                if (actor) {
                    if (prefs.perActor[actor._actorId] && actor._states.includes(prefs.perActor[actor._actorId])) {
                        actor.removeState(prefs.perActor[actor._actorId]);
                        actor._result.removedStates = actor._result.removedStates.filter(a => a !=prefs.perActor[actor._actorId]);
                        this.refresh();
                    }
                }
            }
        }
    }

    Window_OmoriBattleActorStatus.prototype.mangledRefresh = function(mainState) {
        this.refresh();
        var actor = this.actor();

        let stateMeta = $dataStates[mainState].meta
        if (stateMeta.StateBackIndex) this.setStatusBack(stateMeta.StateBackIndex);

        let worldIndex = SceneManager.currentWorldIndex();
        let tagName = 'World_' + worldIndex + '_StateListIndex';
        if (stateMeta[tagName]) this.setStatusHeader(Number(stateMeta[tagName]));
        else if (stateMeta.StateListIndex) this.setStatusHeader(Number(stateMeta.StateListIndex));
        
        if (stateMeta.AltIndexSwitch) {
            if ($gameSwitches.value(Number(stateMeta.AltIndexSwitch))) {
                this._faceSprite.setAnimRow(Number(stateMeta.AltStateFaceIndex));
            }
        } else {
            if (stateMeta.StateFaceIndex) {
                this._faceSprite.setAnimRow(Number(stateMeta.StateFaceIndex));
            }
        }
    }
}