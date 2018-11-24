module.exports = (realm) => {
  const timeout = ms => new Promise(res => setTimeout(res, ms));

  return {
    'do::a': async (userId, payload) => {
      await timeout(1500);

      realm.broadcastFrom(userId, {
        type: 'info',
        payload: { text: 'You are being attacked!!!' },
      });
    },
  };
};
