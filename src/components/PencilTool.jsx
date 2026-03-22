import React, { useState, useRef } from 'react';

export default function PencilTool({ isActive, viewBoxWidth = 760, viewBoxHeight = 480, paths = [], onPathsChange }) {
  const [currentPath, setCurrentPath] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const svgRef = useRef(null);

  const getCoordinates = (e) => {
    if (!svgRef.current) return null;
    const svg = svgRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const cursor = pt.matrixTransform(svg.getScreenCTM().inverse());
    return { x: cursor.x, y: cursor.y };
  };

  const startDrawing = (e) => {
    if (!isActive) return;
    // Allow both left (0) and right (2) clicks as requested
    if (e.button !== 0 && e.button !== 2) return;
    
    const coords = getCoordinates(e);
    if (!coords) return;
    
    setIsDrawing(true);
    setCurrentPath(`M ${coords.x} ${coords.y}`);
  };

  const draw = (e) => {
    if (!isActive || !isDrawing || !currentPath) return;
    
    const coords = getCoordinates(e);
    if (!coords) return;
    
    setCurrentPath((prev) => `${prev} L ${coords.x} ${coords.y}`);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    
    if (currentPath) {
      if (onPathsChange) onPathsChange([...paths, currentPath]);
    }
    setCurrentPath(null);
    setIsDrawing(false);
  };

  // Prevent context menu from interrupting drawing if they meant right click literally
  const handleContextMenu = (e) => {
    if (isActive) e.preventDefault();
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: isActive ? 'auto' : 'none',
        zIndex: 10,
        touchAction: 'none'
      }}
      onMouseDown={startDrawing}
      onMouseMove={draw}
      onMouseUp={stopDrawing}
      onMouseLeave={stopDrawing}
      onContextMenu={handleContextMenu}
    >
      {paths.map((pathData, index) => (
        <path
          key={index}
          d={pathData}
          fill="none"
          stroke="#1f2937"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {currentPath && (
        <path
          d={currentPath}
          fill="none"
          stroke="#1f2937"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
