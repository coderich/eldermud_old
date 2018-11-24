module.exports = (realm) => {
  return (input) => {
    const { text } = input.payload;
    const words = text.split(' ');
    const [type, ...remainder] = [words.shift(), ...words];
    const phrase = remainder.join(' ');

    switch (type.toLowerCase()) {
      case 'gos':
        return [{
          type,
          stream: 'chat',
          payload: { text: phrase },
        }];
      case 'a':
        return [{
          type,
          stream: 'combat',
          payload: { target: phrase },
        }];
      default:
        if (type.length) {
          return [{
            type: 'unknown',
            stream: 'chat',
            payload: { text: `"${input.payload.text}"` },
          }];
        }

        return [];
    }
  };
};
