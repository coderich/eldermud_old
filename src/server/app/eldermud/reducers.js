const _ = require('lodash');

module.exports = (realm) => {
  return {
    players: (state = {}, action) => {
      switch (action.type.toUpperCase()) {
        case 'ADD_PLAYER':
          return Object.assign({}, state, { [action.payload.client.clientId]: action.payload });
        case 'REM_PLAYER':
          return _.omit(state, action.payload.client.clientId);
        default:
          return state;
      }
    },

    maps: (state = [], action) => {
      switch (action.type.toUpperCase()) {
        case 'ADD_MAP':
          return [...state, action.payload];
        case 'REM_MAP':
          return _.filter(state, action.payload);
        default:
          return state;
      }
    },
  };
};
