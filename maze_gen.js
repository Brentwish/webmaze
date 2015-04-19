var _ = require('underscore');

function tileObj(x, y, val) {
  this.x = x;
  this.y = y;
  this.val = val;
}

tileObj.prototype.toString = function() {
  return this.val.toString();
}

function mazeObj(width, height) {
  this.width = width;
  this.height = height;
  this.maze = new Array();
  for (i = 0; i < height; i++) {
    this.maze[i] = new Array();
    for (j = 0; j < width; j++) {
      this.maze[i][j] = new tileObj(j, i, 0);
    }
  }
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

mazeObj.prototype.set_of_all_tiles = function() {
  var all_tiles = new Set();
  for (x = 0; x < this.width; x++) {
    for (y = 0; y < this.height; y++) {
      all_tiles.add(this.maze[y][x]);
    }
  }
  return all_tiles;
}

mazeObj.prototype.is_border_tile = function(tile) {
  return tile.x == this.width - 1 || tile.x == 0 || tile.y == this.height - 1 || tile.y == 0;
}

mazeObj.prototype.generate = function(edge_hole_tuples) {
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
  _.each(edge_hole_tuples, function(coord) {
    tile = this.maze[coord.y][coord.x];
    tile.val = 1;
    garenteed_halls.push(tile);
  }, this);

  var working_tiles = new Set();
  var first_edge = garenteed_halls[Math.floor(Math.random() * garenteed_halls.length)];
  garenteed_halls = _.without(garenteed_halls, first_edge);
  _.each(this.surrounding_tiles(first_edge), function(t) {
    working_tiles.add(t);
  });

  while (working_tiles.size > 0) {
    var tile = working_tiles.pop();
    var tiles = this.surrounding_tiles(tile);
    var touching_count = _.reduce(tiles, function(m, t) {
      return m + t.val;
    }, 0);
    var edges = _.intersection(garenteed_halls, tiles);

    if ((touching_count == 1 || edges.length > 0) && !this.is_border_tile(tile)) {
      tile.val = 1;
      garenteed_halls = _.difference(garenteed_halls, edges);
    } else {
      continue;
    }
    _.each(tiles, function(t) {
      if (all_tiles.has(t)) {
        working_tiles.add(t);
        all_tiles.delete(t);
      }
    });
  }
}

mazeObj.prototype.print = function() {
  return _.reduce(this.maze, function(m, row) {
    return m + (row.toString() + "\n");
  }, "");
}

exports.mazeObj = mazeObj;