const IO = require('socket.io-client');
const Readline = require('readline');

const ReadInterface = Readline.createInterface({ input: process.stdin, output: process.stdout });
const ServerIO = IO('http://localhost:3000');
const EldermudIO = IO('http://localhost:3000/realm/eldermud');

ServerIO.on('request', (event, cb) => {
  cb(new Date().getTime());
});
// ServerIO.on('connect', () => {});
// ServerIO.on('reconnect', () => {});
// ServerIO.on('disconnect', (reason) => {
//   if (reason === 'io server disconnect') {
//     // Need to manually re-connect
//   }
// });

let query = '';

const clearLine = () => {
  process.stdout.clearLine();
};

const write = (text, suffix = '> ') => {
  clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(`${suffix}${text}`);
};

const writeLine = (line) => {
  clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(`${line}\n`);
  write(query);
};

process.stdin.on('keypress', (chunk, key) => {
  switch (key.name) {
    case 'return':
      EldermudIO.emit('input', { type: 'text', payload: { text: query } });
      query = '';
      write(query);
      break;
    case 'backspace':
      query = query.slice(0, -1);
      break;
    default:
      if (!key.code) {
        query += chunk;
      }
      break;
  }
});

// const userAction = () => {
//   ReadInterface.question(`> ${query}`, (text) => {
//     EldermudIO.emit('input', { type: 'text', payload: { text: query } });
//     query = '';
//     userAction();
//   });
// };

EldermudIO.on('connect', () => {
  write(query);
});

EldermudIO.on('output', (event) => {
  switch (event.type.toLowerCase()) {
    case 'info':
      writeLine(`==== ${event.payload.text} ====`);
      break;
    case 'speach':
      writeLine(`# ${event.payload.text}`);
      break;
    case 'brief':
      writeLine(`| ${event.payload.name}`);
      writeLine(`| ${event.payload.description}`);
      writeLine(`| Exits: ${Object.keys(event.payload.exits).join(', ')}`);
      break;
    default:
      break;
  }
});
