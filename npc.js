function npcObj(settings) {
  this.position = settings.position;
  this.direction = 0;
  this.id = settings.id;
}

npcObj.prototype.get_next_move = function(maze) {
  var surrounding_halls = maze.surrounding_halls(this.position);
  var i = Math.floor(Math.random() * surrounding_halls.length);
  var next_move = surrounding_halls[i];
  this.position = next_move;

  return next_move;

  //if the tile in front of the bot is a hall, return it
  //else choose a random surrounding hall and update its direction
}
exports.npcObj = npcObj;
