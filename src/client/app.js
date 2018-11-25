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


const userAction = () => {
  ReadInterface.question('> ', (text) => {
    EldermudIO.emit('input', { type: 'text', payload: { text } });
    userAction();
  });
};

EldermudIO.on('connect', () => {
  userAction();
});

EldermudIO.on('output', (event) => {
  switch (event.type.toLowerCase()) {
    case 'info':
      console.log(event.payload.text);
      break;
    case 'brief':
      console.log(event.payload.name);
      console.log(event.payload.description);
      console.log('Exits: ', event.payload.exits);
      break;
    default:
      break;
  }
});
