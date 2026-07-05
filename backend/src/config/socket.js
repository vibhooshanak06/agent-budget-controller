'use strict';

/**
 * socket.js
 *
 * Socket.IO server singleton.
 * Initialised once in server.js, then referenced anywhere via getIO().
 */

const { Server } = require('socket.io');
const logger     = require('./logger');
const env        = require('./env');

let _io = null;

/**
 * Attach Socket.IO to an existing HTTP server.
 * @param {import('http').Server} httpServer
 * @returns {import('socket.io').Server}
 */
function initIO(httpServer) {
  _io = new Server(httpServer, {
    cors: {
      origin:      env.corsOrigins,
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  _io.on('connection', (socket) => {
    logger.info({ socketId: socket.id }, 'WebSocket client connected');
    socket.on('disconnect', () =>
      logger.info({ socketId: socket.id }, 'WebSocket client disconnected'),
    );
  });

  logger.info('Socket.IO initialised');
  return _io;
}

/**
 * Return the singleton Socket.IO instance.
 * Throws if initIO() has not been called yet.
 */
function getIO() {
  if (!_io) throw new Error('Socket.IO has not been initialised — call initIO(httpServer) first');
  return _io;
}

module.exports = { initIO, getIO };
