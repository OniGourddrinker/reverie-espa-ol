/*:
 * @plugindesc Falling Star enemy's custom encountry
 * @author surrealegg
 *
 * @param waitTime
 * @desc Wait time in seconds
 * @default 3
 *
 * @param playerRange
 * @desc Range for entities to detect the player
 * @default 10
 *
 * @param despawnTime
 * @desc How long should falling star stay
 * @default 4
 *
 * @param mapId
 * @desc Map id of the entity
 * @default 3
 *
 * @param eventId
 * @desc Event id
 * @default 104
 *
 */

var Imported = Imported || {};
Imported.ReverieFallingStar = true;

var ReverieFallingStar = {
  parameters: PluginManager.parameters("Reverie_FallingStar"),
  collided: {},
  fadingEntities: {},
  someoneFalling: false,
  shadowCount: 0
};

ReverieFallingStar.waitTime =
  parseInt(ReverieFallingStar.parameters["waitTime"]) || 3;

ReverieFallingStar.playerRange =
  parseInt(ReverieFallingStar.parameters["playerRange"]) || 10;

ReverieFallingStar.despawnTime =
  parseInt(ReverieFallingStar.parameters["despawnTime"]) || 4;

ReverieFallingStar.mapId =
  parseInt(ReverieFallingStar.parameters["mapId"]) || 3;

ReverieFallingStar.eventId =
  parseInt(ReverieFallingStar.parameters["eventId"]) || 3;

ReverieFallingStar.hitsPlayer = function (eventId) {
  const event = $gameMap._events[eventId];
  if (!event) return false;

  return $gamePlayer.pos(event.x, event.y);
};

Game_Event.prototype.isNearThePlayer = function (range = 20) {
  var sx = Math.abs(this.deltaXFrom($gamePlayer.x));
  var sy = Math.abs(this.deltaYFrom($gamePlayer.y));
  return sx + sy < range;
};

ReverieFallingStar.addFadingEntity = function (entityId) {
  this.fadingEntities[entityId] = new Date().getTime();
};

ReverieFallingStar.handleFadingEntities = function () {
  if (Object.keys(this.fadingEntities).length === 0) return;
  const now = new Date().getTime();
  for (const eventId in this.fadingEntities)
    if ((now - this.fadingEntities[eventId]) / 1000 >= this.despawnTime) {
      if ($gameMap.event(eventId)) Yanfly.DespawnEventID(eventId);
      delete this.fadingEntities[eventId];
    }
};

ReverieFallingStar.handleCollision = function (eventId) {
  const event = $gameMap._events[eventId];
  if (!event) {
    return false;
  }

  const collided = event.isNearThePlayer(this.playerRange);
  const hasKey = Object.keys(this.collided).includes(eventId.toString());
  const now = new Date().getTime();

  if (!hasKey && collided) {
    this.collided[eventId] = now;
    return false;
  }

  if (hasKey && !collided) {
    delete this.collided[eventId];
    return false;
  }

  if (
    !this.someoneFalling &&
    (now - this.collided[eventId]) / 1000 >= this.waitTime
  ) {
    delete this.collided[eventId];
    this.someoneFalling = true;
    Yanfly.SpawnEventAt(this.mapId, this.eventId, event.x, event.y - 8, false);
    this.shadowCount -= 1;
    return true;
  }

  return false;
};

ReverieFallingStar.obtainRegionCoords = function (regionId) {
  const coords = [];
  for (let x = 0; x < $dataMap.width; ++x)
    for (let y = 0; y < $dataMap.height; ++y)
      if (
        $gameMap.regionId(x, y) === regionId &&
        $gameMap.eventsXy(x, y).length === 0 &&
        this.isInsideScreen(x, y)
      )
        coords.push([x, y]);
  return coords.sort(() => Math.random() - 0.5);
};

ReverieFallingStar.isInsideScreen = function (x, y) {
  const gw = Graphics.width;
  const gh = Graphics.height;
  const tw = $gameMap.tileWidth();
  const th = $gameMap.tileHeight();
  const px = $gameMap.adjustX(x) * tw + tw / 2 - gw / 2;
  const py = $gameMap.adjustY(y) * th + th / 2 - gh / 2;
  return px >= -gw && px <= gw && py >= -gh && py <= gh;
};

ReverieFallingStar.spawnEntities = function (mapId, eventId, amount, regionId) {
  const coords = ReverieFallingStar.obtainRegionCoords(regionId);
  for (let i = 0; i < amount && i < coords.length; ++i) {
    Yanfly.SpawnEventAt(mapId, eventId, coords[i][0], coords[i][1], false);
    this.shadowCount += 1;
  }
};
