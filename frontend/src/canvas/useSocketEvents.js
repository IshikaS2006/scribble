import { useEffect } from 'react';
import socket from '../socket';

export const useSocketEvents = ({
  setRoomId,
  setUserId,
  setIsAdmin,
  setUserCount,
  setPublicStrokes,
  setPrivateStrokes,
  setAllPrivateStrokes,
  setPromoteRequests,
  setAllUsersCode,
  setMyCode,
  setUserCursors,
  setUserLiveStrokes
}) => {
  useEffect(() => {
    const handleJoinAck = (data) => {
      console.log('Join ACK received:', data);
      setRoomId(data.roomId);
      setUserId(data.userId);
      setIsAdmin(data.isAdmin);
    };

    const handleRoomJoined = (data) => {
      console.log('Room joined event received:', data);
      console.log('Setting userCount to:', data.userCount);
      setRoomId(data.roomId);
      setUserId(data.userId);
      setIsAdmin(data.isAdmin);
      setUserCount(data.userCount || 0);
      setPublicStrokes(data.publicStrokes || []);
      setPrivateStrokes(data.privateStrokes || []);
      
      if (data.isAdmin && data.allPrivateStrokes) {
        setAllPrivateStrokes(data.allPrivateStrokes);
      }
      
      // Set code state
      if (data.myCode) {
        setMyCode(data.myCode);
      }
      if (data.isAdmin && data.allUsersCode) {
        setAllUsersCode(data.allUsersCode);
      }
    };

    const handlePublicStroke = (stroke) => {
      setPublicStrokes(prev => [...prev, stroke]);
    };

    const handlePrivateStroke = (stroke) => {
      setPrivateStrokes(prev => [...prev, stroke]);
    };

    const handlePrivateStrokeFromOther = ({ userId: otherUserId, stroke }) => {
      setAllPrivateStrokes(prev => ({
        ...prev,
        [otherUserId]: [...(prev[otherUserId] || []), stroke]
      }));
    };

    const handleStrokePromoted = ({ strokeId, userId: strokeUserId }) => {
      setPrivateStrokes(prev => prev.filter(s => s.id !== strokeId));
      setAllPrivateStrokes(prev => {
        const updated = { ...prev };
        if (updated[strokeUserId]) {
          updated[strokeUserId] = updated[strokeUserId].filter(s => s.id !== strokeId);
        }
        return updated;
      });
    };

    const handlePromoteRequest = (request) => {
      setPromoteRequests(prev => [...prev, request]);
    };

    const handleUsersUpdate = ({ count }) => {
      console.log('Users update received, count:', count);
      setUserCount(count);
    };
    
    const handleUserJoined = ({ userId, code }) => {
      console.log('New user joined:', userId);
      setAllUsersCode(prev => ({
        ...prev,
        [userId]: code || ''
      }));
    };

    const handleCodeUpdate = ({ userId, code }) => {
      console.log('Code update from user:', userId);
      setAllUsersCode(prev => ({
        ...prev,
        [userId]: code
      }));
    };

    const handleRoomCodeState = ({ allUsersCode: codeData, myCode: myCodeData }) => {
      console.log('Received room code state');
      if (codeData) setAllUsersCode(codeData);
      if (myCodeData) setMyCode(myCodeData);
    };

    const handleCursorMove = ({ userId, x, y }) => {
      setUserCursors(prev => ({
        ...prev,
        [userId]: { x, y, timestamp: Date.now() }
      }));
    };

    const handleUserLeft = ({ userId }) => {
      setUserCursors(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
      setUserLiveStrokes(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    };
    
    const handleLiveStroke = ({ userId, stroke }) => {
      setUserLiveStrokes(prev => ({
        ...prev,
        [userId]: stroke
      }));
    };
    
    const handleLiveStrokeEnd = ({ userId }) => {
      setUserLiveStrokes(prev => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    };

    socket.on('join-ack', handleJoinAck);
    socket.on('room-joined', handleRoomJoined);
    socket.on('public-stroke', handlePublicStroke);
    socket.on('private-stroke', handlePrivateStroke);
    socket.on('private-stroke-from-other', handlePrivateStrokeFromOther);
    socket.on('stroke-promoted', handleStrokePromoted);
    socket.on('promote-request', handlePromoteRequest);
    socket.on('users-update', handleUsersUpdate);
    socket.on('user-joined', handleUserJoined);
    socket.on('code-update', handleCodeUpdate);
    socket.on('room-code-state', handleRoomCodeState);
    socket.on('cursor-move', handleCursorMove);
    socket.on('user-left', handleUserLeft);
    socket.on('live-stroke', handleLiveStroke);
    socket.on('live-stroke-end', handleLiveStrokeEnd);

    return () => {
      socket.off('join-ack', handleJoinAck);
      socket.off('room-joined', handleRoomJoined);
      socket.off('public-stroke', handlePublicStroke);
      socket.off('private-stroke', handlePrivateStroke);
      socket.off('private-stroke-from-other', handlePrivateStrokeFromOther);
      socket.off('stroke-promoted', handleStrokePromoted);
      socket.off('promote-request', handlePromoteRequest);
      socket.off('users-update', handleUsersUpdate);
      socket.off('user-joined', handleUserJoined);
      socket.off('code-update', handleCodeUpdate);
      socket.off('room-code-state', handleRoomCodeState);
      socket.off('cursor-move', handleCursorMove);
      socket.off('user-left', handleUserLeft);
      socket.off('live-stroke', handleLiveStroke);
      socket.off('live-stroke-end', handleLiveStrokeEnd);
    };
  }, [setRoomId, setUserId, setIsAdmin, setUserCount, setPublicStrokes, setPrivateStrokes, setAllPrivateStrokes, setPromoteRequests, setAllUsersCode, setMyCode, setUserCursors, setUserLiveStrokes]);
};
