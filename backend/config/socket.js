let ioInstance;

const initSocket = (io) => {
  ioInstance = io;
};

const getIO = () => ioInstance;

module.exports = { initSocket, getIO };
