module.exports = (realm) => {
  return (input) => {
    const text = input.payload.text.trim();
    const words = text.split(' ');
    const [type, ...remainder] = [words.shift(), ...words];
    const phrase = remainder.join(' ');

    switch (type.toLowerCase()) {
      case 'a':
        return [{
          type,
          stream: 'combat',
          payload: { target: phrase },
        }];
      case 'n': case 's': case 'e': case 'w':
        return [{
          type: 'move',
          stream: 'navigation',
          payload: type,
        }];
      case 'gos':
        return [{
          type,
          stream: 'chat',
          payload: { text: phrase },
        }];
      default:
        if (type.length) {
          return [{
            type: 'say',
            stream: 'chat',
            payload: { text: input.payload.text },
          }];
        }

        return [{
          type: 'return',
          stream: 'chat',
        }];
    }
  };
};
