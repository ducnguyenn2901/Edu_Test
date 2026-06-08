import io from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const socketService = {
  connect() {
    if (!socket) {
      socket = io(SOCKET_URL, {
        withCredentials: true,
      });
    }
    return socket;
  },

  disconnect() {
    if (socket) {
      socket.disconnect();
      socket = null;
    }
  },

  getSocket() {
    return socket;
  },

  joinClass(classroomId, type = 'community') {
    if (socket) {
      socket.emit('join-class', { classroomId, type });
    }
  },

  sendMessage(message) {
    if (socket) {
      socket.emit('send-message', message);
    }
  },

  onNewMessage(callback) {
    if (socket) {
      socket.on('new-message', callback);
    }
  },

  offNewMessage(callback) {
    if (socket) {
      socket.off('new-message', callback);
    }
  },

  isConnected() {
    return socket && socket.connected;
  },
};
