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
});

socket.on('player_disconnect', function(data) {
  if (_.isNull(maze)) return; //Return if maze has yet to be created
  maze.delete_player(data.id);
});

$(window).off('keydown').on('keydown', function(e) {
  var key = e.which;
  if (_.isNull(maze)) return; //Return if maze has yet to be created

  if (key == 40) { //down
    maze.attempt_move("down");
  } else if (key == 38) { //up
    maze.attempt_move("up");
  } else if (key == 39) { //right
    maze.attempt_move("right");
  } else if (key == 37) { //left
    maze.attempt_move("left");
  }

  e.preventDefault();
  return false;
});
