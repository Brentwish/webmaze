var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var maze_gen = require('./maze_gen.js');
var npc = require('./npc.js');
var game = require('./game.js');
var _ = require('./public/js/underscore-min.js');

var server_port = (process.env.PORT || 3000);

var game_settings = {
  maze_size_x: 55,
  maze_size_y: 25,
  num_teleporters: 6,
  num_npcs: 18,
  game_tick_length: 20
};

var the_game = new game.game(game_settings);

function game_update() {
  var update = the_game.game_tick();
  if (_.any(update, function(v) { return !_.isEmpty(v); })) {
    io.emit('game_update', update);
  }
}

setInterval(game_update, the_game.game_tick_length);

app.use("/public", express.static(__dirname + '/public'));

app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get('/maze/', function(req, res) {
  res.sendFile(__dirname + '/maze.html');
});

io.on('connection', function(socket) {
  //Add the player to the game
  the_game.add_player({ id: socket.id });

  //Send the maze to the new player
  socket.emit('maze_data', the_game.to_data_hash(socket.id));
  
  //Let everyone else know about the new player
  io.emit('player_update', the_game.players[socket.id]);


  socket.on('coord_update', function(player_coord) {
    var updates = the_game.handle_player_update(player_coord, socket.id);
    if (!_.isEmpty(updates)) {
      io.emit('player_update', updates["player_data"]);
    }

    if (the_game.is_over) {
      the_game.reset_game();
      io.emit('maze_data', the_game.to_data_hash(socket.id));
    }
  });

  console.log('a user connected');
  console.log('Number of players: ' + Object.keys(the_game.players).length);
  io.emit('user_connect', {data : 'a user connected'});
  socket.on('disconnect', function(){
    delete the_game.players[socket.id];
    console.log('user disconnected');
    console.log('Number of players: ' + Object.keys(the_game.players).length);
    io.emit('player_disconnect', {id: socket.id});
  });
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
