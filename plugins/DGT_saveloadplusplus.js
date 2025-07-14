// make the loading less bad
{
  let old_loadglobalinfo = DataManager.loadGlobalInfo
  DataManager.loadGlobalInfo = function() {
    if (!this._cachedGlobalInfo) {
      this._cachedGlobalInfo = old_loadglobalinfo.call(this)
    }
    return this._cachedGlobalInfo
  }
  DataManager.reloadCachedGlobalInfo = function() { //currently unused
    this._cachedGlobalInfo = old_loadglobalinfo.call(this)
  }
}
