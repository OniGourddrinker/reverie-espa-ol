(function() {
    //window.ondragover = function() { debugger; }
    const fs = require('fs');
    const path = require("path");
	const base = path.dirname(process.mainModule.filename);

    document.body.ondragover = function(ev) { ev.preventDefault(); }
    document.body.ondrop = function(ev) { 
        ev.preventDefault(); 
        if (ev.dataTransfer.files && ev.dataTransfer.files.length > 0) {
            let reader = new FileReader();
            reader.readAsText(ev.dataTransfer.files[0], "UTF-8");
            reader.onload = function(data) {
                try {
                    let fileData = LZString.decompressFromBase64(data.target.result);
                    if (!fileData) throw new Error();

                    if (confirm("Load the file dragged over the game?")) {
                        fs.writeFileSync(`${base}/save/file655361337.rpgsave`, data.target.result);
                        let old = DataManager.isThisGameFile;
                        DataManager.isThisGameFile = function() { return true; }

                        DataManager.loadGame(655361337);
                        DataManager.isThisGameFile = old;

                        SceneManager.goto(Scene_OmoriFile);

                        setTimeout(function() {
                            SceneManager._scene.fadeOutAll();
                            setTimeout(function() { 
                                SoundManager.playLoad();
                                setTimeout(function() {
                                    if ($gameSystem.versionId() !== $dataSystem.versionId) {
                                        $gamePlayer.reserveTransfer($gameMap.mapId(), $gamePlayer.x, $gamePlayer.y);
                                        $gamePlayer.requestMapReload();
                                    }
                                    setTimeout(function() {
                                        SceneManager.goto(Scene_Map);
                                    }, 50);
                                }, 40);
                            }, 10);

                            fs.unlinkSync(`${base}/save/file655361337.rpgsave`);
                        }, 10);
                    }
                } catch(e) {
                    alert("Not a valid save file");
                }
            }
            reader.onerror = function() {
                alert("Failed to load dropped save.");
            }
        }
    }
})();