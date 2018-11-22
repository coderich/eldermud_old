const SocketIO = require('socket.io');
const Realm = require('./realm');

module.exports = class Server {
  constructor(options = {}) {
    this.started = false;
    this.realms = new Set();
    this.IO = new SocketIO(options);
  }

  addRealm(namespace, options) {
    if (!namespace) throw new Error('Server.addRealm requires a namespace');
    if (this.realms.has(namespace)) throw new Error(`Server.addRealm namespace "${namespace}" already in use`);

    this.realms.add(namespace);
    return new Realm(this.IO, namespace, options);
  }

  start(port, options = {}) {
    if (!port) throw new Error('Server.start must specify a port');
    if (this.started) return; this.started = true;

    this.IO.attach(port, options).on('connection', (socket) => {
      // console.log(Object.keys(this.IO.of('/').connected));
      socket.client.streams = {};

      socket.on('disconnect', (reason) => {
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
