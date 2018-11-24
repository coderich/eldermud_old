module.exports = (realm) => {
  return {
    app: (state = '', action) => {
      if (action.type === 'app') return action.payload;
      return state;
    },
  };
};
