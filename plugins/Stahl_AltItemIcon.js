//=============================================================================
// Stahl - Alternate Item Icon
// Stahl_AltItemIcon.js    VERSION 1.0.2
//=============================================================================

var Imported = Imported || {};
Imported.Stahl_AltItemIcon = true;

//=============================================================================
 /*:
 * @plugindesc v1.0.2 Allow specifying which image sheet to use for item icons
 * @author ReynStahl
 * @help
 * Notetags [Armor, Weapon, Item]:
 * <ItemIconSheet:value>
 * - value is the image name in system folder. WITHOUT quote and file extension.
 * - Spaces will be counted so avoid first space.
 * - This only specify which sheet to use, iconIndex is still needed.
 * 
 * EXAMPLE: 
 * <ItemIconSheet:myNewSheet>
 * <IconIndex: 5>
 * Grabs icon 5 from myNewSheet.png
 * 
 * - First square is index 0.
 * - Item icons are assumed to be 108x108. 
 * - Sheet could be of any size as long it's in multiples of 108.
 */
 //=============================================================================

var Stahl = Stahl || {};
Stahl.AltItemIcon = Stahl.AltItemIcon || {};

Stahl.AltItemIcon.Window_Base_drawItemIcon = Window_Base.prototype.drawItemIcon;
Window_Base.prototype.drawItemIcon = function(item, x, y, rate = 1.0) {
    if (item.meta.ItemIconSheet) {
        let bitmap = ImageManager.loadSystem(item.meta.ItemIconSheet);
        bitmap.addLoadListener(() => {
            let index = 0;
            if (item.meta.IconIndex) {index = Number(item.meta.IconIndex);};
            let width = 108;
            let height = 108;
            let columns =  Math.floor(bitmap.width / width);
            let sX = (index % columns) * width;
            let sY = Math.floor(index / columns) * height;
            this.contents.blt(bitmap, sX, sY, width, height, x, y, width * rate, height * rate);
        });
    } else {
        Stahl.AltItemIcon.Window_Base_drawItemIcon.call(this, ...arguments);
    };
};

// Init atlas required to display image
Stahl.AltItemIcon.Scene_OmoriItemShop_initAtlastLists = Scene_OmoriItemShop.prototype.initAtlastLists;
Scene_OmoriItemShop.prototype.initAtlastLists = function() {
    Stahl.AltItemIcon.Scene_OmoriItemShop_initAtlastLists.call(this);
    for (let item of $dataItems) {
        if (item && item.meta.ItemIconSheet) {
            ImageManager.reserveSystem(item.meta.ItemIconSheet, 0, this._imageReservationId);
        };
    };
};