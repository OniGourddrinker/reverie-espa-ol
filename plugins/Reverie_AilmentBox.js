//=============================================================================
// Reverie Plugin - Ailment Box
// Reverie_AilmentBox.js    VERSION 1.0.1
//=============================================================================
/*:
 * @plugindesc v1.0.1 Ailment background on battle portrait
 * @author ReynStahl
 */

var Imported = Imported || {};
Imported.Reverie_AilmentBox = true;

Game_Actor.prototype.ailmentEffectIndex = function () {
  var state = this.states().find(st => st.meta.AilmentEffectIndex);
  if (state) {
    return Number(state.meta.AilmentEffectIndex);
  };
  return -1;
};

//=============================================================================
// ** Sprite_OmoActorAilment
//-----------------------------------------------------------------------------
// Animated ailment box effects
//=============================================================================
function Sprite_OmoActorAilment() { this.initialize.apply(this, arguments);}
Sprite_OmoActorAilment.prototype = Object.create(Sprite.prototype);
Sprite_OmoActorAilment.prototype.constructor = Sprite_OmoActorAilment;

//=============================================================================
// * Initialize Object
//=============================================================================
Sprite_OmoActorAilment.prototype.initialize = function() {
  Sprite.prototype.initialize.call(this);

  this._actor = null;

  this._defaultDelay = 12;
  this._maxFrames = 3;

  this._animRow = 0;
  this._animRowOld = 0;
  this._animDelay = this._defaultDelay;
  this._animFrame = 0;

  this._faceWidth = 160;
  this._faceHeight = 240;

  this._active = true;
  this.alpha = 0; //start invisible
};

//=============================================================================
// * Update Bitmap
//=============================================================================
Sprite_OmoActorAilment.prototype.updateBitmap = function() {
  var actor = this.actor
  if (actor) {
    let faceName = 'rv_ailmentBox';
    this.bitmap = ImageManager.loadSystem(faceName);
  } else {
    this.bitmap = null;
  };
  this.updateFrame();
};

//=============================================================================
// * Actor
//=============================================================================
Object.defineProperty(Sprite_OmoActorAilment.prototype, 'actor', {
  get: function() { return this._actor; },
  set: function(value) {
    // If Value is changing
    if (value !== this._actor) {
      this._actor = value;
      this.updateBitmap();
    }
  },
  configurable: true
})

Sprite_OmoActorAilment.prototype.setAnimRow = function(index) {
  // Set Animation Row
  this._animRow = index;
  if (index > 0) this._animRowOld = index;
  // Update Frame
  this.updateFrame();
};

Sprite_OmoActorAilment.prototype.update = function() {
  Sprite.prototype.update.call(this);
  if (this._active) {
    // Check if need to be updated
    if (this.actor && this.actor._stateChangeForBox) {
      this.setAnimRow(this.actor.ailmentEffectIndex());
      this.actor._stateChangeForBox = false;
    }

    if (this._animDelay > 0) {
      this._animDelay--; // Decrease Animation Value
    } else {
      // Reset Delay
      this._animDelay = this._defaultDelay;
      this._animFrame = (this._animFrame + 1) % this._maxFrames;
      this.updateFrame();
    };

    //Fade in and out. Negative row is none
    if (this._animRow < 0 ){
      if (this.alpha > 0)
        this.alpha -= 0.1;
    } else {
      if (this.alpha < 1)
        this.alpha += 0.1
    }
  };
};

Sprite_OmoActorAilment.prototype.updateFrame = function() {
  // Get Face Width & Height
  var fw = this._faceWidth, fh = this._faceHeight;
  // Get Face X & Y
  var fx = (this._animFrame * fw);
  var fy = this._animRowOld * fh;
  // Set Frame
  this.setFrame(fx, fy, fw, fh);
};

//====================================================
// Aliasing Sprite Creation
//====================================================

const _old_Window_OmoriBattleActorStatus_createSprites = Window_OmoriBattleActorStatus.prototype.createSprites;
Window_OmoriBattleActorStatus.prototype.createSprites = function() {
  var layers = this._displayLayers;
  var pos = this._homePosition;

  // Create Sprite
  this._ailmentBox = new Sprite_OmoActorAilment();
  this._ailmentBox.x = pos.x - 23;
  this._ailmentBox.y = pos.y - 38;
  layers._polaroid.addChild(this._ailmentBox);
  // Set Actor
  this._ailmentBox.actor = this.actor();

  _old_Window_OmoriBattleActorStatus_createSprites.call(this);
}

const _old_Window_OmoriBattleActorStatus_refresh = Window_OmoriBattleActorStatus.prototype.refresh;
Window_OmoriBattleActorStatus.prototype.refresh = function() {
  _old_Window_OmoriBattleActorStatus_refresh.call(this);
  var actor = this.actor();
  if (actor) {
    actor._stateChangeForBox = true;
  };
};

const _RVAILMENTBOX_ADDSTATE = Game_Actor.prototype.addState;
Game_Actor.prototype.addState = function(stateId) {
  _RVAILMENTBOX_ADDSTATE.call(this, stateId);
  this._stateChangeForBox = true;
};