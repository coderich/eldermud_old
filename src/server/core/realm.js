const Store = require('./store');
const CoreStream = require('./stream');

module.exports = class Realm {
  constructor(IO, namespace, options = {}) {
    this.streams = {};
    this.namespace = namespace;

    this.realm = IO.of(`/${namespace}`).on('connection', (socket) => {
      socket.on('input', (input) => {
        if (this.translator) this.translator(input).forEach(intent => this.streams[intent.stream].process(socket.id, intent));
      });

      socket.on('disconnect', (reason) => {
        socket.removeAllListeners();
      });
    });
  }

  setTranslator(cb) {
    this.translator = cb;
  }

  createStore(reducers, options) { // eslint-disable-line
    return new Store(reducers, options);
  }

  addStream(name, options) {
    this.streams[name] = new CoreStream(options);
    return this.streams[name];
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
