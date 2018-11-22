const Server = require('./core/server');
// const NavigationPlugin = require('./plugin/navigation.plugin');

(async () => {
  // await Server.register(NavigationPlugin);
  const server = new Server();
  server.start(3000);
})();
