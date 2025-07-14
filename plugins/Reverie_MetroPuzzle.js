/*:
 * @plugindesc Metro Puzzle for Reverie
 * @author surrealegg
 *
 * @param spriteOffsetX
 * @desc X Offset for the crate
 * @default 0
 *
 * @param spriteOffsetY
 * @desc Y Offset for the crate
 * @default 0
 * 
 * @param crateGatorMaxRange
 * @desc Maximum range for Emergency Radio
 * @default 12
 */

var Imported = Imported || {};
Imported.ReverieMetroPuzzle = true;

var ReverieMetroPuzzle = {
  isElevated: false,
  finished: false,
  collidedEventId: -1,
  ladderPositions: [],
  gatorPositions: [],
  gatePositions: [],
  blockerPositions: [],
  topPositions: [],
  savedCollision: [],
  parameters: PluginManager.parameters("Reverie_MetroPuzzle"),
  spriteOffsetX: 0,
  spriteOffsetY: 0,
  respawnPositions: [],
  finishPositions: [],
  finishedPositions: [],
};

ReverieMetroPuzzle.Crate = class {
  /**
   * @param {number} eventId
   * @returns {ReverieMetroPuzzle.Crate}
   */
  static fromEventId(eventId) {
    const event = $gameMap.event(eventId);
    return event ? this.from(event) : null;
  }

  /**
   * @param {Game_Event} event
   * @returns {ReverieMetroPuzzle.Crate}
   */
  static from(event) {
    return this.crates[this.crates.push(new this(event))];
  }

  /**
   * @param {number} id
   * @returns {number}
   */
  static indexOf(id) {
    for (let i = 0; i < this.crates.length; ++i) {
      if (this.crates[i].id === id) {
        return i;
      }
    }
    return -1;
  }

  /**
   * @param {number} position
   * @returns {boolean}
   */
  static containsInPosition(position) {
    for (const crate of this.crates) {
      if (crate.position === position) {
        return true;
      }
    }
    return false;
  }

  /**
   * @param {number} eventId
   */
  static enable(eventId) {
    const indexOf = this.indexOf(eventId);
    if (indexOf > -1) {
      this.crates[indexOf].setEnabled(true);
    }
  }

  /**
   * @param {number} eventId
   */
  static disable(eventId) {
    const indexOf = ReverieMetroPuzzle.Crate.indexOf(eventId);
    if (indexOf > -1) {
      this.crates[indexOf].setEnabled(false);
    }
  }

  /**
   * @param {number} value
   */
  static updateAllCollisions(value = 1) {
    for (const crate of this.crates) {
      if (crate.enabled) {
        crate.updateCollision(value);
      }
    }
  }

  static resetAll() {
    for (const crate of this.crates) {
      if (crate.enabled) {
        crate.reset();
      }
    }
  }

  static saveAll() {
    console.log("Metro Crate did saveAll()")
    for (const crate of this.crates) {
      if (crate.enabled) {
        crate.save();
      }
    }
  }

  /**
   * @param {Game_Event} event
   */
  constructor(event) {
    this.enabled = true;
    this.initialX = event.x;
    this.initialY = event.y;
    this.id = event._eventId;
    this.event = event;
    this.updateCollision();
  }

  reset() {
    this.updateCollision(0);
    $gameTemp._bypassLoadLocation = true;
    this.event.locate(this.initialX, this.initialY);
    $gameTemp._bypassLoadLocation = undefined;
    this.updateCollision();
  }

  save() {
    this.initialX = this.x;
    this.initialY = this.y;
  }

  setEnabled(value) {
    this.enabled = value;
    this.updateCollision(this.enabled ? 1 : 0);
  }

  updateCollision(value = 1) {
    $gameMap._collisionMap[0][this.position] = value;
  }

  get x() {
    return this.event.x;
  }

  get y() {
    return this.event.y;
  }

  get position() {
    return this.event.y * $gameMap.width() + this.event.x;
  }
};

ReverieMetroPuzzle.Crate.crates = [];

const REVERIE_METRO_PUZZLE_ELEVATED = 38;
const REVERIE_METRO_PUZZLE_RESPAWN_FORMAT =
  /<[ ]*ReverieMetroPuzzleRespawn[ ]*:[ ]*(\d+)[ ]*>/m;

ReverieMetroPuzzle.spriteOffsetX =
  parseInt(ReverieMetroPuzzle.parameters["spriteOffsetX"]) || 0;
ReverieMetroPuzzle.spriteOffsetY =
  parseInt(ReverieMetroPuzzle.parameters["spriteOffsetY"]) || 0;
ReverieMetroPuzzle.crateGatorMaxRange =
  parseInt(ReverieMetroPuzzle.parameters["crateGatorMaxRange"]) || 12;

/**
 * @param {boolean} value
 */
ReverieMetroPuzzle.setElevated = function (value) {
  this.isElevated = value;
  $gameSwitches.setValue(REVERIE_METRO_PUZZLE_ELEVATED, value);
  this.updateCollision();
};

ReverieMetroPuzzle.setCollided = function (value) {
  this.collidedEventId = value;
  this.updateCollision();
};

/**
 * @param {boolean} value
 */
ReverieMetroPuzzle.toggleElevated = function () {
  this.setElevated(!this.isElevated);
};

ReverieMetroPuzzle.setPosition = function (interpreter, value) {
  if (value === 0) {
    ReverieMetroPuzzle.Crate.disable(interpreter._eventId);
    return;
  }
  ReverieMetroPuzzle.Crate.enable(interpreter._eventId);
};

ReverieMetroPuzzle.findRespawnPositionById = function (id) {
  const width = $gameMap.width();
  for (const [x, y] of this.respawnPositions) {
    if (y * width + x === id) {
      return true;
    }
  }
  return false;
};

/**
 * @param {Game_Interpreter} interpreter
 */
ReverieMetroPuzzle.canMoveBlock = function (interpreter) {
  if (this.isElevated && this.collidedEventId === -1) {
    return false;
  }

  const event = $gameMap.event(interpreter._eventId);
  const sx = event.deltaXFrom($gamePlayer.x);
  const sy = event.deltaYFrom($gamePlayer.y);

  const position = (event.y + sy) * $gameMap.width() + (event.x + sx);
  return !this.topPositions.contains(position) &&
    !this.ladderPositions.contains(position) && $gameMap
      ._collisionMap[0][position] === 0 &&
    !this.gatePositions.contains(position) &&
    !this.blockerPositions.contains(position) &&
    !this.gatorPositions.contains(position) &&
    !this.findRespawnPositionById(position);
};

ReverieMetroPuzzle.updateCollision = function () {
  if (this.collidedEventId > -1) {
    $gameMap._collisionMap[0] = [...this.savedCollision];
    ReverieMetroPuzzle.Crate.updateAllCollisions();
    return;
  }

  if (this.isElevated) {
    $gameMap._collisionMap[0] = [];
    for (let i = 0; i < this.savedCollision.length; ++i) {
      $gameMap._collisionMap[0].push(
        Number(
          !this.ladderPositions.contains(i) &&
          !ReverieMetroPuzzle.Crate.containsInPosition(i) &&
          !this.topPositions.contains(i),
        ),
      );
    }
    return;
  }

  $gameMap._collisionMap[0] = [...this.savedCollision];
  ReverieMetroPuzzle.Crate.updateAllCollisions();
  this.topPositions.forEach((position) => {
    $gameMap._collisionMap[0][position] = 1;
  });
};

ReverieMetroPuzzle.updateLadder = function (eventId) {
  const event = $gameMap._events[eventId];
  if (!event) {
    return;
  }

  const collided = $gamePlayer.pos(event.x, event.y);
  if (collided && this.collidedEventId === -1) {
    const position = event.y * $gameMap.width() + event.x;
    if (
      !this.finishedPositions.contains(position) &&
      this.finishPositions.contains(position)
    ) {
      this.finished = true;
      this.Crate.saveAll();
      this.finishedPositions.push(position);
    }
    this.setCollided(eventId);
    return;
  }
  if (!collided && this.collidedEventId === eventId) {
    this.setCollided(-1);
    this.setElevated(this.isPlayerOnTop());
  }
};

ReverieMetroPuzzle.resetPuzzleIfNotFinished = function () {
  if (!this.finished) {
    this.Crate.resetAll();
  }
};

ReverieMetroPuzzle.isPlayerOnTop = function () {
  const playerPosition =
    ($gamePlayer.y + $gamePlayer._newY) * $gameMap.width() +
    ($gamePlayer.x + $gamePlayer._newX);
  return this.topPositions.contains(playerPosition);
};

ReverieMetroPuzzle.resetPuzzle = function () {
  if (this.respawnPositions.length === 0) {
    return;
  }

  const distances = this.respawnPositions.map((point) =>
    Math.sqrt(($gamePlayer.x - point[0]) ** 2 + ($gamePlayer.y - point[1]) ** 2)
  );
  const min = Math.min(...distances);
  const index = distances.indexOf(min);
  if (index === -1 || min > ReverieMetroPuzzle.crateGatorMaxRange) {
    return;
  }

  this.setElevated(false);
  this.Crate.resetAll();
  AudioManager.playSe({
    name: "SE_whirlpool copy",
    volume: 100,
    pitch: 100,
    pan: 0,
  });
  setTimeout(() => {
    $gamePlayer.reserveTransfer(
      $gameMap._mapId,
      this.respawnPositions[index][0],
      this.respawnPositions[index][1],
      this.respawnPositions[index][2],
      0,
    )
  }, 100);
};

ReverieMetroPuzzle.setInitialCrate = function (target) {
  target._spriteOffsetX = this.spriteOffsetX;
  target._spriteOffsetY = this.spriteOffsetY;
  this.Crate.from(target);
};

ReverieMetroPuzzle.isOnTop = function () {
  return this.isElevated || this.collidedEventId > -1;
};

ReverieMetroPuzzle.Game_Event_initialize = Game_Event.prototype.initialize;
Game_Event.prototype.initialize = function (mapId, eventId) {
  ReverieMetroPuzzle.Game_Event_initialize.call(this, mapId, eventId);

  const event = this.event();
  if (!event) {
    return;
  }

  const position = event.y * $gameMap.width() + event.x;

  if (event.note.indexOf("<ReverieMetroPuzzleLadder>") > -1) {
    if (event.note.indexOf("<ReverieMetroPuzzleFinish>") > -1) {
      ReverieMetroPuzzle.finishPositions.push(position);
    }
    ReverieMetroPuzzle.ladderPositions.push(position);
    return;
  }

  if (event.note.indexOf("<ReverieMetroPuzzleTop>") > -1) {
    ReverieMetroPuzzle.topPositions.push(position);
    return;
  }

  if (event.note.indexOf("<ReverieMetroPuzzleGator>") > -1) {
    ReverieMetroPuzzle.gatorPositions.push(position);
    return;
  }

  if (event.note.indexOf("<ReverieMetroPuzzleGate>") > -1) {
    ReverieMetroPuzzle.gatePositions.push(position);
    return;
  }

  if (event.note.indexOf("<ReverieMetroPuzzleBlocker>") > -1) {
    ReverieMetroPuzzle.blockerPositions.push(position);
    return;
  }

  const check = REVERIE_METRO_PUZZLE_RESPAWN_FORMAT.exec(event.note);
  if (check !== null && check.length >= 2) {
    ReverieMetroPuzzle.respawnPositions.push([
      event.x,
      event.y,
      parseInt(check[1]) || 2,
    ]);
    return;
  }
};

ReverieMetroPuzzle.Game_Map_setup = Game_Map.prototype.setup;
Game_Map.prototype.setup = function (mapId) {
  $gameSwitches.setValue(REVERIE_METRO_PUZZLE_ELEVATED, 0);
  ReverieMetroPuzzle.isElevated = false;
  ReverieMetroPuzzle.Crate.crates = [];
  ReverieMetroPuzzle.collidedEventId = -1;
  ReverieMetroPuzzle.gatePositions = [];
  ReverieMetroPuzzle.blockerPositions = [];
  ReverieMetroPuzzle.gatorPositions = [];
  ReverieMetroPuzzle.ladderPositions = [];
  ReverieMetroPuzzle.topPositions = [];
  ReverieMetroPuzzle.respawnPositions = [];
  ReverieMetroPuzzle.finishPositions = [];
  ReverieMetroPuzzle.finishedPositions = [];
  ReverieMetroPuzzle.Game_Map_setup.call(this, mapId);
  ReverieMetroPuzzle.savedCollision = [...$gameMap._collisionMap[0]];
  ReverieMetroPuzzle.finished = false;
  ReverieMetroPuzzle.updateCollision();
};

ReverieMetroPuzzle.Game_Event_setupPageSettings =
  Game_Event.prototype.setupPageSettings;
Game_Event.prototype.setupPageSettings = function () {
  ReverieMetroPuzzle.Game_Event_setupPageSettings.call(this);
  const event = this.event();
  if (
    event &&
    (event.note.indexOf("<ReverieMetroPuzzleTop>") > -1 ||
      event.note.indexOf("<ReverieMetroPuzzleLadder>") > -1)
  ) {
    this._spriteOffsetX = ReverieMetroPuzzle.spriteOffsetX;
    this._spriteOffsetY = ReverieMetroPuzzle.spriteOffsetY;
  }
};

ReverieMetroPuzzle.Game_Event_ScreenZ = Game_Event.prototype.screenZ;
Game_Event.prototype.screenZ = function () {
  const event = this.event();
  if (event) {
    if (event.note.indexOf("<ReverieMetroPuzzleCrate>") > -1 || 
    event.note.indexOf("<ReverieMetroPuzzleTop>") > -1 || 
    event.note.indexOf("<ReverieMetroPuzzleLadder>") > -1) 
    {
      return 2;
    }
    else if (event.note.indexOf("<ReverieMetroPuzzleBlocker>") > -1)
    {
      return 1;
    }
  } 
  return ReverieMetroPuzzle.Game_Event_ScreenZ.call(this);
};

ReverieMetroPuzzle.GameEventchaseConditions =
  Game_Event.prototype.chaseConditions;
Game_Event.prototype.chaseConditions = function (dis) {
  if (ReverieMetroPuzzle.isOnTop()) {
    return false;
  }
  return ReverieMetroPuzzle.GameEventchaseConditions.call(this, dis);
};

Game_Character.prototype.moveRandom = function () {
  if (ReverieMetroPuzzle.isOnTop()) {
    return;
  }
  var d = 2 + Math.randomInt(4) * 2;
  if (this.canPass(this.x, this.y, d)) {
    this.moveStraight(d);
  }
};

Game_Player.prototype.startMapEvent = function (x, y, triggers, normal) {
  if (!$gameMap.isEventRunning()) {
    if (ReverieMetroPuzzle.isOnTop()) {
      triggers = triggers.filter((value) => value !== 2 && value !== 1);
    }
    $gameMap.eventsXy(x, y).forEach(function (event) {
      if (event.isTriggerIn(triggers) && event.isNormalPriority() === normal) {
        event.start();
      }
    });
  }
};
