const Logger = require('./logger');
const Store = require('./store');
const CoreStream = require('./stream');

module.exports = class Realm {
  constructor(server, namespace, options = {}) {
    this.server = server;
    this.namespace = namespace;
    this.options = options;
    this.streams = {};
    this.started = false;
  }

  setTranslator(cb) {
    this.translator = cb;
  }

  createStore(reducers) {
    this.store = new Store(reducers);
  }

  getStore() {
    return this.store;
  }

  addStream(name, options) {
    this.streams[name] = new CoreStream(options);
    return this.streams[name];
  }

  getStream(name) {
    return this.streams[name];
  }

  remStream(name) {
    try {
      this.streams[name].purge();
      delete this.streams[name];
    } catch (e) {
      Logger.error(e);
    }
  }

  broadcast(message) {
    this.realm.emit('output', message);
  }

  broadcastTo(socketIds, message) {
    (Array.isArray(socketIds) ? socketIds : [socketIds]).forEach(sid => this.realm.to(sid).emit('output', message));
  }

  broadcastFrom(socketId, message) {
    this.realm.connected[socketId].broadcast.emit('output', message);
  }

  start(cb) {
    if (this.started) return; this.started = true;

    this.realm = this.server.getNamespace(`/realm/${this.namespace}`).on('connection', (socket) => {
      const client = Object.assign({}, this.server.getClient(socket.client.id), { socketId: socket.id });

      // Notify app and store of client
      if (cb) cb('connection', client);

      socket.on('disconnect', (reason) => {
        socket.removeAllListeners();
        if (cb) cb('disconnect', client);
      });

      socket.on('input', (input) => {
        if (this.translator) {
          this.translator(input).forEach((intent) => {
            if (this.streams[intent.stream]) {
              this.streams[intent.stream].process(Object.assign(intent, { meta: client }));
            } else {
              Logger.error(new Error(`Unable to find stream "${intent.stream}"`));
            }
          });
        }
      });
    });
  }
};
