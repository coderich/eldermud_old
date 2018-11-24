module.exports = (realm) => {
  const timeout = ms => new Promise(res => setTimeout(res, ms));

  return {
    chat: {
      'auth::gos': (intent) => {
        return Boolean(intent.payload.text && intent.payload.text.length);
      },

      'do::gos': (intent) => {
        realm.broadcastFrom(intent.meta.socketId, {
          type: 'info',
          payload: { text: `(GOSSIP) ${intent.meta.socketId} says: ${intent.payload.text}` },
        });
      },

      'do::unknown': async (intent) => {
        realm.broadcastFrom(intent.meta.socketId, {
          type: 'info',
          payload: { text: `${intent.payload.text}` },
        });
      },
    },

    combat: {
      'do::a': async (intent) => {
        await timeout(1500);

        realm.broadcastFrom(intent.meta.socketId, {
          type: 'info',
          payload: { text: 'You are being attacked(ish)!!!' },
        });
      },
    },
  };
};
