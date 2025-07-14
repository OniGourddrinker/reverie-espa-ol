/*:
 * @plugindesc A plugin to be able to move events with the relative position.
 * @author surrealegg
 *
 * @help
 * Usage:
 *
 * <Move Event x: n>
 * <Move Event y: n>
 * <Move Event x: n y: m>
 */

var Imported = Imported || {};
Imported.SurrealeggEventMover = true;

const SurrealeggEventMover = {
  note1: /<Move Event x:[ ]*([\+\-]\d+)[ ]*>/i,
  note2: /<Move Event y:[ ]*([\+\-]\d+)[ ]*>/i,
  note3: /<Move Event x:[ ]*([\+\-]\d+)[ ]*y:[ ]*([\+\-]\d+)[ ]*>/i,
};

SurrealeggEventMover.GameEventSetupPageSettings =
  Game_Event.prototype.setupPageSettings;
Game_Event.prototype.setupPageSettings = function () {
  SurrealeggEventMover.GameEventSetupPageSettings.call(this);
  const event = this.event();
  if (!event || event.note === "" || this._eventMoved) return;
  if (event.note.match(SurrealeggEventMover.note1)) {
    this.locate(this._x + parseInt(RegExp.$1), this._y);
    this._eventMoved = true;
    this.refresh();
    return;
  }
  if (event.note.match(SurrealeggEventMover.note2)) {
    this.locate(this._x, this._y + parseInt(RegExp.$1));
    this._eventMoved = true;
    this.refresh();
    return;
  }
  if (event.note.match(SurrealeggEventMover.note3)) {
    this.locate(this._x + parseInt(RegExp.$1), this._y + parseInt(RegExp.$2));
    this._eventMoved = true;
    this.refresh();
    return;
  }
};
