var socket = io();
var maze = null;

socket.on('maze_data', function(data) {
  $.extend(data, {table: "#maze_table"});
  maze = new clientMaze(data);
  maze.draw_maze();
});

socket.on('player_update', function(data) {
  if (_.isNull(maze)) return; //Return if maze has yet to be created
  maze.update_player(data.id, data);
});

socket.on('npc_update', function(npcs) {
  if (_.isNull(maze)) return; //Return if maze has yet to be created
  _.each(npcs, function(bot) {
    maze.update_bots(bot);
  });
  socket.emit('npc_log', {msg: 'got it'});
});

socket.on('player_disconnect', function(data) {
  if (_.isNull(maze)) return; //Return if maze has yet to be created
  maze.delete_player(data.id);
});

$(window).off('keydown').on('keydown', function(e) {
  var key = e.which;
  if (_.isNull(maze)) return; //Return if maze has yet to be created
  var player_coord = maze.get_current_player().position;
  var x = player_coord.x
  var y = player_coord.y

  if (key == 40 || key == 83) { //down
    var new_y = y + 1;
    if (new_y < maze.height) {
      var tile = maze.get_tile_at(x, new_y);
      if (tile.val == 1) {
        maze.update_position(tile);
      }
    }
  } else if (key == 38 || key == 87) { //up
    var new_y = player_coord.y - 1;
    if (new_y >= 0) {
      var tile = maze.get_tile_at(x, new_y);
      if (tile.val == 1) {
        maze.update_position(tile);
      }
    }
  } else if (key == 39 || key == 68) { //right
    var new_x = player_coord.x + 1;
    if (new_x < maze.width) {
      var tile = maze.get_tile_at(new_x, y);
      if (tile.val == 1) {
        maze.update_position(tile);
      }
    }
  } else if (key == 37 || key == 65) { //left
    var new_x = player_coord.x - 1;
    if (new_x >= 0) {
      var tile = maze.get_tile_at(new_x, y);
      if (tile.val == 1) {
        maze.update_position(tile);
      }
    }
  }

  e.preventDefault();
  return false;
});
