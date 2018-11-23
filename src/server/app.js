const Chokidar = require('chokidar');
const { Server } = require('./core');

(async () => {
  const port = 3000;
  const appPath = `${__dirname}/app`;
  const server = new Server();

  const defaultWatch = (path) => {
    return Chokidar.watch(`${path}/*`, {
      ignored: /(^|[/\\])\../,
      persistent: true,
      depth: 0,
    });
  };

  const requireModule = (path) => {
    delete require.cache[require.resolve(path)];
    return require(path); // eslint-disable-line
  };

  const onRealmChange = (path) => {
    const name = path.split('/').pop().toLowerCase();
    return server.addRealm(name);
  };

  const onTranslateChange = (realm, path) => {
    realm.setTranslator(requireModule(path));
  };

  const onStreamChange = (realm, path) => {
    const name = path.split('/').pop().toLowerCase();
    return realm.addStream(name);
  };

  const onListenerChange = (realm, stream, path) => {
    const listeners = requireModule(path)(realm);

    Object.keys(listeners).forEach((key) => {
      stream.addEventListener(key, listeners[key]);
    });
  };

  const onConfigChange = (realm, path) => {
    const file = path.split('/').pop().toLowerCase();

    switch (file) {
      case 'translate.js':
        return onTranslateChange(realm, path);
      case 'config.json':
        break;
      default:
        break;
    }
  };

  defaultWatch(appPath).on('addDir', (realmPath) => {
    const realm = onRealmChange(realmPath);

    defaultWatch(realmPath).on('add', (configPath) => {
      onConfigChange(realm, configPath);
    }).on('addDir', (streamPath) => {
      const stream = onStreamChange(realm, streamPath);

      defaultWatch(streamPath).on('add', (listenerPath) => {
        onListenerChange(realm, stream, listenerPath);
      });
    });
  }).on('ready', () => {
    server.start(port);
  });

  // const eldermudStore = eldermudRealm.createStore({
  //   data: (state = {}, action) => {
  //     return Object.assign({}, state, action.payload);
  //   },
  // }, {
  //   persist: true,
  // });

  // eldermudStore.subscribeTo('data.name', (newVal, oldVal) => {
  //   console.log(newVal, oldVal);
  // });

  // eldermudStore.dispatch({
  //   type: 'blah',
  //   payload: { name: 'Richard' },
  // });

  // eldermudStore.dispatch({
  //   type: 'blah',
  //   payload: { name: 'Anthony' },
  // });

  // eldermudStore.dispatch({
  //   type: 'blah',
  //   payload: { name: 'Livolsi' },
  // });
})();
