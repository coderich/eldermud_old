module.exports = (realm) => {
  return {
    'auth::gos': (userId, payload) => {
      return Boolean(payload.text && payload.text.length);
    },

    'do::gos': (userId, payload) => {
      realm.broadcastFrom(userId, {
        type: 'info',
        payload: { text: `Gossip: ${payload.text}` },
      });
    },

    'do::unknown': async (userId, payload) => {
      realm.broadcastTo(userId, {
        type: 'info',
        payload: { text: payload.text },
      });
    },
  };
};
