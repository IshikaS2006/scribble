const drawStroke = (ctx, stroke, isSelected = false) => {
  // Highlight selected strokes with a glow effect
  if (isSelected) {
    ctx.save();
    ctx.shadowColor = '#5e5ce6';
    ctx.shadowBlur = 15;
    ctx.globalAlpha = 0.8;
  }
  
  if (stroke.type === 'text') {
    // Draw text
    ctx.fillStyle = stroke.color || "#000";
    const fontSize = stroke.fontSize || (stroke.width || 2) * 8;
    const fontFamily = stroke.fontFamily || 'Arial';
    ctx.font = `${fontSize}px ${fontFamily}, sans-serif`;
    ctx.textBaseline = 'top';
    
    // Handle multiline text
    const lines = stroke.text.split('\n');
    const lineHeight = fontSize * 1.2;
    lines.forEach((line, index) => {
      ctx.fillText(line, stroke.x, stroke.y + (index * lineHeight));
    });
  } else if (stroke.type === 'rectangle') {
    // Draw rectangle
    ctx.strokeStyle = stroke.color || "#000";
    ctx.lineWidth = stroke.width || 2;
    ctx.strokeRect(stroke.startX, stroke.startY, stroke.endX - stroke.startX, stroke.endY - stroke.startY);
  } else if (stroke.type === 'circle') {
    // Draw circle
    ctx.strokeStyle = stroke.color || "#000";
    ctx.lineWidth = stroke.width || 2;
    const centerX = (stroke.startX + stroke.endX) / 2;
    const centerY = (stroke.startY + stroke.endY) / 2;
    const radiusX = Math.abs(stroke.endX - stroke.startX) / 2;
    const radiusY = Math.abs(stroke.endY - stroke.startY) / 2;
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI);
    ctx.stroke();
  } else if (stroke.type === 'line') {
    // Draw line
    ctx.strokeStyle = stroke.color || "#000";
    ctx.lineWidth = stroke.width || 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(stroke.startX, stroke.startY);
    ctx.lineTo(stroke.endX, stroke.endY);
    ctx.stroke();
  } else if (stroke.type === 'arrow') {
    // Draw arrow with filled arrowhead
    ctx.strokeStyle = stroke.color || "#000";
    ctx.fillStyle = stroke.color || "#000";
    ctx.lineWidth = stroke.width || 2;
    ctx.lineCap = "round";
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(stroke.startX, stroke.startY);
    ctx.lineTo(stroke.endX, stroke.endY);
    ctx.stroke();
    
    // Draw filled arrowhead
    const angle = Math.atan2(stroke.endY - stroke.startY, stroke.endX - stroke.startX);
    const arrowLength = 15;
    const arrowAngle = Math.PI / 6;
    
    ctx.beginPath();
    ctx.moveTo(stroke.endX, stroke.endY);
    ctx.lineTo(
      stroke.endX - arrowLength * Math.cos(angle - arrowAngle),
      stroke.endY - arrowLength * Math.sin(angle - arrowAngle)
    );
    ctx.lineTo(
      stroke.endX - arrowLength * Math.cos(angle + arrowAngle),
      stroke.endY - arrowLength * Math.sin(angle + arrowAngle)
    );
    ctx.closePath();
    ctx.fill();
  } else if (stroke.type === 'arrow-line') {
    // Draw arrow with simple line arrowhead
    ctx.strokeStyle = stroke.color || "#000";
    ctx.lineWidth = stroke.width || 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    // Draw line
    ctx.beginPath();
    ctx.moveTo(stroke.startX, stroke.startY);
    ctx.lineTo(stroke.endX, stroke.endY);
    ctx.stroke();
    
    // Draw simple line arrowhead
    const angle = Math.atan2(stroke.endY - stroke.startY, stroke.endX - stroke.startX);
    const arrowLength = 15;
    const arrowAngle = Math.PI / 6;
    
    // Left side of arrowhead
    ctx.beginPath();
    ctx.moveTo(stroke.endX, stroke.endY);
    ctx.lineTo(
      stroke.endX - arrowLength * Math.cos(angle - arrowAngle),
      stroke.endY - arrowLength * Math.sin(angle - arrowAngle)
    );
    ctx.stroke();
    
    // Right side of arrowhead
    ctx.beginPath();
    ctx.moveTo(stroke.endX, stroke.endY);
    ctx.lineTo(
      stroke.endX - arrowLength * Math.cos(angle + arrowAngle),
      stroke.endY - arrowLength * Math.sin(angle + arrowAngle)
    );
    ctx.stroke();
  } else if (stroke.points && stroke.points.length > 1) {
    // Draw freehand
    ctx.strokeStyle = stroke.color || "#000";
    ctx.lineWidth = stroke.width || 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
    }
    ctx.stroke();
  }
  
  // Restore context if it was highlighted
  if (isSelected) {
    ctx.restore();
  }
};

export const renderCanvas = (ctx, canvas, {
  publicStrokes,
  privateStrokes,
  revealedStrokes = [],
  currentStroke,
  shapePreview,
  selectionBox,
  selectedStrokes,
  camera,
  isAdminRef,
  isDark,
  selectionBounds = null,
  resizeHandles = [],
  userCursors = {},
  myUserId = null,
  revealedStudents = new Set(),
  userLiveStrokes = {}
}) => {
  const dpr = window.devicePixelRatio || 1;
  
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const { x, y, zoom } = camera.current;
  ctx.scale(dpr, dpr);
  ctx.translate(-x * zoom, -y * zoom);
  ctx.scale(zoom, zoom);

  // Grid - subtle dots like Excalidraw
  ctx.fillStyle = isDark ? "#2a2a2a" : "#e0e0e0";
  const gridSize = 20;
  const dotSize = 1;
  for (let i = Math.floor(x - 1000/zoom); i <= x + 1000/zoom; i += gridSize) {
    for (let j = Math.floor(y - 1000/zoom); j <= y + 1000/zoom; j += gridSize) {
      ctx.fillRect(i, j, dotSize, dotSize);
    }
  }

  // Public strokes
  const selectedIds = selectedStrokes ? selectedStrokes.map(s => s.id) : [];
  
  publicStrokes.forEach((stroke) => {
    const isSelected = selectedIds.includes(stroke.id);
    drawStroke(ctx, stroke, isSelected);
  });

  // Private strokes (students only see their own)
  if (!isAdminRef.current) {
    privateStrokes.forEach((stroke) => {
      const isSelected = selectedIds.includes(stroke.id);
      drawStroke(ctx, stroke, isSelected);
    });
  }

  // Revealed student strokes (admin only)
  if (isAdminRef.current && revealedStrokes.length > 0) {
    ctx.globalAlpha = 0.7; // Make revealed strokes slightly transparent
    revealedStrokes.forEach((stroke) => {
      const isSelected = selectedIds.includes(stroke.id);
      drawStroke(ctx, stroke, isSelected);
    });
    ctx.globalAlpha = 1.0;
  }

  // Current stroke being drawn
  if (currentStroke) {
    drawStroke(ctx, currentStroke);
  }

  // Shape preview
  if (shapePreview) {
    ctx.globalAlpha = 0.7;
    drawStroke(ctx, shapePreview);
    ctx.globalAlpha = 1.0;
  }

  // Selection box
  if (selectionBox) {
    const minX = Math.min(selectionBox.startX, selectionBox.endX);
    const maxX = Math.max(selectionBox.startX, selectionBox.endX);
    const minY = Math.min(selectionBox.startY, selectionBox.endY);
    const maxY = Math.max(selectionBox.startY, selectionBox.endY);
    
    ctx.strokeStyle = '#5e5ce6';
    ctx.fillStyle = 'rgba(94, 92, 230, 0.1)';
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([5 / zoom, 5 / zoom]);
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
    ctx.fillRect(minX, minY, maxX - minX, maxY - minY);
    ctx.setLineDash([]);
  }

  // Draw bounding box and resize handles for selected strokes
  if (selectionBounds && selectedStrokes && selectedStrokes.length > 0) {
    const { minX, minY, maxX, maxY } = selectionBounds;
    
    // Draw bounding box
    ctx.strokeStyle = '#5e5ce6';
    ctx.lineWidth = 2 / zoom;
    ctx.setLineDash([5 / zoom, 5 / zoom]);
    ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);
    ctx.setLineDash([]);
    
    // Draw resize handles
    if (resizeHandles && resizeHandles.length > 0) {
      const handleSize = 8 / zoom;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#5e5ce6';
      ctx.lineWidth = 2 / zoom;
      
      resizeHandles.forEach(handle => {
        ctx.fillRect(
          handle.x - handleSize / 2,
          handle.y - handleSize / 2,
          handleSize,
          handleSize
        );
        ctx.strokeRect(
          handle.x - handleSize / 2,
          handle.y - handleSize / 2,
          handleSize,
          handleSize
        );
      });
    }
  }

  // Draw cursors for admin and revealed students
  if (userCursors) {
    Object.entries(userCursors).forEach(([userId, cursor]) => {
      if (userId === myUserId) return; // Don't draw own cursor
      
      // Show cursor if:
      // 1. Current user is not admin and cursor is admin's
      // 2. Current user is admin and student is revealed
      // 3. Current user is not admin and student is revealed (public view)
      const shouldShowCursor = 
        (!isAdminRef.current) || // Non-admin users
        (isAdminRef.current && revealedStudents.has(userId)); // Admin sees revealed students
      
      if (!shouldShowCursor) return;
      
      const { x: cursorX, y: cursorY } = cursor;
      const size = 16 / zoom;
      
      // Determine cursor color based on user type
      const isAdminCursor = userId.includes('admin') || userId === 'teacher';
      const cursorColor = isAdminCursor ? '#5e5ce6' : '#10b981';
      
      // Draw cursor pointer
      ctx.save();
      ctx.strokeStyle = cursorColor;
      ctx.fillStyle = cursorColor;
      ctx.lineWidth = 2 / zoom;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      // Cursor arrow shape
      ctx.beginPath();
      ctx.moveTo(cursorX, cursorY);
      ctx.lineTo(cursorX, cursorY + size);
      ctx.lineTo(cursorX + size * 0.35, cursorY + size * 0.7);
      ctx.lineTo(cursorX + size * 0.6, cursorY + size * 0.6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      
      // Draw label with userId
      const labelText = userId;
      const fontSize = 11 / zoom;
      ctx.font = `${fontSize}px sans-serif`;
      const textMetrics = ctx.measureText(labelText);
      const padding = 4 / zoom;
      
      const labelX = cursorX + size * 0.7;
      const labelY = cursorY + size * 0.7;
      
      // Label background
      ctx.fillStyle = cursorColor;
      ctx.fillRect(
        labelX,
        labelY,
        textMetrics.width + padding * 2,
        fontSize + padding * 2
      );
      
      // Label text
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'top';
      ctx.fillText(labelText, labelX + padding, labelY + padding);
      
      ctx.restore();
    });
  }
};
