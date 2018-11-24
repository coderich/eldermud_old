const Logger = require('./logger');
const Store = require('./store');
const CoreStream = require('./stream');

module.exports = class Realm {
  constructor(server, namespace, options = {}) {
    this.stores = {};
    this.streams = {};

    this.realm = server.getNamespace(`/${namespace}`).on('connection', (socket) => {
      socket.on('input', (input) => {
        if (this.translator) {
          this.translator(input).forEach((intent) => {
            if (this.streams[intent.stream]) {
              this.streams[intent.stream].process(socket.id, intent);
            } else {
              Logger.error(new Error(`Unable to find stream "${intent.stream}"`));
            }
          });
        }
      });

      socket.on('disconnect', (reason) => {
        socket.removeAllListeners();
      });
    });
  }

  setTranslator(cb) {
    this.translator = cb;
  }

  addStore(name, reducers, options) {
    this.stores[name] = new Store(reducers, options);
    return this.stores[name];
  }

  getStore(name) {
    return this.stores[name];
  }

  remStore(name) {
    try {
      this.store[name].purge();
      delete this.stores[name];
    } catch (e) {
      Logger.error(e);
    }
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

  broadcastTo(socketId, message) {
    if (this.realm.connected[socketId]) this.realm.connected[socketId].emit('output', message);
  }

  broadcastFrom(socketId, message) {
    Object.keys(this.realm.connected).forEach((sid) => {
      const socket = this.realm.connected[sid];
      if (socket.id !== socketId) socket.emit('output', message);
    });
  }
};
