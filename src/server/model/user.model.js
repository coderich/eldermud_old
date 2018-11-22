const Backbone = require('backbone');
const BeingModel = require('./being.model');

module.exports = BeingModel.extend({
  initialize: function initialize() {
    this.type = 'user';
  },

  quit: function quit() {
    this.trigger('quit', { self: this });
  },
});
