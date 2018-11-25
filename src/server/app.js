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

    configs: (state = [], action) => {
      const { absolutePath, realmName, subject } = getDefaultInfo(action.payload);

      switch (`${action.type}-${subject}`) {
        case 'add-config.json':
          return [...state, { realmName, config: JSON.parse(FS.readFileSync(absolutePath)) }];
        case 'unlink-config.json':
          return _.filter(state, { realmName });
        case 'change-config.json':
          return [..._.filter(state, { realmName }), { realmName, config: JSON.parse(FS.readFileSync(absolutePath)) }];
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
      const { absolutePath, realmName, subject } = getDefaultInfo(action.payload);

      switch (`${action.type}-${subject}`) {
        case 'add-listeners.js':
          return [...state, { realmName, listeners: requireModule(absolutePath) }];
        case 'unlink-listeners.js':
          return _.filter(state, { realmName });
        case 'change-listeners.js':
          return [..._.filter(state, { realmName }), { realmName, listeners: requireModule(absolutePath) }];
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
      try {
        const { configs, realms, translators, reducers, listeners } = store.getState(); // eslint-disable-line

        // Realms
        realms.forEach((realmName) => {
          try {
            const app = requireModule(`${appPath}/${realmName}/app`);
            const config = _.get(_.find(configs, { realmName }), 'config');
            const translator = _.get(_.find(translators, { realmName }), 'translator');
            const reducer = _.get(_.find(reducers, { realmName }), 'reducers');
            const listener = _.get(_.find(listeners, { realmName }), 'listeners');

            // Validation
            if (!app) throw new Error(`No app found for realm "${realmName}"`);
            if (!config) throw new Error(`No config found for realm "${realmName}"`);
            if (!reducer) throw new Error(`No reducers found for realm "${realmName}"`);
            if (!translator) throw new Error(`No translator found for realm "${realmName}"`);
            if (!listener) throw new Error(`No listener found for realm "${realmName}"`);

            // Create Server & Realm
            const server = new Server();
            const realm = new Realm(server, realmName);
            const streamListeners = listener(realm);
            realm.createStore(reducer(realm));
            realm.setTranslator(translator(realm));

            // Add Streams
            (config.streams || []).forEach(({ name: streamName, options }) => {
              const stream = realm.addStream(streamName, options);

              // Add Stream Listeners
              Object.entries(streamListeners[streamName]).forEach(([key, cb]) => {
                unsubscribes.push(stream.subscribeTo(key, cb));
              });
            });


            // Start the main server
            servers.push(server);
            server.start(config.server.port);

            // Pass off to the app
            app(realm);
          } catch (e) {
            Logger.error(e);
          }
        });

        // Listene for state change; rinse and repeat
        store.subscribe(() => {
          watcher.close();
          unsubscribes.forEach(unsubscribe => unsubscribe());
          servers.forEach(server => server.stop());
          servers = []; unsubscribes = [];
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
