const IO = require('socket.io-client');
const Readline = require('readline');

const ReadInterface = Readline.createInterface({ input: process.stdin, output: process.stdout });
const ServerIO = IO('http://localhost:3000');
const EldermudIO = IO('http://localhost:3000/eldermud');

const userAction = () => {
  ReadInterface.question('> ', (text) => {
    EldermudIO.emit('intent', { type: 'text', payload: { text } });
    userAction();
  });
};

ServerIO.on('connect', () => {
});

ServerIO.on('reconnect', () => {
});

ServerIO.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    // Need to manually re-connect
  }
});


EldermudIO.on('connect', () => {
  userAction();
});

EldermudIO.on('data', (event) => {
  console.log(event);
});
