var _ = require('underscore');
var maze_gen = require('./maze_gen.js');

function npcObj(settings) {
  this.position = settings.position;
  this.direction = 'left';
  this.last_position = settings.position;
  this.id = settings.id;
}

npcObj.prototype.get_direction = function(tile) {
  if (this.position.x - tile.x > 0) {
    return 'left';
  } else if (this.position.x - tile.x < 0) {
    return 'right';
  } else if (this.position.y - tile.y > 0) {
    return 'up';
  } else if (this.position.y - tile.y < 0) {
    return 'down';
  } else {return this.direction}
}

npcObj.prototype.get_next_move = function(maze) {
  var surrounding_halls = maze.surrounding_halls(this.position);
  var i = Math.floor(Math.random() * surrounding_halls.length);
  var facing_tile = maze.get_facing_tile(this.position, this.direction);
  var next_move;

  if (surrounding_halls.length > 2) {
    next_move = _.sample(_.reject(surrounding_halls, function(t) {
        return this.last_position.same_coords(t);
    }, this));
  }
  else if (facing_tile != this.position && facing_tile.val == 1) {
    next_move = facing_tile;
  }
  else {
    next_move = surrounding_halls[i];
  }
  this.direction = this.get_direction(next_move);
  this.last_position = this.position;
  this.position = next_move;
  return next_move;
}
exports.npcObj = npcObj;
