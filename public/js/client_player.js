function clientPlayer(settings) {
  this.table = settings.table;
  this.id = settings.id;
  this.position = settings.position;
  this.win_count = settings.win_count;
  this.color = '#'+ ('000000' + (Math.random()*0xFFFFFF<<0).toString(16)).slice(-6); //random color
  this.text_color = (function(color) {
    var c = color.substring(1);      // strip #
    var rgb = parseInt(c, 16);   // convert rrggbb to decimal
    var r = (rgb >> 16) & 0xff;  // extract red
    var g = (rgb >>  8) & 0xff;  // extract green
    var b = (rgb >>  0) & 0xff;  // extract blue

    var luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // per ITU-R BT.709

    return luma < 180 ? "white" : "black";
  })(this.id);
}

clientPlayer.prototype.current_tile_name = function() {
  return "tile_" + String(this.position.x) + "_" + String(this.position.y);
}

clientPlayer.prototype.update_position = function(pos) {
  this.position.x = pos.x;
  this.position.y = pos.y;
  return this.position;
}
