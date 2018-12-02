module.exports = realm => class Player {
  constructor(playerId) {
    this.id = playerId;
  }

  getAttributes() {
    return realm.getStore().getState().players[this.id];
  }

  getMap() {
    const { location } = this.getAttributes();
    return realm.getModel('MAP', location.map);
  }

  getRoom() {
    const { location } = this.getAttributes();
    return this.getMap().getRoom(location.room);
  }

  // getLocation() {

  // }
};
