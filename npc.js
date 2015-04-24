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

  if (facing_tile == this.position) {
    next_move = surrounding_halls[i];
  }
  else if (facing_tile.is_hall()) {
    if (surrounding_halls.length > 2) {
      next_move = _.sample(_.reject(surrounding_halls, function(t) {
        if (this.last_position.x == t.x && this.last_position.y == t.y) {
          return t;
        }
      }, this));
      next_move = surrounding_halls[i];
    } else {
    //if the tile in front of the bot is a hall, return it
    next_move = {x: facing_tile.x, y: facing_tile.y};
    }
  }
  else {
    //else choose a random surrounding hall and update its direction
    next_move = surrounding_halls[i];
  }

  this.direction = this.get_direction(next_move);
  this.last_position = this.position;
  this.position = next_move;
  return next_move;

  //else if the tile in the direction of the start is a hall, return it
}
exports.npcObj = npcObj;
