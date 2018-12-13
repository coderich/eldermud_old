const _ = require('lodash');
const FS = require('fs');
const MapModel = require('./model/map.model');
const RoomModel = require('./model/room.model');
const PlayerModel = require('./model/player.model');

module.exports = async (realm) => {
  const subscribers = {};
  const store = realm.getStore();
  const Map = MapModel(realm);
  const Room = RoomModel(realm);
  const Player = PlayerModel(realm);

  realm.getModel = (modelName, ...args) => {
    switch (modelName.toUpperCase()) {
      case 'MAP': return new Map(...args);
      case 'ROOM': return new Room(...args);
      case 'PLAYER': return new Player(...args);
      default: return null;
    }
  };

  // Load our map into state
  store.dispatch({
    type: 'ADD_MAP',
    payload: JSON.parse(FS.readFileSync(`${__dirname}/data/map/atlanta.json`)),
  });

  realm.start((event, client) => {
    if (event === 'connection') {
      realm.broadcastTo(client.socketId, { type: 'info', payload: { text: 'Welcome to Eldermud!' } });

      const unsubscribe = store.subscribeTo(`players.${client.clientId}.location`, (location) => {
        const state = store.getState();
        const room = _.find(state.maps, { id: location.map }).rooms[location.room];
        realm.broadcastTo(client.socketId, { type: 'brief', payload: room });
      });

      subscribers[client.clientId] = [unsubscribe];
      store.dispatch({ type: 'ADD_PLAYER', payload: { id: client.clientId, client, location: { map: 'atlanta', room: 1 } } });
    } else if (event === 'disconnect') {
      subscribers[client.clientId].forEach(s => s());
      store.dispatch({ type: 'REMOVE_PLAYER', payload: { id: client.clientId } });
    }
  });
};
