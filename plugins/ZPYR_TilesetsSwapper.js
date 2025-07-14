//=============================================================================
// TilesetSwapper.js
//=============================================================================
/*:
 * @plugindesc Allows you to define maps and have specific tilesets swapped for others.
 *
 * @author Pyro#3607
 *
 * 
 * @help
 *
 * Allows you to define maps and have specific tilesets swapped for others.
 *
 * TERMS OF USE
 * Made specifically for REVERIE, but outside use is permitted.
 *
 */


const citySet = [561, 567, 568, 562, 566, 563, 565, 564]

const swapperdata = {

    citySet : {
        
        "evening" : {

            original: ["RV_CityExterior.json", "RV_CityExterior_2.json", "FA_OUTSIDE_CARS.json", "FA_OUTSIDE_OBJECTS.json", "RV_CityInterior.json", "RV_CityInterior2.json", "RV_CityApartmentInterior.json", "RV_CityPark.json", "FA_objects.json", "RV_Mall.json"],
            replace: ["RV_CityExterior_sun.json", "RV_CityExterior_2_sun.json", "RV_City_cars.json", "FA_SUNSET_OBJECTS.json", "RV_CityInterior_sun.json", "RV_CityInterior2_sun.json", "RV_CityApartmentInterior_sun.json", "RV_CityPark_sun.json", "FA_objects_sun.json", "RV_mall_sun.json"]
        },

        "night" : {

            // currently unused, maybe for later...?? he he 
            original: ["FA_OUTSIDE_OBJECTS.json", "FA_OUTSIDE_BIGHOUSES.json"],
            replace: ["FA_objects_new.json", "FA_UpperHouses_new.json"]

        }
    }

}   

function gettime(_input){

    // input is the game variable value
    if (_input == 13) {return "evening"}
    
}








// DO NOT EDIT BEYOND THIS!!



if(!!Utils.isOptionValid("test")) {




    DataManager.loadTiledMapData = function (mapId) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', "./maps/Map" + mapId + ".json");
        xhr.overrideMimeType('application/json');

        // on success callback
        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200 || xhr.responseText !== "") {
                    DataManager._tempTiledData = JSON.parse(xhr.responseText);
                }
                DataManager.loadTilesetData(mapId);
                DataManager._tiledLoaded = true;
            }
        };

        // set data to null and send request
        this.unloadTiledMapData();
        xhr.send();
    };

    DataManager.loadTilesetData = function (mapId) {
        var _iteratorNormalCompletion = true;
        var _didIteratorError = false;
        var _iteratorError = undefined;

        try {
            var _loop = function _loop() {
                var tileset = _step.value;

                if (!tileset.source) {
                    return "continue";
                }

                if(Utils.isOptionValid("test")) {
                    DataManager._tilesetToLoad++;
                    var filename = tileset.source.replace(/^.*[\\\/]/, '');
                    var xhr = new XMLHttpRequest();

                
                    // STEP ONE: Figure out what set we're in

                    currentset = 0;

                    if (citySet.contains(mapId)){

                        currentset = "citySet"



                    } else {

                        currentset = 0;
                    }
                    if (swapperdata.hasOwnProperty(currentset) && swapperdata[currentset].hasOwnProperty(gettime($gameVariables.value(1513)))) {
                        if (swapperdata[currentset][gettime($gameVariables.value(1513))].original.contains(filename))
                        {
                            _index = swapperdata[currentset][gettime($gameVariables.value(1513))].original.indexOf(filename)
                            filename = swapperdata[currentset][gettime($gameVariables.value(1513))].replace[_index]
                        }
                    }
                

                    console.log(currentset)
                    /*
                    if (swapperdata.hasOwnProperty(mapId) && swapperdata[mapId].hasOwnProperty(gettime($gameVariables.value(1513)))) {

                        if (swapperdata[mapId][gettime($gameVariables.value(1513))].original.contains(filename))
                        {
                            _index = swapperdata[mapId][gettime($gameVariables.value(1513))].original.indexOf(filename)
                            filename = swapperdata[mapId][gettime($gameVariables.value(1513))].replace[_index]
                        }
                    }
                    */


                    xhr.open('GET', "./maps/" + filename);
                    xhr.overrideMimeType('application/json');

                    xhr.onreadystatechange = function () {
                        if (xhr.readyState === 4) {
                            if (xhr.status === 200 || xhr.responseText !== "") {
                                Object.assign(tileset, JSON.parse(xhr.responseText));
                            }
                            DataManager._tilesetToLoad--;
                        }
                    };

                    xhr.send();					
                }
                else {
                    DataManager._tilesetToLoad++;
                    var filename = tileset.source.replace(/^.*[\\\/]/, '');
                    const path = require('path');
                    const fs = require('fs');
                    var base = path.dirname(process.mainModule.filename);

                    if (swapperdata.hasOwnProperty(mapId) && swapperdata[mapId].hasOwnProperty(gettime($gameVariables.value(1513)))) {

                        if (swapperdata[mapId][gettime($gameVariables.value(1513))].original.contains(filename))
                        {
                            _index = swapperdata[mapId][gettime($gameVariables.value(1513))].original.indexOf(filename)
                            filename = swapperdata[mapId][gettime($gameVariables.value(1513))].replace[_index]
                        }
                    }

                    filename = filename.replace(".json", ".AUBREY")
                    fs.readFile(base + "/maps/" + filename, (err, data) => {
                        if(err) {throw new Error(err)}
                        data = Encryption.decrypt(data);
                        Object.assign(tileset,JSON.parse(data.toString()))
                        DataManager._tilesetToLoad--;
                    });

                }
            };

            for (var _iterator = DataManager._tempTiledData.tilesets[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var _ret = _loop();

                if (_ret === "continue") continue;
            }
        } catch (err) {
            _didIteratorError = true;
            _iteratorError = err;
        } finally {
            try {
                if (!_iteratorNormalCompletion && _iterator.return) {
                    _iterator.return();
                }
            } finally {
                if (_didIteratorError) {
                    throw _iteratorError;
                }
            }
        }
    };
} else {


/// !!!! REAL GAME

DataManager = class extends DataManager {

    static loadDatabase() {
        if(!!Utils.isOptionValid("test")) {return super.loadDatabase();}

        const path = require('path');
        const fs = require('fs');
        const yaml = require('./js/libs/js-yaml-master')  
        var base = path.dirname(process.mainModule.filename);
        if(window['$externalNotesData'] === undefined) {
            let noteBuffer = fs.readFileSync(base + '/data/Notes.PLUTO');
            noteBuffer = Encryption.decrypt(noteBuffer);
            window['$externalNotesData'] = yaml.safeLoad(noteBuffer.toString());
        }

        if(window["$dataQuests"] === undefined) {
            let questBuffer = fs.readFileSync(base + '/data/Quests.PLUTO');
            questBuffer = Encryption.decrypt(questBuffer);
            window["$dataQuests"] = yaml.safeLoad(questBuffer.toString());
        }
        for (var i = 0; i < this._databaseFiles.length; i++) {
            var name = this._databaseFiles[i].name;
            var src = this._databaseFiles[i].src.replace(".json", ".KEL");
            this.loadDataFile(name, src);
        }		
    }

    static loadDataFile(name, src) {
        if(!!Utils.isOptionValid("test")) {return super.loadDataFile(name, src);}
        const path = require('path');
        const fs = require('fs');
        var base = path.dirname(process.mainModule.filename);
        fs.readFile(base + "/data/" + src, (err, buffer) => {
            if(err) {throw new Error(err)}
            let decrypt = Encryption.decrypt(buffer);
            window[name] = JSON.parse(decrypt.toString());
            DataManager.onLoad(window[name]);
        });

    }

    static loadMapData(mapId) {
        if(!!Utils.isOptionValid("test")) {return super.loadMapData(mapId);}
        const path = require('path');
        const fs = require('fs');
        var base = path.dirname(process.mainModule.filename);
        if(mapId > 0) {
            let filename = 'Map%1.KEL'.format(mapId.padZero(3));
            this._mapLoader = false;
            window["$dataMap"] = null;
            Graphics.startLoading();
            fs.readFile(base + "/data/" + filename, (err, buffer) => {
                if(!!err) {
                    Graphics.printLoadingError(base + "/data/" + filename);
                    SceneManager.stop();
                }
                let decrypt = Encryption.decrypt(buffer);
                window["$dataMap"] = JSON.parse(decrypt.toString());
                DataManager.onLoad(window["$dataMap"])
                Graphics.endLoading();
                this._mapLoader = true;
            })
            this.loadTiledMapData(mapId)
        }
        else {
            this.makeEmptyMap();
            this.unloadTiledMapData();
        }
    }

    static loadTiledMapData(mapId) {
        if(!!Utils.isOptionValid("test")) {return super.loadTiledMapData(mapId);}
        const path = require('path');
        const fs = require('fs');
        var base = path.dirname(process.mainModule.filename);
        let mapName = `/maps/map${mapId}.AUBREY`;
        this.unloadTiledMapData();
        fs.readFile(base + mapName, (err, buffer) => {
            if(!!err) {
                console.error(err)
                Graphics.printLoadingError(base + mapName);
                SceneManager.stop();
            }
            let decrypt = Encryption.decrypt(buffer);
            DataManager._tempTiledData = JSON.parse(decrypt.toString());
            DataManager.loadTilesetData(mapId);
            DataManager._tiledLoaded = true;
        })
    }

    // Compatibility with YEP Call Event

    static loadCallMapData(mapId) {
        if(!!Utils.isOptionValid("test")) {return super.loadCallMapData(mapId);}
        if(mapId > 0) {
            let filename = 'Map%1.KEL'.format(mapId.padZero(3));
            this.loadDataFile("$callEventMap", filename);
        }
        else {
            $callEventMap = {};
            $callEventMap.data = [];
            $callEventMap.events = [];
            $callEventMap.width = 100;
            $callEventMap.height = 100;
            $callEventMap.scrollType = 3;			
        }
    }
}


/*
DataManager.loadTiledMapData = function (mapId) {
    
    var xhr = new XMLHttpRequest();
    xhr.open('GET', "./maps/Map" + mapId + ".json");
    xhr.overrideMimeType('application/json');

    // on success callback
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200 || xhr.responseText !== "") {
                DataManager._tempTiledData = JSON.parse(xhr.responseText);
            }
            DataManager.loadTilesetData(mapId);
            DataManager._tiledLoaded = true;
        }
    };

    // set data to null and send request
    this.unloadTiledMapData();
    xhr.send();
};*/

DataManager.loadTilesetData = function (mapId) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        var _loop = function _loop() {
            var tileset = _step.value;

            if (!tileset.source) {
                return "continue";
            }

            if(Utils.isOptionValid("test")) {
                DataManager._tilesetToLoad++;
                var filename = tileset.source.replace(/^.*[\\\/]/, '');
                var xhr = new XMLHttpRequest();

                // STEP ONE: Figure out what set we're in

                currentset = 0;

                if (citySet.contains(mapId)){

                    currentset = "citySet"
                } else {

                    currentset = 0;
                }
                if (swapperdata.hasOwnProperty(currentset) && swapperdata[currentset].hasOwnProperty(gettime($gameVariables.value(1513)))) {
                    if (swapperdata[currentset][gettime($gameVariables.value(1513))].original.contains(filename))
                    {
                        _index = swapperdata[currentset][gettime($gameVariables.value(1513))].original.indexOf(filename)
                        filename = swapperdata[currentset][gettime($gameVariables.value(1513))].replace[_index]
                    }
                }
              

                console.log(currentset)


                xhr.open('GET', "./maps/" + filename);
                xhr.overrideMimeType('application/json');

                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200 || xhr.responseText !== "") {
                            Object.assign(tileset, JSON.parse(xhr.responseText));
                        }
                        DataManager._tilesetToLoad--;
                    }
                };

                xhr.send();					
            }

            // !!!

            else {
                DataManager._tilesetToLoad++;
                var filename = tileset.source.replace(/^.*[\\\/]/, '');
                const path = require('path');
                const fs = require('fs');
                var base = path.dirname(process.mainModule.filename);

                currentset = 0;

                if (citySet.contains(mapId)){

                    currentset = "citySet"
                } else {

                    currentset = 0;
                }

                //console.log(swapperdata[currentset][gettime($gameVariables.value(1513))].original)
                console.log($gameMap._mapId)
                console.log(mapId)

                if (swapperdata.hasOwnProperty(currentset) && swapperdata[currentset].hasOwnProperty(gettime($gameVariables.value(1513)))) {
                    if (swapperdata[currentset][gettime($gameVariables.value(1513))].original.contains(filename))
                    {
                        
                        _index = swapperdata[currentset][gettime($gameVariables.value(1513))].original.indexOf(filename)
                        filename = swapperdata[currentset][gettime($gameVariables.value(1513))].replace[_index]
                        
                    }
                }
                


                filename = filename.replace(".json", ".AUBREY")
                fs.readFile(base + "/maps/" + filename, (err, data) => {
                    if(err) {throw new Error(err)}
                    data = Encryption.decrypt(data);
                    Object.assign(tileset,JSON.parse(data.toString()))
                    DataManager._tilesetToLoad--;
                });
                console.log(filename)
            }
        };

        for (var _iterator = DataManager._tempTiledData.tilesets[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var _ret = _loop();

            if (_ret === "continue") continue;
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }
};
}
