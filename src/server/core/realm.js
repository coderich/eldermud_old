const CoreStream = require('./stream');

module.exports = class Realm {
  constructor(IO, namespace, options = {}) {
    this.streams = {};
    this.namespace = namespace;

    this.realm = IO.of(`/${namespace}`).on('connection', (socket) => {
      socket.streams = {};

      socket.on('intent', (intent) => {
        const streamName = intent.stream;

        // Ensure stream definition exists and is created
        if (!this.streams[streamName]) throw new Error(`Stream "${streamName}" not found in Realm "${this.namespace}"`);

        this.streams[streamName].process(socket.id, intent);
      });

      socket.on('disconnect', (reason) => {
        socket.removeAllListeners();
      });
    });
  }

  addStream(name, options) {
    const stream = new CoreStream(options);
    this.streams[name] = stream;
    return stream;
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
