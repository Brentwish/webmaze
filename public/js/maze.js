var socket = io();

socket.on('maze_data', function(data) {
  var maze = data.maze;
  var players = data.player_data;
  var player_id = data.id;
  var update_players = function() {
    $('#maze td').removeClass('player');
    _.each(players, function(player_data, player_id) {
      var td = $('#tile_id_' + String(player_data.position.x) + '_' + String(player_data.position.y));
      td.addClass('player');
    });
  }
  var update_position = function(tile) {
    var player_coord = players[player_id].position;
    player_coord.x = tile.x;
    player_coord.y = tile.y;
    socket.emit('coord_update', player_coord);
    players[player_id].position = player_coord;
    update_players();
  }

  socket.on('player_update', function(data) {
    players[data.id] = data;
    update_players();
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
    var player_coord = players[player_id].position;
    var x = player_coord.x
    var y = player_coord.y

    //down
    if (key == 40) {
      var new_y = player_coord.y + 1;
      if (new_y < maze.length) {
        var tile = maze[new_y][x];
        if (tile.val == 1) {
          update_position(tile);
        }
      }
    }

    //up
    else if (key == 38) {
      var new_y = player_coord.y - 1;
      if (new_y >= 0) {
        var tile = maze[new_y][x];
        if (tile.val == 1) {
          update_position(tile);
        }
      }
    }

    //right
    else if (key == 39) {
      var new_x = player_coord.x + 1;
      if (new_x < maze[0].length) {
        var tile = maze[y][new_x];
        if (tile.val == 1) {
          update_position(tile);
        }
      }
    }

    //left
    else if (key == 37) {
      var new_x = player_coord.x - 1;
      if (new_x >= 0) {
        var tile = maze[y][new_x];
        if (tile.val == 1) {
          update_position(tile);
        }
      }
    }
  });
});
