module.exports = (realm) => {
  const timeout = ms => new Promise(res => setTimeout(res, ms));

  return {
    'do::a': async (intent) => {
      await timeout(1500);

      realm.broadcastFrom(intent.meta.socketId, {
        type: 'info',
        payload: { text: 'You are being attacked!!!' },
      });
    },
  };
};
