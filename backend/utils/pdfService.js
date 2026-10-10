import PDFDocument from "pdfkit";

/**
 * Streams a payslip PDF directly to the Express response.
 * @param {object} payroll - populated payroll doc (with employee)
 * @param {object} res - express response
 */
export const generatePayslipPDF = (payroll, res) => {
  const emp = payroll.employee || {};
  const doc = new PDFDocument({ size: "A4", margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=payslip-${emp.employeeId || "employee"}-${payroll.month}.pdf`
  );
  doc.pipe(res);

  const accent = "#4f46e5";

  // Header
  doc.fillColor(accent).fontSize(24).text("SmartHR AI", { continued: false });
  doc.fillColor("#666").fontSize(10).text("Intelligent Human Resource Management System");
  doc.moveDown(0.5);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(accent).stroke();
  doc.moveDown();

  doc.fillColor("#111").fontSize(16).text(`Payslip - ${payroll.month}`, { align: "center" });
  doc.moveDown();

  // Employee details
  const line = (label, value) => {
    doc.fontSize(11).fillColor("#555").text(label, 60, doc.y, { continued: true, width: 200 });
    doc.fillColor("#111").text(`  ${value}`);
  };

  doc.fontSize(13).fillColor(accent).text("Employee Details");
  doc.moveDown(0.3);
  line("Name:", emp.name || "—");
  line("Employee ID:", emp.employeeId || "—");
  line("Department:", emp.department || "—");
  line("Designation:", emp.designation || "—");
  doc.moveDown();

  // Earnings & deductions
  doc.fontSize(13).fillColor(accent).text("Earnings & Deductions");
  doc.moveDown(0.3);

  const money = (n) => `PKR ${Number(n || 0).toLocaleString()}`;
  const row = (label, value, isTotal = false) => {
    doc.fontSize(isTotal ? 13 : 11).fillColor(isTotal ? "#111" : "#555");
    const y = doc.y;
    doc.text(label, 60, y, { width: 300 });
    doc.text(value, 360, y, { width: 180, align: "right" });
    doc.moveDown(0.4);
  };

  row("Basic Salary", money(payroll.basicSalary));
  row("Allowances", money(payroll.allowances));
  row("Bonus", money(payroll.bonus));
  row("Deductions", `- ${money(payroll.deductions)}`);
  doc.moveTo(60, doc.y).lineTo(540, doc.y).strokeColor("#ccc").stroke();
  doc.moveDown(0.4);
  row("Net Salary", money(payroll.netSalary), true);

  doc.moveDown(2);
  doc.fontSize(9).fillColor("#999").text(
    `Status: ${payroll.status}    Generated: ${new Date().toLocaleString()}`,
    { align: "center" }
  );
  doc.fontSize(8).fillColor("#bbb").text(
    "This is a system-generated payslip and does not require a signature.",
    { align: "center" }
  );

  doc.end();
};
