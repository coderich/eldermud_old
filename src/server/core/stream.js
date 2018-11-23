// const Logger = require('./logger');

module.exports = class Stream {
  constructor(options = { queueSize: 0, canInterrupt: false }) {
    this.listeners = {};
    this.queues = {};
    this.options = options;
  }

  addEventListener(event, fn) {
    const [type, action] = event.toLowerCase().split('::');

    switch (type) {
      case 'auth': case 'prep':
        if (fn.constructor.name === 'AsyncFunction') throw new Error(`Event listener for "${event}" must be synchronous`);
        break;
      case 'do': break;
      default: throw new Error(`Event type "${type}" not supported`);
    }

    const fqn = `${type}::${action}`;
    this.listeners[fqn] = this.listeners[fqn] || new Set();
    this.listeners[fqn].add(fn);
  }

  removeEventListener(event, fn) {
    this.listeners[event].delete(fn);
  }

  async process(userId, action) {
    this.queues[userId] = this.queues[userId] || [];
    if (this.queues[userId].length > this.options.queueSize) return;
    this.queues[userId].push(action);

    // Listeners which may want to prevent this intent from becoming an action
    const auth = [...this.listeners[`auth::${action.type}`] || new Set()].reduce((prev, fn) => {
      return prev && fn(userId, action.payload);
    }, true);

    if (auth) {
      // Listeners responsible preparing/altering the payload (which becomes the action)
      const payload = [...this.listeners[`prep::${action.type}`] || new Set()].reduce((prev, fn) => {
        return fn(userId, action.payload, prev);
      }, Object.assign({}, action.payload));

      // Listeners responsible for performing the action (async and in parallel. eg. Move & Save Position)
      await Promise.all([...this.listeners[`do::${action.type}`] || new Set()].map(fn => fn(userId, payload)));
    }

    this.queues[userId].shift();
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
