function clientMaze(settings) {
  this.width = settings.maze.width;
  this.height = settings.maze.height;
  this.maze = settings.maze.maze;
  this.teleport_tiles = settings.maze.teleport_tiles;
  this.players = {};
  _.each(settings.player_data, function(player, id) {
    this.players[id] = new clientPlayer(player);
  }, this);
  this.table = settings.table;
  this.player_id = settings.id;
  this.teleport_colors = ["red", "orange", "yellow", "green", "blue", "purple"]; 
}

clientMaze.prototype.draw_players = function() {
  //Clear the player fields
  $('#maze td.player')
    .removeClass('player')
    .removeAttr('style')
    .text('');

  this.draw_teleports();

  //Update the players
  _.each(this.players, function(player, player_id) {
    $("[name='" + player.current_tile_name() + "']")
      .addClass('player')
      .css('background-color', player.color)
      .css('color', player.text_color)
      .text(player.win_count);
  }, this);

  //Re-update the current player so it is on top
  $("[name='" + this.get_current_player().current_tile_name() + "']")
    .css('background-color', this.get_current_player().color)
    .css('color', this.get_current_player().text_color)
    .text(this.get_current_player().win_count);
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
  this.draw_players();

  //Send second update if the tile we move into is a teleport
  if (tile.is_teleport_tile) {
    var partner = this.teleport_tiles[tile.pair_id][tile.teleport_partner]
    socket.emit('coord_update', this.get_current_player().update_position(partner));
    this.draw_players();
  }
}

clientMaze.prototype.draw_maze = function() {
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
}

clientMaze.prototype.update_player = function(id, data) {
  var player = this.players[id];
  if (_.isUndefined(player)) {
    this.players[id] = new clientPlayer(data);
  } else {
    player.update_position(data.position);
    player.win_count = data.win_count;
  }
}

clientMaze.prototype.delete_player = function(id) {
  delete this.players[id];
}

clientMaze.prototype.get_tile_at = function(x, y) {
  return this.maze[y][x];
}

clientMaze.prototype.get_current_player = function() {
  return this.players[this.player_id];
}
