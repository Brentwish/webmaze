var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var maze_gen = require('./maze_gen.js');
var npc = require('./npc.js');
var _ = require('./public/js/underscore-min.js');

var server_port = 3000;

var maze_size_x = 54;
var maze_size_y = 28;
var num_teleporters = 6;
var num_npcs = 14;
var game_tick_length = 20;
var bot_speed = 150;

var players = {};
var npcs = [];
var num_teleporters = 6;

function create_maze(start, end) {
  var maze = new maze_gen.mazeObj({
    width: maze_size_x,
    height: maze_size_y,
    num_teleporters: num_teleporters,
    start: start,
    end: end
  });
  npcs = maze.generate_npcs(num_npcs);

  console.log('New Maze generated');
  console.log('Size  : (' + maze.width + ', ' + maze.height + ')');
  console.log('Start : (' + maze.start.x + ', ' + maze.start.y + ')');
  console.log('End   : (' + maze.end.x + ', ' + maze.end.y + ')');
  console.log('Number of players: ' + Object.keys(players).length);
  return maze;
}

var bot_count = 0;
function game_tick() {
  var next_move;

  if (bot_count * game_tick_length <= bot_speed) {
    bot_count++;
  } else {
    _.each(npcs, function(npc) {
      next_move = npc.get_next_move(the_maze);
      _.each(players, function(player_data, player_id) {
        if ((player_data.position.x == next_move.x) && (player_data.position.y == next_move.y)) {
          player_data.position = the_maze.start;
          players[player_id] = player_data;
          io.emit('player_update', players[player_id]);
        }
      });
      npc.update_position(next_move);
      io.emit('npc_update', npc);
    });
    bot_count = 0;
  }
}

var the_maze = create_maze();
setInterval(game_tick, game_tick_length);

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
    position: the_maze.start
  };
  socket.emit('maze_data', {
    maze: the_maze,
    player_data: players,
    npcs: npcs,
    id: socket.id
  });
  io.emit('player_update', players[socket.id]);
  socket.on('coord_update', function(player_coord) {
    var player_data = players[socket.id];
    //If we have a valid move
    if (the_maze.is_valid_move(player_data.position, player_coord)) {
      //If the player moves into an npc, send them to the start
      _.each(npcs, function(npc) {
        if ((player_coord.x == npc.position.x) && (player_coord.y == npc.position.y)) {
          player_data.position = the_maze.start;
          players[socket.id] = player_data;
          io.emit('player_update', player_data);
        }
      });
      //If the new move is the winning move
      if (player_coord.x == the_maze.end.x && player_coord.y == the_maze.end.y) {
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
        player_data.position = player_coord;
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
