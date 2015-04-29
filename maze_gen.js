var _ = require('underscore');
var npc = require('./npc.js');
var game = require('./game.js');

function tileObj(x, y, val) {
  this.x = x;
  this.y = y;
  this.val = val;
  this.is_teleport_tile = false;
  this.teleport_partner = null;
  this.pair_id = null;
}

tileObj.prototype.is_hall = function() {
  return this.val == 1;
}

tileObj.prototype.is_wall = function() {
  return this.val == 0;
}

tileObj.prototype.same_coords = function(coords) {
  return this.x == coords.x && this.y == coords.y;
}

tileObj.prototype.toString = function() {
  return String(this.x) + "," + String(this.y);
}

function mazeObj(settings) {
  this.width = settings.width;
  this.height = settings.height;
  this.num_teleporters = settings.num_teleporters;
  this.teleport_tiles = [];
  this.maze = new Array();
  for (i = 0; i < this.height; i++) {
    this.maze[i] = new Array();
    for (j = 0; j < this.width; j++) {
      this.maze[i][j] = new tileObj(j, i, 0);
    }
  }
  if (_.isUndefined(settings.start)) {
    this.start = this.get_random_edge();
  } else {
    this.start = settings.start;
  }
  if (_.isUndefined(settings.end)) {
    this.end = this.get_random_edge();
    while (this.dist_between(this.end, this.start) < (this.width + this.height) / 2) {
      this.end = this.get_random_edge();
    }
  } else {
    this.end = settings.end;
  }
  this.generate();
}

mazeObj.prototype.dist_between = function(tile_a, tile_b) {
  return Math.abs(tile_a.x - tile_b.x) + Math.abs(tile_a.y - tile_b.y);
}

mazeObj.prototype.surrounding_tiles = function(tile) {
  var x = tile.x;
  var y = tile.y;
  var sur_tiles = [];
  if (x != 0)
    sur_tiles.push(this.maze[y][x - 1]);
  if (x != this.width - 1)
    sur_tiles.push(this.maze[y][x + 1]);
  if (y != 0)
    sur_tiles.push(this.maze[y - 1][x]);
  if (y != this.height - 1)
    sur_tiles.push(this.maze[y + 1][x]);
  return sur_tiles;
}

mazeObj.prototype.adjacent_tiles = function(tile) {
  var x = tile.x;
  var y = tile.y;
  var adj_tiles = this.surrounding_tiles(tile);
  if (x != 0 && y != 0)
    adj_tiles.push(this.tile_at(x - 1, y - 1));
  if (x != 0 && y != this.height - 1)
    adj_tiles.push(this.tile_at(x - 1, y + 1));
  if (x != this.width - 1 && y != 0)
    adj_tiles.push(this.tile_at(x + 1, y - 1));
  if (x != this.width - 1 && y != this.height - 1)
    adj_tiles.push(this.tile_at(x + 1, y + 1));
  return adj_tiles;
}

mazeObj.prototype.get_touching_count = function(tile) {
  return  _.reduce(this.surrounding_tiles(tile), function(m, t) {
    return m + t.val;
  }, 0);
}

mazeObj.prototype.surrounding_halls = function(tile) {
  return _.select(this.surrounding_tiles(tile), function(t) {
    return t.is_hall();
  });
}

mazeObj.prototype.surrounding_walls = function(tile) {
  return _.select(this.surrounding_tiles(tile), function(t) {
    return t.is_wall();
  });
}

mazeObj.prototype.set_of_all_tiles = function() {
  var all_tiles = new Set();
  for (x = 0; x < this.width; x++) {
    for (y = 0; y < this.height; y++) {
      all_tiles.add(this.maze[y][x]);
    }
  }
  return all_tiles;
}

mazeObj.prototype.get_facing_tile = function(position, direction) {
  if (direction == 'left') {
    if (position.x == 0) {
      return position;
    } else {
      return this.maze[position.y][position.x - 1];
    }
  } else if (direction == 'right') {
    if (position.x == this.width - 1) {
      return position;
    } else {
      return this.maze[position.y][position.x + 1];
    }
  } else if (direction == 'up') {
    if (position.y == 0) {
      return position;
    } else {
      return this.maze[position.y - 1][position.x];
    }
  } else if (direction == 'down') {
    if (position.y == this.height - 1) {
      return position;
    } else {
      return this.maze[position.y + 1][position.x];
    }
  }
}

mazeObj.prototype.all_halls = function() {
  var all_halls = [];
  _.each(this.maze, function(row) {
    _.each(row, function(tile) {
      if (tile.val == 1) {
        all_halls.push(tile);
      }
    });
  });
  return all_halls;
}

mazeObj.prototype.is_border_tile = function(tile) {
  return tile.x == this.width - 1 || tile.x == 0 || tile.y == this.height - 1 || tile.y == 0;
}

mazeObj.prototype.generate = function() {
  var exits = [this.end];
  Set.prototype.pop = function() {
    var i = Math.ceil((Math.random() * this.size));
    var iter = this.values();
    var val = null;
    for (j = 0; j < i; j++) {
      val = iter.next();
    }
    this.delete(val.value);
    return val.value;
  }

  var all_tiles = this.set_of_all_tiles();
  var garenteed_halls = [];
  _.each(exits, function(coord) {
    tile = this.maze[coord.y][coord.x];
    tile.val = 1;
    garenteed_halls.push(tile);
  }, this);
  var start_tile = this.maze[this.start.y][this.start.x];
  start_tile.val = 1;

  var working_tiles = new Set();
  _.each(_.reject(this.surrounding_tiles(start_tile), this.is_border_tile, this), function(t) {
    working_tiles.add(t);
  });

  while (working_tiles.size > 0) {
    var tile = working_tiles.pop();
    var tiles = this.surrounding_tiles(tile);
    var touching_count = _.reduce(tiles, function(m, t) {
      return m + t.val;
    }, 0);
    var edges = _.intersection(garenteed_halls, tiles);

    var has_touching_corners = false;
    var touching_tile = _.find(tiles, function(t) { return t.val == 1; });
    if (touching_count == 1 && !this.is_border_tile(touching_tile)) {
      var x_diff = tile.x - touching_tile.x;
      var y_diff = tile.y - touching_tile.y;
      if (y_diff == 0) {
        var corner_1 = this.maze[tile.y + 1][tile.x + x_diff];
        var corner_2 = this.maze[tile.y - 1][tile.x + x_diff];
      } else {
        var corner_1 = this.maze[tile.y + y_diff][tile.x + 1];
        var corner_2 = this.maze[tile.y + y_diff][tile.x - 1];
      }
      has_touching_corners = ((corner_1.val == 1 || corner_2.val == 1) &&
                              _.intersection(garenteed_halls, [corner_1, corner_2]).length == 0);
    }

    if (((touching_count == 1 && !has_touching_corners) || edges.length > 0) && !this.is_border_tile(tile)) {
      tile.val = 1;
      garenteed_halls = _.difference(garenteed_halls, edges);
      _.each(_.reject(tiles, this.is_border_tile, this), function(t) {
        if (all_tiles.has(t)) {
          working_tiles.add(t);
          all_tiles.delete(t);
        }
      });
    } else {
      continue;
    }
  }

  _.each(garenteed_halls, function(hall) {
    var examined = new Set();
    while (true) {
      var sur_gar_tiles = _.reject(this.surrounding_tiles(hall), function(t) { return this.is_border_tile(t) || examined.has(t); }, this);
      _.each(sur_gar_tiles, function(t) { examined.add(t); });
      if (!_.any(sur_gar_tiles, function(t) { return t.val == 1; })) {
        var t = sur_gar_tiles[Math.floor(Math.random() * sur_gar_tiles.length)];
        t.val = 1;
        hall = t;
      } else {
        break;
      }
    }
  }, this);

  //Generate teleports
  var all_halls = _.reject(this.all_halls(), function(hall) {
    var touching_count = _.reduce(this.surrounding_tiles(hall), function(m, t) {
      return m + t.val;
    }, 0);
    return touching_count > 1 || this.is_border_tile(hall);
  }, this);
  for (i = 0; i < this.num_teleporters; i++) {
    if (all_halls.length >= 2) {
      var t1 = all_halls[Math.floor(Math.random() * all_halls.length)];
      all_halls = _.without(all_halls, t1);
      t1.is_teleport_tile = true;

      var t2 = all_halls[Math.floor(Math.random() * all_halls.length)];
      all_halls = _.without(all_halls, t2);
      t2.is_teleport_tile = true;

      t1.pair_id = this.teleport_tiles.length;
      t2.pair_id = this.teleport_tiles.length;

      t1.teleport_partner = 1;
      t2.teleport_partner = 0;
      this.teleport_tiles.push([t1, t2]);
    } else {
      break;
    }
  }
}


mazeObj.prototype.print = function() {
  return _.reduce(this.maze, function(m, row) {
    return m + (row.toString() + "\n");
  }, "");
}

mazeObj.prototype.get_opposite_tile = function(old_tile) {
  var x = 0;
  var y = 0;
  if (old_tile.x == this.width - 1) {
    x = 0;
    y = old_tile.y;
  } else if (old_tile.x == 0) {
    x = this.width - 1;
    y = old_tile.y;
  } else if (old_tile.y == this.height - 1) {
    x = old_tile.x;
    y = 0;
  } else if (old_tile.y == 0) {
    x = old_tile.x;
    y = this.height - 1;
  }
  return this.tile_at(x, y);
}

mazeObj.prototype.get_random_edge = function(dir) {
  dirs = ["right", "left", "top", "bottom"];
  if (typeof dir == 'undefined' || !_.contains(dirs, dir)) {
    dir = dirs[Math.floor(Math.random() * dirs.length)];
  }
  var x = -1;
  var y = -1;
  if (dir == "top") {
    y = 0;
  } else if (dir == "bottom") {
    y = this.height - 1;
  } else if (dir == "right") {
    x = this.width - 1;
  } else if (dir == "left") {
    x = 0;
  }

  if (x == -1) {
    x = Math.floor(Math.random() * (this.width - 2)) + 1;
  } else if (y == -1) {
    y = Math.floor(Math.random() * (this.height - 2)) + 1;
  }

  return this.tile_at(x, y);
}

mazeObj.prototype.get_random_hall = function() {
  return _.sample(this.all_halls());
}


mazeObj.prototype.tile_at = function(x, y) {
  if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
    return this.maze[y][x];
  } else {
    return null;
  }
}

mazeObj.prototype.get_tile_at_dir = function(tile, dir) {
  var t = null;
  try {
    if (dir == "right") {
      t = this.tile_at(tile.x + 1, tile.y);
    } else if (dir == "left") {
      t = this.tile_at(tile.x - 1, tile.y);
    } else if (dir == "up") {
      t = this.tile_at(tile.x, tile.y - 1);
    } else if (dir == "down") {
      t = this.tile_at(tile.x, tile.y + 1);
    }
  } finally {
    return t;
  }
}

mazeObj.prototype.get_relative_right = function(dir) {
  if (dir == "up") return "right";
  if (dir == "down") return "left";
  if (dir == "left") return "up";
  if (dir == "right") return "down";
  return "right";
}

exports.mazeObj = mazeObj;
