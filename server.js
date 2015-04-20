var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var maze_gen = require('./maze_gen.js');
var _ = require('./public/js/underscore-min.js');

var players = {};
var start = {x: 1, y: 0}
var end = {x: 24, y: 23}
var the_maze = new maze_gen.mazeObj(55,55);
the_maze.generate([start, end]);

app.use("/public", express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/maze/', function(req, res) {
  res.sendFile(__dirname + '/maze.html');
});

io.on('connection', function(socket){
  players[socket.id] = {id: socket.id, position: start};
  socket.emit('maze_data', {maze: the_maze.maze, start_pos: start, end_pos: end, player_data: players, id: socket.id});
  io.emit('player_update', players[socket.id]);
  socket.on('coord_update', function(player_coord){
    var player_data = players[socket.id];
    if (player_coord.x == end.x && player_coord.y == end.y) {
      _.each(players, function(player_data, player_id) {
        player_data.position = start;
        players[player_id] = player_data;
      });
      the_maze = new maze_gen.mazeObj(25,25);
      the_maze.generate([start, end]);
      io.emit('maze_data', {maze: the_maze.maze, start_pos: start, end_pos: end, player_data: players, id: socket.id});
    } else if (player_data.position.x != player_coord.x || player_data.position.y != player_coord.y) {
      player_data.position = player_coord;
      io.emit('player_update', player_data);
      players[socket.id] = player_data;
    }
  });

  console.log('a user connected');
  io.emit('user_connect', {data : 'a user connected'});
  socket.on('disconnect', function(){
    delete players[socket.id];
    console.log('user disconnected');
    io.emit('user_disconnect', {id: socket.id});
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
