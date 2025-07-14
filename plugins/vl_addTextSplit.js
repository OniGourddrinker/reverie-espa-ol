BattleManager.addTextSplit = function(text) {
	const maxTextLength = 388;
	let lastIndex = text.lastIndexOf(" ");
	if (SceneManager._scene._logWindow._backBitmap.measureTextWidth(text, true) < maxTextLength || lastIndex < 0) {
		SceneManager._scene._logWindow.push("addText", text, 16)
		//break;
	} else {
		let textBeginning = text.slice(0, lastIndex)
		let textEnding = text.slice(lastIndex + 1)
		for (var i = text.length; i > 0; i--) {
			if (text.charAt(i) != " ") { continue }
			if (SceneManager._scene._logWindow._backBitmap.measureTextWidth(textBeginning, true) > maxTextLength) {
				textBeginning = text.slice(0, i)
				textEnding = text.slice(textBeginning.length + 1)
			}
		}
		SceneManager._scene._logWindow.push("addText", textBeginning, 16)
		SceneManager._scene._logWindow.push("addText", textEnding, 16)
	}
}