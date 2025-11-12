import { useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3000';

let socket = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastDiceRoll, setLastDiceRoll] = useState(null);

  useEffect(() => {
    // Initialize socket connection
    if (!socket) {
      socket = io(SOCKET_URL, {
        reconnectionDelay: 1000,
        reconnection: true,
        reconnectionAttempts: 10,
        transports: ['websocket'],
        agent: false,
        upgrade: false,
        rejectUnauthorized: false
      });
    }

    function onConnect() {
      console.log('✅ Socket connected');
      setIsConnected(true);
    }

    function onDisconnect() {
      console.log('❌ Socket disconnected');
      setIsConnected(false);
    }

    function onDiceRoll(data) {
      console.log('🎲 Dice roll received:', data);
      setLastDiceRoll(data);
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('dice_roll', onDiceRoll);

    // Check initial connection state
    if (socket.connected) {
      setIsConnected(true);
    }

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('dice_roll', onDiceRoll);
    };
  }, []);

  const emit = useCallback((event, data) => {
    if (socket) {
      socket.emit(event, data);
    }
  }, []);

  return { socket, isConnected, lastDiceRoll, emit };
}
