const Backbone = require('backbone');

module.exports = Backbone.Model.extend({
  initialize: function initialize() {
  },

  action: function action(action, data = {}) {
    this.trigger(action, { self: this, data });
  },
});
