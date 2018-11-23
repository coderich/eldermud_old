const { createStore, combineReducers } = require('redux');

module.exports = class Store {
  constructor(reducers) {
    this.store = createStore(combineReducers(reducers));
  }
};
