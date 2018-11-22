const internals = {
  map: {
    trace: 'log',
    debug: 'log',
    info: 'log',
    warn: 'warn',
    error: 'error',
    fatal: 'error',
  },
  log: (level, tags, msg) => {
    console.log(tags, msg);
  },
};

exports.trace = (tags, msg) => internals.log('trace', tags, msg);
exports.debug = (tags, msg) => internals.log('debug', tags, msg);
exports.info = (tags, msg) => internals.log('info', tags, msg);
exports.warn = (tags, msg) => internals.log('warn', tags, msg);
exports.error = (tags, msg) => internals.log('error', tags, msg);
exports.fatal = (tags, msg) => internals.log('fatal', tags, msg);
