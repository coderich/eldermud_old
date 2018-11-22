const Backbone = require('backbone');
const LocationModel = require('./location.model');

module.exports = Backbone.Model.extend({
  initialize: function initialize() {
    this.location = new LocationModel();
  },

  move: function move(direction, options = {}) {
    this.trigger('move', { self: this, direction, options });
  },

  follow: function follow(being, options = {}) {
    this.trigger('follow', { self: this, being, options });
  },

  navigate: function navigate(location, options = {}) {
    this.trigger('navigate', { self: this, location, options });
  },
});
