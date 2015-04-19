var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var maze_gen = require('./maze_gen.js');

app.use("/public", express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/maze/', function(req, res) {
  res.sendFile(__dirname + '/maze.html');
});

io.on('connection', function(socket){
  var the_maze = new maze_gen.mazeObj(25,25);
  var start = {x: 1, y: 0}
  var end = {x: 24, y: 23}
  the_maze.generate([start, end]);

  console.log('a user connected');
  io.emit('user_connect', {data : 'a user connected'});
  io.emit('maze_data', {maze: the_maze.maze});
  socket.on('disconnect', function(){
    console.log('user disconnected');
    io.emit('user_disconnect', {data : 'a user disconnected'});
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
