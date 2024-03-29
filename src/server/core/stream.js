const Logger = require('./logger');

const types = ['auth', 'prep', 'do'];

module.exports = class Stream {
  constructor(options = { queueSize: 0, canInterrupt: false }) {
    this.queues = {};
    this.subscribers = {};
    this.options = options;
  }

  subscribeTo(key, cb) {
    const [type, action] = key.toLowerCase().split('::');
    const fqn = `${type}::${action}`;

    // Validation
    if (types.indexOf(type) === -1) return Logger.error(new Error(`Unknown stream type "${type}"`));
    if ((type === 'auth' || type === 'prep') && cb.constructor.name === 'AsyncFunction') return Logger.error(new Error(`Subscription to "${fqn}" must be a synchronous callback`));

    // Subscribe
    if (Object.prototype.hasOwnProperty.call(this.subscribers, fqn)) this.subscribers[fqn].push(cb);
    else this.subscribers[fqn] = [cb];
    return () => { this.subscribers[fqn] = this.subscribers[fqn].filter(s => s !== cb); }; // Unsubscribe
  }

  purge() {
    this.subscribers.forEach(unsubscribe => unsubscribe());
  }

  async process(intent, passthru = false) {
    const { clientId } = intent.meta;
    this.queues[clientId] = this.queues[clientId] || [];

    if (!passthru) {
      if (this.queues[clientId].length > this.options.queueSize) return;
      this.queues[clientId].push(intent);
      if (this.queues[clientId].length > 1) return;
    }

    try {
      // Subscriber which may want to prevent this intent from becoming an action
      const auth = [...this.subscribers[`auth::${intent.type}`] || new Set()].reduce((prev, fn) => {
        return prev && fn(intent);
      }, true);

      if (auth) {
        // Subscriber responsible preparing/altering the payload (which becomes the action)
        const action = [...this.subscribers[`prep::${intent.type}`] || new Set()].reduce((prev, fn) => {
          return fn(intent, prev);
        }, intent);

        // Subscriber responsible for performing the action (async and in parallel. eg. Move & Save Position)
        await Promise.all([...this.subscribers[`do::${intent.type}`] || new Set()].map(fn => fn(action)));
      }

      this.queues[clientId].splice(0, 1);
      const nextIntent = this.queues[clientId][0];
      if (nextIntent) this.process(nextIntent, true);
    } catch (e) {
      Logger.error(e);
      this.queues[clientId].splice(0, 1);
      const nextIntent = this.queues[clientId][0];
      if (nextIntent) this.process(nextIntent, true);
    }
  }
};
