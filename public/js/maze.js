var socket = io();

socket.on('maze_data', function(data) {
  var player_coord = data.start_pos;
  var maze = data.maze;
  var update_player = function(tile) {
    var old_player_td = $('#tile_id_' + String(player_coord.x) + '_' + String(player_coord.y));
    var new_player_td = $('#tile_id_' + String(tile.x) + '_' + String(tile.y));
    old_player_td.removeClass('player');
    new_player_td.addClass('player');
    player_coord.x = tile.x;
    player_coord.y = tile.y;
    socket.emit('coord_update', player_coord);
  }

  socket.on('player_update', function(data) {
    update_player(data.position);
  });

  _.each(data.maze, function(row) {
    var tr = $('<tr>');
      _.each(row, function(tile) {
        var td = $('<td>')
          .addClass(tile.val == 0 ? 'wall' : 'hall')
          .attr('id', 'tile_id_' + String(tile.x) + '_' + String(tile.y));
        if (data.start_pos.x == tile.x && data.start_pos.y == tile.y) {
          td.addClass('player');
        }
        tr.append(td);
      });
    $('#maze').append(tr);
  });

  $(window).keydown(function(e) {
    var key = e.which;
    var x = player_coord.x
    var y = player_coord.y

    //down
    if (key == 40) {
      var new_y = player_coord.y + 1;
      if (new_y < maze.length) {
        var tile = maze[new_y][x];
        if (tile.val == 1) {
          update_player(tile);
        }
      }
    }

    //up
    else if (key == 38) {
      var new_y = player_coord.y - 1;
      if (new_y >= 0) {
        var tile = maze[new_y][x];
        if (tile.val == 1) {
          update_player(tile);
        }
      }
    }

    //right
    else if (key == 39) {
      var new_x = player_coord.x + 1;
      if (new_x < maze[0].length) {
        var tile = maze[y][new_x];
        if (tile.val == 1) {
          update_player(tile);
        }
      }
    }

    //left
    else if (key == 37) {
      var new_x = player_coord.x - 1;
      if (new_x >= 0) {
        var tile = maze[y][new_x];
        if (tile.val == 1) {
          update_player(tile);
        }
      }
    }
  });
});
