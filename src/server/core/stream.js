const Events = require('./events');

module.exports = class Stream {
  constructor(options = { queueSize: 0, canInterrupt: false }) {
    this.eventListeners = new Set();
    this.options = options;
    this.queue = [];
  }

  addEventListener(event, fn) {
    this.eventListeners.add({ event, fn });
  }

  removeEventListener(event, fn) {
    this.eventListeners.delete({ event, fn });
  }

  // next() {

  // }

  // pause() {

  // }

  // resume() {

  // }

  // end() {

  // }
};
