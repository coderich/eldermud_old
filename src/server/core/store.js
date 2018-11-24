const _ = require('lodash');
// const { from } = require('rxjs');
// const { filter } = require('rxjs/operators');
const { createStore, combineReducers } = require('redux');

module.exports = class Store {
  constructor(reducers, options = {}) {
    this.subscribers = {};
    this.store = createStore(combineReducers(reducers));
    this.prevState = this.store.getState();

    // Subscribe to changes, notify listeners when a change happens
    this.store.subscribe(() => {
      const currState = this.store.getState();

      Object.keys(this.subscribers).forEach((key) => {
        const prevValue = _.get(this.prevState, key);
        const currValue = _.get(currState, key);

        if (!_.isEqual(prevValue, currValue)) {
          this.subscribers[key].forEach(cb => cb(currValue, prevValue));
        }
      });

      this.prevState = currState;
    });

    // If persistent, listen for data changes and save it
    if (options.persist) {
      Object.keys(reducers).forEach((key) => {
        this.subscribeTo(key, _.throttle((newVal) => {
          console.log('persist', key, newVal);
        }, 1000));
      });
    }
  }

  getState() {
    return this.store.getState();
  }

  dispatch(action) {
    this.store.dispatch(action);
  }

  subscribe(cb) {
    this.store.subscribe(cb);
  }

  subscribeTo(key, cb) {
    if (Object.prototype.hasOwnProperty.call(this.subscribers, key)) this.subscribers[key].push(cb);
    else this.subscribers[key] = [cb];
    return () => { this.subscribers[key] = this.subscribers[key].filter(s => s !== cb); }; // Unsubscribe
  }
};
