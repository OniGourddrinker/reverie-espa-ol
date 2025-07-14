 /*:
 * @plugindesc v1.0.0 Adds common two sided animation used in Reverie
 * @author ReynStahl
 * 
 * @help
 * Dependencies: Put BELOW YEP ActionSequence
 * 
 * ANIMATION CLEAR BUFF: target
 * ANIMATION CLEAR DEBUFF: target
 * ANIMATION CHARGE: target
 */

var Reverie = Reverie || {};
Reverie.TwoSideAnim = Reverie.TwoSideAnim || {};

Reverie.TwoSideAnim.BattleManager_processActionSequence = BattleManager.processActionSequence;
BattleManager.processActionSequence = function(actionName, actionArgs) {
    if (actionName.match(/ANIMATION CLEAR BUFF/i)) {
        return this.actionAnimationTwoSide(actionArgs, 522, 521);
    }
    if (actionName.match(/ANIMATION CLEAR DEBUFF/i)) {
        return this.actionAnimationTwoSide(actionArgs, 520, 519);
    }
    if (actionName.match(/ANIMATION CHARGE/i)) {
        return this.actionAnimationTwoSide(actionArgs, 465, 464);
    }

    return Reverie.TwoSideAnim.BattleManager_processActionSequence.call(this, actionName, actionArgs);
};

// Plays an Animation, Accounting for Actor or Enemy
BattleManager.actionAnimationTwoSide = function(actionArgs, actorAnim, enemyAnim) {
    var targets = this.makeActionTargets(actionArgs[0]);
    if (targets.length < 1) return false;
    
    var targetEnemies = [];
    var targetActors = [];

    targets.forEach((target) => {
        if (target.isActor()) {
            targetActors.push(target);
        } else {
            targetEnemies.push(target);
        };
    });

    if (targetActors.length > 0)
        this._logWindow.showNormalAnimation(targetActors, actorAnim, false);
    if (targetEnemies.length > 0)
        this._logWindow.showNormalAnimation(targetEnemies, enemyAnim, false);

    return true;
};