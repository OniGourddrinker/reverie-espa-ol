 /*:
 * @plugindesc v1.0.0 Allows multiplicative X params
 * @author Draught, ReynStahl
 * 
 * @help
 * <multiply xparam TYPE: xx.xx%>
 * 
 * Example:
 * <multiply xparam hit: 50%>
 */
{
    const PI_XPARAM = Symbol('PI_XPARAM')

    let old_xparam = Game_BattlerBase.prototype.xparam
    Game_BattlerBase.prototype.xparam = function (xparamId) {
        let value = old_xparam.call(this, xparamId)
        return value * this.traitsPi(PI_XPARAM, xparamId)
    }

    let traitDict = new Map([
      ['hit', 0], // hit rate
      ['eva', 1], // evasion rate
      ['cri', 2], // critical rate
      ['cev', 3], // critical evasion
      ['mev', 4], // magic evasion
      ['mrf', 5], // magic reflection
      ['cnt', 6], // counter rate
      ['hrg', 7], // hp regen
      ['mrg', 8], // mp regen
      ['trg', 9], // tp regen
    ])

    function processXparamTags(dataObject) {
        let note = /<multiply xparam (\w+):[ ]?(\d+(?:\.\d+)?)(%)?>/i
        dataObject.forEach((item) => {
            if (!item) { return }
            let notedata = item.note.split(/[\r\n]+/);
            notedata.forEach((line) => {
                if (line.match(note)) {
                    let paramName = RegExp.$1
                    let dataId = traitDict.get(paramName)
                    if (dataId === null) { return }
                    let value = parseFloat(RegExp.$2)
                    let percent = RegExp.$3
                    value = percent ? value / 100 : value
                    item.traits.push({ code: PI_XPARAM, dataId, value })
                }
            })
        })
    }

    let old_isDatabaseLoaded = DataManager.isDatabaseLoaded
    DataManager.isDatabaseLoaded = function () {
        if (!old_isDatabaseLoaded.call(this)) { return false }
        processXparamTags($dataActors)
        processXparamTags($dataClasses)
        processXparamTags($dataEnemies)
        processXparamTags($dataArmors)
        processXparamTags($dataWeapons)
        processXparamTags($dataStates)
        return true
    }
}
  