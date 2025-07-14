//=============================================================================
// Compatibility Save&Load.js
//=============================================================================
/*:
 * @plugindesc Makes changes to the Improved Save & Load Menu mod if it exists
 *
 * @author Pyro#3607
 *
 * @help
 *
 * Makes changes to the Improved Save & Load Menu mod if it exists
 *
 * TERMS OF USE
 * This plugin is licensed under the "Do What the Fuck You Want To Public License". Use it how you see fit. Do credit me if you want, though.
 *
 * COMPATIBILITY
 * There shouldn't be any issues. Load after the original plugin. Will do nothing if you don't have the mod installed.
 */
(function() {

  saveFileFaceExists = function(faceImage) {
    let fs = require('fs');
    const base = path.dirname(process.mainModule.filename);
    return fs.existsSync(`${base}/img/faces/${faceImage}.png`) || fs.existsSync(`${base}/img/faces/${faceImage}.rpgmvp`);
  };

  getFaceName = function(actor) {
    let faceSpriteData = actor.realFaceName ? actor.realFaceName : actor.faceName
    if (!saveFileFaceExists(faceSpriteData)) {
      faceSpriteData = "RV_Invalid";
    }
    return faceSpriteData;
  }

  //=============================================================================
  // * Change Save Face Image
  //=============================================================================

  Game_Actor.prototype.faceSaveLoad = function() {
    //THIS WILL APPEAR IF REVERIE IS NOT INSTALLED/ENABLED
    return "01_FA_OMORI_BATTLE"
  };
  
  Game_Actor.prototype.faceSaveLoad2 = function() {
    var actor = this.actor();
    // When changing these the .png should not be required.
    switch (actor.id) {
      case 1: // Omori
      return "01_OMORI_BATTLE";
      case 2: // Aubrey
      return "02_AUBREY_BATTLE";
      case 3: // Kel
      return "03_KEL_BATTLE";
      case 4: // Hero
      return "04_HERO_BATTLE";
      case 8: // Omori
      return "01_FA_OMORI_BATTLE";
      case 9: // Aubrey
      return "02_FA_AUBREY_BATTLE";
      case 10: // Kel
      return "03_FA_KEL_BATTLE";
      case 11: // Hero
      return "04_FA_HERO_BATTLE";
      case 17: // Omori (Reverie)
      return "01_PLAYER_BATTLE";
      case 18: // Sweetheart
      return "02_SW_BATTLE";
      case 19: // Doughie
      return "03_DG_BATTLE";
      case 20: // Spaceboy
      return "04_SB_BATTLE";
      case 27:
      return "01_RW_PLAYER_BATTLE";
      default:
        return "01_OMORI_BATTLE";
    }
  };

  //=============================================================================
  // * Change Save Face Index
  //=============================================================================
Game_Actor.prototype.faceSaveLoadIndex = function() {
    var actor = this.actor();
    // When changing these the .png should not be required.
    switch (actor.id) {
      case 1: // Omori
      return 0;
      case 2: // Aubrey
      return 0;
      case 3: // Kel
      return 0;
      case 4: // Hero
      return 0;
      default:
        return 0;
    }
  };

  //=============================================================================
  // * Change Save Background
  //============================================================================= 
  hasMod = false;
  if (typeof Scene_OmoriFile.prototype.createCommandHints=== "function") { 
    hasMod = true;
  }
  if (hasMod) 
  {
    Window_OmoriFileInformation.prototype.refresh = function(valid, info, id) {
      // Clear Contents
      this.contents.clear();
      // Get Color
      var color = 'rgba(255, 255, 255, 1)';
      // Get ID
      //var id = this._index + 1;
      //var valid = DataManager.isThisGameFile(id);
      //var info = DataManager.loadSavefileInfo(id);
    
      // Draw Lines
      this.contents.fillRect(0, 29, this.contents.width, 3, color);
    
      for (var i = 0; i < 3; i++) {
        var y = 55 + (i * 25)
        this.contents.fillRect(113, y, this.contents.width - 117, 1, color);
      };
    
    
      // Draw File
      this.contents.fontSize = 30;
      if(this._columns === 1)this.contents.drawText('FILE ' + id + ':', 10 + 30, -5, 100, this.contents.fontSize);
      else{
        if(!valid || info.saveName === null || info.saveName === "" ||info.saveName === undefined)this.contents.drawText(id, 2, -5, 100, this.contents.fontSize, 'center');
        else this.contents.drawText(info.saveName, 2, -5, 98, this.contents.fontSize, 'center');
      }
      
      // If Valid
      if (valid) {
        if(this._select){
          this._faceSprite.visible = true;
          this._selectedBG.visible = true;
        }else{
          this._faceSprite.visible = false;
          this._selectedBG.visible = false;
        }
          this.contents.drawText(info.dummyrevChapter, 85 + 30 + 13 * Math.floor(Math.log10(id)), -5, this.contents.width, this.contents.fontSize);
      
          this.contents.fontSize = 28;
      
          let backBitmap = ImageManager.loadSystem('loadscreen_backgrounds');
          let width = 100;
          let height = 100;
          // this.contents.blt(backBitmap, 0, 0, width, height, 0, 34, width + 10, height);
          bgLocation = getBackground(info.location);
          this.contents.blt(backBitmap, width*bgLocation[0], height*bgLocation[1], width, height, 1, 33); //width*n, height*m controls background
          this._selectedBG.setFrame(width*bgLocation[0], height*bgLocation[1], width, height);
          // Get Actor
          var actor = info.actorData;
          // Draw Actor Face
          let faceSpriteData = getFaceName(actor);
          //console.log(actor);
          this.drawFace(faceSpriteData, 0, -2, this.contents.height - Window_Base._faceHeight + 7, Window_Base._faceWidth, height - 2);
          this._faceSprite.actor = actor;
          if(omoDelete)this._faceSprite.setAnimRow(4);
          else this._faceSprite.setAnimRow(0);
          // Draw Actor Name
          this.contents.fontSize = 24;
          if(info.saveName === null || info.saveName === "" || info.saveName === undefined)this.contents.drawText(actor.name, 118, 30, 200, 24);
          else this.contents.drawText(info.saveName, 118, 30, 200, 24);
          // Draw Level
          this.contents.drawText('LEVEL:', 290 + 55, 30, 100, 24);
          this.contents.drawText(actor.level, 290 + 55, 30, 70, 24, 'right');
          // Draw Total PlayTime
          this.contents.drawText('TOTAL PLAYTIME:', 118, 55, 200, 24);
          this.contents.drawText(info.playtime, 295 + 55, 55, 100, 24);
          // Draw Location
          this.contents.drawText('LOCATION:', 118, 80, 200, 24);
          this.contents.drawText(info.location, 205, 80, 210, 24, 'right');
        }else{
          this._faceSprite.visible = false;
          this._selectedBG.visible = false;
        };
    
      // Draw Border
      this.contents.fillRect(102, 32, 3, 102, 'rgba(255, 255, 255, 1)')
      this.contents.fillRect(0, 29, 108, 3, 'rgba(255, 255, 255, 1)')
    };
  } else 
  {
    Window_OmoriFileInformation.prototype.refresh = function() {
      console.log("refresh vanilla")
      // Clear Contents
      this.contents.clear();
      // Get Color
      var color = 'rgba(255, 255, 255, 1)';
      // Get ID
      var id = this._index + 1;
      var valid = DataManager.isThisGameFile(id);
      var info = DataManager.loadSavefileInfo(id);
    
      // Draw Lines
      this.contents.fillRect(0, 29, this.contents.width, 3, color);
      for (var i = 0; i < 3; i++) {
        var y = 55 + (i * 25)
        this.contents.fillRect(113, y, this.contents.width - 117, 1, color);
      };
    
    
      // Draw File
      this.contents.fontSize = LanguageManager.getMessageData("XX_BLUE.Window_OmoriFileInformation").refresh_contents_fontsize;
      let loc_position = LanguageManager.getMessageData("XX_BLUE.Window_OmoriFileInformation").file_position
      this.contents.drawText(LanguageManager.getMessageData("XX_BLUE.Omori_Save_Load").file.format(id), loc_position[0], loc_position[1], 100, this.contents.fontSize);
      // If Valid
      
      if (valid) {
        loc_position = LanguageManager.getMessageData("XX_BLUE.Window_OmoriFileInformation").refresh_drawText_position;
        let chap = LanguageManager.getMessageData("XX_BLUE.Chapter_Names")[info.chapter]
        if(!chap) {
          chap = info.chapter
        }
        this.contents.drawText(chap, loc_position[0], loc_position[1], this.contents.width, this.contents.fontSize);
        this.contents.fontSize = 28;
    
        let backBitmap = ImageManager.loadSystem('faceset_states');
        let width = backBitmap.width / 4;
        let height = backBitmap.height / 5;
        // this.contents.blt(backBitmap, 0, 0, width, height, 0, 34, width + 10, height);
        this.contents.blt(backBitmap, 0, 0, width, height, 1, 33);
        // Get Actor
        var actor = info.actorData
        // Draw Actor Face
        let faceName = getFaceName(actor);
        let bit = ImageManager.loadFace(faceName);
        bit.addLoadListener(() => this.drawFace(faceName, actor.faceIndex, -2, this.contents.height - Window_Base._faceHeight + 7, Window_Base._faceWidth, height - 2));
        // Draw Actor Name
        this.contents.fontSize = 24;
        this.contents.drawText(actor.name, 118, 30, 100, 24);
        // Draw Level
        loc_position = LanguageManager.getMessageData("XX_BLUE.Window_OmoriFileInformation").level_position;
        this.contents.drawText(LanguageManager.getMessageData("XX_BLUE.Omori_Save_Load").level, loc_position[0], loc_position[1], 100, 24);
        this.contents.drawText(actor.level, loc_position[0], loc_position[1], 70, 24, 'right');
        // Draw Total PlayTime
        loc_position = LanguageManager.getMessageData("XX_BLUE.Window_OmoriFileInformation").playtime_position;
        this.contents.drawText(LanguageManager.getMessageData("XX_BLUE.Omori_Save_Load").playtime, 118, 55, 200, 24);
        this.contents.drawText(info.playtime, loc_position[0], loc_position[1], 100, 24);
        // Draw Location
        this.contents.drawText(LanguageManager.getMessageData("XX_BLUE.Omori_Save_Load").location, 118, 80, 200, 24);
        this.contents.drawText(info.location, 205, 80, 210, 24, 'right');
      };
    }
  }


DataManager.makeSavefileInfo = function() {
// Get Original Info
var info = _TDS_.OmoriSaveLoad.DataManager_makeSavefileInfo.call(this);
// Get Leader
var actor = $gameParty.leader();
// "REVERIE SAVE FILE" only appears when reverie is not installed/enabled
info.actorData = {name: "REVERIE SAVE FILE", dummyrevName: actor.name(), level: actor.level, faceName: actor.faceSaveLoad(), faceIndex: actor.faceSaveLoadIndex(), realFaceName: actor.faceSaveLoad2()};
info.chapter = "REVERIE SAVE FILE"
info.dummyrevChapter = $gameVariables.value(23);
info.location = $gameMap.displayName();
info.saveName = $gameSystem.saveName;
// Return Info
return info;
};

Window_OmoriFileStats.prototype.updateStats = function (valid, info, id) {
this.contents.clear();
this.contents.fontSize = 30;
this.contents.drawText('FILE ' + id + ':', 1, 1, 130, this.contents.fontSize, 'center');
if (valid) {
  console.log("aaaa")
  this.contents.drawText(info.dummyrevChapter, 1, 31, 130, this.contents.fontSize, 'center');
  var actor = info.actorData;
  // Draw Actor Name
  this.contents.fontSize = 24;
  // Draw Level
  this.contents.drawText('LEVEL: '+actor.level, 1, 67, 130, 24, 'center');
  // Draw Total PlayTime
  this.contents.drawText('PLAYTIME:', 1, 93, 130, 24, 'center');
  this.contents.drawText(info.playtime, 1, 117, 130, 24, 'center');
  // Draw Location
  this.contents.drawText('LOCATION:', 1, 143, 130, 24, 'center');
  this.contents.drawText(info.location, 1, 167, 130, 24, 'center');
}
var color = 'rgba(255, 255, 255, 1)';
this.contents.fillRect(0, 64, this.contents.width, 3, color);
this.contents.fillRect(8, 92, this.contents.width - 16, 1, color);
this.contents.fillRect(8, 142, this.contents.width - 16, 1, color);
this.contents.fillRect(8, 191, this.contents.width - 16, 1, color);
};

Sprite_OmoSaveMenuFace.prototype.updateBitmap = function() {
// Get Actor
var actor = this.actor
// If Actor Exists and it has Battle Status Face Name
if (actor) {
  let faceName = getFaceName(actor);
  // Set Bitmap
  this.bitmap = ImageManager.loadFace(faceName);
} else {
  this.bitmap = null;
};
// Update Frame
this.updateFrame();
};

function getBackground(location){
  switch(location){
    case "LOWER METRO":
      return [1,0];
    case "METRO PATH":
      return [2,0];
    case "METRO HUB":
      return [3,0];
    case "MAKESHIFT TOWN":
      return [4,0];
    case "JUNKYARD":
      return [0,1];
    case "JUNKYARD CAUTION":
      return [1,1];
    case "CAMPSITE":
      return [2,1];
    case "SHATTERED FIELDS":
      return [3,1];
    case "HOME":
      return [4,1];
    case "HOME (NIGHT)":
      return [2,3];
    case "FALLEN WORLD PLATFORM":
      return [0,2];
    case "LANDFILL ALPINES":
      return [1,2];
    case "APARTMENT":
      return [2,2];
    case "HOME BLOCK":
      return [3,2];
    case "CENTRAL PARK":
      return [4,2];
    case "MALL F1":
      return [0,3];
    case "STORE BLOCK":
      return [1,3];
    // CHAPTER 4 ONWARD
    case "METRO HUB B2":
      return [3,3];
    case "SPROUT MOLE COLONY":
      return [4,3];
    case "CASTLE FOYER":
      return [0,4];
    case "PIANO ROOM":
      return [1,4];
    case "THE DUNGEON":
      return [2,4];
    case "CASTLE LIBRARY":
      return [3,4];
    case "BEFORE THE KEEP":
      return [4,4];
    case "LOST PASSAGE":
      return [0,5];
    case "SERVANT'S QUARTER":
      return [1,5];
    case "FOREST OF THE LOST":
      return [2,5];
    case "BEHIND THE DUNGEON":
      return [3,5];
    case "B2C DEPTHS":
      return [4,5];
    case "SCHOOL CORRIDOOR":
      return [0,6];
    case "FANMAIL GRAVEYARD":
      return [1,6];
    case "B2C ENTRYWAY":
      return [2,6];
    default:
      return [0,0];
  }
}

//=============================================================================
// * RESERVE IMAGE FACES
//=============================================================================
let old_loadReservedBitmaps = Scene_OmoriFile.prototype.loadReservedBitmaps;
Scene_OmoriFile.prototype.loadReservedBitmaps = function() {
  old_loadReservedBitmaps.call(this);
  // Super Call
  Scene_Base.prototype.loadReservedBitmaps.call(this);
  // Go through face
  ImageManager.reserveFace("01_OMORI_BATTLE", 0, this._imageReservationId);
  ImageManager.reserveFace("02_AUBREY_BATTLE", 0, this._imageReservationId);
  ImageManager.reserveFace("03_KEL_BATTLE", 0, this._imageReservationId);
  ImageManager.reserveFace("04_HERO_BATTLE", 0, this._imageReservationId);
  ImageManager.reserveFace("01_FA_OMORI_BATTLE", 0, this._imageReservationId);
  ImageManager.reserveFace("02_FA_AUBREY_BATTLE", 0, this._imageReservationId);
  ImageManager.reserveFace("03_FA_KEL_BATTLE", 0, this._imageReservationId);
  ImageManager.reserveFace("04_FA_HERO_BATTLE", 0, this._imageReservationId);
  ImageManager.reserveFace("01_PLAYER_BATTLE", 0, this._imageReservationId);
  ImageManager.reserveFace("02_SW_BATTLE", 0, this._imageReservationId);
  ImageManager.reserveFace("03_DG_BATTLE", 0, this._imageReservationId);
  ImageManager.reserveFace("04_SB_BATTLE", 0, this._imageReservationId);
  ImageManager.reserveFace("01_PLAYER_BATTLE", 0, this._imageReservationId);
  ImageManager.reserveFace("01_RW_PLAYER_BATTLE", 0, this._imageReservationId);
  ImageManager.reserveFace("RV_Invalid", 0, this._imageReservationId);
  
  ImageManager.reserveSystem('loadscreen_backgrounds', 0, this._imageReservationId);
  ImageManager.reserveBattleback1('battleback_bookshelf', 0, this._imageReservationId);
  ImageManager.reserveParallax('!parallax_black_space', 0, this._imageReservationId);
  ImageManager.reserveParallax('Space_parallax', 0, this._imageReservationId);
  ImageManager.reserveParallax('!polaroidBG_FA_day', 0, this._imageReservationId);
  ImageManager.reserveSystem('VISION',0,this._imageReservationId);
};

DataManager.saveGameWithoutRescue = function(savefileId) {
  // FOR SOME REASON THE GAME LIMITS THE SAVE DATA AND IT PROBABLY BREAKS STUFF
  var json = JsonEx.stringify(this.makeSaveContents());
  if (json.length >= 6000000) {
      console.warn('Save data too big!');
  }
  StorageManager.save(savefileId, json);
  this._lastAccessedId = savefileId;
  var globalInfo = this.loadGlobalInfo() || [];
  globalInfo[savefileId] = this.makeSavefileInfo();
  this.saveGlobalInfo(globalInfo);
  return true;
};

DataManager = class extends DataManager {
  static saveGameWithoutRescue(id) {
    $gameActors._data.forEach(actor => {
      if (actor) {
        actor._fullSkillset = actor._equippedSkills
        actor._equippedSkills = actor._equippedSkills.slice(0, 4)
      }
    })
    let result = super.saveGameWithoutRescue(id)
    $gameActors._data.forEach(actor => {
      if (actor) {
        if (actor._fullSkillset) {
          actor._equippedSkills = actor._fullSkillset
        }
      }
    })
    return result
  }
  static extractSaveContents(contents) {
    super.extractSaveContents(contents)
    $gameActors._data.forEach(actor => {
      if (actor) {
        if (actor._fullSkillset) {
          let allEqual = true
          actor._equippedSkills.forEach((skillId, i) => {
            allEqual = allEqual && (skillId === actor._fullSkillset[i])
          })
          if (allEqual) {
            actor._equippedSkills = actor._fullSkillset
          }
        }
      }
    })
  }
}

Window_OmoriFileStats.prototype.updateStats = function (valid, info, id) {
  this.contents.clear();
  this.contents.fontSize = 30;
  this.contents.drawText('FILE ' + id + ':', 1, 1, 130, this.contents.fontSize, 'center');
  
  if (valid) {
    console.log(info.dummyChapter)
    this.contents.drawText(info.dummyrevChapter, 1, 31, 130, this.contents.fontSize, 'center');
    var actor = info.actorData;
    // Draw Actor Name
    this.contents.fontSize = 24;
    // Draw Level
    this.contents.drawText('LEVEL: '+actor.level, 1, 67, 130, 24, 'center');
    // Draw Total PlayTime
    this.contents.drawText('PLAYTIME:', 1, 93, 130, 24, 'center');
    this.contents.drawText(info.playtime, 1, 117, 130, 24, 'center');
    // Draw Location
    this.contents.drawText('LOCATION:', 1, 143, 130, 24, 'center');
    this.contents.drawText(info.location, 1, 167, 130, 24, 'center');
  }
  var color = 'rgba(255, 255, 255, 1)';
  this.contents.fillRect(0, 64, this.contents.width, 3, color);
  this.contents.fillRect(8, 92, this.contents.width - 16, 1, color);
  this.contents.fillRect(8, 142, this.contents.width - 16, 1, color);
  this.contents.fillRect(8, 191, this.contents.width - 16, 1, color);
};
Scene_OmoriFile.prototype.createStatWindow = function() {
  // Create Prompt Window
  this._statWindow = new Window_OmoriFileStats();
  this._statWindow.y = this._commandWindow.height + this._commandWindow.y + 10;
  //this._statWindow.updateStats(null, null);
  // Set Handlers
  //this._statWindow.setHandler('ok', this.onPromptWindowOk.bind(this));
  //this._statWindow.setHandler('cancel', this.onPromptWindowCancel.bind(this));
  //this._statWindow.close();
  //this._statWindow.openness = 0;
  //this._statWindow.deactivate();
  this.addChild(this._statWindow);
};

Sprite_OmoSaveMenuFace.prototype.updateBitmap = function() {
  // Get Actor
  var actor = this.actor
  // If Actor Exists and it has Battle Status Face Name
  if (actor) {
    let faceName = getFaceName(actor);
    // Set Bitmap
    this.bitmap = ImageManager.loadFace(faceName);
  } else {
    this.bitmap = null;
  };
  // Update Frame
  this.updateFrame();
}

})();
