const Readline = require('readline');
const ReadInterface = Readline.createInterface({ input: process.stdin, output: process.stdout });
const SocketClient = require('socket.io-client')('http://localhost:3000');


const userAction = () => {
  ReadInterface.question('> ', (cmd) => {
    SocketClient.emit('cmd', cmd);
    userAction();
  });
};

SocketClient.on('connect', () => {
  userAction();
});

SocketClient.on('reconnect', () => {
});

SocketClient.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    // Need to manually re-connect
  }
});


// A request expects a response (via cb)
SocketClient.on('request', (event, cb) => {
  cb();
});

SocketClient.on('data', (event) => {

});

SocketClient.on('info', (event) => {
  console.log(event.message);
});

