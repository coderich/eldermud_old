const _ = require('lodash');
const FS = require('fs');
const Chokidar = require('chokidar');
const { Server, Realm, Store, Logger } = require('./core'); // eslint-disable-line

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

    config: (state = null, action) => {
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

    reducers: (state = [], action) => {
      const { absolutePath, realmName, subject } = getDefaultInfo(action.payload);

      switch (`${action.type}-${subject}`) {
        case 'add-reducers.js':
          return [...state, { realmName, reducers: requireModule(absolutePath) }];
        case 'unlink-reducers.js':
          return _.filter(state, { realmName });
        case 'change-reducers.js':
          return [..._.filter(state, { realmName }), { realmName, reducers: requireModule(absolutePath) }];
        default:
          return state;
      }
    },

    listeners: (state = [], action) => {
      const { absolutePath, streamName, realmName, subject } = getDefaultInfo(action.payload); // eslint-disable-line

      switch (`${action.type}-${subject}`) {
        case 'add-listeners.js':
          return [...state, { realmName, streamName, listener: requireModule(absolutePath) }];
        case 'unlink-listeners.js':
          return _.filter(state, { realmName, streamName });
        case 'change-listeners.js':
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
  let unsubscribes = [];
  const server = new Server();
  const store = makeStore();
  const watcher = watch(store);

  store.subscribeTo('app', (newVal, oldVal) => {
    if (newVal === 'ready') {
      try {
        const { config, realms, translators, reducers, streams, listeners } = store.getState(); // eslint-disable-line

        // Validation
        if (!config) throw new Error('No configuration file found');

        // Realms
        realms.forEach((realmName) => {
          try {
            const translator = _.get(_.find(translators, { realmName }), 'translator');
            const reducer = _.get(_.find(reducers, { realmName }), 'reducers');

            // Validation
            if (!reducer) throw new Error(`No reducers found for realm "${realmName}"`);
            if (!translator) throw new Error(`No translator found for realm "${realmName}"`);

            // Create Realm
            const realm = new Realm(server, realmName);
            realm.setTranslator(translator(realm));
            realm.addStore('app', reducer(realm), config.store);

            // Add Streams
            _.filter(streams, { realmName }).forEach(({ streamName }) => {
              const stream = realm.addStream(streamName, _.get(config, `streams.${streamName}`));

              // Add Stream Listeners
              _.filter(listeners, { realmName, streamName }).forEach(({ listener }) => {
                unsubscribes = Object.entries(listener(realm)).map(([key, cb]) => stream.subscribeTo(key, cb));
              });
            });
          } catch (e) {
            Logger.error(e);
          }
        });

        // Start the server
        server.start(config.server.port);

        // Listene for state change; rinse and repeat
        store.subscribe(() => {
          unsubscribes.forEach(unsubscribe => unsubscribe());
          server.stop();
          watcher.close();
          unsubscribes = [];
          start();
        });
      } catch (e) {
        Logger.error(e);
      }
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
