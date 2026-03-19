import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Card, Input, InputNumber, Space, Typography } from "antd";
import { DeleteOutlined, FontSizeOutlined, LineOutlined, ReloadOutlined } from "@ant-design/icons";

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

function createDefaultLayout(sheet) {
  return {
    version: 1,
    sheet,
    lines: [],
    labels: [],
  };
}

function clampLayout(layout) {
  return {
    ...layout,
    lines: (layout.lines || []).map((line) => normalizeLine(line)),
    labels: (layout.labels || []).map((label) => normalizeLabel(label)),
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

  for (let index = 0; index < leftLines.length; index += 1) {
    const lineA = leftLines[index];
    const lineB = rightLines[index];
    if (
      lineA.id !== lineB.id ||
      lineA.type !== lineB.type ||
      lineA.x1 !== lineB.x1 ||
      lineA.y1 !== lineB.y1 ||
      lineA.x2 !== lineB.x2 ||
      lineA.y2 !== lineB.y2
    ) {
      return false;
    }
  }

  const leftLabels = left.labels || [];
  const rightLabels = right.labels || [];
  if (leftLabels.length !== rightLabels.length) return false;

  for (let index = 0; index < leftLabels.length; index += 1) {
    const labelA = leftLabels[index];
    const labelB = rightLabels[index];
    if (
      labelA.id !== labelB.id ||
      labelA.x !== labelB.x ||
      labelA.y !== labelB.y ||
      labelA.text !== labelB.text
    ) {
      return false;
    }
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

function buildDefaultLine(type = "vertical", x = 0.5, y = 0.5) {
  const presets = {
    vertical: { type: "vertical", x1: x, y1: 0.08, x2: x, y2: 0.92 },
    horizontal: { type: "horizontal", x1: 0.08, y1: y, x2: 0.92, y2: y },
    slanted: { type: "slanted", x1: 0.2, y1: 0.25, x2: 0.8, y2: 0.75 },
  };
  return normalizeLine(presets[type] || presets.vertical);
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
  const [lineType, setLineType] = useState("vertical");
  const [labelDraft, setLabelDraft] = useState("");
  const [labelMode, setLabelMode] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const sheet = useMemo(() => {
    const fallbackW = safeNum(length, 18);
    const fallbackH = Math.max(1, safeNum(breadth, 12) + safeNum(height, 0));
    const parsed = parseCuttingSize(cuttingSize, fallbackW, fallbackH);
    return {
      width: parsed.width,
      height: parsed.height,
      cuttingSize: cuttingSize || `${parsed.width} x ${parsed.height}`,
    };
  }, [breadth, cuttingSize, height, length]);

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
      if (areLayoutsEqual(prev, nextLayout)) {
        return prev;
      }

      return nextLayout;
    });
  }, [initialLayout, sheet]);

  useEffect(() => {
    if (!layout) return;
    onLayoutChange?.(layout);
  }, [layout, onLayoutChange]);

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

  const addLine = (type = lineType) => {
    if (disabled) return;
    setLayoutSafe((prev) => {
      const nextLine = buildDefaultLine(type, 0.5, 0.5);
      return {
        ...prev,
        lines: [...prev.lines, nextLine],
      };
    });
  };

  const deleteSelected = () => {
    if (disabled) return;
    if (!selectedItem) return;
    setLayoutSafe((prev) => {
      if (selectedItem.kind === "line") {
        return { ...prev, lines: prev.lines.filter((line) => line.id !== selectedItem.id) };
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

  const clearLines = () => {
    if (disabled) return;
    setLayoutSafe((prev) => ({ ...prev, lines: [] }));
    setSelectedItem((prev) => (prev?.kind === "line" ? null : prev));
  };

  const clearLabels = () => {
    if (disabled) return;
    setLayoutSafe((prev) => ({ ...prev, labels: [] }));
    setSelectedItem((prev) => (prev?.kind === "label" ? null : prev));
  };

  const addGuideSet = () => {
    if (disabled) return;
    setLayoutSafe((prev) => ({
      ...prev,
      lines: [
        ...prev.lines,
        buildDefaultLine("vertical", 0.25, 0.5),
        buildDefaultLine("vertical", 0.5, 0.5),
        buildDefaultLine("vertical", 0.75, 0.5),
        buildDefaultLine("horizontal", 0.5, 0.25),
        buildDefaultLine("horizontal", 0.5, 0.5),
        buildDefaultLine("horizontal", 0.5, 0.75),
      ],
    }));
  };

  const startDrag = (payload, event) => {
    if (disabled) return;
    event.stopPropagation();
    const start = svgPointToNormalized(event);
    if (!start) return;
    dragRef.current = { ...payload, start };
  };

  const handleMouseMove = (event) => {
    if (!dragRef.current || !layout) return;
    const current = svgPointToNormalized(event);
    if (!current) return;

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

            let nextDx = dx;
            let nextDy = dy;
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
      return;
    }

    if (kind === "label") {
      setLayoutSafe((prev) => {
        const nextLabels = prev.labels.map((label) => {
          if (label.id !== id) return label;
          return {
            ...label,
            x: clamp(label.x + dx),
            y: clamp(label.y + dy),
          };
        });
        return { ...prev, labels: nextLabels };
      });
      dragRef.current = { ...dragRef.current, start: current };
    }
  };

  const handleMouseUp = () => {
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

  const onCanvasClick = (event) => {
    if (disabled) {
      setSelectedItem(null);
      return;
    }
    if (!labelMode || !layout) {
      setSelectedItem(null);
      return;
    }
    const point = svgPointToNormalized(event);
    if (!point) return;
    const text = formatDimensionText(labelDraft) || "0";
    const newLabel = normalizeLabel({ x: point.x, y: point.y, text });
    setLayoutSafe((prev) => ({ ...prev, labels: [...prev.labels, newLabel] }));
    setSelectedItem({ kind: "label", id: newLabel.id });
    setLabelMode(false);
  };

  return (
    <Card
      size="small"
      title="Layout Drawing Tool"
      className="diagram-card"
      extra={<Text type="secondary">{disabled ? "View only" : "Auto-saved with this job"}</Text>}
    >
      <div className="diagram-help-row">
        <Text type="secondary">Step 1: Set dimensions</Text>
        <Text type="secondary">Step 2: Add guides or labels</Text>
        <Text type="secondary">Step 3: Drag and fine-tune</Text>
      </div>

      <div className="diagram-control-grid">
        <Space direction="vertical" size={4}>
          <Text type="secondary">Length (L)</Text>
          <InputNumber min={0.1} step={0.01} size="small" value={length} onChange={(value) => onLengthChange?.(value)} className="diagram-mini-input" disabled={disabled} />
        </Space>
        <Space direction="vertical" size={4}>
          <Text type="secondary">Breadth (B)</Text>
          <InputNumber min={0.1} step={0.01} size="small" value={breadth} onChange={(value) => onBreadthChange?.(value)} className="diagram-mini-input" disabled={disabled} />
        </Space>
        <Space direction="vertical" size={4}>
          <Text type="secondary">Height (H)</Text>
          <InputNumber min={0.1} step={0.01} size="small" value={height} onChange={(value) => onHeightChange?.(value)} className="diagram-mini-input" disabled={disabled} />
        </Space>
        <Space direction="vertical" size={4}>
          <Text type="secondary">Cutting Size</Text>
          <Input size="small" value={cuttingSize} placeholder="e.g., 18 x 12 in" onChange={(event) => onCuttingSizeChange?.(event.target.value)} className="diagram-mini-input" disabled={disabled} />
        </Space>
      </div>

      <div className="diagram-toolbar">
        <div className="diagram-toolbar-row">
          <Text className="diagram-toolbar-label">Line Type</Text>
          <SelectLineType value={lineType} onChange={setLineType} disabled={disabled} />
          <Button icon={<LineOutlined />} onClick={() => addLine(lineType)} disabled={disabled}>Add Line</Button>
          <Button type="primary" onClick={() => addLine("vertical")} disabled={disabled}>Center Vertical</Button>
          <Button type="primary" onClick={() => addLine("horizontal")} disabled={disabled}>Center Horizontal</Button>
          <Button onClick={addGuideSet} disabled={disabled}>Add Guide Set</Button>
          <Button icon={<ReloadOutlined />} onClick={resetLayout} disabled={disabled}>Reset</Button>
          <Button icon={<DeleteOutlined />} danger disabled={!selectedItem || disabled} onClick={deleteSelected}>Delete</Button>
        </div>
        <div className="diagram-toolbar-row">
          <Text className="diagram-toolbar-label">Label</Text>
          <Input
            value={labelDraft}
            onChange={(event) => setLabelDraft(event.target.value)}
            placeholder="e.g., 15.75 (auto -> 15 3/4)"
            className="diagram-label-input"
            disabled={disabled}
          />
          <Button
            type={labelMode ? "primary" : "default"}
            icon={<FontSizeOutlined />}
            onClick={() => setLabelMode((prev) => !prev)}
            disabled={disabled}
          >
            {labelMode ? "Click on Sheet" : "Place Label"}
          </Button>
          <Button onClick={clearLines} disabled={disabled || !(layout?.lines?.length)}>Clear Lines</Button>
          <Button onClick={clearLabels} disabled={disabled || !(layout?.labels?.length)}>Clear Labels</Button>
          <Text type="secondary">
            {layout ? `${layout.lines.length} lines, ${layout.labels.length} labels` : "0 lines, 0 labels"}
          </Text>
        </div>
        <div className="diagram-toolbar-row diagram-status-row">
          <Text className={`diagram-status-pill ${selectedItem ? "is-active" : ""}`}>
            {selectedItem ? `Selected: ${selectedItem.kind}` : "Selected: none"}
          </Text>
          <Text className={`diagram-status-pill ${labelMode ? "is-active" : ""}`}>
            {labelMode ? "Label placement ON" : "Label placement OFF"}
          </Text>
        </div>
      </div>

      <div className="diagram-canvas-wrap">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_VIEWBOX.width} ${SVG_VIEWBOX.height}`}
          width="100%"
          height="380"
          className={`diagram-canvas ${labelMode ? "diagram-canvas-label-mode" : ""} ${disabled ? "diagram-canvas-readonly" : ""}`}
          onClick={onCanvasClick}
          aria-label="interactive job layout"
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

          {layout?.lines.map((line) => {
            const p = lineToPixels(line, sheetRect);
            const selected = selectedItem?.kind === "line" && selectedItem.id === line.id;
            return (
              <g key={line.id}>
                <line
                  x1={p.x1}
                  y1={p.y1}
                  x2={p.x2}
                  y2={p.y2}
                  stroke={selected ? "#ef4444" : "#1455ad"}
                  strokeWidth={selected ? 3.5 : 2.4}
                  strokeLinecap="round"
                  onMouseDown={(event) => {
                    setSelectedItem({ kind: "line", id: line.id });
                    startDrag({ kind: "line", id: line.id, handle: "move" }, event);
                  }}
                />
                <circle
                  cx={p.x1}
                  cy={p.y1}
                  r={selected ? 6 : 5}
                  fill="#ffffff"
                  stroke="#1f5ead"
                  strokeWidth="2"
                  onMouseDown={(event) => {
                    setSelectedItem({ kind: "line", id: line.id });
                    startDrag({ kind: "line", id: line.id, handle: "start" }, event);
                  }}
                />
                <circle
                  cx={p.x2}
                  cy={p.y2}
                  r={selected ? 6 : 5}
                  fill="#ffffff"
                  stroke="#1f5ead"
                  strokeWidth="2"
                  onMouseDown={(event) => {
                    setSelectedItem({ kind: "line", id: line.id });
                    startDrag({ kind: "line", id: line.id, handle: "end" }, event);
                  }}
                />
              </g>
            );
          })}

          {layout?.labels.map((label) => {
            const p = labelToPixels(label, sheetRect);
            const selected = selectedItem?.kind === "label" && selectedItem.id === label.id;
            return (
              <g key={label.id}>
                <rect
                  x={p.x - 4}
                  y={p.y - 16}
                  width={Math.max(34, label.text.length * 7.4)}
                  height={20}
                  fill={selected ? "#ffe8e8" : "#ffffff"}
                  stroke={selected ? "#ef4444" : "#8eb8f0"}
                  rx={4}
                />
                <text
                  x={p.x}
                  y={p.y - 2}
                  fill="#0f3765"
                  fontSize="13"
                  fontWeight="600"
                  onMouseDown={(event) => {
                    setSelectedItem({ kind: "label", id: label.id });
                    startDrag({ kind: "label", id: label.id }, event);
                  }}
                >
                  {label.text || "-"}
                </text>
              </g>
            );
          })}

          <text x={sheetRect.x + 6} y={sheetRect.y - 10} fill="#1f4e87" fontSize="12" fontWeight="700">
            Cutting Size: {sheet.cuttingSize}
          </text>
        </svg>
      </div>

      <Text type="secondary">
        Tip: drag line body to move, drag line ends to resize, and use "Add Guide Set" for quick structure.
      </Text>
    </Card>
  );
}

function SelectLineType({ value, onChange, disabled }) {
  return (
    <div className="diagram-line-type">
      <button type="button" className={value === "vertical" ? "active" : ""} onClick={() => onChange("vertical")} disabled={disabled}>Vertical</button>
      <button type="button" className={value === "horizontal" ? "active" : ""} onClick={() => onChange("horizontal")} disabled={disabled}>Horizontal</button>
      <button type="button" className={value === "slanted" ? "active" : ""} onClick={() => onChange("slanted")} disabled={disabled}>Slanted</button>
    </div>
  );
}
