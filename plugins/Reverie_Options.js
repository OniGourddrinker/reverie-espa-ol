/*:
* @plugindesc v1.0.0 All Customs options related to Reverie
* @author ReynStahl
* 
* @help
* Customs options related to Reverie
*/

var Reverie = Reverie || {};
Reverie.Options = Reverie.Options || {};

class RvOptions {
    static getLanguageData() {
        return LanguageManager.getTextData("XX_REVERIE", "Options");
    };

    static getDifficulty() {
        return this.inSave() ? $gameVariables.value(1512) : 0;
    }

    static inSave() {
        return !(SceneManager._scene instanceof Scene_OmoriTitleScreen);
    }

    static setDifficulty(number) {
        if (this.inSave()) {
            $gameVariables.setValue(1512, number);
            console.log("Set Reverie Difficulty to", number)
        } else {
            console.log("Attempted to change difficulty without being in save!")
        }
    }

    static getDifficultyIndex() {
        return this.getDifficulty() + 1;
    }

    static setDifficultyFromIndex(index) {
        this.setDifficulty(index - 1)
    }

    // 0 means actually doing it, due to index of ON being first
    static doTurnOrder() {
        return ConfigManager.reverieTurnOrder == 0;
    }
}

/**
 * This is to keep track of optionIndex.
 * The actual value will be overridden automatically.
 */
RvOptions.optionIndex = {
    header: 0,
    difficulty: 0,
    turnorder: 0
}

Reverie.Options.Window_OmoMenuOptionsGeneral_processOptionCommand = Window_OmoMenuOptionsGeneral.prototype.processOptionCommand;
Window_OmoMenuOptionsGeneral.prototype.processOptionCommand = function () {
    Reverie.Options.Window_OmoMenuOptionsGeneral_processOptionCommand.call(this);
    var index = this.index();
    var data = this._optionsList[index];
    // Switch Case Index
    switch (index) {
        case RvOptions.optionIndex.difficulty: RvOptions.setDifficultyFromIndex(data.index); break;
        case RvOptions.optionIndex.turnorder: ConfigManager.reverieTurnOrder = data.index; break;
    };
};

Reverie.Options.ConfigManager_makeData = ConfigManager.makeData;
ConfigManager.makeData = function () {
    // Get Original Config
    var config = Reverie.Options.ConfigManager_makeData.call(this);
    // Set Config Settings
    // Difficulty is a local save variable.
    config.reverieTurnOrder = this.reverieTurnOrder;
    // Return Config
    return config;
};

Reverie.Options.Window_OmoMenuOptionsGeneral_makeOptionsList = Window_OmoMenuOptionsGeneral.prototype.makeOptionsList;
Window_OmoMenuOptionsGeneral.prototype.makeOptionsList = function () {
    Reverie.Options.Window_OmoMenuOptionsGeneral_makeOptionsList.call(this);
    const LANG = RvOptions.getLanguageData();
    this.createCustomOption(LANG, "header", 120, -1);
    this.createCustomOption(LANG, "difficulty", 120, RvOptions.getDifficultyIndex());
    this.createCustomOption(LANG, "turnorder", 120, ConfigManager.reverieTurnOrder);
};

/**
 * Creates an option from language file.
 * @param {*} lang Language File
 * @param {*} varName Varaible name of the option Index and Lang
 * @param {*} spacing Spacing between option
 * @param {*} index Where to start the index
 */
Window_OmoMenuOptionsGeneral.prototype.createCustomOption = function (lang, varName, spacing, index) {
    this._optionsList.push({
        header: lang[varName].header,
        options: lang[varName].options,
        helpText: lang[varName].helpText,
        spacing: spacing,
        index: index,
    });
    RvOptions.optionIndex[varName] = this._optionsList.length - 1;
}

Reverie.Options.ConfigManager_applyData = ConfigManager.applyData;
ConfigManager.applyData = function (config) {
    // Run Original Function
    Reverie.Options.ConfigManager_applyData.call(this, config);
    this.reverieTurnOrder = (config.reverieTurnOrder == undefined) ? 1 : config.reverieTurnOrder;
};

// =========================================================
// EMPTY OPTION HEADER
// =========================================================
Reverie.Options.Window_OmoMenuOptionsGeneral_drawOptionSegment = Window_OmoMenuOptionsGeneral.prototype.drawOptionSegment;
Window_OmoMenuOptionsGeneral.prototype.drawOptionSegment = function(header, options, spacing, rect) {
    let old_color = this.contents.textColor;
    const SAVEKEY = "/save/";
    if (options.length > 0) {
        if (header.startsWith(SAVEKEY)) {
            header = header.substring(SAVEKEY.length)
            if (!RvOptions.inSave()) {
                this.contents.textColor = 'rgb(120, 120, 120)';
            }
        }
        Reverie.Options.Window_OmoMenuOptionsGeneral_drawOptionSegment.call(this, header, options, spacing, rect);
    } else {
        // Draw Header
        this.contents.textColor = 'rgb(255, 200, 0)';    
        this.contents.drawText(header, rect.x + 50, rect.y + 20, rect.width, 24);
    }
    this.contents.textColor = old_color;
};

// =========================================================
// FUNCTIONALITY
// =========================================================

// From Actual Turn Order
Reverie.Options.BattleManager_getActorInputOrder = BattleManager.getActorInputOrder;
BattleManager.getActorInputOrder = function () {
    // If no turn order, just use old one
    if (!RvOptions.doTurnOrder()) {
        return Reverie.Options.BattleManager_getActorInputOrder.call(this);
    }
    let members = $gameParty.members();
    let list = members.map((el, index) => [index, el.agi, el.isAlive() && el.isBattleMember()])
    list.sort((a, b) => b[1] > a[1])
    list = list.filter(_ => _[2])
    return list.map(_ => _[0])
};