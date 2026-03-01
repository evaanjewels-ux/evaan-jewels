import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import dbConnect from "@/lib/db";
import Bill from "@/models/Bill";

export const dynamic = "force-dynamic";

const PAYMENT_MODE_LABELS: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  upi: "UPI",
  bank_transfer: "Bank Transfer",
};

// GET /api/bills/export — Export bills as Excel with date filters
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const period = searchParams.get("period"); // monthly | quarterly | custom

    // Build date filter
    const filter: Record<string, unknown> = {};
    const now = new Date();

    if (period === "monthly") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      filter.createdAt = { $gte: startOfMonth, $lte: endOfMonth };
    } else if (period === "quarterly") {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
      const endOfQuarter = new Date(now.getFullYear(), currentQuarter * 3 + 3, 0, 23, 59, 59, 999);
      filter.createdAt = { $gte: startOfQuarter, $lte: endOfQuarter };
    } else if (from || to) {
      filter.createdAt = {};
      if (from) (filter.createdAt as Record<string, Date>).$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        (filter.createdAt as Record<string, Date>).$lte = toDate;
      }
    }

    const bills = await Bill.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Evaan Jewels";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Bills", {
      properties: { defaultColWidth: 18 },
    });

    // Title row
    sheet.mergeCells("A1:I1");
    const titleCell = sheet.getCell("A1");
    titleCell.value = "Evaan Jewels - Bills Report";
    titleCell.font = { size: 16, bold: true, color: { argb: "FF333333" } };
    titleCell.alignment = { horizontal: "center" };

    // Date range info
    sheet.mergeCells("A2:I2");
    const dateRangeCell = sheet.getCell("A2");
    let dateRangeText = "All Bills";
    if (period === "monthly") {
      dateRangeText = `Monthly Report - ${now.toLocaleString("en-IN", { month: "long", year: "numeric" })}`;
    } else if (period === "quarterly") {
      const qtr = Math.floor(now.getMonth() / 3) + 1;
      dateRangeText = `Quarterly Report - Q${qtr} ${now.getFullYear()}`;
    } else if (from || to) {
      dateRangeText = `${from || "Start"} to ${to || "Present"}`;
    }
    dateRangeCell.value = dateRangeText;
    dateRangeCell.font = { size: 10, italic: true, color: { argb: "FF666666" } };
    dateRangeCell.alignment = { horizontal: "center" };

    // Generated on
    sheet.mergeCells("A3:I3");
    const genCell = sheet.getCell("A3");
    genCell.value = `Generated on: ${new Date().toLocaleString("en-IN")}`;
    genCell.font = { size: 9, color: { argb: "FF999999" } };
    genCell.alignment = { horizontal: "center" };

    // Empty row
    sheet.addRow([]);

    // Column headers
    const headerRow = sheet.addRow([
      "Bill Number",
      "Date",
      "Customer Name",
      "Customer Phone",
      "Product",
      "Final Amount (Rs.)",
      "Amount Paid (Rs.)",
      "Unpaid (Rs.)",
      "Payment Mode",
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
    sheet.getColumn(1).width = 16; // Bill Number
    sheet.getColumn(2).width = 14; // Date
    sheet.getColumn(3).width = 22; // Customer Name
    sheet.getColumn(4).width = 16; // Phone
    sheet.getColumn(5).width = 28; // Product
    sheet.getColumn(6).width = 18; // Final Amount
    sheet.getColumn(7).width = 18; // Amount Paid
    sheet.getColumn(8).width = 16; // Unpaid
    sheet.getColumn(9).width = 16; // Payment Mode

    // Data rows
    let totalAmount = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const bill of bills as any[]) {
      const finalAmount = bill.finalAmount || 0;
      const amountPaid = bill.amountPaid ?? finalAmount;
      const unpaid = Math.max(0, finalAmount - amountPaid);

      totalAmount += finalAmount;
      totalPaid += amountPaid;
      totalUnpaid += unpaid;

      // Get product name(s)
      let productName = "";
      if (bill.items && bill.items.length > 0) {
        productName = bill.items
          .map((item: { productSnapshot?: { name?: string }; quantity?: number }) => {
            const name = item.productSnapshot?.name || "Product";
            return item.quantity && item.quantity > 1 ? `${name} (x${item.quantity})` : name;
          })
          .join(", ");
      } else if (bill.productSnapshot?.name) {
        productName = bill.productSnapshot.name;
      }

      const dateStr = bill.createdAt
        ? new Date(bill.createdAt).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "";

      const row = sheet.addRow([
        bill.billNumber || "",
        dateStr,
        bill.customer?.name || "",
        bill.customer?.phone || "",
        productName,
        finalAmount,
        amountPaid,
        unpaid,
        PAYMENT_MODE_LABELS[bill.paymentMode] || bill.paymentMode || "",
      ]);

      // Format currency columns
      row.getCell(6).numFmt = "#,##0.00";
      row.getCell(7).numFmt = "#,##0.00";
      row.getCell(8).numFmt = "#,##0.00";

      // Red color for unpaid amounts
      if (unpaid > 0) {
        row.getCell(8).font = { color: { argb: "FFDC2626" }, bold: true };
      }

      row.alignment = { vertical: "middle" };
    }

    // Summary row
    sheet.addRow([]);
    const summaryRow = sheet.addRow([
      "",
      "",
      "",
      "",
      `Total (${bills.length} bills)`,
      totalAmount,
      totalPaid,
      totalUnpaid,
      "",
    ]);

    const summaryFill: ExcelJS.Fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF5F5F5" },
    };

    summaryRow.eachCell((cell, colNumber) => {
      cell.fill = summaryFill;
      cell.font = { bold: true, size: 11 };
      if (colNumber >= 6 && colNumber <= 8) {
        cell.numFmt = "#,##0.00";
      }
    });
    summaryRow.getCell(8).font = {
      bold: true,
      size: 11,
      color: totalUnpaid > 0 ? { argb: "FFDC2626" } : { argb: "FF16A34A" },
    };

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Build filename
    let fileName = "Bills-All";
    if (period === "monthly") {
      fileName = `Bills-${now.toLocaleString("en-IN", { month: "long", year: "numeric" }).replace(/\s/g, "-")}`;
    } else if (period === "quarterly") {
      const qtr = Math.floor(now.getMonth() / 3) + 1;
      fileName = `Bills-Q${qtr}-${now.getFullYear()}`;
    } else if (from || to) {
      fileName = `Bills-${from || "start"}-to-${to || "present"}`;
    }

    return new Response(buffer as ArrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${fileName}.xlsx"`,
        "Content-Length": String((buffer as ArrayBuffer).byteLength),
      },
    });
  } catch (error) {
    console.error("GET /api/bills/export error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to export bills" },
      { status: 500 }
    );
  }
}
