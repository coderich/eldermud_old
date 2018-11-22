const FS = require('fs');
const Readline = require('readline');
const ReadInterface = Readline.createInterface({ input: process.stdin, output: process.stdout });
const user = FS.readFileSync('./src/data/user/user.json');
const region = FS.readFileSync('./src/data/region/atlanta.json');
let buffer = '';

Readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

// process.stdin.on('keypress', (ch, key) => {
//   buffer += ch;
//   console.log('keypress:', buffer);
//   if (key && key.ctrl && key.name === 'c') { process.exit(); }
// });

const writeLine = (line) => {
  console.log(line);
};

const getObviousExists = (room) => {
  const dirMap = { n: 'north', s: 'south', e: 'east', w: 'west' };
  return Object.keys(room.exits).map(d => dirMap[d]).join(', ');
};

const processHeroAction = (hero, action) => {
  switch (action.toLowerCase()) {
    case 'n': hero.room
  }
};

const userAction = () => {
  ReadInterface.question('---> ', (cmd) => {
    writeLine(`You perform ${cmd}`);
    userAction();
  });
};

const run = async () => {
  try {
    const hero = JSON.parse(user);
    const map = JSON.parse(region);
    const room = map.rooms[hero.room];

    writeLine(`You are in a little town called ${map.name}`);
    writeLine(`You are currently stading in ${room.name}`);
    writeLine(`Obvious exits: ${getObviousExists(room)}`);

    userAction();
  } catch (e) {
    console.log('Fatal error parsing content:', e);
  }
};

run();
