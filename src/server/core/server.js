const _ = require('lodash');
const SocketIO = require('socket.io');
const Logger = require('./logger');
const Store = require('./store');

module.exports = class Server {
  constructor(options = {}) {
    this.started = false;
    this.IO = new SocketIO(options);

    this.store = new Store({
      clients: (state = {}, action) => {
        const clientId = _.get(action, 'payload.clientId');

        switch (action.type.toUpperCase()) {
          case 'CLIENT_CONNECT':
            return Object.assign({}, state, { [clientId]: { clientId, loggedIn: false } });
          case 'CLIENT_DISCONNECT':
            return _.omit(state, clientId);
          case 'CLIENT_LOGIN':
            return Object.assign({}, state, { [clientId]: { clientId, loggedIn: true, user: action.payload.user } });
          case 'CLIENT_LOGOUT':
            return Object.assign({}, state, { [clientId]: { clientId, loggedIn: false } });
          default: {
            return state;
          }
        }
      },
    });
  }

  getClient(id) {
    return this.store.getState().clients[id];
  }

  getNamespace(namespace) {
    return this.IO.of(namespace);
  }

  async start(port, options = {}) {
    if (!port) Logger.error(new Error('Server.start must specify a port'));

    if (port && !this.started) {
      this.started = true;

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
          socket.removeAllListeners();

          this.store.dispatch({
            type: 'CLIENT_DISCONNECT',
            payload: { clientId: socket.client.id },
          });
        });
      });
    }
  }

  async stop() {
    this.IO.close();
  }
};
