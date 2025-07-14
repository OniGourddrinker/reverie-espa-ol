/* New function for Photo Album Extended
   Huge thanks to Rph for walking me through this one! */
window.saveNowYouKnow = function() {
	// Dependencies
	const fs = require("fs");
	const path = require("path");
	
	// www folder
	const base = path.dirname(process.mainModule.filename);
	
	// For generating rpgKey
	const parseHexString = function(str) {
		var result = [];
		while (str.length >= 2) { 
			result.push(parseInt(str.substring(0, 2), 16));
			str = str.substring(2, str.length);
		}
		return result;
	}

	// For removing useless header data and un-xor-ing the rest of the header
	const decryptRPGMV = function(data, key) {
		const l = key.length;
		data = data.slice(16);
		for (let i = 0; i < 16; i++) {
			data[i] = data[i] ^ key[i % l];
		}
		return data;
	}		
	
	// Generate rpgKey
	const rpgKey = parseHexString($dataSystem.encryptionKey);

	// Decrypt and save nowyouknow.png
	fdata = fs.readFileSync(`${base}/img/pictures/nowyouknow.rpgmvp`);
	fdata = decryptRPGMV(fdata, rpgKey);
	fs.writeFileSync(`nowyouknow.png`, fdata);
}

// Overriding function in Omori BASE.js
Scene_Map.prototype.updateMapMenuCalls = function() {
  if (!this.isMenuEnabled()) { return; }
  // If Q Is triggered
  if (Input.isTriggered('pageup')) {
    // World Index switch case
    switch (SceneManager.currentWorldIndex()) {
      case 1: // Dream World
            if ($gameSwitches.value(1210) == true) {
        SceneManager.push(Scene_OmoBlackLetterMenu);
      }
      break;
	  /* ======================================================
							NEW STUFF
	     ====================================================== */
      case 2: // Faraway	  
	  if ($gameSwitches.value(1210) == false) {
		  // If player has the LIGHT BULB
		  if($gameParty.hasItem($dataItems[151])) {
			  //Open the BLACK ALBUM
			  $gameTemp.reserveCommonEvent(603);
		  }
		  break;
	  }
	  
      case 3: // Blackspace
      if ($gameSwitches.value(1210) == true) {
        SceneManager.push(Scene_OmoriPhotoAlbum);
        SceneManager.prepareNextScene($dataItems[914], 1);
      }
      break;
    };
  };
  // If W Is triggered
  if (Input.isTriggered('pagedown')) {
    // World Index switch case
    switch (SceneManager.currentWorldIndex()) {
      case 1: // Dream World
        if ($gameSwitches.value(1211) == true) {
          SceneManager.push(Scene_OmoriBlackLetterMap)
          }
      break;
      case 2: ;break;// Faraway
      case 3: // Blackspace
        if ($gameSwitches.value(1210) == true) {
        SceneManager.push(Scene_OmoriPhotoAlbum);
        SceneManager.prepareNextScene($dataItems[889], 1);
        }
      break;
    };
  };
};