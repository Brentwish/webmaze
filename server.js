var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var game = require('./game.js');
var game_room = require('./game_room.js');
var _ = require('./public/js/underscore-min.js');

var server_port = (process.env.PORT || 3000);
var game_rooms = [];

setInterval(function() {
  game_rooms = _.reject(game_rooms, function(room) {
    var should_remove = room.should_be_removed();
    if (should_remove) {
      console.log("removing room: " + room.id + " from room pool");
    }
    return should_remove;
  });
}, 5000);

app.use("/public", express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/maze/', function(req, res) {
  res.sendFile(__dirname + '/maze.html');
});

io.on('connection', function(socket) {
  console.log("player: " + socket.id + " is looking for room");
  var room = _.find(game_rooms, function(room) { return room.has_room(); });
  if (!room) {
    console.log("no open rooms. making a new one");
    room = new game_room.game_room({ name: "harg", io: io });
    game_rooms.push(room);
  }
  console.log("calling add player for: " + socket.id);
  room.join(socket);
});

io.on('connection', function(socket){
  socket.on('chat message', function(msg){
    io.emit('chat message', msg);
    console.log('message: ' + msg);
  });
});

http.listen(server_port, function() {
  console.log('listening on *:' + String(server_port));
});
