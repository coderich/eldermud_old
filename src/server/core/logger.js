const _ = require('lodash');
const Stringify = require('json-stringify-safe');

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
    const realTags = _.uniq(_.flatten(_.concat([], level, msg ? tags : null)));
    const realMsg = msg || tags;
    const logMsg = realMsg instanceof Error ? Stringify(realMsg.stack) : realMsg;
    console.log(realTags, logMsg);
  },
};

exports.trace = (tags, msg) => internals.log('trace', tags, msg);
exports.debug = (tags, msg) => internals.log('debug', tags, msg);
exports.info = (tags, msg) => internals.log('info', tags, msg);
exports.warn = (tags, msg) => internals.log('warn', tags, msg);
exports.error = (tags, msg) => internals.log('error', tags, msg);
exports.fatal = (tags, msg) => internals.log('fatal', tags, msg);
