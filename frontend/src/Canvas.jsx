import { useRef, useEffect, useCallback, useMemo, useState } from "react";
import PropTypes from 'prop-types';
import socket from './socket';
import { useCanvasState } from './canvas/useCanvasState';
import { useSocketEvents } from './canvas/useSocketEvents';
import { renderCanvas } from './canvas/renderCanvas';
import { useTheme } from './hooks/useTheme';
import CanvasToolbar from './canvas/CanvasToolbar';
import StudentWorkPanel from './canvas/StudentWorkPanel';
import ContextMenu from './canvas/ContextMenu';
import { 
  isPointInStroke, 
  isStrokeInBox as utilsIsStrokeInBox, 
  getSelectionBounds, 
  getResizeHandles,
  getHandleAtPoint,
  resizeStrokes
} from './canvas/selectionUtils';

export default function Canvas({ onLeaveRoom, initialRoomData }) {
  const canvasRef = useRef(null);
  const state = useCanvasState(initialRoomData);
  const { isDark } = useTheme();
  const [zoomLevel, setZoomLevel] = useState(100);

  useSocketEvents({
    setRoomId: state.setRoomId,
    setUserId: state.setUserId,
    setIsAdmin: state.setIsAdmin,
    setUserCount: state.setUserCount,
    setPublicStrokes: state.setPublicStrokes,
    setPrivateStrokes: state.setPrivateStrokes,
    setAllPrivateStrokes: state.setAllPrivateStrokes,
    setPromoteRequests: state.setPromoteRequests,
    setAllUsersCode: state.setAllUsersCode,
    setMyCode: state.setMyCode,
    setUserCursors: state.setUserCursors,
    setUserLiveStrokes: state.setUserLiveStrokes
  });

  // Calculate selection bounds and resize handles
  const selectionBounds = useMemo(() => {
    return getSelectionBounds(state.selectedStrokes);
  }, [state.selectedStrokes]);

  const resizeHandles = useMemo(() => {
    return selectionBounds ? getResizeHandles(selectionBounds) : [];
  }, [selectionBounds]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
      render();
    };

    const getMousePos = (e) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const screenToWorld = (sx, sy) => {
      const { x, y, zoom } = state.camera.current;
      return {
        x: sx / zoom + x,
        y: sy / zoom + y,
      };
    };

    const isStrokeInBox = (stroke, minX, minY, maxX, maxY) => {
      return utilsIsStrokeInBox(stroke, minX, minY, maxX, maxY);
    };

    const render = () => {
      // Get revealed student strokes if admin
      let revealedStrokes = [];
      if (state.isAdminRef.current && state.revealedStudents.size > 0) {
        state.revealedStudents.forEach(studentId => {
          const studentStrokes = state.allPrivateStrokes[studentId] || [];
          revealedStrokes = [...revealedStrokes, ...studentStrokes];
        });
      }

      renderCanvas(ctx, canvas, {
        publicStrokes: state.publicStrokes,
        privateStrokes: state.privateStrokes,
        revealedStrokes,
        currentStroke: state.currentStroke,
        shapePreview: state.shapePreview,
        selectionBox: state.selectionBox,
        selectedStrokes: state.selectedStrokes,
        selectionBounds,
        resizeHandles,
        camera: state.camera,
        isAdminRef: state.isAdminRef,
        isDark,
        userCursors: state.userCursors,
        myUserId: state.userId,
        revealedStudents: state.revealedStudents,
        userLiveStrokes: state.userLiveStrokes
      });
    };

    const onWheel = (e) => {
      e.preventDefault();
      const { x: mx, y: my } = getMousePos(e);
      const before = screenToWorld(mx, my);

      const zoomStep = e.deltaY < 0 ? 1.08 : 1 / 1.08;
      const newZoom = Math.min(10, Math.max(0.1, state.camera.current.zoom * zoomStep));

      state.camera.current.zoom = newZoom;
      state.camera.current.x = before.x - mx / newZoom;
      state.camera.current.y = before.y - my / newZoom;
      setZoomLevel(Math.round(newZoom * 100));

      render();
    };

    const onMouseDown = (e) => {
      const { x: mx, y: my } = getMousePos(e);
      const world = screenToWorld(mx, my);
      
      // Pan mode: Shift or middle mouse button
      if (e.shiftKey || e.button === 1) {
        e.preventDefault();
        state.isPanning.current = true;
        state.lastPanPos.current = { x: e.clientX, y: e.clientY };
        canvas.style.cursor = 'grabbing';
        return;
      }

      // Selection/Pointer tool mode
      if (state.selectedTool === 'select' && e.button === 0) {
        // Check if clicking on a resize handle
        if (state.selectedStrokes.length > 0 && resizeHandles.length > 0) {
          const handle = getHandleAtPoint(world, resizeHandles, 8 / state.camera.current.zoom);
          if (handle) {
            state.isResizing.current = true;
            state.resizeHandle.current = handle;
            state.dragOffset.current = { ...selectionBounds };
            return;
          }
        }

        // Check if clicking on an already selected stroke (for dragging)
        if (state.selectedStrokes.length > 0) {
          const clickedOnSelected = state.selectedStrokes.some(stroke => 
            isPointInStroke(world, stroke, 10)
          );
          
          if (clickedOnSelected) {
            state.isDragging.current = true;
            state.dragOffset.current = { x: world.x, y: world.y };
            return;
          }
        }

        // Find stroke at click position (single select)
        const allStrokes = [
          ...state.publicStrokes.map(s => ({ ...s, isPublic: true })),
          ...(state.isAdminRef.current ? [] : state.privateStrokes.map(s => ({ ...s, isPublic: false })))
        ];

        // Check from top to bottom (reverse order for proper stacking)
        let clickedStroke = null;
        for (let i = allStrokes.length - 1; i >= 0; i--) {
          if (isPointInStroke(world, allStrokes[i], 10)) {
            clickedStroke = allStrokes[i];
            break;
          }
        }

        if (clickedStroke) {
          // Single click selection
          if (e.ctrlKey || e.metaKey) {
            // Multi-select with Ctrl/Cmd
            const isAlreadySelected = state.selectedStrokes.some(s => s.id === clickedStroke.id);
            if (isAlreadySelected) {
              state.setSelectedStrokes(prev => prev.filter(s => s.id !== clickedStroke.id));
            } else {
              state.setSelectedStrokes(prev => [...prev, clickedStroke]);
            }
          } else {
            // Replace selection
            state.setSelectedStrokes([clickedStroke]);
          }
          state.setSelectionBox(null);
        } else {
          // Start drag selection box
          state.isSelecting.current = true;
          state.setSelectionBox({
            startX: world.x,
            startY: world.y,
            endX: world.x,
            endY: world.y
          });
          if (!e.ctrlKey && !e.metaKey) {
            state.setSelectedStrokes([]);
          }
        }
        return;
      }

      // Drawing tools mode
      if (e.button === 0 && !e.shiftKey) {
        const world = screenToWorld(mx, my);
        state.isDrawing.current = true;
        
        // Handle different tools
        if (state.selectedTool === 'text') {
          // Show text input
          state.setTextInput({ show: true, x: world.x, y: world.y, text: "" });
          return;
        }
        
        if (state.selectedTool === 'freehand') {
          const newStroke = {
            id: `stroke-${Date.now()}-${Math.random()}`,
            type: 'freehand',
            points: [{ x: world.x, y: world.y }],
            color: state.selectedColor,
            width: state.selectedWidth,
          };
          state.setCurrentStroke(newStroke);
        } else if (state.selectedTool !== 'select') {
          // For shapes, store the start point
          const newShape = {
            id: `stroke-${Date.now()}-${Math.random()}`,
            type: state.selectedTool,
            startX: world.x,
            startY: world.y,
            endX: world.x,
            endY: world.y,
            color: state.selectedColor,
            width: state.selectedWidth,
          };
          state.setShapePreview(newShape);
        }
      }
    };

    const onMouseMove = (e) => {
      const { x: mx, y: my } = getMousePos(e);
      const world = screenToWorld(mx, my);

      // Emit cursor position for all users
      if (state.userId) {
        socket.emit('cursor-move', { x: world.x, y: world.y });
      }

      // Update cursor based on context
      if (state.selectedTool === 'select' && !state.isPanning.current && !state.isDragging.current && !state.isResizing.current) {
        // Check if hovering over resize handle
        if (state.selectedStrokes.length > 0 && resizeHandles.length > 0) {
          const handle = getHandleAtPoint(world, resizeHandles, 8 / state.camera.current.zoom);
          if (handle) {
            canvas.style.cursor = handle.cursor;
            return;
          }
        }

        // Check if hovering over a selected stroke
        const hoveringSelected = state.selectedStrokes.some(stroke => isPointInStroke(world, stroke, 10));
        canvas.style.cursor = hoveringSelected ? 'move' : 'default';
      } else if (state.selectedTool !== 'select') {
        canvas.style.cursor = 'crosshair';
      }

      if (state.isPanning.current) {
        const dx = e.clientX - state.lastPanPos.current.x;
        const dy = e.clientY - state.lastPanPos.current.y;
        
        state.camera.current.x -= dx / state.camera.current.zoom;
        state.camera.current.y -= dy / state.camera.current.zoom;
        
        state.lastPanPos.current = { x: e.clientX, y: e.clientY };
        render();
        return;
      }

      // Handle resizing selected strokes
      if (state.isResizing.current && state.resizeHandle.current && selectionBounds) {
        const handle = state.resizeHandle.current;
        const originalBounds = state.dragOffset.current;
        let newBounds = { ...originalBounds };

        // Update bounds based on handle position
        if (handle.id.includes('n')) newBounds.minY = world.y;
        if (handle.id.includes('s')) newBounds.maxY = world.y;
        if (handle.id.includes('w')) newBounds.minX = world.x;
        if (handle.id.includes('e')) newBounds.maxX = world.x;

        // Ensure bounds are valid (min < max)
        if (newBounds.minX > newBounds.maxX) {
          [newBounds.minX, newBounds.maxX] = [newBounds.maxX, newBounds.minX];
        }
        if (newBounds.minY > newBounds.maxY) {
          [newBounds.minY, newBounds.maxY] = [newBounds.maxY, newBounds.minY];
        }

        // Apply resize to selected strokes
        const resizedStrokes = resizeStrokes(state.selectedStrokes, originalBounds, newBounds);
        state.setSelectedStrokes(resizedStrokes);

        // Update strokes in their respective arrays
        resizedStrokes.forEach(stroke => {
          if (stroke.isPublic) {
            state.setPublicStrokes(prev => prev.map(s => 
              s.id === stroke.id ? { ...stroke, isPublic: undefined } : s
            ));
          } else {
            state.setPrivateStrokes(prev => prev.map(s => 
              s.id === stroke.id ? { ...stroke, isPublic: undefined } : s
            ));
          }
        });

        render();
        return;
      }

      // Handle dragging selected strokes
      if (state.isDragging.current) {
        const dx = world.x - state.dragOffset.current.x;
        const dy = world.y - state.dragOffset.current.y;
        
        // Update positions of selected strokes
        state.setSelectedStrokes(prev => prev.map(stroke => {
          if (stroke.type === 'text') {
            return { ...stroke, x: stroke.x + dx, y: stroke.y + dy };
          }
          if (stroke.type === 'freehand') {
            return { 
              ...stroke, 
              points: stroke.points.map(p => ({ x: p.x + dx, y: p.y + dy }))
            };
          }
          if (stroke.type === 'rectangle' || stroke.type === 'circle' || stroke.type === 'line' || stroke.type === 'arrow' || stroke.type === 'arrow-line') {
            return {
              ...stroke,
              startX: stroke.startX + dx,
              startY: stroke.startY + dy,
              endX: stroke.endX + dx,
              endY: stroke.endY + dy
            };
          }
          return stroke;
        }));
        
        // Update strokes in public or private arrays
        state.selectedStrokes.forEach(stroke => {
          if (stroke.isPublic) {
            state.setPublicStrokes(prev => prev.map(s => {
              if (s.id === stroke.id) {
                if (stroke.type === 'text') return { ...s, x: s.x + dx, y: s.y + dy };
                if (stroke.type === 'freehand') {
                  return { ...s, points: s.points.map(p => ({ x: p.x + dx, y: p.y + dy })) };
                }
                return { ...s, startX: s.startX + dx, startY: s.startY + dy, endX: s.endX + dx, endY: s.endY + dy };
              }
              return s;
            }));
          } else {
            state.setPrivateStrokes(prev => prev.map(s => {
              if (s.id === stroke.id) {
                if (stroke.type === 'text') return { ...s, x: s.x + dx, y: s.y + dy };
                if (stroke.type === 'freehand') {
                  return { ...s, points: s.points.map(p => ({ x: p.x + dx, y: p.y + dy })) };
                }
                return { ...s, startX: s.startX + dx, startY: s.startY + dy, endX: s.endX + dx, endY: s.endY + dy };
              }
              return s;
            }));
          }
        });
        
        state.dragOffset.current = { x: world.x, y: world.y };
        render();
        return;
      }

      // Handle selection box dragging
      if (state.isSelecting.current && state.selectionBox) {
        state.setSelectionBox(prev => ({
          ...prev,
          endX: world.x,
          endY: world.y
        }));
        render();
        return;
      }

      if (!state.isDrawing.current) return;

      // Handle shape preview
      if (state.shapePreview) {
        state.setShapePreview(prev => ({
          ...prev,
          endX: world.x,
          endY: world.y
        }));
        render();
        return;
      }

      // Handle freehand drawing
      if (state.currentStroke && state.selectedTool === 'freehand') {
        const updatedStroke = {
          ...state.currentStroke,
          points: [...state.currentStroke.points, { x: world.x, y: world.y }]
        };
        state.setCurrentStroke(updatedStroke);
        
        // Emit live stroke update for real-time viewing
        socket.emit('live-stroke', {
          points: updatedStroke.points,
          type: updatedStroke.type,
          color: updatedStroke.color,
          width: updatedStroke.width
        });
        
        render();
      }
    };

    const onMouseUp = () => {
      if (state.isPanning.current) {
        state.isPanning.current = false;
        if (state.selectedTool === 'select') {
          canvas.style.cursor = 'default';
        } else {
          canvas.style.cursor = 'crosshair';
        }
      }
      
      if (state.isResizing.current) {
        state.isResizing.current = false;
        state.resizeHandle.current = null;
        // Emit updated strokes to server
        state.selectedStrokes.forEach(stroke => {
          const cleanStroke = { ...stroke };
          delete cleanStroke.isPublic;
          if (stroke.isPublic) {
            socket.emit('update-stroke', { strokeId: stroke.id, updates: cleanStroke, isPublic: true });
          } else {
            socket.emit('update-stroke', { strokeId: stroke.id, updates: cleanStroke, isPublic: false });
          }
        });
        return;
      }
      
      if (state.isDragging.current) {
        state.isDragging.current = false;
        // Emit updated strokes to server
        state.selectedStrokes.forEach(stroke => {
          const cleanStroke = { ...stroke };
          delete cleanStroke.isPublic;
          if (stroke.isPublic) {
            socket.emit('update-stroke', { strokeId: stroke.id, updates: cleanStroke, isPublic: true });
          } else {
            socket.emit('update-stroke', { strokeId: stroke.id, updates: cleanStroke, isPublic: false });
          }
        });
        return;
      }

      // Handle selection completion
      if (state.isSelecting.current && state.selectionBox) {
        state.isSelecting.current = false;
        const box = state.selectionBox;
        const minX = Math.min(box.startX, box.endX);
        const maxX = Math.max(box.startX, box.endX);
        const minY = Math.min(box.startY, box.endY);
        const maxY = Math.max(box.startY, box.endY);
        
        const selected = [];
        
        // Check public strokes
        state.publicStrokes.forEach(stroke => {
          if (isStrokeInBox(stroke, minX, minY, maxX, maxY)) {
            selected.push({ ...stroke, isPublic: true });
          }
        });
        
        // Check private strokes (only for non-admin)
        if (!state.isAdminRef.current) {
          state.privateStrokes.forEach(stroke => {
            if (isStrokeInBox(stroke, minX, minY, maxX, maxY)) {
              selected.push({ ...stroke, isPublic: false });
            }
          });
        }
        
        state.setSelectedStrokes(selected);
        state.setSelectionBox(null);
        return;
      }

      if (!state.isDrawing.current) return;
      state.isDrawing.current = false;

      // Handle shape completion
      if (state.shapePreview) {
        const finalShape = { ...state.shapePreview };
        
        if (state.isAdminRef.current) {
          socket.emit('public-stroke', finalShape);
          state.setPublicStrokes(prev => [...prev, finalShape]);
        } else {
          socket.emit('private-stroke', finalShape);
          state.setPrivateStrokes(prev => [...prev, finalShape]);
        }
        
        state.setShapePreview(null);
        return;
      }

      // Handle freehand stroke completion
      if (state.currentStroke && state.currentStroke.points.length > 1) {
        if (state.isAdminRef.current) {
          socket.emit('public-stroke', state.currentStroke);
          state.setPublicStrokes(prev => [...prev, state.currentStroke]);
        } else {
          socket.emit('private-stroke', state.currentStroke);
          state.setPrivateStrokes(prev => [...prev, state.currentStroke]);
        }
        
        // Notify that live stroke ended
        socket.emit('live-stroke-end');
      }
      
      state.setCurrentStroke(null);
    };

    const onKeyDown = (e) => {
      // Delete selected strokes
      if ((e.key === 'Delete' || e.key === 'Backspace') && !e.target.matches('input, textarea')) {
        if (state.selectedStrokes.length > 0) {
          e.preventDefault();
          
          const publicToDelete = state.selectedStrokes.filter(s => s.isPublic).map(s => s.id);
          const privateToDelete = state.selectedStrokes.filter(s => !s.isPublic).map(s => s.id);
          
          if (publicToDelete.length > 0) {
            socket.emit('delete-strokes', { strokeIds: publicToDelete, isPublic: true });
            state.setPublicStrokes(prev => prev.filter(s => !publicToDelete.includes(s.id)));
          }
          
          if (privateToDelete.length > 0 && !state.isAdminRef.current) {
            socket.emit('delete-strokes', { strokeIds: privateToDelete, isPublic: false });
            state.setPrivateStrokes(prev => prev.filter(s => !privateToDelete.includes(s.id)));
          }
          
          state.setSelectedStrokes([]);
          state.setSelectionBox(null);
        }
      } 
      // Escape - clear selection
      else if (e.key === 'Escape') {
        state.setSelectedStrokes([]);
        state.setSelectionBox(null);
      }
      // Duplicate with Ctrl+D or Cmd+D
      else if ((e.ctrlKey || e.metaKey) && e.key === 'd' && !e.target.matches('input, textarea')) {
        if (state.selectedStrokes.length > 0) {
          e.preventDefault();
          
          const duplicates = state.selectedStrokes.map(stroke => {
            const newStroke = {
              ...stroke,
              id: `stroke-${Date.now()}-${Math.random()}`,
            };
            delete newStroke.isPublic;
            
            // Offset duplicates slightly
            if (stroke.type === 'text') {
              newStroke.x += 20;
              newStroke.y += 20;
            } else if (stroke.type === 'freehand') {
              newStroke.points = stroke.points.map(p => ({ x: p.x + 20, y: p.y + 20 }));
            } else {
              newStroke.startX += 20;
              newStroke.startY += 20;
              newStroke.endX += 20;
              newStroke.endY += 20;
            }
            
            // Add to appropriate array and emit
            if (stroke.isPublic && state.isAdminRef.current) {
              socket.emit('public-stroke', newStroke);
              state.setPublicStrokes(prev => [...prev, newStroke]);
              return { ...newStroke, isPublic: true };
            } else if (!state.isAdminRef.current) {
              socket.emit('private-stroke', newStroke);
              state.setPrivateStrokes(prev => [...prev, newStroke]);
              return { ...newStroke, isPublic: false };
            }
            return null;
          }).filter(Boolean);
          
          // Select the duplicates
          state.setSelectedStrokes(duplicates);
        }
      }
      // Select All with Ctrl+A or Cmd+A
      else if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !e.target.matches('input, textarea')) {
        e.preventDefault();
        const allStrokes = [
          ...state.publicStrokes.map(s => ({ ...s, isPublic: true })),
          ...(state.isAdminRef.current ? [] : state.privateStrokes.map(s => ({ ...s, isPublic: false })))
        ];
        state.setSelectedStrokes(allStrokes);
      }
      // Switch to Select tool with V key
      else if (e.key === 'v' && !e.target.matches('input, textarea')) {
        state.setSelectedTool('select');
      }
      // Switch to Draw tool with D key
      else if (e.key === 'd' && !e.target.matches('input, textarea') && !e.ctrlKey && !e.metaKey) {
        state.setSelectedTool('freehand');
      }
      // Switch to Rectangle tool with R key
      else if (e.key === 'r' && !e.target.matches('input, textarea')) {
        state.setSelectedTool('rectangle');
      }
      // Switch to Circle tool with C key
      else if (e.key === 'c' && !e.target.matches('input, textarea')) {
        state.setSelectedTool('circle');
      }
      // Switch to Text tool with T key
      else if (e.key === 't' && !e.target.matches('input, textarea')) {
        state.setSelectedTool('text');
      }
    };

    const onContextMenu = (e) => {
      // Show context menu only when in select mode and something is selected
      if (state.selectedTool === 'select' && state.selectedStrokes.length > 0) {
        e.preventDefault();
        const { x: mx, y: my } = getMousePos(e);
        const world = screenToWorld(mx, my);
        
        // Check if right-clicking on a selected stroke
        const clickedOnSelected = state.selectedStrokes.some(stroke => 
          isPointInStroke(world, stroke, 10)
        );
        
        if (clickedOnSelected) {
          state.setContextMenu({ show: true, x: e.clientX, y: e.clientY });
        }
      }
    };

    resize();
    canvas.addEventListener("wheel", onWheel, { passive: false });
    canvas.addEventListener("mousedown", onMouseDown);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("mouseleave", onMouseUp);
    canvas.addEventListener("contextmenu", onContextMenu);
    window.addEventListener("resize", resize);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("mousedown", onMouseDown);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("mouseleave", onMouseUp);
      canvas.removeEventListener("contextmenu", onContextMenu);
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [state, isDark, selectionBounds, resizeHandles, state.revealedStudents, state.allPrivateStrokes]);

  const handlePromoteStudent = useCallback((studentId) => {
    if (!state.isAdmin || !state.allPrivateStrokes[studentId]) return;
    
    const strokeIds = state.allPrivateStrokes[studentId].map(s => s.id);
    if (strokeIds.length > 0) {
      socket.emit('promote-stroke', { strokeIds });
    }
    
    state.setPromoteRequests(prev => prev.filter(req => req.userId !== studentId));
  }, [state.isAdmin, state.allPrivateStrokes, state.setPromoteRequests]);

  const handleToggleReveal = useCallback((studentId) => {
    state.setRevealedStudents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  }, [state.setRevealedStudents]);

  const handleCodeChange = useCallback((newCode) => {
    state.setMyCode(newCode);
    socket.emit('code-update', { code: newCode });
  }, [state.setMyCode]);

  const handleZoomIn = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const { x, y, zoom } = state.camera.current;
    
    const beforeX = centerX / zoom + x;
    const beforeY = centerY / zoom + y;
    
    const newZoom = Math.min(10, zoom * 1.2);
    state.camera.current.zoom = newZoom;
    state.camera.current.x = beforeX - centerX / newZoom;
    state.camera.current.y = beforeY - centerY / newZoom;
    setZoomLevel(Math.round(newZoom * 100));
  }, [state.camera]);

  const handleZoomOut = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const { x, y, zoom } = state.camera.current;
    
    const beforeX = centerX / zoom + x;
    const beforeY = centerY / zoom + y;
    
    const newZoom = Math.max(0.1, zoom / 1.2);
    state.camera.current.zoom = newZoom;
    state.camera.current.x = beforeX - centerX / newZoom;
    state.camera.current.y = beforeY - centerY / newZoom;
    setZoomLevel(Math.round(newZoom * 100));
  }, [state.camera]);

  const handleZoomReset = useCallback(() => {
    state.camera.current.zoom = 1;
    state.camera.current.x = 0;
    state.camera.current.y = 0;
    setZoomLevel(100);
  }, [state.camera]);

  const handleRequestPromote = useCallback(() => {
    if (!state.isAdmin && state.privateStrokes.length > 0) {
      socket.emit('request-promote');
    }
  }, [state.isAdmin, state.privateStrokes]);

  const handleSaveAsPNG = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create a temporary canvas for export
    const exportCanvas = document.createElement('canvas');
    const exportCtx = exportCanvas.getContext('2d');
    
    // Set size to current visible canvas size
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    
    // Fill with white background
    exportCtx.fillStyle = '#ffffff';
    exportCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    
    // Copy current canvas content
    exportCtx.drawImage(canvas, 0, 0);
    
    // Convert to PNG and download
    exportCanvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `scribble-${state.roomId}-${Date.now()}.png`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }, [state.roomId]);

  // Context menu handlers
  const handleDuplicateSelected = useCallback(() => {
    if (state.selectedStrokes.length === 0) return;
    
    const duplicates = state.selectedStrokes.map(stroke => {
      const newStroke = { ...stroke };
      delete newStroke.isPublic;
      newStroke.id = `stroke-${Date.now()}-${Math.random()}`;
      
      // Offset duplicates
      if (stroke.type === 'text') {
        newStroke.x += 20;
        newStroke.y += 20;
      } else if (stroke.type === 'freehand') {
        newStroke.points = stroke.points.map(p => ({ x: p.x + 20, y: p.y + 20 }));
      } else {
        newStroke.startX += 20;
        newStroke.startY += 20;
        newStroke.endX += 20;
        newStroke.endY += 20;
      }
      
      // Add to appropriate array
      if (stroke.isPublic && state.isAdminRef.current) {
        socket.emit('public-stroke', newStroke);
        state.setPublicStrokes(prev => [...prev, newStroke]);
        return { ...newStroke, isPublic: true };
      } else if (!state.isAdminRef.current) {
        socket.emit('private-stroke', newStroke);
        state.setPrivateStrokes(prev => [...prev, newStroke]);
        return { ...newStroke, isPublic: false };
      }
      return null;
    }).filter(Boolean);
    
    state.setSelectedStrokes(duplicates);
  }, [state]);

  const handleDeleteSelected = useCallback(() => {
    if (state.selectedStrokes.length === 0) return;
    
    const publicToDelete = state.selectedStrokes.filter(s => s.isPublic).map(s => s.id);
    const privateToDelete = state.selectedStrokes.filter(s => !s.isPublic).map(s => s.id);
    
    if (publicToDelete.length > 0) {
      socket.emit('delete-strokes', { strokeIds: publicToDelete, isPublic: true });
      state.setPublicStrokes(prev => prev.filter(s => !publicToDelete.includes(s.id)));
    }
    
    if (privateToDelete.length > 0) {
      socket.emit('delete-strokes', { strokeIds: privateToDelete, isPublic: false });
      state.setPrivateStrokes(prev => prev.filter(s => !privateToDelete.includes(s.id)));
    }
    
    state.setSelectedStrokes([]);
  }, [state]);

  const handleChangeColor = useCallback((color) => {
    if (state.selectedStrokes.length === 0) return;
    
    state.selectedStrokes.forEach(stroke => {
      const cleanStroke = { ...stroke, color };
      delete cleanStroke.isPublic;
      
      if (stroke.isPublic) {
        socket.emit('update-stroke', { strokeId: stroke.id, updates: cleanStroke, isPublic: true });
        state.setPublicStrokes(prev => prev.map(s => s.id === stroke.id ? { ...s, color } : s));
      } else {
        socket.emit('update-stroke', { strokeId: stroke.id, updates: cleanStroke, isPublic: false });
        state.setPrivateStrokes(prev => prev.map(s => s.id === stroke.id ? { ...s, color } : s));
      }
    });
    
    state.setSelectedStrokes(prev => prev.map(s => ({ ...s, color })));
  }, [state]);

  const handleChangeWidth = useCallback((width) => {
    if (state.selectedStrokes.length === 0) return;
    
    state.selectedStrokes.forEach(stroke => {
      const cleanStroke = { ...stroke, width };
      delete cleanStroke.isPublic;
      
      if (stroke.isPublic) {
        socket.emit('update-stroke', { strokeId: stroke.id, updates: cleanStroke, isPublic: true });
        state.setPublicStrokes(prev => prev.map(s => s.id === stroke.id ? { ...s, width } : s));
      } else {
        socket.emit('update-stroke', { strokeId: stroke.id, updates: cleanStroke, isPublic: false });
        state.setPrivateStrokes(prev => prev.map(s => s.id === stroke.id ? { ...s, width } : s));
      }
    });
    
    state.setSelectedStrokes(prev => prev.map(s => ({ ...s, width })));
  }, [state]);

  const handleBringToFront = useCallback(() => {
    if (state.selectedStrokes.length === 0) return;
    
    state.selectedStrokes.forEach(stroke => {
      if (stroke.isPublic) {
        state.setPublicStrokes(prev => {
          const filtered = prev.filter(s => s.id !== stroke.id);
          return [...filtered, stroke];
        });
      } else {
        state.setPrivateStrokes(prev => {
          const filtered = prev.filter(s => s.id !== stroke.id);
          return [...filtered, stroke];
        });
      }
    });
  }, [state]);

  const handleSendToBack = useCallback(() => {
    if (state.selectedStrokes.length === 0) return;
    
    state.selectedStrokes.forEach(stroke => {
      if (stroke.isPublic) {
        state.setPublicStrokes(prev => {
          const filtered = prev.filter(s => s.id !== stroke.id);
          return [stroke, ...filtered];
        });
      } else {
        state.setPrivateStrokes(prev => {
          const filtered = prev.filter(s => s.id !== stroke.id);
          return [stroke, ...filtered];
        });
      }
    });
  }, [state]);

  return (
    <div className="w-screen h-screen relative">
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{
          background: isDark ? "#1a1a1a" : "#ffffff",
          cursor: state.isPanning.current ? "grabbing" : "crosshair",
        }}
      />

      <CanvasToolbar
        isAdmin={state.isAdmin}
        userCount={state.userCount}
        selectedColor={state.selectedColor}
        setSelectedColor={state.setSelectedColor}
        selectedWidth={state.selectedWidth}
        setSelectedWidth={state.setSelectedWidth}
        selectedTool={state.selectedTool}
        setSelectedTool={state.setSelectedTool}
        privateStrokes={state.privateStrokes}
        allPrivateStrokes={state.allPrivateStrokes}
        promoteRequests={state.promoteRequests}
        onRequestPromote={handleRequestPromote}
        onTogglePromotionPanel={() => state.setShowPromotionPanel(!state.showPromotionPanel)}
        showPromotionPanel={state.showPromotionPanel}
        onSaveAsPNG={handleSaveAsPNG}
        onLeaveRoom={onLeaveRoom}
      />

      <StudentWorkPanel
        showPromotionPanel={state.showPromotionPanel && state.isAdmin}
        allPrivateStrokes={state.allPrivateStrokes}
        promoteRequests={state.promoteRequests}
        onPromoteStudent={handlePromoteStudent}
        onToggleReveal={handleToggleReveal}
        revealedStudents={state.revealedStudents}
        onClose={() => state.setShowPromotionPanel(false)}
      />

      {/* Context Menu */}
      <ContextMenu
        show={state.contextMenu.show}
        x={state.contextMenu.x}
        y={state.contextMenu.y}
        selectedStrokes={state.selectedStrokes}
        onDuplicate={handleDuplicateSelected}
        onDelete={handleDeleteSelected}
        onChangeColor={handleChangeColor}
        onChangeWidth={handleChangeWidth}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
        onClose={() => state.setContextMenu({ show: false, x: 0, y: 0 })}
      />

      {/* Text Input Overlay */}
      {state.textInput.show && (() => {
        const canvas = canvasRef.current;
        if (!canvas) return null;
        
        const rect = canvas.getBoundingClientRect();
        const { x: camX, y: camY, zoom } = state.camera.current;
        
        // Convert world coordinates to screen coordinates
        const screenX = (state.textInput.x - camX) * zoom;
        const screenY = (state.textInput.y - camY) * zoom;
        
        const fontSize = (state.selectedWidth || 2) * 8;
        
        return (
          <div
            className="absolute pointer-events-none"
            style={{
              left: 0,
              top: 0,
              width: '100%',
              height: '100%',
            }}
            onClick={(e) => {
              // Click outside to close
              if (e.target === e.currentTarget) {
                state.setTextInput({ show: false, x: 0, y: 0, text: "" });
              }
            }}
          >
            <textarea
              value={state.textInput.text}
              onChange={(e) => {
                state.setTextInput(prev => ({ ...prev, text: e.target.value }));
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && state.textInput.text.trim()) {
                  e.preventDefault();
                  const textStroke = {
                    id: `stroke-${Date.now()}-${Math.random()}`,
                    type: 'text',
                    x: state.textInput.x,
                    y: state.textInput.y,
                    text: state.textInput.text,
                    color: state.selectedColor,
                    width: state.selectedWidth,
                    fontSize: fontSize,
                    fontFamily: 'Arial',
                  };
                  
                  if (state.isAdminRef.current) {
                    socket.emit('public-stroke', textStroke);
                    state.setPublicStrokes(prev => [...prev, textStroke]);
                  } else {
                    socket.emit('private-stroke', textStroke);
                    state.setPrivateStrokes(prev => [...prev, textStroke]);
                  }
                  
                  state.setTextInput({ show: false, x: 0, y: 0, text: "" });
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  state.setTextInput({ show: false, x: 0, y: 0, text: "" });
                }
              }}
              autoFocus
              placeholder="Type text..."
              spellCheck="true"
              className={`pointer-events-auto resize-none overflow-hidden border-2 rounded px-2 py-1 focus:outline-none ${
                isDark 
                  ? 'bg-transparent border-[#5e5ce6] text-white placeholder-gray-500 focus:border-blue-400' 
                  : 'bg-transparent border-blue-500 text-gray-900 placeholder-gray-400 focus:border-blue-600'
              }`}
              style={{
                position: 'absolute',
                left: `${screenX}px`,
                top: `${screenY}px`,
                fontSize: `${fontSize}px`,
                fontFamily: 'Arial, sans-serif',
                minWidth: '100px',
                maxWidth: '400px',
                lineHeight: '1.2',
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
              }}
              rows={1}
              onInput={(e) => {
                // Auto-grow textarea
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
            />
          </div>
        );
      })()}
      
      {/* Bottom Left - Room ID */}
      <div className={`absolute bottom-4 left-4 px-3 py-2 rounded-lg shadow-lg ${
          isDark ? 'bg-[#1e1e1e] border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <div className="flex items-center gap-2 text-xs">
            <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Room</span>
            <span className={`font-mono font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {state.roomId}
            </span>
          </div>
        </div>

      {/* Bottom Right - Zoom Controls */}
      <div className={`absolute bottom-4 right-4 flex items-center gap-2 px-2 py-2 rounded-lg shadow-lg ${
          isDark ? 'bg-[#1e1e1e] border border-gray-700' : 'bg-white border border-gray-200'
        }`}>
          <button
            onClick={handleZoomOut}
            className={`w-7 h-7 flex items-center justify-center rounded transition-all ${
              isDark
                ? 'hover:bg-[#2a2a2a] text-gray-300'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            title="Zoom Out"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
          
          <button
            onClick={handleZoomReset}
            className={`px-2 py-1 rounded text-xs font-mono font-semibold transition-all ${
              isDark
                ? 'hover:bg-[#2a2a2a] text-white'
                : 'hover:bg-gray-100 text-gray-900'
            }`}
            title="Reset Zoom (100%)"
          >
            {zoomLevel}%
          </button>
          
          <button
            onClick={handleZoomIn}
            className={`w-7 h-7 flex items-center justify-center rounded transition-all ${
              isDark
                ? 'hover:bg-[#2a2a2a] text-gray-300'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
            title="Zoom In"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
              <line x1="11" y1="8" x2="11" y2="14"></line>
              <line x1="8" y1="11" x2="14" y2="11"></line>
            </svg>
          </button>
        </div>

      {/* Top Right - Role Info & Panel Toggle */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
        {/* Role Info & Status */}
        <div className={`px-3 py-2 rounded-lg shadow-lg ${
          isDark ? 'bg-[#1e1e1e] border border-gray-700 text-gray-300' : 'bg-white border border-gray-200 text-gray-700'
        }`}>
          <div className="text-xs space-y-1">
            {state.isAdmin ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span>Strokes are</span>
                  <span className="font-semibold text-green-500">visible to all</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>Code is</span>
                  <span className="font-semibold text-green-500">visible to all</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <span>Strokes are</span>
                  <span className="font-semibold text-blue-500">private</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span>Code is</span>
                  <span className="font-semibold text-blue-500">private</span>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Code Panel Toggle Button */}
        <button
          onClick={() => state.setShowCodePanel(!state.showCodePanel)}
          className={`w-10 h-10 rounded-lg shadow-lg flex items-center justify-center transition-all ${
            isDark 
              ? 'bg-[#1e1e1e] border border-gray-700 hover:bg-[#2a2a2a] text-gray-300' 
              : 'bg-white border border-gray-200 hover:bg-gray-50 text-gray-700'
          }`}
          title="Toggle Code Panel"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="16 18 22 12 16 6"></polyline>
            <polyline points="8 6 2 12 8 18"></polyline>
          </svg>
        </button>
      </div>

      {/* Sliding Code Panel */}
      <div className={`absolute top-0 right-0 h-full w-1/2 transform transition-transform duration-300 ease-in-out z-[100] ${
        state.showCodePanel ? 'translate-x-0' : 'translate-x-full'
      } ${isDark ? 'bg-[#1e1e1e]' : 'bg-white'} shadow-2xl border-l ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        {/* Panel Header */}
        <div className={`flex items-center justify-between px-4 py-3 border-b ${
          isDark ? 'border-gray-700 bg-[#252525]' : 'border-gray-200 bg-gray-50'
        }`}>
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <span className={`text-sm font-semibold ml-2 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Code Editor
              {state.isAdmin && state.viewingUserId && (
                <span className={`ml-2 text-xs font-normal ${
                  isDark ? 'text-blue-400' : 'text-blue-600'
                }`}>
                  (Viewing: {state.viewingUserId})
                </span>
              )}
            </span>
          </div>
          <button
            onClick={() => state.setShowCodePanel(false)}
            className={`p-1 rounded hover:bg-opacity-10 ${
              isDark ? 'hover:bg-white text-gray-400' : 'hover:bg-black text-gray-600'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        {/* Panel Content - Code Editor Style */}
        <div className="h-[calc(100%-60px)] flex flex-col">
          {/* User Selector Dropdown for Admin */}
          {state.isAdmin && (
            <div className={`px-4 py-3 border-b ${
              isDark ? 'border-gray-700 bg-[#252525]' : 'border-gray-200 bg-gray-50'
            }`}>
              <label className={`text-xs font-semibold mb-2 block ${
                isDark ? 'text-gray-400' : 'text-gray-600'
              }`}>
                Viewing Code:
              </label>
              <select
                value={state.viewingUserId || 'me'}
                onChange={(e) => state.setViewingUserId(e.target.value === 'me' ? null : e.target.value)}
                className={`w-full px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDark 
                    ? 'bg-[#1e1e1e] border border-gray-600 text-gray-300' 
                    : 'bg-white border border-gray-300 text-gray-700'
                }`}
              >
                <option value="me">My Code</option>
                {Object.keys(state.allUsersCode).map(userId => (
                  userId !== state.userId && (
                    <option key={userId} value={userId}>
                      {userId}
                    </option>
                  )
                ))}
              </select>
            </div>
          )}

          {/* Line Numbers + Code Area */}
          <div className="flex-1 flex overflow-hidden">
            {/* Line Numbers */}
            <div className={`w-12 flex-shrink-0 py-4 text-right pr-3 text-xs font-mono select-none ${
              isDark ? 'bg-[#252525] text-gray-600' : 'bg-gray-50 text-gray-400'
            }`}>
              {Array.from({ length: 30 }, (_, i) => (
                <div key={i + 1} className="leading-6">{i + 1}</div>
              ))}
            </div>

            {/* Code Content - Editable Textarea */}
            <div className="flex-1 overflow-hidden">
              <textarea
                className={`w-full h-full p-4 text-xs font-mono leading-6 resize-none focus:outline-none ${
                  isDark ? 'bg-[#1e1e1e] text-gray-300' : 'bg-white text-gray-800'
                }`}
                spellCheck="false"
                value={state.viewingUserId !== null 
                  ? (state.allUsersCode[state.viewingUserId] || '// No code yet...')
                  : state.myCode
                }
                onChange={(e) => {
                  if (state.viewingUserId === null) {
                    handleCodeChange(e.target.value);
                  }
                }}
                readOnly={state.viewingUserId !== null}
                placeholder={state.viewingUserId !== null 
                  ? `Viewing ${state.viewingUserId}'s code...`
                  : "Start typing code..."
                }
              />
            </div>
          </div>

          {/* Status Bar */}
          <div className={`flex items-center justify-between px-4 py-1.5 text-xs border-t ${
            isDark ? 'border-gray-700 bg-[#252525] text-gray-400' : 'border-gray-200 bg-gray-50 text-gray-600'
          }`}>
            <div className="flex items-center gap-4">
              {state.viewingUserId !== null && (
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded ${
                  isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-700'
                }`}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <span>Read-only</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

Canvas.propTypes = {
  onLeaveRoom: PropTypes.func.isRequired,
  initialRoomData: PropTypes.object,
};
