var _ = require('underscore');
var game = require('./game.js');

function gameRoom(settings) {
  this.game_settings = {
    maze_size_x: 20,
    maze_size_y: 5,
    num_teleporters: 6,
    num_npcs: 2,
    game_tick_length: 20
  };

  this.game = new game.game(this.game_settings);
  this.id = settings.id;
  this.name = settings.name;
  this.io = settings.io;
  this.max_players = 2;
  this.last_player_exit_at = (new Date()).getTime();
  this.room_life = 10000; //Time before room is removed when no players present

  function game_update() {
    var update = this.game.game_tick();
    if (_.any(update, function(v) { return !_.isEmpty(v); })) {
      this.broadcast_room('game_update', update);
    }
  }

  setInterval(game_update.bind(this), this.game.game_tick_length);
}

gameRoom.prototype.current_player_count = function() {
  var count = 0;
  try {
    count = Object.keys(this.io.nsps["/"].adapter.rooms[this.id]).length;
  } finally {
    return count;
  }
}

gameRoom.prototype.has_room = function() {
  return this.current_player_count() < this.max_players;
}

gameRoom.prototype.broadcast_room = function(event_name, data) {
  this.io.to(this.id).emit(event_name, data);
}

gameRoom.prototype.join = function(player_socket) {
  console.log("player: " + player_socket.id + " is joining room: " + this.name);
  player_socket.join(this.id);
  //Add the player to the game
  this.game.add_player({ id: player_socket.id });

  //Send the maze to the new player
  player_socket.emit('maze_data', this.game.to_data_hash(player_socket.id));

  //Let everyone else know about the new player
  this.broadcast_room('player_update', this.game.players[player_socket.id]);


  player_socket.on('coord_update', function(player_coord) {
    var updates = this.game.handle_player_update(player_coord, player_socket.id);
    if (!_.isEmpty(updates)) {
      this.broadcast_room('player_update', updates["player_data"]);
    }

    if (this.game.is_over) {
      this.game.reset_game();
      this.broadcast_room('maze_data', this.game.to_data_hash(player_socket.id));
    }
  }.bind(this));

  player_socket.on('disconnect', function(){
    this.last_player_exit_at = (new Date()).getTime();
    this.game.remove_player(player_socket.id);
    console.log('user disconnected from room: ' + this.name);
    console.log('Number of players: ' + this.current_player_count());
    this.broadcast_room('player_disconnect', {id: player_socket.id});
  }.bind(this));
}

gameRoom.prototype.should_be_removed = function() {
  var time_since_last_player = ((new Date()).getTime() - this.last_player_exit_at);
  return this.current_player_count() == 0 && this.room_life < time_since_last_player;
}
exports.game_room = gameRoom;
