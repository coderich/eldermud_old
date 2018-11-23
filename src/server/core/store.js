const _ = require('lodash');
// const { from } = require('rxjs');
// const { filter } = require('rxjs/operators');
const { createStore, combineReducers } = require('redux');

module.exports = class Store {
  constructor(reducers) {
    this.subscribers = {};
    this.store = createStore(combineReducers(reducers));

    let prevState = this.store.getState();

    this.store.subscribe(() => {
      const currState = this.store.getState();

      Object.keys(this.subscribers).forEach((key) => {
        const prevValue = _.get(prevState, key);
        const currValue = _.get(currState, key);

        if (prevValue !== currValue) {
          this.subscribers[key].forEach(cb => cb(currValue, prevValue));
        }
      });

      prevState = currState;
    });
  }

  getStore() {
    return this.store.getStore();
  }

  dispatch(action) {
    this.store.dispatch(action);
  }

  subscribe(cb) {
    return this.store.subscribe(cb);
  }

  subscribeTo(key, cb) {
    if (Object.prototype.hasOwnProperty.call(this.subscribers, key)) {
      this.subscribers[key].push(cb);
    } else {
      this.subscribers[key] = [cb];
    }

    // Unsubscribe
    return () => { this.subscribers[key] = this.subscribers[key].filter(s => s !== cb); };
  }
};
