const setupSockets = (io) => {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join', (userId) => {
      if (userId) {
        socket.join(userId.toString());
        console.log(`User ${userId} joined personal room`);
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });
};

module.exports = setupSockets;
