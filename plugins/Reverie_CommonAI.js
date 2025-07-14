//=============================================================================
 /*:
 * @plugindesc v1.0.0 Miscellaneous Reverie AI
 * @author ReynStahl
 * 
 * @help
 * This is for common function to help simplify making AIs for Reverie
 * 
 * This plugin is dependent on Stahl_StateTiering
 * 
 * Over Game_Unit will assume AOE, and over singular target will use Game_Battler
 * Example Usage:
 * $gameParty.rvaiDebuff("ATK") is used for enemy targeting to DEBUFF ATTACK of entire PARTY
 * $gameActors.actor()[x].rvaiDebuff("ATK") is used for enemy targeting to DEBUFF ATTACK of ACTOR X
 * 
 * $gameTroop.rvaiBuff("ATK") is used for enemy targeting to BUFF ATTACK of entire TROOP
 * $gameTroop.members()[x].rvaiDebuff("ATK") is used for enemy targeting to BUFF ATTACK of ENEMY X
 */

 /**
  * Helper class for all things related to REVERIE enemy AIs.
  */
class RVAI {
    static gameDifficulty() {
        return $gameVariables.value(1512);
    }
    
    /**
     * Creates an emotion dictionary.
     * @returns A dictionary. String: Int
     */
    static createEmotionDict() {
        return {
            "NEUTRAL": 0,
            "HAPPY": 0,
            "SAD": 0,
            "ANGRY": 0
        };
    }

    static getAlliesOf(battler) {
        if (battler.isEnemy()) {
            return $gameTroop.aliveMembers();
        } else if (battler.isActor()) {
            return $gameParty.aliveMembers();
        }
        return null;
    }

    static getOpponentsOf(battler) {
        if (battler.isActor()) {
            return $gameTroop.aliveMembers();
        } else if (battler.isEnemy()) {
            return $gameParty.aliveMembers();
        }
        return null;
    }
        
    // =========================================================================
    // Checking number of party members who have a state
    // =========================================================================

    static countState(unit, id) {
        const members = unit.aliveMembers();
        return members.reduce((sum, battler) => sum + battler.isStateAffected(id), 0);
    }

    static countStateAddable(unit, id) {
        const members = unit.aliveMembers();
        return members.reduce((sum, battler) => sum + battler.isStateAddable(id), 0);
    }

    // Count state that is addable AND not affected yet
    static countStateAddableNew(unit, id) {
        const members = unit.aliveMembers();
        return members.reduce((sum, battler) => sum + (battler.isStateAddable(id) && !battler.isStateAffected(id)), 0);
    }

    static countStateCategory(unit, id) {
        const members = unit.aliveMembers();
        return members.reduce((sum, battler) => sum + battler.isStateCategoryAffected(id), 0);
    }

    static ratioState(unit, id) {
        const members = unit.aliveMembers();
        return RVAI.countState(unit, id) / members.length;
    }

    static ratioStateAddable(unit, id) {
        const members = unit.aliveMembers();
        return RVAI.countStateAddable(unit, id) / members.length;
    }

    static ratioStateAddableNew(unit, id) {
        const members = unit.aliveMembers();
        return RVAI.countStateAddableNew(unit, id) / members.length;
    }

    static ratioStateCategory(unit, id) {
        const members = unit.aliveMembers();
        return RVAI.countStateCategory(unit, id) / members.length;
    }

    /**
     * ================================================================================================================================
     * * emotionApplyParty, emotionApplyTroop, checkEmotionAdvantageApply
     * ================================================================================================================================
     * 
     * Basically generates a probability number based on what happen of enemy tries to apply an AOE emotion. 
     * Check whether the enemy troop becomes in better standing or worse standing after an emotion is applied, compared to before.
     * 
     * There's 2 main variable: 
     * 1. How much enemy is sensitive to advantage change.
     *     - If enemy is very sensitive, meaning if enemy sees even 1 more worse off advantage pairing (compared to before) it then doesn't do it. (Generally "Smarter")
     *     - If enemy is less sensitive it just does it regardless even if it's a bit worse off, let say the enemy really prefer a strategy. (Generally "Dumber")
     * 2. How much enemy just want to change by "default" (like when most are still NEUTRAL, nothing gets better or worse).
     *     - If enemy is very "want to change" then it gets far higher proability if it's neutral. Would just do emotion to not remain neutral. (Generally "Dumber")
     *     - If enemy doesn't care about change, the enemy just only bother emotions in wanting to get advantage. (Generally "Smarter")
     * 
     * ================================================================================================================================
     */

    /**
     * Rolls a probability based on if the Skill is applying Emotion on Party.
     * @param {*} emotion The emotion
     * @param {*} changeValue The weight value to count just the act of changing as. This is to avoid not bothering when Neutral as it gives 0 change in advantage. Higher number means more biased to change if possible. Ex: 0 = Ignore if no change, 1 = Treat changing same as 1 advantage point.
     * @param {*} advantageMult The weight value to count change in advantage. Higher number means more likely to double down or risk averse. Ex: 0 = Not care change, 1 = Care advantage, 2 = Really care about advantage.
     * @returns 
     */
    static emotionApplyParty(emotion, changeValue = 0.0, advantageMult = 1.0) {
        let p = this.checkEmotionAdvantageApply($gameTroop, $gameParty, emotion, advantageMult, changeValue);
        let result = Math.random() < p;
        console.log("RVAI - emotionApplyParty", emotion, p, result);
        return result;
    }

    /**
     * Rolls a probability based on if the Skill is applying Emotion on Troop.
     * @param {*} emotion The emotion
     * @param {*} changeValue The weight value to count just the act of changing as. This is to avoid not bothering when Neutral as it gives 0 change in advantage. Higher number means more biased to change if possible. Ex: 0 = Ignore if no change, 1 = Treat changing same as 1 advantage point.
     * @param {*} advantageMult The weight value to count change in advantage. Higher number means more likely to double down or risk averse. Ex: 0 = Not care change, 1 = Care advantage, 2 = Really care about advantage.
     * @returns 
     */
    static emotionApplyTroop(emotion, changeValue = 0.0, advantageMult = 1.0) {
        let p = this.checkEmotionAdvantageApply($gameParty, $gameTroop, emotion, -advantageMult, changeValue); // Negative as it's viewing from Party POV. Party worse off is good for enemy.
        let result = Math.random() < p;
        console.log("RVAI - emotionApplyTroop", emotion, p, result);
        return result;
    }

    /**
     * Check Advantage Change when an emotion is applied. Positive is better, negative is worse.
     * Outputs range from -1 to 1 by default multiplier, with 1 being totally positive change, 0 being neutral, -1 being totally negative.
     * @param {*} userUnit User's Unit
     * @param {*} targetUnit Target's Unit
     * @param {*} emotion Emotion String
     * @param {*} advantageMult The weight value to count change in advantage. This is to avoid not bothering when Neutral as it gives 0 change in advantage. Higher number means more likely to double down or risk averse. Ex: 0 = Not care change, 1 = Care advantage, 2 = Really care about advantage.
     * @param {*} changeValue The weight value to count just the act of changing as. Higher number means more biased to change if possible. Ex: 0 = Ignore if no change, 1 = Treat changing same as 1 advantage point.
     * @returns A decimal probability. -1 to 1 by default multiplier. Can be changed by other multipliers.
     */
    static checkEmotionAdvantageApply(userUnit, targetUnit, emotion, advantageMult = 1.0, changeValue = 0.0) {
        emotion = emotion.toUpperCase();
        let userMembers = userUnit.aliveMembers();
        let targetMembers = targetUnit.aliveMembers()

        let userDict = this.getBattlersEmotions(userMembers);
        let targetDict = this.getBattlersEmotions(targetMembers);
        let newTargetDict = this.getBattlersEmotionsApply(targetMembers, emotion);
        
        let curAdvantage = this.checkEmotionAdvantage(userDict, targetDict);
        let newAdvantage = this.checkEmotionAdvantage(userDict, newTargetDict);

        let changeRatio = this.getBattlersEmotionsChangedCount(targetDict, newTargetDict) / targetMembers.length;

        console.log("RVAI - checkEmotionAdvantageApply - changeRatio, Old, New:", changeRatio, curAdvantage, newAdvantage)
        return ((newAdvantage - curAdvantage) * advantageMult) + (changeRatio * changeValue);
    }

    /**
     * Returns an emotion dictionary count of each type.
     * @param {*} battlers 
     * @returns 
     */
    static getBattlersEmotions(battlers) {
        let output = this.createEmotionDict();
        for (let battler of battlers) {
            let foundEmo = false;
            for (let key in output) {
                if (battler.isStateCategoryAffected(key)) {
                    output[key] += 1;
                    foundEmo = true;
                    break;
                }
            }
            if (!foundEmo) {
                output["NEUTRAL"] += 1;
            }
        }
        return output;
    }

    /**
     * Returns Emotion Dictionary after an emotion is attempted applied
     * @param {*} battlers 
     * @param {*} emotion 
     * @returns 
     */
    static getBattlersEmotionsApply(battlers, emotion) {
        let output = this.createEmotionDict();
        for (let battler of battlers) {
            if (battler.canAddStateTier(emotion)) {
                output[emotion] += 1; // If can add, then change emotion
            } else {
                output[battler.emotionStateType()] += 1; // If can't then remain same (mostly for emotion locks)
            }
        }
        return output;
    }

    /**
     * Count how many emotion changed
     * @param {*} userDict 
     * @param {*} targetDict 
     * @returns 
     */
    static getBattlersEmotionsChangedCount(userDict, targetDict) {
        let output = 0;
        for (const [userEmo, userEmoNum] of Object.entries(userDict)) {
            const targetEmoNum = targetDict[userEmo];
            output += Math.abs(userEmoNum - targetEmoNum);
        }
        return output / 2; // Divide by 2 as changing one emotion means losing another, counting twice
    }

    /**
     * Check how much advantage user has over target
     * @param {*} userDict 
     * @param {*} targetDict 
     * @returns 
     */
    static checkEmotionAdvantage(userDict, targetDict) {
        let userMembers = 0;
        let targetMembers = 0;
        for (const key in userDict) { userMembers += userDict[key]; }
        for (const key in targetDict) { targetMembers += targetDict[key]; }
        let totalCombinations = userMembers * targetMembers;
        let totalAdvantage = 0;

        for (const [userEmo, userEmoNum] of Object.entries(userDict)) {
            let userEmotionState = DataManager.getEmotion(userEmo);
            let weakToEmotions = userEmotionState ? userEmotionState.emotionWeak : [];
            let strongToEmotions = userEmotionState ? userEmotionState.emotionStrong : [];
            for (const [targetEmo, targetEmoNum] of Object.entries(targetDict)) {
                let targetEmotionState = DataManager.getEmotion(userEmo);
                if (targetEmotionState == null || targetEmotionState == null ) { // if Any Neutral, skip
                    continue;
                }
                if (weakToEmotions.contains(targetEmo)) { // if target's emotion is user Weak to
                    totalAdvantage -= userEmoNum * targetEmoNum; // Amount of User and Target combination
                }
                if (strongToEmotions.contains(targetEmo)) {  // if target's emotion is user Strong to
                    totalAdvantage += userEmoNum * targetEmoNum; // Amount of User and Target combination
                }
            }
        }

        return totalAdvantage / totalCombinations;
    }

    static setRerollBasicAttack(enemy, count) {
        enemy._rerollBasicAttack = count;
    }

    // =========================================================================
    // Adding Emotion - More available means good
    // Requires individual check as each actor have different limits
    // =========================================================================

    /**
     * Emotion Add checks for the resist as the "total tier" as well. 
     * Good for checking skill that want add emotion to not waste it.
     * @param {*} battler 
     * @param {*} type 
     * @param {*} mult 
     * @param {*} tier 
     * @returns 
     */
    static addEmotion(battler, type, mult = 1.0, tier = 1) {
        type = type.toUpperCase();
        let availableTiers = 0;
        let totalTiers = 0;
        if (battler instanceof Game_Unit) {  
            const members = battler.aliveMembers();
            for (const member of members) {
                availableTiers += member.canAddStateTier(type, tier);
                totalTiers += member.canAddStateTierCount(type, RVAI.MAX_EMOTION_TIER);
            }
        } else {
            availableTiers = battler.canAddStateTier(type, tier);
            totalTiers = battler.canAddStateTierCount(type, RVAI.MAX_EMOTION_TIER); // Assume the limit is trying to add 3, + consider resist
        }
        let tierProportion = availableTiers / totalTiers; // MORE available tiers => MORE likely
        let p = mult * tierProportion;
        let result = Math.random() < p;
        console.log("RVAI - addEmotion", type, p, result);
        return result;
    }

    // Emotion Find is based on Current tier to Max Tier (regardless of resist). Good for Ailment / Checking Weaknesses

    static findEmotion(battler, type, mult = 1.0) {
        type = type.toUpperCase();

        let curTier = 0;  // Finds amount of tier have
        let totalTiers = 0; // Assume the limit is trying to add 3, + consider resist
        
        if (battler instanceof Game_Unit) {
            const members = battler.aliveMembers();
            for (const member of members) {
                curTier += member.emotionStateTier(type);
            }
            totalTiers = RVAI.MAX_EMOTION_TIER * members.length;
        } else {
            curTier = battler.emotionStateTier(type); // Finds amount of tier have
            totalTiers = RVAI.MAX_EMOTION_TIER; // Assume the limit is trying to add 3, + consider resist
        }

        let tierProportion = curTier / totalTiers; // HIGHER tiers => MORE likely
        let p = mult * tierProportion;
        let result = Math.random() < p;
        console.log("RVAI - findEmotion", type, p, result);
        return result;
    }

    // =========================================================================
    // Adding Buff / Debuff - Negative Tier is Debuff
    // =========================================================================

    static buff(battler, type, mult = 1.0) {
        type = type.toUpperCase();
        let tierProportion = 0;
        if (battler instanceof Game_Unit) {
            tierProportion = battler.stateBuffTier(type) / (RVAI.RANGE_STATE_TIER * battler.aliveMembers().length); // Range [-0.5,0.5]
        } else {
            tierProportion = battler.stateBuffTier(type) / RVAI.RANGE_STATE_TIER; // Range [-0.5,0.5]
        }
        let p = mult * (0.5 - tierProportion); // HIGH tiers already => LESS likely
        let result = Math.random() < p;
        console.log("RVAI - buff", type, p, result);
        return result;
    }

    static debuff(battler, type, mult = 1.0) {
        type = type.toUpperCase();
        let tierProportion = 0;
        if (battler instanceof Game_Unit) {
            tierProportion = battler.stateBuffTier(type) / (RVAI.RANGE_STATE_TIER * battler.aliveMembers().length); // Range [-0.5,0.5]
        } else {
            tierProportion = battler.stateBuffTier(type) / RVAI.RANGE_STATE_TIER; // Range [-0.5,0.5]
        }
        let p = mult * (0.5 + tierProportion); // HIGH tiers already => MORE likely
        let result = Math.random() < p;
        console.log("RVAI - debuff", type, p, result);
        return result;
    }

    // =========================================================================
    // Adding ALL Buff / Debuff - Negative Tier is Debuff
    // =========================================================================
    // averageBuffTier() gives -3 to 3, +3 to offset 0 to 6, then divide by 6 to range 0-1


    static buffAll(battler, mult = 1.0) {
        let tierProportion = 0;
        if (battler instanceof Game_Unit) {
            tierProportion = (battler.averageBuffTier() + RVAI.MAX_STATE_TIER) / (RVAI.RANGE_STATE_TIER * battler.aliveMembers().length); // Range [0,1]
        } else {
            tierProportion = (battler.averageBuffTier() + RVAI.MAX_STATE_TIER) / RVAI.RANGE_STATE_TIER; // Range [0,1]
        }
        let p = mult * (1.0 - tierProportion); // HIGH tiers already => LESS likely
        let result = Math.random() < p;
        console.log("RVAI - buffAll", p, result);
        return result;
    }

    static debuffAll(battler, mult = 1.0) {
        let tierProportion = 0;
        if (battler instanceof Game_Unit) {
            tierProportion = (battler.averageBuffTier() + RVAI.MAX_STATE_TIER) / (RVAI.RANGE_STATE_TIER * battler.aliveMembers().length); // Range [0,1]
        } else {
            tierProportion = (battler.averageBuffTier() + RVAI.MAX_STATE_TIER) / RVAI.RANGE_STATE_TIER; // Range [0,1]
        }
        let p = mult * tierProportion; // HIGH tiers already => MORE likely
        let result = Math.random() < p;
        console.log("RVAI - buffAll", p, result);
        return result;
    }

    // =========================================================================
    // Clear Buff / Debuff - Check only one side
    // =========================================================================

    static clearBuff(battler, mult = 1.0) {
        let tierProportion = 0;
        if (battler instanceof Game_Unit) {
            tierProportion = battler.totalBuffTier() / (RVAI.HALF_STATE_TIER * battler.aliveMembers().length); // Only Buff Side - Range [0,1]
        } else {
            tierProportion = battler.totalBuffTier() / RVAI.HALF_STATE_TIER; // Only Buff Side - Range [0,1]
        }
        let p = mult * tierProportion;
        let result = Math.random() < p;
        console.log("RVAI - clearBuff", p, result);
        return result;
    }

    static clearDebuff(battler, mult = 1.0) {
        let tierProportion = 0;
        if (battler instanceof Game_Unit) {
            tierProportion = Math.abs(battler.totalDebuffTier()) / (RVAI.HALF_STATE_TIER * battler.aliveMembers().length); // Only Buff Side - Range [0,1]
        } else {
            tierProportion = Math.abs(battler.totalDebuffTier()) / RVAI.HALF_STATE_TIER; // Only Buff Side - Range [0,1]
        }
        let p = mult * tierProportion;
        let result = Math.random() < p;
        console.log("RVAI - clearDebuff", p, result);
        return result;
    }

    // =========================================================================
    // Healing - Check Percentage Stat
    // =========================================================================

    static hpHeal(battler, mult = 1.0) {
        let tierProportion = 0;
        if (battler instanceof Game_Unit) {
            const members = battler.aliveMembers();
            for (const member of members) {
                tierProportion += 1 - member.hpRate();
            }
            tierProportion /= members.length;
        } else {
            tierProportion = 1 - battler.hpRate(); // Lost Pecentage HP - Range [0,1]
        }
        let p = mult * tierProportion;
        let result = Math.random() < p;
        console.log("RVAI - hpHeal", p, result);
        return result;
    }

    static mpHeal(battler, mult = 1.0) {
        let tierProportion = 0;
        if (battler instanceof Game_Unit) {
            const members = battler.aliveMembers();
            for (const member of members) {
                tierProportion += 1 - member.mpRate();
            }
            tierProportion /= members.length;
        } else {
            tierProportion = 1 - battler.mpRate(); // Lost Pecentage MP - Range [0,1]
        }
        let p = mult * tierProportion;
        let result = Math.random() < p;
        console.log("RVAI - mpHeal", p, result);
        return result;
    }

    // =========================================================================
    // Ailments - Check Prerequisite Emotion / Ailment
    // =========================================================================
    static addAilment(battler, ailment, mult = 1.0) {
        // When entered is unit, recurse itself but inputting battler.
        if (battler instanceof Game_Unit) {
            const members = battler.aliveMembers();
            return members.some((x) => RVAI.addAilment(x, ailment, mult));
        }

        ailment = ailment.toUpperCase();
        console.log("RVAI - addAilment (findEmotion on next line if exists)", ailment, mult)
        if (battler.isStateCategoryAffected("AILMENT")) return false;
        const emotion = RVAI.AILMENT_EMO[ailment];
        if (emotion)
            return RVAI.findEmotion(battler, emotion, mult)
        return Math.random() < mult;
    }

    static findAilment(battler, ailment, mult = 1.0) {
        // When entered is unit, recurse itself but inputting battler.
        if (battler instanceof Game_Unit) {
            const members = battler.aliveMembers();
            return members.some((x) => RVAI.findAilment(x, ailment, mult));
        }

        ailment = ailment.toUpperCase();
        console.log("RVAI - findAilment", ailment, mult)
        const id = RVAI.AILMENT_IDS[ailment];
        if (id != null && battler.isStateAffected(id))
            return Math.random() < mult;
        return false;
    }

    static clearAilment(battler, mult = 1.0) {
        // When entered is unit, recurse itself but inputting battler.
        if (battler instanceof Game_Unit) {
            const members = battler.aliveMembers();
            return members.some((x) => RVAI.clearAilment(x, ailment, mult));
        }

        // if affected ailment, roll mult. If not then false (nothing to clear).
        if (battler.isStateCategoryAffected("AILMENT")) {
            return Math.random() < mult;
        }
        return false;
    }
}

class RVSkills {
    static diffDamageTakenMult(action, value) {
        const isDamage = action.isPhysical() && action.isHpEffect() && value > 0;
        const diff = $gameVariables.value(1512);
        const setNormal = $gameSwitches.value(2806);
        const ignoreAdjust = action.isIgnoreDifficultyAdjust();
        if (ignoreAdjust)
            return 1.0;
        if (isDamage && (setNormal || diff == 0))
            return 0.7;
        if (isDamage && diff < 0)
            return 0.5;
        return 1.0;
    }

    static diffDamageDealtMult(action, value) {
        const isDamage = action.isPhysical() && action.isHpEffect() && value > 0;
        const diff = $gameVariables.value(1512);
        const setNormal = $gameSwitches.value(2806);
        const ignoreAdjust = action.isIgnoreDifficultyAdjust();
        if (ignoreAdjust)
            return 1.0;
        if (isDamage && (setNormal || diff == 0))
            return 1.15;
        if (isDamage && diff < 0)
            return 1.3;
        return 1.0;
    }

    // NEUTRAL counts as 0
    static emotionTier(battler) {
        if (battler.isStateCategoryAffected("EMOTION3")) return 3;
        if (battler.isStateCategoryAffected("EMOTION2")) return 2;
        if (battler.isStateCategoryAffected("EMOTION1")) return 1;
        return 0;
    }

    static odeEmotion(target) {
        let tier = 1;
        if (target.isStateCategoryAffected("HAPPY")) target.addStateTier("HAPPY", tier);
        if (target.isStateCategoryAffected("SAD")) target.addStateTier("SAD", tier);
        if (target.isStateCategoryAffected("ANGRY")) target.addStateTier("ANGRY", tier);
    }

    static quartetBuff(user, target) {
        let tier = this.emotionTier(user);
        if (user.isStateCategoryAffected("HAPPY")) target.addStateTier("SPD", tier);
        if (user.isStateCategoryAffected("SAD")) target.addStateTier("DEF", tier);
        if (user.isStateCategoryAffected("ANGRY")) target.addStateTier("ATK", tier);
    }

    // Damages are 3.0/2.5/2.0 (SUNNY gets up to 2 tiers of emotion)
    static concertoMult(user) {
        let tier = this.emotionTier(user);
        return 3.0 - (tier * 0.5);
    }

    // Damages are 2.5/3.5/4.5/5.5
    static sonataMult() {
        const members = $gameTroop.aliveMembers();
        let mult = 2.5;
        mult += members.some(x => x.isStateCategoryAffected("HAPPY")) ? 1 : 0;
        mult += members.some(x => x.isStateCategoryAffected("SAD")) ? 1 : 0;
        mult += members.some(x => x.isStateCategoryAffected("ANGRY")) ? 1 : 0;
        mult += members.some(x => x.isStateCategoryAffected("AFRAID")) ? 1 : 0; // Unlikely, but in case
        return mult;
    }
}

RVAI.TOTAL_EMOTION_TIER = 7; //4 party member: 1,1,2,3
RVAI.TOTAL_STATE_TIER = 24; //4 type buff: 6 tiers each (+-3)
RVAI.HALF_STATE_TIER = 12; //USED TO OFFSET
RVAI.MIN_STATE_TIER = -3;
RVAI.MAX_STATE_TIER = 3;
RVAI.RANGE_STATE_TIER = 6; //Range from -3 to 3
RVAI.MAX_EMOTION_TIER = 3;
RVAI.BUFF_LIST = ["ATK", "DEF", "SPD", "HIT"];

RVAI.AILMENT_IDS = {
    "GLOW": 235,
    "WEEP": 236,
    "BURN": 237,
    "SLEEP": 238,
    "CHARM": 239,
    "FREEZE": 240,
    "SICK": 241
}

RVAI.AILMENT_EMO = {
    "GLOW": "HAPPY",
    "WEEP": "SAD",
    "BURN": "ANGRY"
}

RVAI.BASIC_ATTACK_ID = 3;

/**
 * This function evaluates when AI Priority picked a skill.
 * Used by KOFFIN_BetterEnemySystem
 */
Game_Enemy.prototype.doCustomDecidedActionAI = function() {
    let skillId = AIManager._aiSkillId
    let skill = $dataSkills[skillId]
    this._rerollBasicAttack = this._rerollBasicAttack || 0;
    if (skill && skill.stypeId == RVAI.BASIC_ATTACK_ID && this._rerollBasicAttack > 0) {
        console.log("[RVAI] Did setAIPattern Reroll from Basic Attack, was count", this._rerollBasicAttack);
        this._rerollBasicAttack -= 1;
        this.setAIPattern(); // This cause recursion which isn't ideal, but it works for 1-2 rolls.
    }
};

Game_Enemy.prototype.turnCountSinceSummon = function() {
    return $gameTroop.turnCount() - (this._summonTurn || 0);
};