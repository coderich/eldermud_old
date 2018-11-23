const { Server } = require('./core');

(async () => {
  const server = new Server();
  const eldermudRealm = server.addRealm('eldermud');
  const chatStream = eldermudRealm.addStream('chat');
  const eldermudStore = eldermudRealm.createStore({
    data: (state = {}, action) => {
      return Object.assign({}, state, action.payload);
    },
  });

  eldermudStore.subscribe('data', (newVal, oldVal) => {
    console.log(newVal, oldVal);
  });

  eldermudStore.dispatch({
    type: 'blah',
    payload: {
      name: 'Richard',
    },
  });

  eldermudRealm.subscribe((intent) => {
    const { text } = intent.payload;
    const index = text.indexOf(' ');
    const type = text.substr(0, index).trim();
    const phrase = text.substr(index).trim();

    return {
      type,
      stream: 'chat',
      payload: { text: phrase },
    };
  });

  chatStream.addEventListener('auth::gos', (userId, payload) => {
    return Boolean(payload.text && payload.text.length);
  });

  chatStream.addEventListener('do::gos', async (userId, payload) => {
    eldermudRealm.broadcastFrom(userId, `Gossip: ${payload.text}`);
  });

  server.start(3000);
})();
