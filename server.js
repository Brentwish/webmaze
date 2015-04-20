var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var maze_gen = require('./maze_gen.js');
var _ = require('./public/js/underscore-min.js');

var maze_size_x = 10;
var maze_size_y = 10;
var players = {};

var the_maze = new maze_gen.mazeObj(maze_size_x, maze_size_y);
var start = the_maze.get_random_edge();
var end = the_maze.get_random_edge();
the_maze.generate(start, [end]);

app.use("/public", express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/maze/', function(req, res) {
  res.sendFile(__dirname + '/maze.html');
});

io.on('connection', function(socket){
  players[socket.id] = {
    id: socket.id,
    win_count: 0,
    position: start
  };
  socket.emit('maze_data', {
    maze: the_maze.maze,
    player_data: players,
    id: socket.id
  });
  io.emit('player_update', players[socket.id]);
  socket.on('coord_update', function(player_coord) {
    var player_data = players[socket.id];
    //If we have a valid move
    if (the_maze.is_valid_move(player_data.position, player_coord)) {
      //If the new move is the winning move
      if (player_coord.x == end.x && player_coord.y == end.y) {
        //Update the win count of the winning player
        player_data.win_count++;
        players[socket.id] = player_data;

        //Regenerate the maze
        the_maze = new maze_gen.mazeObj(maze_size_x, maze_size_y);
        start = the_maze.get_opposite_tile(end);
        end = the_maze.get_random_edge();
        the_maze.generate(start, [end]);

        //Reset the player data
        _.each(players, function(player_data, player_id) {
          player_data.position = start;
          players[player_id] = player_data;
        });

        //Send the new maze to each of the players
        _.each(io.sockets.connected, function(socket) {
          socket.emit('maze_data', {
            maze: the_maze.maze,
            player_data: players,
            id: socket.id
          });
        });
      } else { //Normal position update
        player_data.position = player_coord;
        io.emit('player_update', player_data);
        players[socket.id] = player_data;
      }
    }
  });

  console.log('a user connected');
  io.emit('user_connect', {data : 'a user connected'});
  socket.on('disconnect', function(){
    delete players[socket.id];
    console.log('user disconnected');
    io.emit('player_disconnect', {id: socket.id});
  });
});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
    console.log('message: ' + msg);
  });
});

http.listen(3000, function() {
  console.log('listening on *:3000');
});
