module.exports = (input) => {
  const { text } = input.payload;
  const index = text.indexOf(' ');
  const type = text.substr(0, index).trim();
  const phrase = text.substr(index).trim();

  switch (type.toLowerCase()) {
    case 'gos':
      return [{
        type,
        stream: 'chat',
        payload: { text: phrase },
      }];
    default:
      if (phrase.length) {
        return [{
          type: 'unknown',
          stream: 'chat',
          payload: { text: `Unknown command "${input.payload.text}"` },
        }];
      }

      return [];
  }
};
