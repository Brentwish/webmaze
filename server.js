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
  maze_size_x: 70,
  maze_size_y: 35,
  num_teleporters: 6,
  num_npcs: 10,
  game_tick_length: 20
};

var the_game = new game.game(game_settings);

function game_update() {
  var update = game.game_tick();
  if(_.any(update, function(v) { return !_.isEmpty(v); })) {
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

io.on('connection', function(socket){
  the_game.add_player({
    id: socket.id,
    win_count: 0,
    position: the_maze.start
  }
  socket.emit('maze_data', {
    maze: the_game.maze,
    player_data: the_game.players,
    npcs: the_game.npcs,
    id: socket.id
  });
  io.emit('player_update', the_game.players[socket.id]);
  socket.on('coord_update', function(player_coord) {
    the_game.handle_player_update(player_coord);
    if (the_game.is_over()) {
      game_settings.start = the_game.maze.get_opposite_tile(the_game.maze.end);
      game_settings.players = 
      the_game = new game.game(game_settings);
    }
    var player_data = players[socket.id];
    var new_tile = the_maze.tile_at(player_coord.x, player_coord.y);
    //If we have a valid move
    if (!_.isNull(new_tile) && the_maze.is_valid_move(player_data.position, new_tile)) {
      //If the player moves into an npc, send them to the start
      var has_died = _.any(npcs, function(npc) {
        return new_tile.same_coords(npc.position);
      });
      //If the new move is the winning move
      if (!has_died && new_tile.same_coords(the_maze.end)) {
        //Update the win count of the winning player
        player_data.win_count++;
        players[socket.id] = player_data;

        //Regenerate the maze
        the_maze = create_maze(the_maze.get_opposite_tile(the_maze.end))
        npcs = the_maze.generate_npcs(num_npcs);

        //Reset the player data
        _.each(players, function(player_data, player_id) {
          player_data.position = the_maze.start;
          players[player_id] = player_data;
        });

        //Send the new maze to each of the players
        _.each(io.sockets.connected, function(socket) {
          socket.emit('maze_data', {
            maze: the_maze,
            player_data: players,
            npcs: npcs,
            id: socket.id
          });
        });
      } else { //Normal position update
        player_data.position = (has_died ? the_maze.start : new_tile);
        io.emit('player_update', player_data);
        players[socket.id] = player_data;
      }
    }
  });

  console.log('a user connected');
  console.log('Number of players: ' + Object.keys(players).length);
  io.emit('user_connect', {data : 'a user connected'});
  socket.on('disconnect', function(){
    delete players[socket.id];
    console.log('user disconnected');
    console.log('Number of players: ' + Object.keys(players).length);
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
