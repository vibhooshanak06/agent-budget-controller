import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

/**
 * Connects to the backend Socket.IO server and returns { socket, connected }.
 * The socket is shared via a module-level singleton so all components share
 * one connection regardless of how many times this hook is used.
 */
let sharedSocket = null;

export function useSocket() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!sharedSocket) {
      sharedSocket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'],
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      });
    }

    const socket = sharedSocket;

    const onConnect    = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    if (socket.connected) setConnected(true);

    socket.on('connect',    onConnect);
    socket.on('disconnect', onDisconnect);

    return () => {
      socket.off('connect',    onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  return { socket: sharedSocket, connected };
}

/**
 * Subscribe to a specific Socket.IO event.
 * @param {string} event  - Event name
 * @param {function} handler - Callback called with the event payload
 */
export function useSocketEvent(event, handler) {
  const { socket } = useSocket();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!socket || !event) return;
    const cb = (data) => handlerRef.current(data);
    socket.on(event, cb);
    return () => socket.off(event, cb);
  }, [socket, event]);
}
