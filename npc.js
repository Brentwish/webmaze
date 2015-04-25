var _ = require('underscore');
var maze_gen = require('./maze_gen.js');

function npcObj(settings) {
  this.strategy = settings.strategy;
  this.name = settings.name;
  this.hit_box = settings.hit_box;
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
  return this.npc_strategies[this.strategy](maze, this);
}

npcObj.prototype.update_position = function(next_move) {
  this.direction = this.get_direction(next_move);
  this.last_position = this.position;
  this.position = next_move;
}

npcObj.prototype.npc_strategies = {
  "not back": function(maze, npc) {
    var surrounding_halls = maze.surrounding_halls(npc.position);
    var facing_tile = maze.get_facing_tile(npc.position, npc.direction);
    var next_move;

    if (surrounding_halls.length > 2) {
      next_move = _.sample(_.reject(surrounding_halls, function(t) {
          return this.last_position.same_coords(t);
      }, npc));
    }
    else if (facing_tile != npc.position && facing_tile.val == 1) {
      next_move = facing_tile;
    }
    else if (surrounding_halls.length == 2 && facing_tile != npc.position && facing_tile.val == 0) {
      next_move = _.sample(_.reject(surrounding_halls, function(t) {
          return this.last_position.same_coords(t);
      }, npc));
    }
    else {
      next_move = _.sample(surrounding_halls);
    }

    return next_move;
  },
  "always right": function(maze, npc) {
    var dir_order = ["right", "up", "left", "down"];
    var start_dir_index = dir_order.indexOf(maze.get_relative_right(npc.direction));
    var next_move = null;
    for (i = 0; i < dir_order.length; i++) {
      next_move = maze.get_tile_at_dir(npc.position, dir_order[start_dir_index % dir_order.length]);
      start_dir_index++;
      if (!_.isNull(next_move) && next_move.is_wall()) {
        break;
      }
    }
    if (_.isNull(next_move)) {
      next_move = npc.position;
    }
    return next_move;
  }
}

exports.npcObj = npcObj;
