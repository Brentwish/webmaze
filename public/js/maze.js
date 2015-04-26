var socket = io();
var maze = null;

socket.on('maze_data', function(data) {
  $.extend(data, {table: "#maze_table"});
  maze = new clientMaze(data);
  maze.draw_maze();
});

socket.on('game_update', function(update) {
  if (_.isNull(maze)) return; //Return if maze has yet to be created
  _.each(update.players, function(player) {
    maze.update_player(player.id, player);
  });
  _.each(update.bots, function(bot) {
    maze.update_bot(bot);
  });
});

socket.on('player_update', function(data) {
  if (_.isNull(maze)) return; //Return if maze has yet to be created
  maze.update_player(data.id, data);
});

socket.on('player_disconnect', function(data) {
  if (_.isNull(maze)) return; //Return if maze has yet to be created
  maze.delete_player(data.id);
});

$(window).off('keydown').on('keydown', function(e) {
  var key = e.which;
  if (_.isNull(maze)) return; //Return if maze has yet to be created

  if (key == 40 || key == 83) { //down
    maze.attempt_move("down");
  } else if (key == 38 || key == 87) { //up
    maze.attempt_move("up");
  } else if (key == 39 || key == 68) { //right
    maze.attempt_move("right");
  } else if (key == 37 || key == 65) { //left
    maze.attempt_move("left");
  }

  e.preventDefault();
  return false;
});

var ongoingTouches = new Array();
var touch_threshold = 40;

$(window).on("touchstart", function(evt) {
  evt.preventDefault();
  touches = evt.originalEvent.changedTouches;
  for (var i=0; i < touches.length; i++) {
    ongoingTouches.push(copyTouch(touches[i]));
  }
});

$(window).on("touchmove", function(evt) {
  evt.preventDefault();
  var touches = evt.originalEvent.changedTouches;

  for (var i=0; i < touches.length; i++) {
    var idx = ongoingTouchIndexById(touches[i].identifier);
    if(idx >= 0) {
      var x_diff = ongoingTouches[idx].pageX - touches[i].pageX;
      var y_diff = ongoingTouches[idx].pageY - touches[i].pageY;
      if (Math.abs(x_diff) > touch_threshold || Math.abs(y_diff) > touch_threshold) {
        ongoingTouches.splice(idx, 1, copyTouch(touches[i]));  // swap in the new touch record
        if (x_diff > 0 && Math.abs(x_diff) > touch_threshold) {
          maze.attempt_move("left");
        } else if (x_diff < 0 && Math.abs(x_diff) > touch_threshold) {
          maze.attempt_move("right");
        } else if (y_diff > 0 && Math.abs(y_diff) > touch_threshold) {
          maze.attempt_move("up");
        } else if (y_diff < 0 && Math.abs(y_diff) > touch_threshold) {
          maze.attempt_move("down");
        }
      }
    }
  }
});

$(window).on("touchend", function(evt) {
  evt.preventDefault();
  var touches = evt.originalEvent.changedTouches;

  for (var i=0; i < touches.length; i++) {
    var idx = ongoingTouchIndexById(touches[i].identifier);

    if(idx >= 0) {
      ongoingTouches.splice(idx, 1);  // remove it; we're done
    }
  }
});

function copyTouch(touch) {
  return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY };
}

function ongoingTouchIndexById(idToFind) {
  for (var i=0; i < ongoingTouches.length; i++) {
    var id = ongoingTouches[i].identifier;
    if (id == idToFind) {
      return i;
    }
  }
  return -1;    // not found
}
