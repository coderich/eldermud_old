const _ = require('lodash');

module.exports = realm => class Room {
  constructor(mapId, roomId) {
    this.id = roomId;
    this.mapId = mapId;
  }

  getAttributes() {
    return _.find(realm.getStore().getState().maps, { id: this.mapId }).rooms[this.id];
  }

  getPlayers() {
    return realm.getModel('MAP', this.mapId).getPlayers().filter(player => Boolean(player.getRoom().id === this.id));
  }

  // getItems() {
  //   return [];
  // }

  getRoomsInSight(distance) {
    return realm.getModel('MAP', this.mapId).getRoomsInSight(this.id, distance);
  }

  getRoomsInArea(distance) {
    return realm.getModel('MAP', this.mapId).getRoomsInArea(this.id, distance);
  }
};
