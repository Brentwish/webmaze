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
  this.create_maze();
  this.is_over = false;
}

game.prototype.create_maze = function(start, end) {
  this.maze = new maze_gen.mazeObj({
    width: this.maze_size_x,
    height: this.maze_size_y,
    num_teleporters: this.num_teleporters,
    start: start,
    end: end
  });
  this.generate_npcs(this.maze, this.num_npcs);
}

game.prototype.is_tile_lethal = function(tile) {
  if (tile.same_coords(this.maze.start)) {
    return false;
  } else {
    return _.any(this.npcs, function(npc) {
      if (npc.hit_box == "self") {
        return tile.same_coords(npc.position);
      } else if (npc.hit_box == "surrounding") {
        return _.contains(this.maze.adjacent_tiles(npc.position), tile);
      }
    }, this);
  }
}

game.prototype.get_dead_players = function() {
  var updated_players = [];
  _.each(this.players, function(player, id) {
    if (this.is_tile_lethal(player.position)) {
      player.position = this.maze.start;
      player.death_count++;
      this.players[id] = player;
      updated_players.push(player);
    }
  }, this);
  return updated_players;
}

game.prototype.game_tick = function() {
  var updated_bots = [];
  _.each(this.npcs, function(npc) {
    if (npc.should_move()) {
      npc.move_timer = 0;
      var next_move = npc.get_next_move(this.maze);
      npc.update_position(next_move);
      updated_bots.push(npc.to_data_hash());
    } else {
      npc.move_timer += this.game_tick_length;
    }
  }, this);
  return { bots: updated_bots, players: this.get_dead_players() };
}

game.prototype.generate_npcs = function() {
  this.npcs = [];
  var i = 0;
  var walls_at_end = this.maze.surrounding_walls(this.maze.end);
  for (i; i < this.num_npcs - walls_at_end.length; i++) {
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

game.prototype.add_player = function(player) {
  var player_settings = {
    win_count: 0,
    death_count: 0,
    position: this.maze.start,
    id: player.id
  }
  this.players[player.id] = player_settings;
}

game.prototype.handle_player_update = function(player_coord, id) {
  var player_data = this.players[id];
  var new_tile = this.maze.tile_at(player_coord.x, player_coord.y);
  var updates = {};
  //If we have a valid move
  if (!_.isNull(new_tile) && this.is_valid_move(player_data.position, new_tile)) {

    var has_died = this.is_tile_lethal(new_tile);

    //If the new move is the winning move
    if (!has_died && new_tile.same_coords(this.maze.end)) {
      //Update the win count of the winning player
      player_data.win_count++;
      this.players[id] = player_data;

      //Flag the game as being over
      this.is_over = true;
    } else { //Normal position update
      player_data.position = (has_died ? this.maze.start : new_tile);
      if (has_died) player_data.death_count++;
      this.players[id] = player_data;
      updates["player_data"] = player_data;
    }
  }
  return updates;
}

game.prototype.to_data_hash = function(current_player_id) {
  return {
    maze: this.maze,
    players: this.players,
    npcs: _.map(this.npcs, function(npc) { return npc.to_data_hash(); }),
    id: current_player_id
  }
}

game.prototype.reset_game = function() {
  //Regenerate the maze
  this.create_maze(this.maze.get_opposite_tile(this.maze.end))

  //Reset the player data
  _.each(this.players, function(player_data, player_id) {
    player_data.position = this.maze.start;
    this.players[player_id] = player_data;
  }, this);

  this.is_over = false;
}

exports.game = game;
