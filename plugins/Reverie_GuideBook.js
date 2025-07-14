//=============================================================================
// REVERIE Plugin - Guide Book
// Reverie_GuideBook.js    VERSION 1.1.0
//=============================================================================

/*:
 * @plugindesc Alters Bestiary into info book
 * @author ReynStahl
 * @help Alters bestiary
 * Depends: Put BELOW BestiaryExtended
 */

var Imported = Imported || {};
Imported.DGT_reveriefixes = true;

var Reverie = Reverie || {};
Reverie.guideBook = Reverie.guideBook || {};

var ReverieMisc = ReverieMisc || {};

ReverieMisc.setGuideBestiary = function(value = true) {
    console.log("Reverie Guide Bestiary", value)
    $gameTemp._rvGuideBestiary = value;
}

// Alters the item use, setting if its special one
Reverie.guideBook.Scene_OmoMenuItem_onItemConfirmationUse = Scene_OmoMenuItem.prototype.onItemConfirmationUse;
Scene_OmoMenuItem.prototype.onItemConfirmationUse = function() {
    var item = this.item();
    if (item.meta.BestiaryGuide) {
        ReverieMisc.setGuideBestiary(true);
        SceneManager.push(Scene_OmoriBestiary);
        return;
    } else {
        ReverieMisc.setGuideBestiary(false);
    }
    // If not continue old function
    Reverie.guideBook.Scene_OmoMenuItem_onItemConfirmationUse.call(this);
}

BestiaryManager.getInformationData = function() {
    if ($gameTemp._rvGuideBestiary) {
        return LanguageManager.getTextData('reverie_guidebook', 'Information');
    }
    return LanguageManager.getTextData('reverie_bestiary', 'Information');
}

BestiaryManager.getEmptyEnemyName = function() {
    if ($gameTemp._rvGuideBestiary) {
        return LanguageManager.getTextData('reverie_bestiary', 'EmptyEnemyName');
    }
    return LanguageManager.getTextData('reverie_bestiary', 'EmptyEnemyName');
}