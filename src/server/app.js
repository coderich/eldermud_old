const Server = require('./core/server');

(async () => {
  const server = new Server();
  const eldermudRealm = server.addRealm('eldermud');
  const chatStream = eldermudRealm.addStream('chat');

  eldermudRealm.subscribe((message) => {
    const { text } = message.payload;
    const index = text.indexOf(' ');
    const intent = text.substr(0, index).trim();
    const phrase = text.substr(index).trim();

    return {
      intent,
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
