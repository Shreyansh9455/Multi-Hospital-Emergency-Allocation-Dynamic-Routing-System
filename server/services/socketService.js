const { Server } = require('socket.io');

let io = null;

/**
 * Initializes Socket.IO with the HTTP Server
 * @param {import('http').Server} httpServer
 */
function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: '*', // Allow all client origins in dev/prod
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
    },
  });

  io.on('connection', (socket) => {
    console.log(`🔌 Real-time client connected: ${socket.id}`);

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

/**
 * Get active Socket.IO server instance
 */
function getIO() {
  return io;
}

/**
 * Emits hospitalUpdated event with latest document
 */
function emitHospitalUpdated(hospitalDoc) {
  if (io) {
    io.emit('hospitalUpdated', hospitalDoc);
    console.log(`📡 [Socket.IO] Emitted 'hospitalUpdated': ${hospitalDoc?.name || hospitalDoc?._id}`);
  }
}

/**
 * Emits caseUpdated event with latest document
 */
function emitCaseUpdated(caseDoc) {
  if (io) {
    io.emit('caseUpdated', caseDoc);
    console.log(`📡 [Socket.IO] Emitted 'caseUpdated': ${caseDoc?.patientName || caseDoc?._id} (${caseDoc?.status})`);
  }
}

/**
 * Emits ambulanceUpdated event with latest document
 */
function emitAmbulanceUpdated(ambulanceDoc) {
  if (io) {
    io.emit('ambulanceUpdated', ambulanceDoc);
    console.log(`📡 [Socket.IO] Emitted 'ambulanceUpdated': ${ambulanceDoc?.vehicleId || ambulanceDoc?._id} (${ambulanceDoc?.status})`);
  }
}

module.exports = {
  initSocket,
  getIO,
  emitHospitalUpdated,
  emitCaseUpdated,
  emitAmbulanceUpdated,
};
