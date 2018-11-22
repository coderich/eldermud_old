const IO = require('socket.io-client');
const Readline = require('readline');

const ReadInterface = Readline.createInterface({ input: process.stdin, output: process.stdout });
const ServerIO = IO('http://localhost:3000');
const ChatIO = IO('http://localhost:3000/chat');

const userAction = () => {
  ReadInterface.question('> ', (cmd) => {
    ChatIO.emit('intent', {
      intent: 'say',
      stream: 'chat',
      payload: {
        text: cmd,
      },
    });

    userAction();
  });
};

ServerIO.on('connect', () => {
  userAction();
});

ServerIO.on('reconnect', () => {
});

ServerIO.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    // Need to manually re-connect
  }
});

ServerIO.on('info', (event) => {
  console.log(event.message);
});


ChatIO.on('data', (event) => {
  console.log(event);
});
