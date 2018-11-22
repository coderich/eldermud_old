module.exports = {
  register: async (server, options) => {
    console.log('Navigation Plugin loaded');

    // This will handle
    server.users.on('move', function (data) {
      const { self: being, direction, options } = data;
      console.log('move', being.attributes, direction, options);
    });
  },
};
