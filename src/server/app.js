const _ = require('lodash');
const FS = require('fs');
const Chokidar = require('chokidar');
const { Server, Store, Logger } = require('./core');

// The application path we wish to watch
const appPath = `${__dirname}/app`;

const requireModule = (path) => {
  delete require.cache[require.resolve(path)];
  return require(path); // eslint-disable-line
};

const getDefaultInfo = (path) => {
  try {
    return {
      absolutePath: path,
      relativePath: path.substr(appPath.length),
      get realmName() { return this.relativePath.split('/')[1]; },
      get streamName() { return this.relativePath.split('/')[2]; },
      get subject() { return this.relativePath.split('/').pop(); },
    };
  } catch (e) {
    return {};
  }
};

// A redux store to manage state
const makeStore = () => {
  return new Store({
    app: (state = '', action) => {
      if (action.type === 'app') return action.payload;
      return state;
    },

    config: (state = {}, action) => {
      const { absolutePath, subject } = getDefaultInfo(action.payload);

      switch (`${action.type}-${subject}`) {
        case 'add-config.json': case 'change-config.json':
          return JSON.parse(FS.readFileSync(absolutePath));
        case 'unlink-config.json':
          return {};
        default:
          return state;
      }
    },

    realms: (state = [], action) => {
      const { realmName, subject } = getDefaultInfo(action.payload);

      switch (`${action.type}-${subject}`) {
        case `addDir-${realmName}`:
          return [...state, realmName];
        case `unlinkDir-${realmName}`:
          return _.filter(state, realmName);
        default:
          return state;
      }
    },

    streams: (state = [], action) => {
      const { realmName, streamName, subject } = getDefaultInfo(action.payload);

      switch (`${action.type}-${subject}`) {
        case `addDir-${streamName}`:
          return [...state, { streamName, realmName }];
        case `unlinkDir-${streamName}`:
          return _.filter(state, { streamName });
        default:
          return state;
      }
    },

    translators: (state = [], action) => {
      const { absolutePath, realmName, subject } = getDefaultInfo(action.payload);

      switch (`${action.type}-${subject}`) {
        case 'add-translator.js':
          return [...state, { realmName, translator: requireModule(absolutePath) }];
        case 'unlink-translator.js':
          return _.filter(state, { realmName });
        case 'change-translator.js':
          return [..._.filter(state, { realmName }), { realmName, translator: requireModule(absolutePath) }];
        default:
          return state;
      }
    },

    listeners: (state = [], action) => {
      const { absolutePath, streamName, realmName, subject } = getDefaultInfo(action.payload); // eslint-disable-line

      switch (`${action.type}-${subject}`) {
        case 'add-listener.js':
          return [...state, { realmName, streamName, listener: requireModule(absolutePath) }];
        case 'unlink-listener.js':
          return _.filter(state, { realmName, streamName });
        case 'change-listener.js':
          return [..._.filter(state, { realmName, streamName }), { realmName, streamName, listener: requireModule(absolutePath) }];
        default:
          return state;
      }
    },
  });
};

const watch = (store) => {
  return Chokidar.watch(`${appPath}/**`, { ignored: /(^|[/\\])\../, persistent: true }).on('all', (event, path) => {
    store.dispatch({
      type: event,
      payload: path,
    });
  }).on('ready', () => {
    store.dispatch({
      type: 'app',
      payload: 'ready',
    });
  });
};

const start = () => {
  let [servers, unsubscribes] = [[], []];
  const store = makeStore();
  const watcher = watch(store);

  store.subscribeTo('app', (newVal, oldVal) => {
    if (newVal === 'ready') {
      const { config, realms, translators, streams, listeners } = store.getState(); // eslint-disable-line

      // Realms
      realms.forEach((realmName) => {
        const server = new Server();
        const realm = server.addRealm(realmName);
        realm.setTranslator(_.get(_.find(translators, { realmName }), 'translator'));

        // Streams
        _.filter(streams, { realmName }).forEach(({ streamName }) => {
          const stream = realm.addStream(streamName, _.get(config, `streams.${streamName}`));

          // Listeners
          _.filter(listeners, { realmName, streamName }).forEach(({ listener }) => {
            unsubscribes = Object.entries(listener(realm)).map(([key, cb]) => stream.addEventListener(key, cb));
          });
        });

        // Save references
        servers.push(server);
        server.start(config.server.port);
      });

      store.subscribe(() => {
        servers.forEach(server => server.stop());
        unsubscribes.forEach(unsubscribe => unsubscribe());
        watcher.close();
        servers = [];
        unsubscribes = [];
        start();
      });
    }
  });
};

process.on('unhandledRejection', (e) => {
  Logger.error(['unhandledRejection'], e);
});

process.on('uncaughtException', (e) => {
  Logger.error(['uncaughtException'], e);
});

start();
