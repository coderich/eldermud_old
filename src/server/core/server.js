const _ = require('lodash');
const SocketIO = require('socket.io');
const Realm = require('./realm');
const Store = require('./store');

module.exports = class Server {
  constructor(options = {}) {
    this.started = false;
    this.realms = new Set();
    this.IO = new SocketIO(options);

    this.store = new Store({
      clients: (clients = {}, action) => {
        switch (action.type.toUpperCase()) {
          case 'CLIENT_CONNECT':
            return Object.assign({}, clients, { [action.payload.clientId]: { loggedIn: false } });
          case 'CLIENT_DISCONNECT':
            return _.omit(clients, action.payload.clientId);
          case 'CLIENT_LOGIN':
            return Object.assign({}, clients, { [action.payload.clientId]: { loggedIn: true, user: action.payload.user } });
          case 'CLIENT_LOGOUT':
            return Object.assign({}, clients, { [action.payload.clientId]: { loggedIn: false } });
          default: {
            return clients;
          }
        }
      },
    });
  }

  addRealm(namespace, options) {
    if (!namespace) throw new Error('Server.addRealm requires a namespace');
    if (this.realms.has(namespace)) throw new Error(`Server.addRealm namespace "${namespace}" already in use`);

    this.realms.add(namespace);
    return new Realm(this.IO, namespace, options);
  }

  async start(port, options = {}) {
    if (!port) throw new Error('Server.start must specify a port');
    if (this.started) return; this.started = true;

    this.IO.attach(port, options).on('connection', (socket) => {
      this.store.dispatch({
        type: 'CLIENT_CONNECT',
        payload: { clientId: socket.client.id },
      });

      socket.emit('request', { type: 'auth' }, (res) => {
        this.store.dispatch({
          type: 'CLIENT_LOGIN',
          payload: { clientId: socket.client.id, user: { id: res } },
        });
      });

      socket.on('logout', (reason) => {
        this.store.dispatch({
          type: 'CLIENT_LOGOUT',
          payload: { clientId: socket.client.id },
        });
      });

      socket.on('disconnect', (reason) => {
        this.store.dispatch({
          type: 'CLIENT_DISCONNECT',
          payload: { clientId: socket.client.id },
        });
      });
    });
  }
};
