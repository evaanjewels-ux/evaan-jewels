import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import dbConnect from "@/lib/db";
import Customer from "@/models/Customer";

export const dynamic = "force-dynamic";

// GET /api/customers/export-debts — Export all customer debts as Excel
export async function GET() {
  try {
    await dbConnect();

    const customers = await Customer.find({ isActive: true })
      .sort({ totalDebt: -1 })
      .lean();

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Evaan Jewels";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Customer Debts", {
      properties: { defaultColWidth: 18 },
    });

    // Title row
    sheet.mergeCells("A1:H1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "Evaan Jewels - Customer Debts Report";
    titleCell.font = { size: 16, bold: true, color: { argb: "FF333333" } };
    titleCell.alignment = { horizontal: "center" };

    // Generated on
    sheet.mergeCells("A2:H2");
    const genCell = sheet.getCell("A2");
    genCell.value = `Generated on: ${new Date().toLocaleString("en-IN")}`;
    genCell.font = { size: 10, italic: true, color: { argb: "FF666666" } };
    genCell.alignment = { horizontal: "center" };

    // Empty row
    sheet.addRow([]);

    // Summary stats
    const totalCustomers = customers.length;
    const customersWithDebt = customers.filter((c) => c.totalDebt > 0).length;
    const totalDebtAmount = customers.reduce((sum, c) => sum + (c.totalDebt || 0), 0);
    const totalPurchases = customers.reduce((sum, c) => sum + (c.totalPurchases || 0), 0);
    const totalPaid = customers.reduce((sum, c) => sum + (c.totalPaid || 0), 0);

    sheet.mergeCells("A4:H4");
    const summaryTitle = sheet.getCell("A4");
    summaryTitle.value = `Summary: ${totalCustomers} customers | ${customersWithDebt} with debt | Total Debt: Rs. ${totalDebtAmount.toLocaleString("en-IN")}`;
    summaryTitle.font = { size: 10, bold: true, color: { argb: "FFB8860B" } };
    summaryTitle.alignment = { horizontal: "center" };

    // Empty row
    sheet.addRow([]);

    // Column headers
    const headerRow = sheet.addRow([
      "Customer Name",
      "Phone",
      "Email",
      "Total Purchases (Rs.)",
      "Total Paid (Rs.)",
      "Outstanding Debt (Rs.)",
      "Bills Count",
      "Customer Since",
    ]);

    // Header styling
    const headerFill: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFB8860B" },
    };
    const headerFont: Partial<ExcelJS.Font> = {
      bold: true,
      color: { argb: "FFFFFFFF" },
      size: 11,
    };

    headerRow.eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { horizontal: "center", vertical: "middle" };
      cell.border = {
        bottom: { style: "thin", color: { argb: "FFB8860B" } },
      };
    });
    headerRow.height = 24;

    // Column widths
    sheet.getColumn(1).width = 24; // Name
    sheet.getColumn(2).width = 16; // Phone
    sheet.getColumn(3).width = 24; // Email
    sheet.getColumn(4).width = 20; // Total Purchases
    sheet.getColumn(5).width = 18; // Total Paid
    sheet.getColumn(6).width = 20; // Outstanding Debt
    sheet.getColumn(7).width = 14; // Bills Count
    sheet.getColumn(8).width = 16; // Customer Since

    // Data rows
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const customer of customers as any[]) {
      const dateStr = customer.createdAt
        ? new Date(customer.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "";

      const row = sheet.addRow([
        customer.name || "",
        customer.phone || "",
        customer.email || "",
        customer.totalPurchases || 0,
        customer.totalPaid || 0,
        customer.totalDebt || 0,
        customer.billCount || 0,
        dateStr,
      ]);

      // Format currency columns
      row.getCell(4).numFmt = "#,##0.00";
      row.getCell(5).numFmt = "#,##0.00";
      row.getCell(6).numFmt = "#,##0.00";

      // Red for outstanding debt
      if (customer.totalDebt > 0) {
        row.getCell(6).font = { color: { argb: "FFDC2626" }, bold: true };
      } else {
        row.getCell(6).font = { color: { argb: "FF16A34A" } };
      }

      row.alignment = { vertical: "middle" };
    }

    // Totals row
    sheet.addRow([]);
    const totalsRow = sheet.addRow([
      "",
      "",
      "TOTAL",
      totalPurchases,
      totalPaid,
      totalDebtAmount,
      customers.reduce((sum, c) => sum + (c.billCount || 0), 0),
      "",
    ]);

    const totalsFill: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF5F5F5" },
    };

    totalsRow.eachCell((cell, colNumber) => {
      cell.fill = totalsFill;
      cell.font = { bold: true, size: 11 };
      if (colNumber >= 4 && colNumber <= 6) {
        cell.numFmt = "#,##0.00";
      }
    });

    totalsRow.getCell(6).font = {
      bold: true,
      size: 11,
      color: totalDebtAmount > 0 ? { argb: "FFDC2626" } : { argb: "FF16A34A" },
    };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    const now = new Date();
    const fileName = `Customer-Debts-${now.toISOString().split("T")[0]}`;

    return new Response(buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}.xlsx"`,
        "Content-Length": String((buffer as ArrayBuffer).byteLength),
      },
    });
  } catch (error) {
    console.error("GET /api/customers/export-debts error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export debts" },
      { status: 500 }
    );
  }
}
