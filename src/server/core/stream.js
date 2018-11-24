const Logger = require('./logger');

const types = ['auth', 'prep', 'do'];

module.exports = class Stream {
  constructor(options = { queueSize: 0, canInterrupt: false }) {
    this.listeners = {};
    this.queues = {};
    this.options = options;
  }

  addEventListener(event, fn) {
    const [type, action] = event.toLowerCase().split('::');
    const fqn = `${type}::${action}`;

    // Validation
    if (types.indexOf(type) === -1) return Logger.error(new Error(`Unknown stream type "${type}"`));
    if ((type === 'auth' || type === 'prep') && fn.constructor.name === 'AsyncFunction') return Logger.error(new Error(`Event listener for "${event}" must be synchronous`));

    // Add listener
    this.listeners[fqn] = this.listeners[fqn] || new Set();
    this.listeners[fqn].add(fn);

    return () => this.listeners[event].delete(fn); // unsubcribe
  }

  async process(userId, intent) {
    this.queues[userId] = this.queues[userId] || [];
    if (this.queues[userId].length > this.options.queueSize) return;
    this.queues[userId].push(intent);

    // Listeners which may want to prevent this intent from becoming an action
    const auth = [...this.listeners[`auth::${intent.type}`] || new Set()].reduce((prev, fn) => {
      return prev && fn(userId, intent.payload);
    }, true);

    if (auth) {
      // Listeners responsible preparing/altering the payload (which becomes the action)
      const payload = [...this.listeners[`prep::${intent.type}`] || new Set()].reduce((prev, fn) => {
        return fn(userId, intent.payload, prev);
      }, Object.assign({}, intent.payload));

      // Listeners responsible for performing the action (async and in parallel. eg. Move & Save Position)
      await Promise.all([...this.listeners[`do::${intent.type}`] || new Set()].map(fn => fn(userId, payload)));
    }

    this.queues[userId].shift();
  }
};
