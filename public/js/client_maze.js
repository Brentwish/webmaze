function clientMaze(settings) {
  this.table = settings.table;
  this.player_id = settings.id;
  this.width = settings.maze.width;
  this.height = settings.maze.height;
  this.maze = settings.maze.maze;
  this.teleport_tiles = settings.maze.teleport_tiles;
  this.players = {};
  this.npcs = settings.npcs;
  _.each(settings.player_data, function(player, id) {
    this.players[id] = new clientPlayer(player);
  }, this);
  this.teleport_colors = ["red", "orange", "yellow", "green", "blue", "purple"]; 
}

clientMaze.prototype.draw_teleports = function() {
  //Update the teleport tile colors
  _.each(this.teleport_tiles, function(pair) {
    _.each(pair, function(tile) {
      $("[name='" + this.tile_name_from_position(tile) + "']")
        .css('background-color', this.teleport_colors[tile.pair_id]);
    }, this);
  }, this);
}

clientMaze.prototype.tile_name_from_position = function(pos) {
  return "tile_" + String(pos.x) + "_" + String(pos.y);
}

clientMaze.prototype.update_position = function(tile) {
  socket.emit('coord_update', this.get_current_player().update_position(tile));
  this.update_player_position(this.player_id);

  //Send second update if the tile we move into is a teleport
  if (tile.is_teleport_tile) {
    var partner = this.teleport_tiles[tile.pair_id][tile.teleport_partner]
    socket.emit('coord_update', this.get_current_player().update_position(partner));
    this.update_player_position(this.player_id);
  }
}

clientMaze.prototype.draw_maze = function() {
  //Clear the maze for redraw
  $(this.table).empty();
  _.each(this.maze, function(row) {
    var tr = $('<tr>');
      _.each(row, function(tile) {
        var td = $('<td>')
          .addClass(tile.val == 0 ? 'wall' : 'hall')
          .attr('name', this.tile_name_from_position(tile));

        if (tile.is_teleport_tile) {
          td.css('background-color', this.teleport_colors[tile.pair_id]);
        }
        tr.append(td);
      },this);
    $(this.table).append(tr);
  }, this);

  //Make sure the table doesn't squish
  $(this.table).css({'min-width': this.width * 20, 'min-height': this.height * 20});

  this.draw_teleports();

  //Create a new div for each player
  _.each(this.players, function(player, id) {
    this.create_player_div(id);
  }, this);
}

clientMaze.prototype.update_player = function(id, data) {
  var player = this.players[id];
  if (_.isUndefined(player)) {
    this.players[id] = new clientPlayer(data);
    this.create_player_div(id);
  } else {
    player.win_count = data.win_count;
    player.update_position(data.position);
    this.update_player_position(id);
  }
}

clientMaze.prototype.delete_player = function(id) {
  delete this.players[id];
  $("#player_" + id).remove();
}

clientMaze.prototype.get_tile_at = function(x, y) {
  return this.maze[y][x];
}

clientMaze.prototype.get_current_player = function() {
  return this.players[this.player_id];
}

clientMaze.prototype.create_player_div = function(id) {
  var player = this.players[id];
  var div = $('<div>')
    .attr('id', "player_" + id)
    .addClass('player')
    .addClass('board_entity')
    .css('background-color', player.color)
    .css('color', player.text_color)
    .text(player.win_count);
  if (this.player_id == id) {
    div.addClass('main_player');
  }
  $(this.table).append(div);
  this.update_player_position(id);
}

clientMaze.prototype.create_bot_div = function(id) {
  var npc = this.npcs[id]
  var div = $('<div>')
    .attr('id', "bot_" + id);
  if (npc.name == "wall walker") {
    div
      .addClass('wall_walker')
      .addClass('large_board_entity');
  } else if (npc.name == "maze walker") {
    div
      .addClass('maze_walker')
      .addClass('board_entity');
  }
  $(this.table).append(div);
}

clientMaze.prototype.update_bot = function(bot) {
  var npc_div = $("#bot_" + bot.id);
  if (npc_div.length == 0) {
    this.create_bot_div(bot.id);
  }
  var npc = this.npcs[bot.id];
  npc.position = bot.position;
  npc.direction = bot.direction;
  var padding = (npc.name == "wall walker" ? -19 : 1);
  this.update_entity(npc_div, npc.position, padding);
}

clientMaze.prototype.update_player_position = function(id) {
  var player_div = $("#player_" + id);
  var player = this.players[id];
  this.update_entity(player_div, player.position, 1);
}

clientMaze.prototype.update_entity = function(entity, position, padding) {
  var tile_pos = $(this.table).find("td[name='tile_" + String(position.x) + "_" + String(position.y) + "']").position();
  entity.css({
    top: tile_pos.top + padding,
    left: tile_pos.left + padding
  });
}

clientMaze.prototype.attempt_move = function(dir) {
  var player_coord = this.get_current_player().position;
  var x = player_coord.x
  var y = player_coord.y
  if (dir == "down") { //down
    var new_y = y + 1;
    if (new_y < maze.height) {
      var tile = maze.get_tile_at(x, new_y);
      if (tile.val == 1) {
        maze.update_position(tile);
      }
    }
  } else if (dir == "up") { //up
    var new_y = player_coord.y - 1;
    if (new_y >= 0) {
      var tile = maze.get_tile_at(x, new_y);
      if (tile.val == 1) {
        maze.update_position(tile);
      }
    }
  } else if (dir == "right") { //right
    var new_x = player_coord.x + 1;
    if (new_x < maze.width) {
      var tile = maze.get_tile_at(new_x, y);
      if (tile.val == 1) {
        maze.update_position(tile);
      }
    }
  } else if (dir == "left") { //left
    var new_x = player_coord.x - 1;
    if (new_x >= 0) {
      var tile = maze.get_tile_at(new_x, y);
      if (tile.val == 1) {
        maze.update_position(tile);
      }
    }
  }
}
