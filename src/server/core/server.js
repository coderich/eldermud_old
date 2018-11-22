const SocketIO = require('socket.io');
const CoreStream = require('./stream');

module.exports = class Server {
  constructor(options = {}) {
    this.IO = new SocketIO(options);
    this.started = false;
    this.connections = new Set();
    this.namespaces = new Set();
    this.streams = new Set();
  }

  createRealm(namespace, options) {
    if (!namespace) throw new Error('Server.createRealm requires a namespace');
    if (this.namespaces.has(namespace)) throw new Error(`Server.createRealm namespace "${namespace}" already in use`);
    // return new CoreStream(this.IO, namespace, options);
  }

  destroyRealm() {

  }

  createStream(name, options = {}) {
    if (this.started) throw new Error('Server.createStream must be called before the server has started');
    this.streams.add({ name, options });
  }

  start(port, options = {}) {
    if (!port) throw new Error('Server.start must specify a port');
    if (this.started) return; this.started = true;

    this.IO.attach(port, options).on('connection', socket => {
      // Attach streams to socket
      socket.streams = [...this.streams].reduce((prev, curr) => {
        prev[curr.name] = new CoreStream(curr.options);
        return prev;
      }, {});

      socket.on('intent', (intent) => {

      });

      // Handle disconnect
      socket.on('disconnect', (reason) => {
        console.log('disconnect');
      });

      // socket.emit('request', { type: 'auth' }, (res) => {
      //   user.id = this.users.length;

      //   if (this.users.get(user)) {
      //     socket.emit('info', { type: 'error', message: 'You are already logged into the server!' });
      //     socket.disconnect(true);
      //   } else {
      //     socket.emit('info', { type: 'success', message: 'Welcome to ElderMud!' });
      //     socket.user = this.users.add(user);
      //   }
      // });
    });
  }
};
