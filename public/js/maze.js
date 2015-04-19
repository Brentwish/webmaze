var socket = io();
  socket.on('maze_data', function(data) {
    _.each(data.maze, function(row) {
      var tr = $('<tr>');
        _.each(row, function(tile) {
          tr.append($('<td>').addClass(tile == 0 ? 'wall' : 'hall'));
        });
      $('#maze').append(tr);
    });
  $('#messages').append($('<li>').text(data.data));
});
