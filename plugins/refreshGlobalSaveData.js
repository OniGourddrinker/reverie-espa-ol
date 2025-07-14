//this function called is used when the current save file has a name and the save file attempting to replace it has no name
//if this is the case, the current name is retained instead of deleting the current name
//this is useful when refreshing global save data because a lot of the save files attempting to replace the current save files won't have names
DataManager.makeSavefileInfoWithName = function(currentName) {
  // Get Original Info
  var info = _TDS_.OmoriSaveLoad.DataManager_makeSavefileInfo.call(this);
  // Get Leader
  var actor = $gameParty.leader();
  info.actorData = {name: actor.name(), level: actor.level, faceName: actor.faceSaveLoad(), faceIndex: actor.faceSaveLoadIndex()};
  info.chapter = $gameVariables.value(23);
  info.location = $gameMap.displayName();

  if($gameSystem.saveName){
    info.saveName = $gameSystem.saveName;
  }else{
    info.saveName = currentName;
  }
  
  // Return Info
  return info;
};

DataManager = class extends DataManager {
  static _restoreGlobalInfo() {
    //used to get saveloadplus config
    const fs = require('fs');
    const path = require("path");
    const base = path.dirname(process.mainModule.filename);

    let globalInfo = [];
    let currentInfo = DataManager.loadGlobalInfo();

    //if the save file menu hasn't been loaded yet, the maxSavefiles isn't properly defined so we define it now
    //it would be awesome to check if the save file menu was loaded before doing this but im too awesome already
    if(fs.existsSync(`${base}/save/saveloadplus.json`)){
      //code is mostly stolen from saveloadplus
      var maxSave = currentInfo.length-1;

      this.config = JSON.parse(fs.readFileSync(`${base}/save/saveloadplus.json`, "utf-8"));

      if(this.config.columns === undefined){
        this._columns = 4;
        this.config.columns = this._columns;
      }else{
        this._columns = this.config.columns;
      }
    
      if(this.config.rows === undefined){
        this._rows = Math.ceil(maxSave/this._columns);
        if(this._rows < 3)this._rows = 3;
        this.config.rows = this._rows;
      }else{
        this._rows = this.config.rows;
      }
      
      maxSave = this._rows*this._columns;

      DataManager.maxSavefiles = function() {return maxSave};
    }

    //makes _restoreGlobalInfo compatible with saveloadplus
    //technically vanilla maxSavefiles is 20 but idc lol :P
    //if omocat is reading this make the vanilla maxSavefiles 6 thx
    let maxSaveFiles = DataManager.maxSavefiles();


    let recoverIndex = 0;
    let loadMap = false;

    function recovery() {
      if(recoverIndex >= maxSaveFiles) {
        SceneManager.ticker.remove(recovery);
        DataManager.saveGlobalInfo(globalInfo.concat(currentInfo.slice(maxSaveFiles+1)));
        DataManager.setupNewGame();
        
        //i am playing a funny sound effect to indicate the refresh is done
        AudioManager.playStaticSe({"name":"SE_Tada","pan":0,"pitch":100,"volume":80});
        return;
      }
      let savefileId = recoverIndex + 1;
      if(!!loadMap) {
        if(!$dataMap) {return;}

        if(currentInfo[savefileId]){
          globalInfo[savefileId] = DataManager.makeSavefileInfoWithName(currentInfo[savefileId].saveName);
        }else{
          globalInfo[savefileId] = DataManager.makeSavefileInfo();
        }
        
        loadMap = false;
        recoverIndex++;
        return;
      }
      if(!DataManager._rescueLoadGame(savefileId)) {
        recoverIndex++;
        return;
      }
      else {
        DataManager.loadMapData($gameMap.mapId());
        loadMap = true;
      }
    }
    SceneManager.ticker.add(recovery);
  }
};

if (typeof CommandHandler !== "undefined") {
  CommandHandler.add("refreshGlobalSaveData", (handler) => {
    if (!(SceneManager._scene instanceof Scene_OmoriTitleScreen)) {
      handler.log("global.rpgsave can only be refreshed on title screen!", "red");
      return;
    }
    DataManager._restoreGlobalInfo();
    // Closes console.
    handler.setConsole(false);
  });
}
