import { useState, useRef, useEffect } from 'react';

export const useCanvasState = (initialRoomData) => {
  const [roomId, setRoomId] = useState(initialRoomData?.roomId || null);
  const [userId, setUserId] = useState(initialRoomData?.userId || null);
  const [isAdmin, setIsAdmin] = useState(initialRoomData?.isAdmin || false);
  const [userCount, setUserCount] = useState(0);
  
  const [publicStrokes, setPublicStrokes] = useState([]);
  const [privateStrokes, setPrivateStrokes] = useState([]);
  const [allPrivateStrokes, setAllPrivateStrokes] = useState({});
  const [currentStroke, setCurrentStroke] = useState(null);
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [selectedWidth, setSelectedWidth] = useState(2);
  const [selectedTool, setSelectedTool] = useState("select"); // select, freehand, rectangle, circle, line, text, arrow, arrow-line
  const [shapePreview, setShapePreview] = useState(null);
  const [textInput, setTextInput] = useState({ show: false, x: 0, y: 0, text: "" });
  const [selectionBox, setSelectionBox] = useState(null);
  const [selectedStrokes, setSelectedStrokes] = useState([]);
  const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0 });
  
  const [promoteRequests, setPromoteRequests] = useState([]);
  const [showPromotionPanel, setShowPromotionPanel] = useState(false);
  const [showCodePanel, setShowCodePanel] = useState(false);
  const [revealedStudents, setRevealedStudents] = useState(new Set());
  
  // Code panel state
  const [myCode, setMyCode] = useState('');
  const [allUsersCode, setAllUsersCode] = useState({}); // { userId: code }
  const [viewingUserId, setViewingUserId] = useState(null); // null means viewing own code
  
  // Cursor presence state
  const [userCursors, setUserCursors] = useState({}); // { userId: { x, y, name } }
  
  // Live stroke tracking for other users
  const [userLiveStrokes, setUserLiveStrokes] = useState({});
  
  const camera = useRef({ x: 0, y: 0, zoom: 1 });
  const isDrawing = useRef(false);
  const isPanning = useRef(false);
  const isSelecting = useRef(false);
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const resizeHandle = useRef(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const lastPanPos = useRef({ x: 0, y: 0 });
  const isAdminRef = useRef(initialRoomData?.isAdmin || false);
  const userIdRef = useRef(initialRoomData?.userId || null);

  useEffect(() => {
    if (initialRoomData) {
      console.log('Canvas: Initializing with room data:', initialRoomData);
      setRoomId(initialRoomData.roomId);
      setUserId(initialRoomData.userId);
      setIsAdmin(initialRoomData.isAdmin);
      isAdminRef.current = initialRoomData.isAdmin;
      userIdRef.current = initialRoomData.userId;
      
      if (initialRoomData.publicStrokes) setPublicStrokes(initialRoomData.publicStrokes);
      if (initialRoomData.privateStrokes) setPrivateStrokes(initialRoomData.privateStrokes);
      if (initialRoomData.userCount) setUserCount(initialRoomData.userCount);
      if (initialRoomData.isAdmin && initialRoomData.allPrivateStrokes) {
        setAllPrivateStrokes(initialRoomData.allPrivateStrokes);
      }
    }
  }, [initialRoomData]);

  useEffect(() => {
    isAdminRef.current = isAdmin;
    userIdRef.current = userId;
  }, [isAdmin, userId]);

  return {
    roomId, setRoomId,
    userId, setUserId,
    isAdmin, setIsAdmin,
    userCount, setUserCount,
    publicStrokes, setPublicStrokes,
    privateStrokes, setPrivateStrokes,
    allPrivateStrokes, setAllPrivateStrokes,
    currentStroke, setCurrentStroke,
    selectedColor, setSelectedColor,
    selectedWidth, setSelectedWidth,
    selectedTool, setSelectedTool,
    shapePreview, setShapePreview,
    textInput, setTextInput,
    selectionBox, setSelectionBox,
    selectedStrokes, setSelectedStrokes,
    contextMenu, setContextMenu,
    promoteRequests, setPromoteRequests,
    showPromotionPanel, setShowPromotionPanel,
    showCodePanel, setShowCodePanel,
    revealedStudents, setRevealedStudents,
    myCode, setMyCode,
    allUsersCode, setAllUsersCode,
    viewingUserId, setViewingUserId,
    userCursors, setUserCursors,
    userLiveStrokes, setUserLiveStrokes,
    camera, isDrawing, isPanning, isSelecting, isDragging, isResizing, resizeHandle, dragOffset, lastPanPos,
    isAdminRef, userIdRef
  };
};
