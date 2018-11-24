module.exports = (realm) => {
  return {
    'auth::gos': (intent) => {
      return Boolean(intent.payload.text && intent.payload.text.length);
    },

    'do::gos': (intent) => {
      realm.broadcastFrom(intent.meta.socketId, {
        type: 'info',
        payload: { text: `Gossip: ${intent.payload.text}` },
      });
    },

    'do::unknown': async (intent) => {
      realm.broadcastFrom(intent.meta.socketId, {
        type: 'info',
        payload: { text: `${intent.payload.text}` },
      });
    },
  };
};
