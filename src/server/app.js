const _ = require('lodash');
const Chokidar = require('chokidar');
const { Server, Store } = require('./core');

// The application path we wish to watch
const appPath = `${__dirname}/app`;

const requireModule = (path) => {
  delete require.cache[require.resolve(path)];
  return require(path); // eslint-disable-line
};

const getDefaultInfo = (path) => {
  if (!path) return {};

  return {
    absolutePath: path,
    relativePath: path.substr(appPath.length),
    get realmName() { return this.relativePath.split('/')[1]; },
    get streamName() { return this.relativePath.split('/')[2]; },
    get subject() { return this.relativePath.split('/').pop(); },
  };
};

// A redux store to manage state
const store = new Store({
  server: (state = new Server(), action) => {
    return state;
  },

  config: (state = { port: 3000 }, action) => {
    return state;
  },

  realms: (state = {}, action) => {
    const { realmName, subject } = getDefaultInfo(action.payload);

    switch (`${action.type}-${subject}`) {
      case `addDir-${realmName}`:
        return Object.assign({}, state, { [subject]: action.meta.state.server.addRealm(subject) });
      case `unlinkDir-${realmName}`:
        return _.omit(state, subject);
      default:
        return state;
    }
  },

  streams: (state = {}, action) => {
    const { realmName, streamName, subject } = getDefaultInfo(action.payload);

    switch (`${action.type}-${subject}`) {
      case `addDir-${streamName}`:
        return Object.assign({}, state, { [subject]: action.meta.state.realms[realmName].addStream(subject) });
      case `unlinkDir-${streamName}`:
        return _.omit(state, subject);
      default:
        return state;
    }
  },

  translator: (state = null, action) => {
    const { absolutePath, realmName, subject } = getDefaultInfo(action.payload);

    switch (`${action.type}-${subject}`) {
      case 'add-translate.js': case 'change-translate.js':
        action.meta.state.realms[realmName].setTranslator(requireModule(absolutePath));
        return absolutePath;
      case 'unlink-translate.js':
        action.meta.state.realms[realmName].setTranslator({});
        return null;
      default:
        return state;
    }
  },

  listeners: (state = {}, action) => {
    const { absolutePath, streamName, realmName, subject } = getDefaultInfo(action.payload); // eslint-disable-line
    const addListeners = (realm, stream, path) => Object.entries(requireModule(path)(realm)).map(([key, cb]) => stream.addEventListener(key, cb));
    const removeListeners = stream => [];

    switch (`${action.type}-${subject}`) {
      case 'add-listener.js':
        return Object.assign({}, state, { [streamName]: addListeners(action.meta.state.realms[realmName], action.meta.state.streams[streamName], absolutePath) });
      case 'unlink-listener.js':
        return Object.assign({}, state, { [streamName]: removeListeners() });
      default:
        return state;
    }
  },
});

// Watch for any changes to folder and dispatch an event
Chokidar.watch(`${appPath}/**`, { ignored: /(^|[/\\])\../, persistent: true }).on('all', (event, path) => {
  store.dispatch({
    type: event,
    payload: path,
    meta: { state: store.getState() },
  });
}).on('ready', () => {
  // All configurations has been loaded, start the server
  const { server, config } = store.getState();
  server.start(config.port);
});
