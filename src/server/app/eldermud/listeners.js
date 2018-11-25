const _ = require('lodash');

module.exports = (realm) => {
  const store = realm.getStore();
  const timeout = ms => new Promise(res => setTimeout(res, ms));
  const getPlayer = intent => store.getState().players[intent.meta.clientId];
  const getMap = intent => _.find(store.getState().maps, { id: getPlayer(intent).location.map });
  const getRoom = intent => getMap(intent).rooms[String(getPlayer(intent).location.room)];

  return {
    chat: {
      'auth::gos': (intent) => {
        return Boolean(intent.payload.text && intent.payload.text.length);
      },

      'do::gos': (intent) => {
        realm.broadcastFrom(intent.meta.socketId, {
          type: 'speach',
          payload: { text: `(GOSSIP) ${intent.meta.socketId} says: ${intent.payload.text}` },
        });
      },

      'do::say': async (intent) => {
        const player = getPlayer(intent);
        const players = Object.values(store.getState().players);
        const otherPlayers = _.reject(_.filter(players, { location: player.location }), { id: player.id });

        otherPlayers.forEach((op) => {
          realm.broadcastTo(op.client.socketId, {
            type: 'speach',
            payload: { text: `${getPlayer(intent).client.clientId} says: ${intent.payload.text}` },
          });
        });
      },

      'do::return': async (intent) => {
        const { location } = getPlayer(intent);
        const room = getMap(intent).rooms[location.room];
        realm.broadcastTo(intent.meta.socketId, { type: 'brief', payload: room });
      },
    },

    combat: {
      'do::a': async (intent) => {
        await timeout(1500);

        realm.broadcastFrom(intent.meta.socketId, {
          type: 'info',
          payload: { text: 'You are being attacked(ish)!!!' },
        });
      },
    },

    navigation: {
      'do::move': async (intent) => {
        const room = getRoom(intent);
        const player = getPlayer(intent);
        const players = Object.values(store.getState().players);
        const otherPlayers = _.reject(_.filter(players, { location: player.location }), { id: player.id });
        const direction = intent.payload;

        if (room.exits[direction]) {
          await timeout(500);
          player.location.room = room.exits[direction];
          store.dispatch({ type: 'UPDATE_PLAYER', payload: player });

          const newPlayers = _.reject(_.filter(players, { location: player.location }), { id: player.id });

          otherPlayers.forEach((op) => {
            realm.broadcastTo(op.client.socketId, {
              type: 'info',
              payload: { text: `${getPlayer(intent).client.clientId} has left to the ${direction.toUpperCase()}` },
            });
          });

          newPlayers.forEach((op) => {
            realm.broadcastTo(op.client.socketId, {
              type: 'info',
              payload: { text: `${getPlayer(intent).client.clientId} walks into the room!` },
            });
          });
        } else {
          realm.broadcastTo(intent.meta.socketId, {
            type: 'info',
            payload: { text: 'You walk into a wall!' },
          });
        }
      },
    },
  };
};
