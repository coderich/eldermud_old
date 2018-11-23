const CoreStream = require('./stream');

module.exports = class Realm {
  constructor(IO, namespace, options = {}) {
    this.streams = {};
    this.listeners = [];
    this.namespace = namespace;

    this.realm = IO.of(`/${namespace}`).on('connection', (socket) => {
      socket.on('intent', (intent) => {
        this.listeners.map(listener => listener(intent)).forEach((action) => {
          this.streams[action.stream].process(socket.id, action);
        });
      });

      socket.on('disconnect', (reason) => {
        socket.removeAllListeners();
      });
    });
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => { this.listeners = this.listeners.filter(l => l !== listener); }; // unsubscribe
  }

  addStream(name, options) {
    this.streams[name] = new CoreStream(options);
    return this.streams[name];
  }

  broadcast(message) {
    this.realm.emit('data', message);
  }

  broadcastTo(socketId, message) {
    if (this.realm.connected[socketId]) this.realm.connected[socketId].emit('data', message);
  }

  broadcastFrom(socketId, message) {
    Object.keys(this.realm.connected).forEach((sid) => {
      const socket = this.realm.connected[sid];
      if (socket.id !== socketId) socket.emit('data', message);
    });
  }
};
