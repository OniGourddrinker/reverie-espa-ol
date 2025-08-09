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

    // 0 means actually doing it, due to index of ON being first
    static doTurnOrder() {
        return ConfigManager.reverieTurnOrder == 0;
    }

    static doDisplayStats() {
        return ConfigManager.reverieShowStats == 0;
    }

    static doDisplayStateIcons() {
        return ConfigManager.reverieShowStateIcons == 0;
    }

    // Returns a set of info of option for the most basic type of just setting index.
    static createBasicOption(varName, defaultIndex = 0, spacing = 120) {
        return {
            listIndex: 0,
            spacing: spacing,
            getIndex: () => {return ConfigManager[varName]},
            processIndex: (data) => {ConfigManager[varName] = data.index},
            loadIndex: (config) => {config[varName] = ConfigManager[varName];},
            saveIndex: (config) => {ConfigManager[varName] = (config[varName] == undefined) ? defaultIndex : config[varName];},
        }
    }
}

/**
 * This is to keep track of optionData.
 * The actual value will be overridden automatically.
 */
RvOptions.optionData = {
    header: {
        listIndex: 0,
        spacing: 120,
        getIndex: () => {return -1},
        processIndex: (data) => {},
        loadIndex: (config) => {},
        saveIndex: (config) => {},
    },
    difficulty: {
        listIndex: 0,
        spacing: 120,
        getIndex: () => {return RvOptions.getDifficulty() + 1},
        processIndex: (data) => {RvOptions.setDifficulty(data.index - 1)},
        loadIndex: (config) => {},
        saveIndex: (config) => {},
    },
    turnorder: RvOptions.createBasicOption("reverieTurnOrder", 1), // off by default
    showstats: RvOptions.createBasicOption("reverieShowStats", 0),
    showstateicons: RvOptions.createBasicOption("reverieShowStateIcons", 0),
}

// =========================================================
// SAVE AND LOAD OPTIONS
// =========================================================
Reverie.Options.Window_OmoMenuOptionsGeneral_processOptionCommand = Window_OmoMenuOptionsGeneral.prototype.processOptionCommand;
Window_OmoMenuOptionsGeneral.prototype.processOptionCommand = function () {
    Reverie.Options.Window_OmoMenuOptionsGeneral_processOptionCommand.call(this);
    var index = this.index();
    var data = this._optionsList[index];

    for (const [key, value] of Object.entries(RvOptions.optionData)) {
        if (value.listIndex == index) {
            value.processIndex(data);
            break;
        }
    }
};

Reverie.Options.ConfigManager_makeData = ConfigManager.makeData;
ConfigManager.makeData = function () {
    // Get Original Config
    var config = Reverie.Options.ConfigManager_makeData.call(this);
    // Set Config Settings
    for (const [key, value] of Object.entries(RvOptions.optionData)) {
        value.loadIndex(config);
    }
    // Return Config
    return config;
};

Reverie.Options.Window_OmoMenuOptionsGeneral_makeOptionsList = Window_OmoMenuOptionsGeneral.prototype.makeOptionsList;
Window_OmoMenuOptionsGeneral.prototype.makeOptionsList = function () {
    Reverie.Options.Window_OmoMenuOptionsGeneral_makeOptionsList.call(this);
    const LANG = RvOptions.getLanguageData();
    for (const [key, value] of Object.entries(RvOptions.optionData)) {
        this.createCustomOption(LANG, key, value.spacing, value.getIndex());
    }
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
    RvOptions.optionData[varName].listIndex = this._optionsList.length - 1;
}

Reverie.Options.ConfigManager_applyData = ConfigManager.applyData;
ConfigManager.applyData = function (config) {
    // Run Original Function
    Reverie.Options.ConfigManager_applyData.call(this, config);
    this.reverieTurnOrder = (config.reverieTurnOrder == undefined) ? 1 : config.reverieTurnOrder;
    for (const [key, value] of Object.entries(RvOptions.optionData)) {
        value.saveIndex(config);
    }
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
                this.contents.textColor = 'rgb(100, 100, 100)';
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

/**
 * Control when to display stats.
 * @returns boolean
 */
StatusDisplayManager.doDisplayStats = function() {
  return RvOptions.doDisplayStats();
}

RvStateIcons = class extends RvStateIcons {
    static doStateIcons() {
        return RvOptions.doDisplayStateIcons();
    }
}