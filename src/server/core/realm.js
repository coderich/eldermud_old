const Logger = require('./logger');
const Store = require('./store');
const CoreStream = require('./stream');

module.exports = class Realm {
  constructor(options = {}) {
    this.streams = {};
    this.started = false;
    this.options = options;
  }

  setTranslator(cb) {
    this.translator = cb;
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

  start(namespace, server, reducers) {
    if (this.started) return; this.started = true;

    this.store = new Store(reducers);

    this.realm = server.getNamespace(`/realm/${namespace}`).on('connection', (socket) => {
      const client = Object.assign({}, server.getClient(socket.client.id), { socketId: socket.id });

      this.store.dispatch({
        type: 'CLIENT_CONNECT',
        payload: client,
      });

      socket.on('disconnect', (reason) => {
        socket.removeAllListeners();

        this.store.dispatch({
          type: 'CLIENT_DISCONNECT',
          payload: client,
        });
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
