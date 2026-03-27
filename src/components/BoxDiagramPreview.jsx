import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Input, InputNumber, Space, Typography, Divider } from "antd";
import { DeleteOutlined, FontSizeOutlined, LineOutlined, ReloadOutlined, DragOutlined, BorderOutlined, EditOutlined } from "@ant-design/icons";
import PencilTool from "./PencilTool";
import { formatDimensionText, parseMixedFraction, toMixedFraction } from "../utils/fractions";

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
    paths: [],
  };
}

function clampLayout(layout) {
  return {
    ...layout,
    lines: (layout.lines || []).map((line) => normalizeLine(line)),
    labels: (layout.labels || []).map((label) => normalizeLabel(label)),
    boxes: (layout.boxes || []).map((box) => normalizeBox(box)),
    paths: layout.paths || [],
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

  const leftPaths = left.paths || [];
  const rightPaths = right.paths || [];
  if (leftPaths.length !== rightPaths.length) return false;
  for (let i = 0; i < leftPaths.length; i++) {
    if (leftPaths[i] !== rightPaths[i]) return false;
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

export default function BoxDiagramPreview({
  length,
  breadth,
  height,
  cuttingSize,
  onLengthChange,
  onBreadthChange,
  onHeightChange,
  onCuttingSizeChange,
  initialLayout,
  onLayoutChange,
  disabled = false,
}) {
  const svgRef = useRef(null);
  const dragRef = useRef(null);
  const [layout, setLayout] = useState(null);
  const [activeTool, setActiveTool] = useState("select");
  const [labelDraft, setLabelDraft] = useState("12 x 9 in");
  const [labelDraftPosition, setLabelDraftPosition] = useState({ x: 50, y: 50 });
  const [selectedItem, setSelectedItem] = useState(null);
  const [draftShape, setDraftShape] = useState(null);
  const [manualEditorValues, setManualEditorValues] = useState({});

  const sheet = useMemo(() => {
    return {
      width: safeNum(initialLayout?.sheet?.width, 100),
      height: safeNum(initialLayout?.sheet?.height, 70),
      cuttingSize: initialLayout?.sheet?.cuttingSize || "",
    };
  }, [initialLayout?.sheet?.cuttingSize, initialLayout?.sheet?.height, initialLayout?.sheet?.width]);

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
    const base = initialLayout ? clampLayout(initialLayout) : createDefaultLayout(sheet);
    const nextLayout = {
      ...base,
      sheet,
    };

    setLayout((prev) => {
      // Avoid overwriting local state if it's already matches parent initial prop
      if (prev && areLayoutsEqual(prev, nextLayout)) return prev;
      return nextLayout;
    });
  }, [initialLayout, sheet]);

  useEffect(() => {
    setManualEditorValues({});
  }, [selectedItem]);

  const onLayoutChangeRef = useRef(onLayoutChange);
  useEffect(() => {
    onLayoutChangeRef.current = onLayoutChange;
  }, [onLayoutChange]);

  useEffect(() => {
    if (!layout) return;
    onLayoutChangeRef.current?.(layout);
  }, [layout]);

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
      setLabelDraftPosition({
        x: Number((start.x * sheet.width).toFixed(2)),
        y: Number((start.y * sheet.height).toFixed(2)),
      });
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
    if (activeTool !== "select") return;
    event.stopPropagation();
    const start = svgPointToNormalized(event);
    if (!start) return;
    dragRef.current = { ...payload, start };
  };

  const handleMouseMove = useCallback((event) => {
    if (!dragRef.current || !layout) return;
    const current = svgPointToNormalized(event);
    if (!current) return;

    if (dragRef.current.kind === "drawing") {
      dragRef.current.current = current;
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
  }, [layout, sheetRect.height, sheetRect.width, sheetRect.x, sheetRect.y]);

  const handleMouseUp = useCallback(() => {
    if (dragRef.current?.kind === "drawing" && draftShape) {
      const { tool, start, current } = dragRef.current;
      if (tool === "line") {
        const len = Math.hypot(current.x - start.x, current.y - start.y);
        if (len > 0.005) {
          let type = "slanted";
          let x1 = start.x;
          let y1 = start.y;
          let x2 = current.x;
          let y2 = current.y;

          if (Math.abs(current.x - start.x) < 0.01) {
            type = "vertical";
            x1 = x2;
          } else if (Math.abs(current.y - start.y) < 0.01) {
            type = "horizontal";
            y1 = y2;
          }

          const finalLine = normalizeLine({ id: `line_${Date.now()}`, type, x1, y1, x2, y2 });
          setLayoutSafe((prev) => ({ ...prev, lines: [...prev.lines, finalLine] }));
          setSelectedItem({ kind: "line", id: finalLine.id });
        }
      } else if (tool === "box") {
        const w = Math.abs(current.x - start.x);
        const h = Math.abs(current.y - start.y);
        if (w > 0.005 && h > 0.005) {
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
  }, [draftShape]);

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);


  const selectedItemData = useMemo(() => {
    if (!layout || !selectedItem) return null;
    if (selectedItem.kind === "line") return layout.lines.find((l) => l.id === selectedItem.id) || null;
    if (selectedItem.kind === "box") return layout.boxes.find((b) => b.id === selectedItem.id) || null;
    if (selectedItem.kind === "label") return layout.labels.find((l) => l.id === selectedItem.id) || null;
    return null;
  }, [layout, selectedItem]);

  const updateSelectedBox = (key, value) => {
    const parsed = parseMixedFraction(value);
    if (!Number.isFinite(parsed)) return;
    const val = clamp(parsed / (key === 'w' || key === 'x' ? sheet.width : sheet.height));
    setLayoutSafe((prev) => ({
      ...prev,
      boxes: prev.boxes.map(b => b.id === selectedItem.id ? { ...b, [key]: val } : b)
    }));
  };

  const updateSelectedLine = (key, value) => {
    const valNum = parseMixedFraction(value);
    if (!Number.isFinite(valNum)) return;
    const valX = clamp(valNum / sheet.width);
    const valY = clamp(valNum / sheet.height);
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
           const dx = (l.x2 - l.x1) * sheet.width;
           const dy = (l.y2 - l.y1) * sheet.height;
           const currLen = Math.hypot(dx, dy);
           if (currLen < 0.001) return l;
           const scale = valNum / currLen;
           const midX = (l.x1 + l.x2) / 2;
           const midY = (l.y1 + l.y2) / 2;
           const halfDx = ((l.x2 - l.x1) * scale) / 2;
           const halfDy = ((l.y2 - l.y1) * scale) / 2;
           return { ...l, x1: clamp(midX - halfDx), x2: clamp(midX + halfDx), y1: clamp(midY - halfDy), y2: clamp(midY + halfDy) };
        }
        return l;
      })
    }));
  };

  const updateSelectedLabel = (key, value) => {
    if (!selectedItem || selectedItem.kind !== "label") return;

    setLayoutSafe((prev) => ({
      ...prev,
      labels: prev.labels.map((label) => {
        if (label.id !== selectedItem.id) return label;

        if (key === "text") {
          return { ...label, text: formatDimensionText(value) };
        }

        const parsed = parseMixedFraction(value);
        if (!Number.isFinite(parsed)) return label;
        const normalized =
          key === "x"
            ? clamp(parsed / sheet.width)
            : clamp(parsed / sheet.height);

        return { ...label, [key]: normalized };
      }),
    }));
  };

  const selectedLineLength = useMemo(() => {
    if (!selectedItemData || selectedItem?.kind !== "line") return 0;
    const value = Math.hypot(
      (selectedItemData.x2 - selectedItemData.x1) * sheet.width,
      (selectedItemData.y2 - selectedItemData.y1) * sheet.height
    );
    return Number.isFinite(value) ? Number(value.toFixed(2)) : 0;
  }, [selectedItem, selectedItemData, sheet.height, sheet.width]);

  const selectedEditorTitle = useMemo(() => {
    if (activeTool === "label" && !selectedItem) return "Text Editor";
    if (!selectedItem) return "Direct Edit Panel";
    if (selectedItem.kind === "box") return "Box Editor";
    if (selectedItem.kind === "line") return "Line Editor";
    return "Text Editor";
  }, [activeTool, selectedItem]);

  return (
    <Card
      size="small"
      title="Layout Drawing Tool"
      className="diagram-card"
      extra={<Text type="secondary">{disabled ? "View only" : "Interactive Job Layout"}</Text>}
    >
      <div className="diagram-help-row">
        <Text className="diagram-status-pill is-active">1. Open edit and choose a tool</Text>
        <Text className="diagram-status-pill">2. Draw on the sheet</Text>
        <Text className="diagram-status-pill">3. Add text anywhere you want and save it in the PDF</Text>
      </div>

      <div className="diagram-toolbar" style={{ marginTop: 16 }}>
        <div className="diagram-toolbar-row">
          <Text className="diagram-toolbar-label">Tools</Text>
          <SelectLineType value={activeTool} onChange={setActiveTool} disabled={disabled} />
          
          <Divider type="vertical" />
          <Button icon={<ReloadOutlined />} onClick={resetLayout} disabled={disabled}>Clear All</Button>
          <Button icon={<DeleteOutlined />} danger disabled={!selectedItem || disabled} onClick={deleteSelected}>Delete Selected</Button>
        </div>

        <div className="diagram-toolbar-row">
          <Text className="diagram-toolbar-label">Text</Text>
          <Input
            value={labelDraft}
            onChange={(event) => setLabelDraft(event.target.value)}
            placeholder="Type the dimension text you want, then click on the sheet"
            className="diagram-label-input"
            disabled={disabled}
          />
        </div>

        <div className="diagram-editor-card">
          <div className="diagram-editor-head">
            <Text strong>{selectedEditorTitle}</Text>
            <Text type="secondary">
              {activeTool === "label" && !selectedItem
                ? "Type your text and use the default X/Y values, then click on the sheet to place it."
                : selectedItem
                ? "Type exact values here after selecting an item in the drawing area."
                : "Select a box, line, or text on the sheet to edit it directly."}
            </Text>
          </div>

          {!selectedItemData && !(activeTool === "label" && !selectedItem) ? (
            <div className="diagram-editor-empty">
              <Text type="secondary">Nothing selected yet. Draw a box or line, then click it to edit width, breadth, position, or text.</Text>
            </div>
          ) : null}

          {activeTool === "label" && !selectedItem ? (
            <div className="diagram-editor-grid">
              <div className="diagram-editor-field diagram-editor-field-wide">
                <Text>Text</Text>
                <Input
                  size="middle"
                  value={labelDraft}
                  onChange={(event) => setLabelDraft(event.target.value)}
                  disabled={disabled}
                  placeholder="Type dimension text"
                />
              </div>
              <div className="diagram-editor-field">
                <Text>X Position</Text>
                <InputNumber
                  size="middle"
                  min={0}
                  step={0.1}
                  value={labelDraftPosition.x}
                  onChange={(value) =>
                    setLabelDraftPosition((prev) => ({
                      ...prev,
                      x: Number.isFinite(Number(value)) ? Number(value) : prev.x,
                    }))
                  }
                  disabled={disabled}
                />
              </div>
              <div className="diagram-editor-field">
                <Text>Y Position</Text>
                <InputNumber
                  size="middle"
                  min={0}
                  step={0.1}
                  value={labelDraftPosition.y}
                  onChange={(value) =>
                    setLabelDraftPosition((prev) => ({
                      ...prev,
                      y: Number.isFinite(Number(value)) ? Number(value) : prev.y,
                    }))
                  }
                  disabled={disabled}
                />
              </div>
            </div>
          ) : null}

          {selectedItemData && selectedItem?.kind === "box" ? (
            <div className="diagram-editor-grid">
              <div className="diagram-editor-field">
                <Text>Width</Text>
                <Input
                  size="middle"
                  value={manualEditorValues.w || ""}
                  placeholder={Number.isFinite(selectedItemData.w) ? toMixedFraction(Number((selectedItemData.w * sheet.width).toFixed(2))) : ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setManualEditorValues((prev) => ({ ...prev, w: value }));
                    updateSelectedBox("w", value);
                  }}
                  disabled={disabled}
                />
              </div>
              <div className="diagram-editor-field">
                <Text>Height</Text>
                <Input
                  size="middle"
                  value={manualEditorValues.h || ""}
                  placeholder={Number.isFinite(selectedItemData.h) ? toMixedFraction(Number((selectedItemData.h * sheet.height).toFixed(2))) : ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setManualEditorValues((prev) => ({ ...prev, h: value }));
                    updateSelectedBox("h", value);
                  }}
                  disabled={disabled}
                />
              </div>
              <div className="diagram-editor-field">
                <Text>X Position</Text>
                <Input
                  size="middle"
                  value={manualEditorValues.x || ""}
                  placeholder={Number.isFinite(selectedItemData.x) ? toMixedFraction(Number((selectedItemData.x * sheet.width).toFixed(2))) : ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setManualEditorValues((prev) => ({ ...prev, x: value }));
                    updateSelectedBox("x", value);
                  }}
                  disabled={disabled}
                />
              </div>
              <div className="diagram-editor-field">
                <Text>Y Position</Text>
                <Input
                  size="middle"
                  value={manualEditorValues.y || ""}
                  placeholder={Number.isFinite(selectedItemData.y) ? toMixedFraction(Number((selectedItemData.y * sheet.height).toFixed(2))) : ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setManualEditorValues((prev) => ({ ...prev, y: value }));
                    updateSelectedBox("y", value);
                  }}
                  disabled={disabled}
                />
              </div>
            </div>
          ) : null}

          {selectedItemData && selectedItem?.kind === "line" ? (
            <div className="diagram-editor-grid">
              <div className="diagram-editor-field">
                <Text>Length</Text>
                <Input
                  size="middle"
                  value={manualEditorValues.len || ""}
                  placeholder={toMixedFraction(selectedLineLength)}
                  onChange={(event) => {
                    const value = event.target.value;
                    setManualEditorValues((prev) => ({ ...prev, len: value }));
                    updateSelectedLine("len", value);
                  }}
                  disabled={disabled}
                />
              </div>
              <div className="diagram-editor-field">
                <Text>X Position</Text>
                <Input
                  size="middle"
                  value={manualEditorValues.x || ""}
                  placeholder={Number.isFinite(selectedItemData.x1) ? toMixedFraction(Number((Math.min(selectedItemData.x1, selectedItemData.x2) * sheet.width).toFixed(2))) : ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setManualEditorValues((prev) => ({ ...prev, x: value }));
                    updateSelectedLine("x", value);
                  }}
                  disabled={disabled}
                />
              </div>
              <div className="diagram-editor-field">
                <Text>Y Position</Text>
                <Input
                  size="middle"
                  value={manualEditorValues.y || ""}
                  placeholder={Number.isFinite(selectedItemData.y1) ? toMixedFraction(Number((Math.min(selectedItemData.y1, selectedItemData.y2) * sheet.height).toFixed(2))) : ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    setManualEditorValues((prev) => ({ ...prev, y: value }));
                    updateSelectedLine("y", value);
                  }}
                  disabled={disabled}
                />
              </div>
            </div>
          ) : null}

          {selectedItemData && selectedItem?.kind === "label" ? (
            <div className="diagram-editor-grid">
              <div className="diagram-editor-field diagram-editor-field-wide">
                <Text>Text</Text>
                <Input
                  size="middle"
                  value={selectedItemData.text || ""}
                  onChange={(event) => updateSelectedLabel("text", event.target.value)}
                  disabled={disabled}
                  placeholder="Type dimension text"
                />
              </div>
              <div className="diagram-editor-field">
                <Text>X Position</Text>
                <InputNumber
                  size="middle"
                  min={0}
                  step={0.1}
                  value={Number.isFinite(selectedItemData.x) ? Number((selectedItemData.x * sheet.width).toFixed(2)) : 0}
                  onChange={(v) => updateSelectedLabel("x", v)}
                  disabled={disabled}
                />
              </div>
              <div className="diagram-editor-field">
                <Text>Y Position</Text>
                <InputNumber
                  size="middle"
                  min={0}
                  step={0.1}
                  value={Number.isFinite(selectedItemData.y) ? Number((selectedItemData.y * sheet.height).toFixed(2)) : 0}
                  onChange={(v) => updateSelectedLabel("y", v)}
                  disabled={disabled}
                />
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className="diagram-canvas-wrap" style={{ position: 'relative', cursor: activeTool === 'select' ? 'default' : 'crosshair', marginTop: 12 }}>
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
              </g>
            )
          })}

          {layout?.labels?.map((label) => {
            const p = labelToPixels(label, sheetRect);
            const selected = selectedItem?.kind === "label" && selectedItem.id === label.id;
            return (
              <g key={label.id}>
                <text
                  x={p.x}
                  y={p.y}
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  fill={selected ? "#ef4444" : "#1e40af"}
                  fontSize="14"
                  fontWeight="600"
                  style={{ cursor: "move", userSelect: "none" }}
                  onMouseDown={(event) => {
                    setSelectedItem({ kind: "label", id: label.id });
                    startItemDrag({ kind: "label", id: label.id }, event);
                  }}
                >
                  {label.text}
                </text>
              </g>
            );
          })}

          {layout?.lines?.map((line) => {
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
        </svg>

        <PencilTool 
          isActive={activeTool === 'pencil'} 
          viewBoxWidth={SVG_VIEWBOX.width} 
          viewBoxHeight={SVG_VIEWBOX.height} 
          paths={layout?.paths || []}
          onPathsChange={(newPaths) => setLayoutSafe(prev => ({ ...prev, paths: newPaths }))}
        />
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
      <button type="button" className={value === "pencil" ? "active" : ""} onClick={() => onChange("pencil")} disabled={disabled} style={{ background: value==='pencil'?'#e6f7ff':'', border: value==='pencil'?'1px solid #1890ff':'1px solid #d9d9d9', padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}>
        <EditOutlined style={{ marginRight: 6 }} /> Pencil
      </button>
      <button type="button" className={value === "line" ? "active" : ""} onClick={() => onChange("line")} disabled={disabled} style={{ background: value==='line'?'#e6f7ff':'', border: value==='line'?'1px solid #1890ff':'1px solid #d9d9d9', padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}>
        <LineOutlined style={{ marginRight: 6 }} /> Draw Line
      </button>
      <button type="button" className={value === "box" ? "active" : ""} onClick={() => onChange("box")} disabled={disabled} style={{ background: value==='box'?'#e6f7ff':'', border: value==='box'?'1px solid #1890ff':'1px solid #d9d9d9', padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}>
        <BorderOutlined style={{ marginRight: 6 }} /> Draw Box
      </button>
      <button type="button" className={value === "label" ? "active" : ""} onClick={() => onChange("label")} disabled={disabled} style={{ background: value==='label'?'#e6f7ff':'', border: value==='label'?'1px solid #1890ff':'1px solid #d9d9d9', padding: '4px 12px', borderRadius: 4, cursor: 'pointer' }}>
        <FontSizeOutlined style={{ marginRight: 6 }} /> Text
      </button>
    </div>
  );
}
