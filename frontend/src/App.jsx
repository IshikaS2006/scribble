import { lazy, Suspense, useState, useEffect, useCallback } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner';
import JoinRoomForm from './components/JoinRoomForm';
import { useTheme } from './hooks/useTheme';
import socket from './socket';
import config from './config';

const Canvas = lazy(() => import('./Canvas'));

function App() {
  const { isDark } = useTheme();
  const [isConnected, setIsConnected] = useState(false);
  const [hasJoinedRoom, setHasJoinedRoom] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [userId, setUserId] = useState('');
  const [error, setError] = useState('');
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [roomData, setRoomData] = useState(null);

  useEffect(() => {
    socket.connect();

    const handleConnect = () => {
      setIsConnected(true);
      setError('');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleConnectError = (err) => {
      setError(`Connection failed: ${err.message}`);
    };

    const handleJoinAck = ({ roomId: joinedRoomId, isAdmin }) => {
      console.log('App: Join ACK received, isAdmin:', isAdmin);
      setRoomData({ roomId: joinedRoomId, isAdmin });
      setHasJoinedRoom(true);
      setError('');
    };

    const handleRoomJoined = (data) => {
      console.log('App: Room joined full data:', data);
      setRoomData(data);
    };

    const handleError = ({ message }) => {
      setError(message);
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('connect_error', handleConnectError);
    socket.on('join-ack', handleJoinAck);
    socket.on('room-joined', handleRoomJoined);
    socket.on('error', handleError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('connect_error', handleConnectError);
      socket.off('join-ack', handleJoinAck);
      socket.off('room-joined', handleRoomJoined);
      socket.off('error', handleError);
    };
  }, []);

  const handleJoinRoom = useCallback((e) => {
    e.preventDefault();
    setError('');
    
    if (!roomId.trim() || !userId.trim()) {
      setError('Room ID and User Name are required');
      return;
    }

    const joinData = {
      roomId: roomId.trim(),
      userId: userId.trim(),
    };

    if (adminKey.trim()) {
      joinData.adminKey = adminKey.trim();
      console.log('Joining as ADMIN with adminKey:', adminKey.trim());
    } else {
      console.log('Joining as STUDENT (no admin key)');
    }

    console.log('Emitting joinRoom with data:', joinData);
    socket.emit('joinRoom', joinData);
  }, [roomId, userId, adminKey]);

  const createTestRoom = useCallback(async () => {
    setError('');
    setIsCreatingRoom(true);

    try {
      const response = await fetch(`${config.server.url}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to create room');
      }

      const data = await response.json();
      
      if (data.roomId && data.adminKey) {
        setRoomId(data.roomId);
        setAdminKey(data.adminKey);
        setError('');
        console.log('Room created successfully:', {
          roomId: data.roomId,
          adminKey: data.adminKey
        });
      } else {
        setError('Invalid response from server');
      }
    } catch (err) {
      setError(err.message || 'Failed to create room');
    } finally {
      setIsCreatingRoom(false);
    }
  }, []);

  const handleLeaveRoom = useCallback(() => {
    socket.emit('leaveRoom');
    setHasJoinedRoom(false);
    setRoomId('');
    setAdminKey('');
    setUserId('');
  }, []);

  if (!hasJoinedRoom) {
    return (
      <ErrorBoundary>
        <div className={`min-h-screen flex items-center justify-center p-4 ${
          isDark ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
        }`}>
          <JoinRoomForm
            isConnected={isConnected}
            error={error}
            roomId={roomId}
            setRoomId={setRoomId}
            adminKey={adminKey}
            setAdminKey={setAdminKey}
            userId={userId}
            setUserId={setUserId}
            handleJoinRoom={handleJoinRoom}
            createTestRoom={createTestRoom}
            isCreatingRoom={isCreatingRoom}
          />
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gray-50"><LoadingSpinner /></div>}>
        <Canvas onLeaveRoom={handleLeaveRoom} initialRoomData={roomData} />
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
