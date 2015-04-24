var maze_gen = require('./maze_gen.js');

function npcObj(settings) {
  this.position = settings.position;
  this.direction = 'left';
  this.id = settings.id;
}

npcObj.prototype.get_direction = function(tile) {
  if (this.position.x - tile.x == 1) {
    return 'left';
  } else if (this.position.x - tile.x == -1) {
    return 'right';
  } else if (this.position.y - tile.x == 1) {
    return 'up';
  } else if (this.position.y - tile.x == -1) {
    return 'down';
  } else {return 'left'}
}

npcObj.prototype.get_next_move = function(maze) {
  var surrounding_halls = maze.surrounding_halls(this.position);
  var i = Math.floor(Math.random() * surrounding_halls.length);
  var next_move = surrounding_halls[i];
  var facing_tile = maze.get_adjacent_tile(this.position, this.direction);

  //if the tile in front of the bot is a hall, return it
  if (facing_tile.is_hall()) {
    next_move = {x: facing_tile.x, y: facing_tile.y};
    this.position = next_move;
    return next_move;
  //else choose a random surrounding hall and update its direction
  } else {
    this.direction = this.get_direction(next_move);
    this.position = next_move;
    return next_move;
  }
  return next_move;

  //else if the tile in the direction of the start is a hall, return it
}
exports.npcObj = npcObj;
