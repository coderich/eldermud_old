const _ = require('lodash');

module.exports = (realm) => {
  return {
    players: (state = {}, action) => {
      switch (action.type.toUpperCase()) {
        case 'ADD_PLAYER': case 'UPDATE_PLAYER':
          return Object.assign({}, state, { [action.payload.id]: action.payload });
        case 'REMOVE_PLAYER':
          return _.omit(state, action.payload.id);
        default:
          return state;
      }
    },

    maps: (state = [], action) => {
      switch (action.type.toUpperCase()) {
        case 'ADD_MAP':
          return [...state, action.payload];
        case 'REMOVE_MAP':
          return _.filter(state, action.payload);
        default:
          return state;
      }
    },
  };
};
