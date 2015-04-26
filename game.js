var _ = require('underscore');
var maze_gen = require('./maze_gen.js');
var npc = require('./npc.js');

function game(settings) {
  this.maze_size_x = settings.maze_size_x;
  this.maze_size_y = settings.maze_size_y;
  this.num_teleporters = settings.num_teleporters;
  this.num_npcs = settings.num_npcs;
  this.game_tick_length = settings.game_tick_length;
  this.players = {};
  this.npcs = [];
  this.maze = this.create_maze();
}

game.prototype.create_maze = function(start, end) {
  this.maze = new maze_gen.mazeObj({
    width: this.maze_size_x,
    height: this.maze_size_y,
    num_teleporters: this.num_teleporters,
    start: start,
    end: end
  });
  this.npcs = this.generate_npcs(this.maze, this.num_npcs);
}

game.prototype.game_tick = function() {
  var updated_bots = [];
  var updated_players = [];
  _.each(this.npcs, function(npc) {
    if (npc.should_move()) {
      npc.move_timer = 0;
      var next_move = npc.get_next_move(this.maze);
      _.each(this.players, function(player_data, player_id) {
        var is_dead = false;
        if (npc.hit_box == "self") {
          is_dead = player_data.position.same_coords(next_move);
        } else if (npc.hit_box == "surrounding") {
          is_dead = _.any(this.maze.surrounding_tiles(next_move), function(tile) {
            return player_data.position.same_coords(tile);
          }, this) || player_data.position.same_coords(next_move);
        }
        if (is_dead) {
          player_data.position = this.maze.start;
          this.players[player_id] = player_data;
          updated_players.push(players.player_id);
        }
      }, this);
      npc.update_position(next_move);
      updated_bots.push(npc);
    } else {
      npc.move_timer += this.game_tick_length;
    }
  }, this);
  return {bots: updated_bots, players: updated_players};
}

game.prototype.generate_npcs = function() {
  var i = 0;
  var walls_at_end = this.maze.surrounding_walls(this.maze.end);
  for (i = 0; i < this.num_npcs - walls_at_end.length; i++) {
    var npc_settings = {
      id: i,
      position: this.maze.get_random_hall(),
      name: "maze walker",
      strategy: "not back",
      hit_box: "self",
      speed: 150
    };
    this.npcs.push(new npc.npcObj(npc_settings));
  }
  _.each(walls_at_end, function(tile) {
    this.npcs.push(new npc.npcObj({
      id: i++,
      position: tile,
      name: "wall walker",
      strategy: "always right",
      hit_box: "surrounding",
      speed: 150
    }));
  }, this);
}

game.prototype.is_valid_move = function(from, to) {
  var is_in_bounds = to.x >= 0 && to.y >= 0 && to.x < this.maze.width && to.y < this.maze.height;
  var is_valid_x = Math.abs(from.x - to.x) == 1 && Math.abs(from.y - to.y) == 0;
  var is_valid_y = Math.abs(from.x - to.x) == 0 && Math.abs(from.y - to.y) == 1;
  var is_hall = is_in_bounds ? this.maze.tile_at(to.x, to.y).is_hall() : false;
  var is_teleport_pair = _.any(this.maze.teleport_tiles, function(pair) {
    return (pair[0].same_coords(to) && pair[1].same_coords(from)) ||
            (pair[0].same_coords(from) && pair[1].same_coords(to));
  }, this);

  return is_hall && (is_valid_x || is_valid_y || is_teleport_pair);
}

game.prototype.add_player = function(player, id) {
  this.players[id] = player;
}

game.prototype.is_over = function() {
  return _.any(this.players, function(player) {
    return player.position.same_coords(this.maze.end)
  }, this);
}

game.prototype.handle_player_update = function(player_coord, id) {
  var player_data = this.players[id];
  var new_tile = this.maze.tile_at(player_coord.x, player_coord.y);

  //If we have a valid move
  if (!_.isNull(new_tile) && this.is_valid_move(player_data.position, new_tile)) {

    var has_died = _.any(this.npcs, function(npc) {
      return new_tile.same_coords(npc.position);
    }, this);

    //If the new move is the winning move
    if (!has_died && new_tile.same_coords(this.maze.end)) {
      //Update the win count of the winning player
      player_data.win_count++;
      this.players[id] = player_data;

      //Regenerate the maze
      this.maze = this.create_maze(this.maze.get_opposite_tile(this.maze.end))
      this.npcs = this.generate_npcs(this.num_npcs);

      //Reset the player data
      _.each(this.players, function(player_data, player_id) {
        player_data.position = this.maze.start;
        this.players[id] = player_data;
      }, this);

    } else { //Normal position update
      player_data.position = (has_died ? this.maze.start : new_tile);
      this.players[id] = player_data;
    }
  }
}

exports.game = game;