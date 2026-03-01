import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { format } from "date-fns";
import dbConnect from "@/lib/db";
import Customer from "@/models/Customer";
import { formatCurrencyPDF } from "@/lib/utils";

export const dynamic = "force-dynamic";

interface RouteParams {
  params: Promise<{ id: string }>;
}

const SHOP = {
  name: "Evaan Jewels",
  tagline: "Premium Gold & Diamond Jewelry",
  address: "2nd Floor, B-169, Mohan Garden, Uttam Nagar, Rama Park Road, Delhi - 110059",
  phone: "+91 96541 48574",
};

function fmtAmt(amount: number | undefined | null): string {
  return formatCurrencyPDF(amount || 0);
}

// GET /api/customers/:id/debt-pdf — Download customer debt summary as PDF
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    await dbConnect();
    const { id } = await params;

    const customer = await Customer.findById(id).lean();
    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    const pdfBuffer = await generateDebtSummaryPDF(customer);

    const arrayBuffer = pdfBuffer.buffer.slice(
      pdfBuffer.byteOffset,
      pdfBuffer.byteOffset + pdfBuffer.byteLength
    ) as ArrayBuffer;

    const safeName = customer.name.replace(/[^a-zA-Z0-9]/g, "_");

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Debt-Summary-${safeName}.pdf"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  } catch (error) {
    console.error("GET /api/customers/:id/debt-pdf error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateDebtSummaryPDF(customer: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 40, bottom: 40, left: 50, right: 50 },
      });

      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageWidth = doc.page.width - 100; // margins
      let y = 50;

      // ─── HEADER ──────────────────────────────────────
      doc.rect(50, y - 10, pageWidth, 60).fill("#B8860B");
      doc.fontSize(20).font("Helvetica-Bold").fillColor("#ffffff");
      doc.text(SHOP.name, 62, y);
      doc.fontSize(8).font("Helvetica").fillColor("#ffffffcc");
      doc.text(SHOP.tagline, 62, y + 24);
      doc.fontSize(7).fillColor("#ffffffaa");
      doc.text(`${SHOP.address} | ${SHOP.phone}`, 62, y + 36);
      y += 66;

      // Gold accent line
      doc.rect(50, y, pageWidth, 3).fill("#B8860B");
      y += 12;

      // ─── TITLE ────────────────────────────────────────
      doc.fontSize(16).font("Helvetica-Bold").fillColor("#333333");
      doc.text("CUSTOMER DEBT SUMMARY", 50, y, { width: pageWidth, align: "center" });
      y += 28;

      // ─── CUSTOMER INFO ────────────────────────────────
      doc.rect(50, y, pageWidth, 80).fill("#faf9f6").stroke();
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#333333");
      doc.text("Customer Details", 62, y + 8);
      y += 24;

      doc.fontSize(9).font("Helvetica");
      const infoRows: [string, string][] = [
        ["Name", customer.name],
        ["Phone", customer.phone],
      ];
      if (customer.email) infoRows.push(["Email", customer.email]);
      if (customer.address) infoRows.push(["Address", customer.address]);

      for (const [label, value] of infoRows) {
        doc.font("Helvetica-Bold").fillColor("#666666").text(`${label}:`, 62, y);
        doc.font("Helvetica").fillColor("#333333").text(value, 140, y);
        y += 14;
      }
      y += 12;

      // ─── FINANCIAL SUMMARY ────────────────────────────
      doc.rect(50, y, pageWidth, 26).fill("#B8860B");
      doc.fontSize(11).font("Helvetica-Bold").fillColor("#ffffff");
      doc.text("Financial Summary", 62, y + 7);
      y += 32;

      const summaryRows: [string, string, string][] = [
        ["Total Purchases", `Rs. ${fmtAmt(customer.totalPurchases)}`, "#333333"],
        ["Total Paid", `Rs. ${fmtAmt(customer.totalPaid)}`, "#16a34a"],
        ["Outstanding Debt", `Rs. ${fmtAmt(customer.totalDebt)}`, customer.totalDebt > 0 ? "#dc2626" : "#16a34a"],
        ["Bills Generated", String(customer.billCount || 0), "#333333"],
      ];

      let rowBg = false;
      for (const [label, value, color] of summaryRows) {
        if (rowBg) {
          doc.rect(50, y - 2, pageWidth, 20).fill("#fafafa");
        }
        doc.fontSize(9).font("Helvetica-Bold").fillColor("#555555");
        doc.text(label, 62, y + 2);
        doc.font("Helvetica-Bold").fillColor(color);
        doc.text(value, 300, y + 2, { width: 200, align: "right" });
        y += 20;
        rowBg = !rowBg;
      }

      // Separator
      doc.moveTo(50, y + 4).lineTo(50 + pageWidth, y + 4).strokeColor("#dddddd").lineWidth(0.5).stroke();
      y += 16;

      // ─── PAYMENT HISTORY TABLE ────────────────────────
      const history = customer.paymentHistory || [];

      if (history.length > 0) {
        doc.fontSize(12).font("Helvetica-Bold").fillColor("#333333");
        doc.text("Payment & Debt History", 50, y);
        y += 22;

        // Table header
        doc.rect(50, y, pageWidth, 22).fill("#B8860B");
        doc.fontSize(8).font("Helvetica-Bold").fillColor("#ffffff");
        doc.text("Date", 58, y + 7, { width: 70 });
        doc.text("Description", 130, y + 7, { width: 140 });
        doc.text("Amount", 270, y + 7, { width: 70, align: "right" });
        doc.text("Debt Before", 345, y + 7, { width: 70, align: "right" });
        doc.text("Debt After", 420, y + 7, { width: 80, align: "right" });
        y += 26;

        // Sort: most recent first for display
        const sortedHistory = [...history].reverse();

        rowBg = false;
        for (const entry of sortedHistory) {
          // Page break check
          if (y > 720) {
            doc.addPage();
            y = 50;
            // Repeat header on new page
            doc.rect(50, y, pageWidth, 22).fill("#B8860B");
            doc.fontSize(8).font("Helvetica-Bold").fillColor("#ffffff");
            doc.text("Date", 58, y + 7, { width: 70 });
            doc.text("Description", 130, y + 7, { width: 140 });
            doc.text("Amount", 270, y + 7, { width: 70, align: "right" });
            doc.text("Debt Before", 345, y + 7, { width: 70, align: "right" });
            doc.text("Debt After", 420, y + 7, { width: 80, align: "right" });
            y += 26;
            rowBg = false;
          }

          if (rowBg) {
            doc.rect(50, y - 2, pageWidth, 18).fill("#fafafa");
          }

          const dateStr = entry.date
            ? format(new Date(entry.date), "dd MMM yyyy")
            : "-";

          // Determine description
          let description = "";
          if (entry.billNumber) {
            description = `Bill #${entry.billNumber}`;
            if (entry.amountPaid > 0 && entry.amountPaid < entry.billAmount) {
              description += " (Partial)";
            } else if (entry.amountPaid >= entry.billAmount) {
              description += " (Paid)";
            } else {
              description += " (Unpaid)";
            }
          } else if (entry.note) {
            description = entry.note.length > 30
              ? entry.note.substring(0, 27) + "..."
              : entry.note;
          } else {
            description = entry.debtAdded < 0 ? "Payment Received" : "Debt Adjustment";
          }

          const amountStr = entry.billNumber
            ? `Rs. ${fmtAmt(entry.billAmount)}`
            : entry.debtAdded < 0
              ? `- Rs. ${fmtAmt(Math.abs(entry.debtAdded))}`
              : `Rs. ${fmtAmt(entry.debtAdded)}`;

          doc.fillColor("#333333");
          doc.fontSize(8).font("Helvetica");
          doc.text(dateStr, 58, y + 2, { width: 70 });
          doc.text(description, 130, y + 2, { width: 135 });
          doc.text(amountStr, 270, y + 2, { width: 70, align: "right" });
          doc.text(`Rs. ${fmtAmt(entry.debtBefore)}`, 345, y + 2, { width: 70, align: "right" });

          // Color debt after based on direction
          const debtColor = entry.debtAfter > entry.debtBefore ? "#dc2626" : "#16a34a";
          doc.fillColor(debtColor);
          doc.text(`Rs. ${fmtAmt(entry.debtAfter)}`, 420, y + 2, { width: 80, align: "right" });

          y += 18;
          rowBg = !rowBg;
        }
      } else {
        doc.fontSize(10).font("Helvetica").fillColor("#999999");
        doc.text("No payment history available.", 50, y, { width: pageWidth, align: "center" });
        y += 20;
      }

      // ─── CURRENT DEBT BOX ──────────────────────────────
      y += 12;
      if (y > 720) {
        doc.addPage();
        y = 50;
      }

      const debtBoxColor = customer.totalDebt > 0 ? "#dc2626" : "#16a34a";
      doc.rect(50, y, pageWidth, 40).fill(debtBoxColor);
      doc.fontSize(14).font("Helvetica-Bold").fillColor("#ffffff");
      doc.text(
        customer.totalDebt > 0 ? "OUTSTANDING DEBT" : "NO DEBT - ALL CLEAR",
        62,
        y + 12
      );
      if (customer.totalDebt > 0) {
        doc.fontSize(16).font("Helvetica-Bold").fillColor("#ffffff");
        doc.text(`Rs. ${fmtAmt(customer.totalDebt)}`, 300, y + 10, {
          width: 200,
          align: "right",
        });
      }
      y += 52;

      // ─── FOOTER ──────────────────────────────────────
      if (y > 700) {
        doc.addPage();
        y = 50;
      }
      y = Math.max(y, 700);

      doc.moveTo(50, y).lineTo(50 + pageWidth, y).strokeColor("#dddddd").lineWidth(0.5).stroke();
      y += 10;

      doc.fontSize(7).font("Helvetica").fillColor("#999999");
      doc.text(
        "This is a computer-generated document from Evaan Jewels.",
        50, y, { width: pageWidth, align: "center" }
      );
      y += 10;
      doc.text(
        `Generated on ${format(new Date(), "dd MMM yyyy, hh:mm a")}`,
        50, y, { width: pageWidth, align: "center" }
      );

      // Bottom accent line
      doc.rect(50, doc.page.height - 43, pageWidth, 3).fill("#B8860B");

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
