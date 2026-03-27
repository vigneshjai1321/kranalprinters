const SVG_VIEWBOX = { width: 760, height: 480 };
const SHEET_PADDING = 48;

function safeNum(value, fallback = 1) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return fallback;
  return num;
}

function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function getSheet(layout) {
  return {
    width: safeNum(layout?.sheet?.width, 100),
    height: safeNum(layout?.sheet?.height, 70),
  };
}

function getSheetRect(sheet) {
  const availableWidth = SVG_VIEWBOX.width - SHEET_PADDING * 2;
  const availableHeight = SVG_VIEWBOX.height - SHEET_PADDING * 2;
  const scale = Math.min(availableWidth / sheet.width, availableHeight / sheet.height);
  const width = sheet.width * scale;
  const height = sheet.height * scale;

  return {
    x: (SVG_VIEWBOX.width - width) / 2,
    y: (SVG_VIEWBOX.height - height) / 2,
    width,
    height,
  };
}

function toPixelsX(value, sheetRect) {
  return sheetRect.x + safeNum(value, 0) * sheetRect.width;
}

function toPixelsY(value, sheetRect) {
  return sheetRect.y + safeNum(value, 0) * sheetRect.height;
}

export function buildLayoutSvgMarkup(layout) {
  const safeLayout = layout || {};
  const sheet = getSheet(safeLayout);
  const sheetRect = getSheetRect(sheet);
  const boxes = Array.isArray(safeLayout.boxes) ? safeLayout.boxes : [];
  const lines = Array.isArray(safeLayout.lines) ? safeLayout.lines : [];
  const labels = Array.isArray(safeLayout.labels) ? safeLayout.labels : [];
  const paths = Array.isArray(safeLayout.paths) ? safeLayout.paths : [];

  const boxMarkup = boxes
    .map((box) => {
      const x = toPixelsX(box.x, sheetRect);
      const y = toPixelsY(box.y, sheetRect);
      const width = safeNum(box.w, 0) * sheetRect.width;
      const height = safeNum(box.h, 0) * sheetRect.height;
      return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="#dbeafe" fill-opacity="0.72" stroke="#3b82f6" stroke-width="1.8" />`;
    })
    .join("");

  const lineMarkup = lines
    .map((line) => {
      const x1 = toPixelsX(line.x1, sheetRect);
      const y1 = toPixelsY(line.y1, sheetRect);
      const x2 = toPixelsX(line.x2, sheetRect);
      const y2 = toPixelsY(line.y2, sheetRect);
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#1455ad" stroke-width="2.4" stroke-linecap="round" />`;
    })
    .join("");

  const labelMarkup = labels
    .map((label) => {
      const x = toPixelsX(label.x, sheetRect);
      const y = toPixelsY(label.y, sheetRect);
      return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="middle" fill="#1e40af" font-size="14" font-weight="600">${escapeXml(label.text || "")}</text>`;
    })
    .join("");

  const pathMarkup = paths
    .map((path) => `<path d="${escapeXml(path)}" fill="none" stroke="#111827" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />`)
    .join("");

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_VIEWBOX.width} ${SVG_VIEWBOX.height}" width="${SVG_VIEWBOX.width}" height="${SVG_VIEWBOX.height}">
      <rect x="0" y="0" width="${SVG_VIEWBOX.width}" height="${SVG_VIEWBOX.height}" fill="#f8fbff" />
      <rect x="${sheetRect.x}" y="${sheetRect.y}" width="${sheetRect.width}" height="${sheetRect.height}" rx="6" fill="#eaf3ff" stroke="#2160b8" stroke-width="2.5" />
      ${boxMarkup}
      ${lineMarkup}
      ${labelMarkup}
      ${pathMarkup}
    </svg>
  `.trim();
}

export async function generateLayoutImage(layout) {
  if (!layout || typeof window === "undefined") return "";

  const svgMarkup = buildLayoutSvgMarkup(layout);
  const blob = new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" });
  const blobUrl = URL.createObjectURL(blob);

  try {
    const image = new Image();
    image.decoding = "async";

    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
      image.src = blobUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = SVG_VIEWBOX.width * 2;
    canvas.height = SVG_VIEWBOX.height * 2;
    const context = canvas.getContext("2d");

    if (!context) return "";

    context.fillStyle = "#f8fbff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(blobUrl);
  }
}
