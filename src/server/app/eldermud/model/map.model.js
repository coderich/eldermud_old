const _ = require('lodash');

module.exports = realm => class Map {
  constructor(mapId) {
    this.id = mapId;
  }

  getAttributes() {
    return _.find(realm.getStore().getState().maps, { id: this.id });
  }

  getRoom(roomId) {
    return realm.getModel('ROOM', this.id, roomId);
  }

  getRooms() {
    return this.getAttributes().rooms.map(roomId => realm.getModel('ROOM', this.id, roomId));
  }

  getPlayers() {
    const { players } = realm.getStore().getState();

    return Object.keys(players).reduce((prev, playerId) => {
      const player = realm.getModel('PLAYER', playerId);
      if (player.getMap().id === this.id) prev.push(player);
      return prev;
    }, []);
  }
};
