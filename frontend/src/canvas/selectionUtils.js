// Selection utility functions for the pointer/selection tool

/**
 * Calculate bounding box for a single stroke
 */
export const getStrokeBounds = (stroke) => {
  if (!stroke) return null;

  if (stroke.type === 'text') {
    const fontSize = stroke.fontSize || (stroke.width || 2) * 8;
    const textWidth = stroke.text.length * fontSize * 0.6; // Approximate width
    const lines = stroke.text.split('\n');
    const textHeight = lines.length * fontSize * 1.2;
    
    return {
      minX: stroke.x,
      minY: stroke.y,
      maxX: stroke.x + textWidth,
      maxY: stroke.y + textHeight,
    };
  }

  if (stroke.type === 'freehand' && stroke.points && stroke.points.length > 0) {
    const xs = stroke.points.map(p => p.x);
    const ys = stroke.points.map(p => p.y);
    return {
      minX: Math.min(...xs),
      minY: Math.min(...ys),
      maxX: Math.max(...xs),
      maxY: Math.max(...ys),
    };
  }

  if (['rectangle', 'circle', 'line', 'arrow', 'arrow-line'].includes(stroke.type)) {
    return {
      minX: Math.min(stroke.startX, stroke.endX),
      minY: Math.min(stroke.startY, stroke.endY),
      maxX: Math.max(stroke.startX, stroke.endX),
      maxY: Math.max(stroke.startY, stroke.endY),
    };
  }

  return null;
};

/**
 * Calculate combined bounding box for multiple strokes
 */
export const getSelectionBounds = (strokes) => {
  if (!strokes || strokes.length === 0) return null;

  const bounds = strokes.map(getStrokeBounds).filter(Boolean);
  if (bounds.length === 0) return null;

  return {
    minX: Math.min(...bounds.map(b => b.minX)),
    minY: Math.min(...bounds.map(b => b.minY)),
    maxX: Math.max(...bounds.map(b => b.maxX)),
    maxY: Math.max(...bounds.map(b => b.maxY)),
  };
};

/**
 * Check if a point is within a stroke
 */
export const isPointInStroke = (point, stroke, tolerance = 10) => {
  if (!stroke) return false;

  const { x, y } = point;

  if (stroke.type === 'text') {
    const fontSize = stroke.fontSize || (stroke.width || 2) * 8;
    const textWidth = stroke.text.length * fontSize * 0.6;
    const lines = stroke.text.split('\n');
    const textHeight = lines.length * fontSize * 1.2;
    
    return x >= stroke.x - tolerance && 
           x <= stroke.x + textWidth + tolerance && 
           y >= stroke.y - tolerance && 
           y <= stroke.y + textHeight + tolerance;
  }

  if (stroke.type === 'freehand' && stroke.points) {
    // Check if point is near any part of the freehand stroke
    return stroke.points.some(p => 
      Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2) < tolerance
    );
  }

  if (['rectangle', 'circle', 'line', 'arrow', 'arrow-line'].includes(stroke.type)) {
    const bounds = getStrokeBounds(stroke);
    if (!bounds) return false;
    
    return x >= bounds.minX - tolerance && 
           x <= bounds.maxX + tolerance && 
           y >= bounds.minY - tolerance && 
           y <= bounds.maxY + tolerance;
  }

  return false;
};

/**
 * Check if a stroke intersects with a selection box
 */
export const isStrokeInBox = (stroke, minX, minY, maxX, maxY) => {
  if (!stroke) return false;

  if (stroke.type === 'text') {
    return stroke.x >= minX && stroke.x <= maxX && stroke.y >= minY && stroke.y <= maxY;
  }

  if (stroke.type === 'freehand' && stroke.points) {
    return stroke.points.some(p => p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY);
  }

  if (['rectangle', 'circle', 'line', 'arrow', 'arrow-line'].includes(stroke.type)) {
    const sMinX = Math.min(stroke.startX, stroke.endX);
    const sMaxX = Math.max(stroke.startX, stroke.endX);
    const sMinY = Math.min(stroke.startY, stroke.endY);
    const sMaxY = Math.max(stroke.startY, stroke.endY);
    return !(sMaxX < minX || sMinX > maxX || sMaxY < minY || sMinY > maxY);
  }

  return false;
};

/**
 * Get resize handle positions for selected strokes
 */
export const getResizeHandles = (bounds) => {
  if (!bounds) return [];

  const { minX, minY, maxX, maxY } = bounds;
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  return [
    { id: 'nw', x: minX, y: minY, cursor: 'nwse-resize' },
    { id: 'n', x: centerX, y: minY, cursor: 'ns-resize' },
    { id: 'ne', x: maxX, y: minY, cursor: 'nesw-resize' },
    { id: 'e', x: maxX, y: centerY, cursor: 'ew-resize' },
    { id: 'se', x: maxX, y: maxY, cursor: 'nwse-resize' },
    { id: 's', x: centerX, y: maxY, cursor: 'ns-resize' },
    { id: 'sw', x: minX, y: maxY, cursor: 'nesw-resize' },
    { id: 'w', x: minX, y: centerY, cursor: 'ew-resize' },
  ];
};

/**
 * Check if a point is on a resize handle
 */
export const getHandleAtPoint = (point, handles, handleSize = 8) => {
  if (!handles || !point) return null;

  return handles.find(handle => 
    Math.abs(handle.x - point.x) <= handleSize && 
    Math.abs(handle.y - point.y) <= handleSize
  );
};

/**
 * Resize strokes based on handle movement
 */
export const resizeStrokes = (strokes, originalBounds, newBounds) => {
  if (!strokes || strokes.length === 0 || !originalBounds || !newBounds) return strokes;

  const scaleX = (newBounds.maxX - newBounds.minX) / (originalBounds.maxX - originalBounds.minX);
  const scaleY = (newBounds.maxY - newBounds.minY) / (originalBounds.maxY - originalBounds.minY);

  return strokes.map(stroke => {
    if (stroke.type === 'text') {
      const relX = (stroke.x - originalBounds.minX) / (originalBounds.maxX - originalBounds.minX);
      const relY = (stroke.y - originalBounds.minY) / (originalBounds.maxY - originalBounds.minY);
      
      return {
        ...stroke,
        x: newBounds.minX + relX * (newBounds.maxX - newBounds.minX),
        y: newBounds.minY + relY * (newBounds.maxY - newBounds.minY),
        fontSize: (stroke.fontSize || (stroke.width || 2) * 8) * Math.min(scaleX, scaleY),
      };
    }

    if (stroke.type === 'freehand') {
      return {
        ...stroke,
        points: stroke.points.map(p => ({
          x: newBounds.minX + ((p.x - originalBounds.minX) / (originalBounds.maxX - originalBounds.minX)) * (newBounds.maxX - newBounds.minX),
          y: newBounds.minY + ((p.y - originalBounds.minY) / (originalBounds.maxY - originalBounds.minY)) * (newBounds.maxY - newBounds.minY),
        })),
      };
    }

    if (['rectangle', 'circle', 'line', 'arrow', 'arrow-line'].includes(stroke.type)) {
      const relStartX = (stroke.startX - originalBounds.minX) / (originalBounds.maxX - originalBounds.minX);
      const relStartY = (stroke.startY - originalBounds.minY) / (originalBounds.maxY - originalBounds.minY);
      const relEndX = (stroke.endX - originalBounds.minX) / (originalBounds.maxX - originalBounds.minX);
      const relEndY = (stroke.endY - originalBounds.minY) / (originalBounds.maxY - originalBounds.minY);

      return {
        ...stroke,
        startX: newBounds.minX + relStartX * (newBounds.maxX - newBounds.minX),
        startY: newBounds.minY + relStartY * (newBounds.maxY - newBounds.minY),
        endX: newBounds.minX + relEndX * (newBounds.maxX - newBounds.minX),
        endY: newBounds.minY + relEndY * (newBounds.maxY - newBounds.minY),
      };
    }

    return stroke;
  });
};
