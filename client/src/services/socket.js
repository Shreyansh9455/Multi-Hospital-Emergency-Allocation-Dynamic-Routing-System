import { io } from 'socket.io-client';

// Backend Server URL
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

let socket = null;

/**
 * Initializes or returns existing Socket.IO connection
 */
export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    socket.on('connect', () => {
      console.log(`🔌 [Socket.IO] Connected to backend dispatch server: ${socket.id}`);
    });

    socket.on('connect_error', (error) => {
      console.warn('⚠️ [Socket.IO] Connection error:', error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 [Socket.IO] Disconnected: ${reason}`);
    });
  }

  return socket;
};

/**
 * Listen for live hospital capacity and metric updates
 * @param {(hospital: object) => void} callback
 */
export const subscribeToHospitalUpdates = (callback) => {
  const s = getSocket();
  s.on('hospitalUpdated', callback);
  return () => s.off('hospitalUpdated', callback);
};

/**
 * Listen for live emergency case status and triage updates
 * @param {(caseDoc: object) => void} callback
 */
export const subscribeToCaseUpdates = (callback) => {
  const s = getSocket();
  s.on('caseUpdated', callback);
  return () => s.off('caseUpdated', callback);
};

/**
 * Listen for live ambulance status and location telemetry updates
 * @param {(ambulanceDoc: object) => void} callback
 */
export const subscribeToAmbulanceUpdates = (callback) => {
  const s = getSocket();
  s.on('ambulanceUpdated', callback);
  return () => s.off('ambulanceUpdated', callback);
};

export default getSocket;
