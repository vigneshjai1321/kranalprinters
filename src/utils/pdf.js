import { jsPDF } from "jspdf";

function addSectionHeader(doc, x, y, width, title) {
  doc.setFillColor(15, 77, 160);
  doc.roundedRect(x, y, width, 20, 6, 6, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(title, x + 8, y + 14);
}

function addKeyValueRows(doc, x, y, width, rows) {
  let cursor = y;

  rows.forEach(([label, value], index) => {
    const wrapped = doc.splitTextToSize(String(value || "-"), width - 185);
    const rowHeight = Math.max(18, wrapped.length * 12 + 4);

    if (index % 2 === 0) {
      doc.setFillColor(246, 250, 255);
      doc.rect(x, cursor, width, rowHeight, "F");
    }

    doc.setDrawColor(218, 230, 245);
    doc.rect(x, cursor, width, rowHeight);

    doc.setTextColor(36, 65, 103);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`${label}`, x + 8, cursor + 12);

    doc.setTextColor(30, 41, 58);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(wrapped, x + 165, cursor + 12);

    cursor += rowHeight;
  });

  return cursor;
}

function buildPdfData(job) {
  const colours = Array.isArray(job.colours) ? job.colours : [];
  const special = Array.isArray(job.special_instructions) ? job.special_instructions : [];
  const printing = Array.isArray(job.printing_type) ? job.printing_type : [];
  const finish = Array.isArray(job.finishing_main) ? job.finishing_main : [];
  const processes = Array.isArray(job.processes) ? job.processes : [];

  return {
    basic: [
      ["Job No", job.job_no || "-"],
      ["Customer", job.customer_name || "-"],
      ["Customer Location", job.customer_location || "-"],
      ["Job Name", job.job_name || "-"],
      ["Date", job.date || "-"],
      ["Machine", job.machine || "-"],
      ["Quantity", String(job.quantity ?? "-")],
      ["Status", job.status || "-"],
    ],
    design: [
      ["Size", job.size || `${job.size_l || "-"} x ${job.size_b || "-"} x ${job.size_h || "-"} in`],
      ["Cutting Size", job.cutting_size || "-"],
      ["Paper / Board", job.paper_board || "-"],
      ["Job Type", job.job_type || "-"],
      ["Cylinder Ready", job.cylinder_ready || "-"],
      ["Border Waste (mm)", String(job.border_waste_mm ?? "-")],
    ],
    colour: [
      ["Printing Type", printing.join(", ") || "-"],
      ["Colours", colours.join(", ") || "-"],
      ["PAN Colour", job.pan_colours || "-"],
      ["Finishing", finish.join(", ") || "-"],
      ["Processes", processes.join(", ") || "-"],
      ["Approval", job.approval_status || "-"],
    ],
    cuttingInstructions: [
      ["Cutting Instructions", job.cutting_size || "Not provided"],
      ["Folding Size", job.folding_size || "-"],
      ["Die Size", job.die_size || "-"],
      ["Die Type", job.die_type || "-"],
      ["Pasting", job.pasting_type || "-"],
      ["Special Instructions", special.join(", ") || "-"],
      ["General Instructions", job.instructions || "-"],
    ],
  };
}

export function downloadJobPdf(job) {
  const doc = createJobPdfDocument(job);
  const fileName = `${job.job_no || "job"}_docket.pdf`.replace(/\s+/g, "_");
  doc.save(fileName);
}

export function generateJobPdfBlob(job) {
  const doc = createJobPdfDocument(job);
  return doc.output("blob");
}

function createJobPdfDocument(job) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const left = 40;
  const width = 515;

  doc.setFillColor(11, 64, 132);
  doc.roundedRect(left, 24, width, 52, 10, 10, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(17);
  doc.text("Kranal Prints - Job Docket", left + 14, 50);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(222, 237, 255);
  doc.text(`Generated: ${new Date().toLocaleString()}`, left + 14, 66);

  const data = buildPdfData(job);

  let y = 90;
  addSectionHeader(doc, left, y, width, "Job Overview");
  y = addKeyValueRows(doc, left, y + 22, width, data.basic) + 12;

  addSectionHeader(doc, left, y, width, "Design & Cutting Details");
  y = addKeyValueRows(doc, left, y + 22, width, data.design) + 12;

  addSectionHeader(doc, left, y, width, "Printing & Finishing");
  y = addKeyValueRows(doc, left, y + 22, width, data.colour) + 12;

  if (y > 650) {
    doc.addPage();
    y = 40;
  }

  addSectionHeader(doc, left, y, width, "Cutting Instructions & Production Notes");
  y = addKeyValueRows(doc, left, y + 22, width, data.cuttingInstructions) + 14;

  if (y > 620) {
    doc.addPage();
    y = 40;
  }

  addSectionHeader(doc, left, y, width, "Reference Drawing Area");
  y += 28;

  const boxGap = 14;
  const boxWidth = (width - boxGap) / 2;
  const boxHeight = 160;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(36, 65, 103);
  doc.text("Reference Sketch 1", left + 8, y + 12);
  doc.text("Reference Sketch 2", left + boxWidth + boxGap + 8, y + 12);

  doc.setDrawColor(152, 179, 212);
  doc.setLineWidth(1.2);
  doc.roundedRect(left, y + 18, boxWidth, boxHeight, 8, 8);
  doc.roundedRect(left + boxWidth + boxGap, y + 18, boxWidth, boxHeight, 8, 8);

  doc.setDrawColor(226, 234, 246);
  doc.setLineWidth(0.6);
  for (let i = 1; i <= 7; i += 1) {
    const lineY = y + 18 + i * (boxHeight / 8);
    doc.line(left + 8, lineY, left + boxWidth - 8, lineY);
    doc.line(left + boxWidth + boxGap + 8, lineY, left + width - 8, lineY);
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(107, 124, 147);
  doc.text("Use this space for manual drawing / approval notes.", left + 8, y + boxHeight + 34);

  return doc;
}
