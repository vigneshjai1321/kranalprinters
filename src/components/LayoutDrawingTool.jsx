import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Input, InputNumber, Space, Typography, Divider } from "antd";
import { DeleteOutlined, FontSizeOutlined, LineOutlined, ReloadOutlined, DragOutlined, BorderOutlined } from "@ant-design/icons";

const { Text } = Typography;

const SVG_VIEWBOX = { width: 760, height: 480 };
const SHEET_PADDING = 48;

function safeNum(value, fallback = 1) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return num;
}

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function gcd(a, b) {
  if (!b) return a;
  return gcd(b, a % b);
}

function toMixedFraction(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) return String(value || "");

  const sign = num < 0 ? "-" : "";
  const abs = Math.abs(num);
  const whole = Math.floor(abs);
  const fraction = abs - whole;

  if (fraction < 0.0001) return `${sign}${whole}`;

  const denominator = 16;
  const roundedNumerator = Math.round(fraction * denominator);
  if (roundedNumerator === denominator) return `${sign}${whole + 1}`;
  if (roundedNumerator === 0) return `${sign}${whole}`;

  const divisor = gcd(roundedNumerator, denominator);
  const numerator = roundedNumerator / divisor;
  const reducedDenominator = denominator / divisor;
  return whole === 0 ? `${sign}${numerator}/${reducedDenominator}` : `${sign}${whole} ${numerator}/${reducedDenominator}`;
}

function formatDimensionText(rawText) {
  const input = String(rawText || "").trim();
  if (!input) return "";
  return input.replace(/-?\d+\.\d+/g, (match) => toMixedFraction(match));
}

function parseCuttingSize(cuttingSize, fallbackWidth, fallbackHeight) {
  const value = String(cuttingSize || "");
  const matches = value.match(/(\d+(?:\.\d+)?)\s*[xX*]\s*(\d+(?:\.\d+)?)/);
  if (matches) {
    return {
      width: safeNum(matches[1], fallbackWidth),
      height: safeNum(matches[2], fallbackHeight),
    };
  }
  return {
    width: safeNum(fallbackWidth, 18),
    height: safeNum(fallbackHeight, 12),
  };
}

function normalizeLine(line) {
  return {
    id: line.id || `line_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: line.type || "vertical",
    x1: clamp(safeNum(line.x1, 0.5)),
    y1: clamp(safeNum(line.y1, 0.1)),
    x2: clamp(safeNum(line.x2, 0.5)),
    y2: clamp(safeNum(line.y2, 0.9)),
  };
}

function normalizeLabel(label) {
  return {
    id: label.id || `label_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    x: clamp(safeNum(label.x, 0.5)),
    y: clamp(safeNum(label.y, 0.5)),
    text: formatDimensionText(label.text || ""),
  };
}

function normalizeBox(box) {
  return {
    id: box.id || `box_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    x: clamp(safeNum(box.x, 0.4)),
    y: clamp(safeNum(box.y, 0.4)),
    w: clamp(safeNum(box.w, 0.2)),
    h: clamp(safeNum(box.h, 0.2)),
  };
}

function createDefaultLayout(sheet) {
  return {
    version: 2,
    sheet,
    lines: [],
    labels: [],
    boxes: [],
  };
}

function clampLayout(layout) {
  return {
    ...layout,
    lines: (layout.lines || []).map((line) => normalizeLine(line)),
    labels: (layout.labels || []).map((label) => normalizeLabel(label)),
    boxes: (layout.boxes || []).map((box) => normalizeBox(box)),
  };
}

function areLayoutsEqual(left, right) {
  if (!left || !right) return left === right;

  if (
    left.sheet?.width !== right.sheet?.width ||
    left.sheet?.height !== right.sheet?.height ||
    left.sheet?.cuttingSize !== right.sheet?.cuttingSize
  ) {
    return false;
  }

  const leftLines = left.lines || [];
  const rightLines = right.lines || [];
  if (leftLines.length !== rightLines.length) return false;
  for (let i = 0; i < leftLines.length; i++) {
    const a = leftLines[i];
    const b = rightLines[i];
    if (a.id !== b.id || a.type !== b.type || a.x1 !== b.x1 || a.y1 !== b.y1 || a.x2 !== b.x2 || a.y2 !== b.y2) return false;
  }

  const leftLabels = left.labels || [];
  const rightLabels = right.labels || [];
  if (leftLabels.length !== rightLabels.length) return false;
  for (let i = 0; i < leftLabels.length; i++) {
    const a = leftLabels[i];
    const b = rightLabels[i];
    if (a.id !== b.id || a.x !== b.x || a.y !== b.y || a.text !== b.text) return false;
  }
  
  const leftBoxes = left.boxes || [];
  const rightBoxes = right.boxes || [];
  if (leftBoxes.length !== rightBoxes.length) return false;
  for (let i = 0; i < leftBoxes.length; i++) {
    const a = leftBoxes[i];
    const b = rightBoxes[i];
    if (a.id !== b.id || a.x !== b.x || a.y !== b.y || a.w !== b.w || a.h !== b.h) return false;
  }

  return true;
}

function lineToPixels(line, sheetRect) {
  return {
    x1: sheetRect.x + line.x1 * sheetRect.width,
    y1: sheetRect.y + line.y1 * sheetRect.height,
    x2: sheetRect.x + line.x2 * sheetRect.width,
    y2: sheetRect.y + line.y2 * sheetRect.height,
  };
}

function labelToPixels(label, sheetRect) {
  return {
    x: sheetRect.x + label.x * sheetRect.width,
    y: sheetRect.y + label.y * sheetRect.height,
  };
}

function boxToPixels(box, sheetRect) {
  return {
    x: sheetRect.x + box.x * sheetRect.width,
    y: sheetRect.y + box.y * sheetRect.height,
    w: box.w * sheetRect.width,
    h: box.h * sheetRect.height,
  };
}

export default function LayoutDrawingTool({
  sheetWidth,
  sheetHeight,
  layoutData,
  setLayoutData,
  onSheetDimensionsChange,
  disabled = false,
}) {
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const [layout, setLayout] = useState(null);
  const [activeTool, setActiveTool] = useState("select");
  const [labelDraft, setLabelDraft] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  
  const [draftShape, setDraftShape] = useState(null);

  const [localSheetWidth, setLocalSheetWidth] = useState(sheetWidth || 18);
  const [localSheetHeight, setLocalSheetHeight] = useState(sheetHeight || 12);
  
  useEffect(() => {
    if (sheetWidth) setLocalSheetWidth(sheetWidth);
    if (sheetHeight) setLocalSheetHeight(sheetHeight);
  }, [sheetWidth, sheetHeight]);

  const sheet = useMemo(() => {
    const fallbackW = safeNum(localSheetWidth, 18);
    const fallbackH = Math.max(1, safeNum(localSheetHeight, 12));
    const parsed = parseCuttingSize(`${fallbackW} x ${fallbackH}`, fallbackW, fallbackH);
    return {
      width: parsed.width,
      height: parsed.height,
      cuttingSize: `${parsed.width} x ${parsed.height}`,
    };
  }, [localSheetHeight, localSheetWidth]);

  const sheetRect = useMemo(() => {
    const availableWidth = SVG_VIEWBOX.width - SHEET_PADDING * 2;
    const availableHeight = SVG_VIEWBOX.height - SHEET_PADDING * 2;
    const scale = Math.min(availableWidth / sheet.width, availableHeight / sheet.height);
    const width = sheet.width * scale;
    const heightPx = sheet.height * scale;
    return {
      x: (SVG_VIEWBOX.width - width) / 2,
      y: (SVG_VIEWBOX.height - heightPx) / 2,
      width,
      height: heightPx,
    };
  }, [sheet.height, sheet.width]);

  useEffect(() => {
    const base = layoutData ? clampLayout(layoutData) : createDefaultLayout(sheet);
    const nextLayout = {
      ...base,
      sheet,
    };

    setLayout((prev) => {
      if (areLayoutsEqual(prev, nextLayout)) return prev;
      return nextLayout;
    });
  }, [layoutData, sheet]);

  useEffect(() => {
    if (!layout) return;
    setLayoutData?.(layout);
  }, [layout, setLayoutData]);

  const svgPointToNormalized = (event) => {
    if (!svgRef.current) return null;
    const pt = svgRef.current.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const matrix = svgRef.current.getScreenCTM();
    if (!matrix) return null;
    const cursor = pt.matrixTransform(matrix.inverse());
    return {
      x: clamp((cursor.x - sheetRect.x) / sheetRect.width),
      y: clamp((cursor.y - sheetRect.y) / sheetRect.height),
    };
  };

  const setLayoutSafe = (updater) => {
    setLayout((prev) => {
      if (!prev) return prev;
      const next = typeof updater === "function" ? updater(prev) : updater;
      return clampLayout(next);
    });
  };

  const deleteSelected = () => {
    if (disabled || !selectedItem) return;
    setLayoutSafe((prev) => {
      if (selectedItem.kind === "line") {
        return { ...prev, lines: prev.lines.filter((line) => line.id !== selectedItem.id) };
      }
      if (selectedItem.kind === "box") {
        return { ...prev, boxes: (prev.boxes || []).filter((box) => box.id !== selectedItem.id) };
      }
      return { ...prev, labels: prev.labels.filter((label) => label.id !== selectedItem.id) };
    });
    setSelectedItem(null);
  };

  const resetLayout = () => {
    if (disabled) return;
    setLayout(createDefaultLayout(sheet));
    setSelectedItem(null);
  };

  const startCanvasDrag = (event) => {
    if (disabled) return;
    const start = svgPointToNormalized(event);
    if (!start) return;

    if (activeTool === "label") {
      const text = formatDimensionText(labelDraft) || "0";
      const newLabel = normalizeLabel({ x: start.x, y: start.y, text });
      setLayoutSafe((prev) => ({ ...prev, labels: [...prev.labels, newLabel] }));
      setSelectedItem({ kind: "label", id: newLabel.id });
      setActiveTool("select");
      return;
    }

    if (activeTool === "select") {
      setSelectedItem(null);
      return;
    }

    dragRef.current = { kind: "drawing", tool: activeTool, start, current: start };
    setSelectedItem(null);
    setDraftShape({ type: activeTool, start, current: start });
  };

  const startItemDrag = (payload, event) => {
    if (disabled) return;
    if (activeTool !== "select") return; // only interact when in select mode
    event.stopPropagation();
    const start = svgPointToNormalized(event);
    if (!start) return;
    dragRef.current = { ...payload, start };
  };

  const handleMouseMove = (event) => {
    if (!dragRef.current || !layout) return;
    const current = svgPointToNormalized(event);
    if (!current) return;

    if (dragRef.current.kind === "drawing") {
      setDraftShape(prev => ({ ...prev, current }));
      return;
    }

    const { kind, id, handle, start } = dragRef.current;
    const dx = current.x - start.x;
    const dy = current.y - start.y;

    if (kind === "line") {
      setLayoutSafe((prev) => {
        const nextLines = prev.lines.map((line) => {
          if (line.id !== id) return line;
          if (handle === "move") {
            if (line.type === "vertical") {
              const x = clamp(line.x1 + dx);
              return { ...line, x1: x, x2: x };
            }
            if (line.type === "horizontal") {
              const y = clamp(line.y1 + dy);
              return { ...line, y1: y, y2: y };
            }
            let nextDx = dx, nextDy = dy;
            const minX = Math.min(line.x1 + nextDx, line.x2 + nextDx);
            const maxX = Math.max(line.x1 + nextDx, line.x2 + nextDx);
            const minY = Math.min(line.y1 + nextDy, line.y2 + nextDy);
            const maxY = Math.max(line.y1 + nextDy, line.y2 + nextDy);
            if (minX < 0) nextDx -= minX;
            if (maxX > 1) nextDx -= maxX - 1;
            if (minY < 0) nextDy -= minY;
            if (maxY > 1) nextDy -= maxY - 1;
            return {
              ...line,
              x1: clamp(line.x1 + nextDx),
              y1: clamp(line.y1 + nextDy),
              x2: clamp(line.x2 + nextDx),
              y2: clamp(line.y2 + nextDy),
            };
          }

          if (line.type === "vertical") {
            if (handle === "start") return { ...line, y1: clamp(line.y1 + dy) };
            return { ...line, y2: clamp(line.y2 + dy) };
          }
          if (line.type === "horizontal") {
            if (handle === "start") return { ...line, x1: clamp(line.x1 + dx) };
            return { ...line, x2: clamp(line.x2 + dx) };
          }
          if (handle === "start") {
            return { ...line, x1: clamp(line.x1 + dx), y1: clamp(line.y1 + dy) };
          }
          return { ...line, x2: clamp(line.x2 + dx), y2: clamp(line.y2 + dy) };
        });
        return { ...prev, lines: nextLines };
      });
      dragRef.current = { ...dragRef.current, start: current };
    } else if (kind === "box") {
      setLayoutSafe((prev) => {
        const nextBoxes = prev.boxes.map((box) => {
          if (box.id !== id) return box;
          if (handle === "move") {
            const maxX = 1 - box.w;
            const maxY = 1 - box.h;
            return { ...box, x: clamp(box.x + dx, 0, maxX), y: clamp(box.y + dy, 0, maxY) };
          }
          if (handle === "se") {
             const newW = clamp(box.w + dx, 0.01, 1 - box.x);
             const newH = clamp(box.h + dy, 0.01, 1 - box.y);
             return { ...box, w: newW, h: newH };
          }
          return box;
        });
        return { ...prev, boxes: nextBoxes };
      });
      dragRef.current = { ...dragRef.current, start: current };
    } else if (kind === "label") {
      setLayoutSafe((prev) => {
        const nextLabels = prev.labels.map((label) => {
          if (label.id !== id) return label;
          return { ...label, x: clamp(label.x + dx), y: clamp(label.y + dy) };
        });
        return { ...prev, labels: nextLabels };
      });
      dragRef.current = { ...dragRef.current, start: current };
    }
  };

  const handleMouseUp = () => {
    if (dragRef.current?.kind === "drawing" && draftShape) {
      const { tool, start, current } = dragRef.current;
      if (tool === "line") {
        const len = Math.hypot(current.x - start.x, current.y - start.y);
        if (len > 0.02) {
          let type = "slanted";
          let x1 = start.x;
          let y1 = start.y;
          let x2 = current.x;
          let y2 = current.y;

          // Optional edge snapping for very straight drags
          if (Math.abs(current.x - start.x) < 0.02) {
            type = "vertical";
            x1 = x2;
          } else if (Math.abs(current.y - start.y) < 0.02) {
            type = "horizontal";
            y1 = y2;
          }

          const finalLine = normalizeLine({
            id: `line_${Date.now()}`,
            type,
            x1, y1, x2, y2,
          });
          setLayoutSafe((prev) => ({ ...prev, lines: [...prev.lines, finalLine] }));
          setSelectedItem({ kind: "line", id: finalLine.id });
        }
      } else if (tool === "box") {
        const w = Math.abs(current.x - start.x);
        const h = Math.abs(current.y - start.y);
        if (w > 0.02 && h > 0.02) {
          const finalBox = normalizeBox({
            id: `box_${Date.now()}`,
            x: Math.min(start.x, current.x),
            y: Math.min(start.y, current.y),
            w,
            h,
          });
          setLayoutSafe((prev) => ({ ...prev, boxes: [...(prev.boxes||[]), finalBox] }));
          setSelectedItem({ kind: "box", id: finalBox.id });
        }
      }
      setActiveTool("select");
      setDraftShape(null);
    }
    dragRef.current = null;
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  });

  const selectedItemData = useMemo(() => {
    if (!layout || !selectedItem) return null;
    if (selectedItem.kind === "line") return layout.lines.find(l => l.id === selectedItem.id);
    if (selectedItem.kind === "box") return layout.boxes.find(b => b.id === selectedItem.id);
    return null;
  }, [layout, selectedItem]);

  const updateSelectedBox = (key, value) => {
    const val = clamp(value / (key === 'w' || key === 'x' ? sheet.width : sheet.height));
    setLayoutSafe((prev) => ({
      ...prev,
      boxes: prev.boxes.map(b => b.id === selectedItem.id ? { ...b, [key]: val } : b)
    }));
  };

  const updateSelectedLine = (key, value) => {
    const valX = clamp(value / sheet.width);
    const valY = clamp(value / sheet.height);
    setLayoutSafe((prev) => ({
      ...prev,
      lines: prev.lines.map(l => {
        if (l.id !== selectedItem.id) return l;
        if (key === "y") {
            const dy = valY - Math.min(l.y1, l.y2);
            return { ...l, y1: clamp(l.y1 + dy), y2: clamp(l.y2 + dy) };
        }
        if (key === "x") {
            const dx = valX - Math.min(l.x1, l.x2);
            return { ...l, x1: clamp(l.x1 + dx), x2: clamp(l.x2 + dx) };
        }
        if (key === "len") {
           // Compute current length, and scale outwards from center
           const dx = (l.x2 - l.x1) * sheet.width;
           const dy = (l.y2 - l.y1) * sheet.height;
           const currLen = Math.hypot(dx, dy);
           if (currLen < 0.001) return l; // Avoid divide by zero
           const scale = value / currLen;
           if (l.type === "vertical") {
             const mid = (l.y1 + l.y2) / 2;
             const half = valY / 2;
             return { ...l, y1: clamp(mid - half), y2: clamp(mid + half) };
           } else if (l.type === "horizontal") {
             const mid = (l.x1 + l.x2) / 2;
             const half = valX / 2;
             return { ...l, x1: clamp(mid - half), x2: clamp(mid + half) };
           } else {
             // For slanted lines, scale around center point
             const midX = (l.x1 + l.x2) / 2;
             const midY = (l.y1 + l.y2) / 2;
             const halfDx = ((l.x2 - l.x1) * scale) / 2;
             const halfDy = ((l.y2 - l.y1) * scale) / 2;
             return { ...l, x1: clamp(midX - halfDx), x2: clamp(midX + halfDx), y1: clamp(midY - halfDy), y2: clamp(midY + halfDy) };
           }
        }
        return l;
      })
    }));
  };

  return (
    <Card
      size="small"
      title="Interactive Layout Planner"
      className="diagram-card"
      extra={<Text type="secondary">{disabled ? "View only" : "Click and draw"}</Text>}
    >
      <div className="diagram-control-grid">
        <Space direction="vertical" size={4}>
          <Text strong>Total Sheet Length</Text>
          <InputNumber
            min={1} step={0.5} size="small"
            value={localSheetWidth}
            onChange={(v) => {
               setLocalSheetWidth(v);
               onSheetDimensionsChange?.({ width: v, height: localSheetHeight });
            }}
            disabled={disabled} />
        </Space>
        <Space direction="vertical" size={4}>
          <Text strong>Total Sheet Breadth</Text>
          <InputNumber
            min={1} step={0.5} size="small"
            value={localSheetHeight}
            onChange={(v) => {
               setLocalSheetHeight(v);
               onSheetDimensionsChange?.({ width: localSheetWidth, height: v });
            }}
            disabled={disabled} />
        </Space>
      </div>

      <div className="diagram-toolbar" style={{ marginTop: 16 }}>
        <div className="diagram-toolbar-row">
          <Text className="diagram-toolbar-label">Tools</Text>
          <SelectLineType value={activeTool} onChange={setActiveTool} disabled={disabled} />
          
          <Divider type="vertical" />
          <Button icon={<ReloadOutlined />} onClick={resetLayout} disabled={disabled}>Clear All</Button>
          <Button icon={<DeleteOutlined />} danger disabled={!selectedItem || disabled} onClick={deleteSelected}>Delete Selected</Button>
        </div>

        {selectedItemData && selectedItem.kind === "box" && (
           <div className="diagram-toolbar-row" style={{ backgroundColor: '#f0f5ff', padding: 8, borderRadius: 4 }}>
             <Text strong>Selected Box Dimensions :</Text>
             <Space>
               <Text>Width:</Text>
               <InputNumber size="small" step={0.1} value={Number((selectedItemData.w * sheet.width).toFixed(2))} onChange={(v) => updateSelectedBox('w', v)} />
               <Text>Breadth/Height:</Text>
               <InputNumber size="small" step={0.1} value={Number((selectedItemData.h * sheet.height).toFixed(2))} onChange={(v) => updateSelectedBox('h', v)} />
               <Text>X Pos:</Text>
               <InputNumber size="small" step={0.1} value={Number((selectedItemData.x * sheet.width).toFixed(2))} onChange={(v) => updateSelectedBox('x', v)} />
               <Text>Y Pos:</Text>
               <InputNumber size="small" step={0.1} value={Number((selectedItemData.y * sheet.height).toFixed(2))} onChange={(v) => updateSelectedBox('y', v)} />
             </Space>
           </div>
        )}
        
        {selectedItemData && selectedItem.kind === "line" && (
          <div className="diagram-toolbar-row" style={{ backgroundColor: '#f0f5ff', padding: 8, borderRadius: 4 }}>
             <Text strong>Selected Line Settings :</Text>
             <Space>
               <Text>Length:</Text>
               <InputNumber size="small" step={0.1} 
                 value={Number(Math.hypot(
                   (selectedItemData.x2 - selectedItemData.x1) * sheet.width, 
                   (selectedItemData.y2 - selectedItemData.y1) * sheet.height
                 ).toFixed(2))} 
                 onChange={(v) => updateSelectedLine('len', v)} />
               
               <Text>X Pos:</Text>
               <InputNumber size="small" step={0.1} value={Number((Math.min(selectedItemData.x1, selectedItemData.x2) * sheet.width).toFixed(2))} onChange={(v) => updateSelectedLine('x', v)} />
                 
               <Text>Y Pos:</Text>
               <InputNumber size="small" step={0.1} value={Number((Math.min(selectedItemData.y1, selectedItemData.y2) * sheet.height).toFixed(2))} onChange={(v) => updateSelectedLine('y', v)} />
             </Space>
           </div>
        )}
      </div>

      <div className="diagram-canvas-wrap" style={{ cursor: activeTool === 'select' ? 'default' : 'crosshair', marginTop: 12 }}>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_VIEWBOX.width} ${SVG_VIEWBOX.height}`}
          width="100%"
          height="380"
          className={`diagram-canvas ${disabled ? "diagram-canvas-readonly" : ""}`}
          onMouseDown={startCanvasDrag}
          aria-label="interactive job layout"
          style={{ userSelect: 'none' }}
        >
          <rect x={0} y={0} width={SVG_VIEWBOX.width} height={SVG_VIEWBOX.height} fill="#f8fbff" />
          <rect
            x={sheetRect.x}
            y={sheetRect.y}
            width={sheetRect.width}
            height={sheetRect.height}
            fill="#eaf3ff"
            stroke="#2160b8"
            strokeWidth="2.5"
            rx="6"
          />

          {layout?.boxes?.map((box) => {
            const p = boxToPixels(box, sheetRect);
            const selected = selectedItem?.kind === "box" && selectedItem.id === box.id;
            return (
              <g key={box.id}>
                <rect
                  x={p.x} y={p.y} width={p.w} height={p.h}
                  fill={selected ? "#bfdbfe" : "#dbeafe"}
                  fillOpacity={0.6}
                  stroke={selected ? "#2563eb" : "#3b82f6"}
                  strokeWidth={selected ? 2.5 : 1.5}
                  onMouseDown={(event) => {
                    setSelectedItem({ kind: "box", id: box.id });
                    startItemDrag({ kind: "box", id: box.id, handle: "move" }, event);
                  }}
                />
                {selected && (
                  <circle
                    cx={p.x + p.w} cy={p.y + p.h} r={6}
                    fill="#ffffff" stroke="#2563eb" strokeWidth="2"
                    style={{ cursor: "se-resize" }}
                    onMouseDown={(event) => {
                      startItemDrag({ kind: "box", id: box.id, handle: "se" }, event);
                    }}
                  />
                )}
                <text x={p.x + p.w/2} y={p.y + p.h/2} textAnchor="middle" alignmentBaseline="middle" fill="#1e3a8a" fontSize={11} pointerEvents="none">
                  {((box.w * sheet.width).toFixed(1))} x {((box.h * sheet.height).toFixed(1))}
                </text>
              </g>
            )
          })}

          {layout?.lines.map((line) => {
            const p = lineToPixels(line, sheetRect);
            const selected = selectedItem?.kind === "line" && selectedItem.id === line.id;
            return (
              <g key={line.id}>
                <line
                  x1={p.x1} y1={p.y1} x2={p.x2} y2={p.y2}
                  stroke={selected ? "#ef4444" : "#1455ad"}
                  strokeWidth={selected ? 3.5 : 2.4}
                  strokeLinecap="round"
                  onMouseDown={(event) => {
                    setSelectedItem({ kind: "line", id: line.id });
                    startItemDrag({ kind: "line", id: line.id, handle: "move" }, event);
                  }}
                />
                <circle
                  cx={p.x1} cy={p.y1} r={selected ? 6 : 5}
                  fill="#ffffff" stroke="#1f5ead" strokeWidth="2"
                  onMouseDown={(event) => {
                    setSelectedItem({ kind: "line", id: line.id });
                    startItemDrag({ kind: "line", id: line.id, handle: "start" }, event);
                  }}
                />
                <circle
                  cx={p.x2} cy={p.y2} r={selected ? 6 : 5}
                  fill="#ffffff" stroke="#1f5ead" strokeWidth="2"
                  onMouseDown={(event) => {
                    setSelectedItem({ kind: "line", id: line.id });
                    startItemDrag({ kind: "line", id: line.id, handle: "end" }, event);
                  }}
                />
              </g>
            );
          })}

          {draftShape && (
            <g opacity={0.6}>
              {draftShape.type === 'line' && (
                <line 
                  x1={sheetRect.x + draftShape.start.x * sheetRect.width} 
                  y1={sheetRect.y + draftShape.start.y * sheetRect.height} 
                  x2={sheetRect.x + draftShape.current.x * sheetRect.width} 
                  y2={sheetRect.y + draftShape.current.y * sheetRect.height} 
                  stroke="#ef4444" strokeWidth="2" strokeDasharray="4 4"
                />
              )}
              {draftShape.type === 'box' && (
                <rect 
                  x={sheetRect.x + Math.min(draftShape.start.x, draftShape.current.x) * sheetRect.width} 
                  y={sheetRect.y + Math.min(draftShape.start.y, draftShape.current.y) * sheetRect.height} 
                  width={Math.abs(draftShape.current.x - draftShape.start.x) * sheetRect.width} 
                  height={Math.abs(draftShape.current.y - draftShape.start.y) * sheetRect.height} 
                  fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 4"
                />
              )}
            </g>
          )}
          
          <text x={sheetRect.x + 6} y={sheetRect.y - 10} fill="#1f4e87" fontSize="12" fontWeight="700">
            Cutting Size: {sheet.cuttingSize}
          </text>
        </svg>
      </div>
    </Card>
  );
}

function SelectLineType({ value, onChange, disabled }) {
  return (
    <div className="diagram-line-type" style={{ display: 'flex', gap: 4 }}>
      <button type="button" className={value === "select" ? "active" : ""} onClick={() => onChange("select")} disabled={disabled} style={{ background: value==='select'?'#e6f7ff':'', border: value==='select'?'1px solid #1890ff':'1px solid #d9d9d9', padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}>
        <DragOutlined style={{ marginRight: 6 }}/> Select/Move
      </button>
      <button type="button" className={value === "line" ? "active" : ""} onClick={() => onChange("line")} disabled={disabled} style={{ background: value==='line'?'#e6f7ff':'', border: value==='line'?'1px solid #1890ff':'1px solid #d9d9d9', padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}>
        <LineOutlined style={{ marginRight: 6 }} /> Draw Line
      </button>
      <button type="button" className={value === "box" ? "active" : ""} onClick={() => onChange("box")} disabled={disabled} style={{ background: value==='box'?'#e6f7ff':'', border: value==='box'?'1px solid #1890ff':'1px solid #d9d9d9', padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}>
        <BorderOutlined style={{ marginRight: 6 }} /> Draw Box
      </button>
    </div>
  );
}