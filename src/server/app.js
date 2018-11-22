const Server = require('./core/server');
// const NavigationPlugin = require('./plugin/navigation.plugin');

(async () => {
  // await Server.register(NavigationPlugin);
  const server = new Server();
  const chatRealm = server.addRealm('chat');
  const chatStream = chatRealm.addStream('chat');

  chatStream.addEventListener('auth::say', (userId, payload) => {
    return Boolean(payload.text && payload.text.length);
  });

  chatStream.addEventListener('do::say', async (userId, payload) => {
    await new Promise(res => setTimeout(res, 2000));
    chatRealm.broadcastFrom(userId, payload.text);
  });

  server.start(3000);
})();
