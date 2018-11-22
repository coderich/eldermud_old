const FS = require('fs');
const Backbone = require('backbone');
const UserModel = require('./user.model');
const RoomModel = require('./room.model');

const data = JSON.parse(FS.readFileSync(__dirname + '/../data/map/atlanta.json'));

module.exports = Backbone.Model.extend({
  initialize: function() {
    this.users = new (Backbone.Collection.extend({
      model: UserModel,
    }))();

    this.rooms = new (Backbone.Collection.extend({
      model: RoomModel,
    }))();
  }
});
