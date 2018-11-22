const Backbone = require('backbone');
const MapModel = require('./map.model');
const RoomModel = require('./room.model');

module.exports = Backbone.Model.extend({
  initialize: function initialize() {
    this.map = new MapModel();
    this.room = new RoomModel();
  },
});
