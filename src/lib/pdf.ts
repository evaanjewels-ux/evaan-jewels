import PDFDocument from "pdfkit";
import { formatCurrencyPDF } from "@/lib/utils";
import { format } from "date-fns";

interface ProductSnapshotPDF {
  name: string;
  productCode: string;
  category?: { name: string } | null;
  gender?: string;
  metalComposition?: Array<{
    variantName: string;
    weightInGrams: number;
    pricePerGram: number;
    subtotal: number;
    metal?: { name: string } | null;
    wastageCharges?: { type: string; value: number };
  }>;
  gemstoneComposition?: Array<{
    variantName: string;
    weightInCarats: number;
    quantity: number;
    pricePerCarat: number;
    subtotal: number;
    gemstone?: { name: string } | null;
    wastageCharges?: { type: string; value: number };
  }>;
  makingCharges?: { type: string; value: number };
  wastageCharges?: { type: string; value: number };
  gstPercentage?: number;
  otherCharges?: Array<{ name: string; amount: number }>;
  metalTotal?: number;
  gemstoneTotal?: number;
  makingChargeAmount?: number;
  wastageChargeAmount?: number;
  otherChargesTotal?: number;
  subtotal?: number;
  gstAmount?: number;
  totalPrice?: number;
  selectedSize?: string;
  selectedColor?: string;
}

interface BillPDFData {
  billNumber: string;
  createdAt: string;
  paymentMode: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
    address?: string;
  };
  /** Single product (backward compat) */
  productSnapshot: ProductSnapshotPDF;
  /** Multiple items — if present, used instead of single productSnapshot */
  items?: Array<{
    productSnapshot: ProductSnapshotPDF;
    quantity?: number;
  }>;
  discount?: {
    type: string;
    value: number;
    amount: number;
  } | null;
  finalAmount: number;
  notes?: string;
  generatedBy?: { name: string } | null;
}

// Shop details — could be moved to env/config
const SHOP = {
  name: "Evaan Jewels",
  tagline: "Premium Gold & Diamond Jewelry",
  address: "2nd Floor, B-169, Mohan Garden, Uttam Nagar, Rama Park Road, Delhi - 110059",
  phone: "+91 96541 48574",
  gstin: "07BEFPG0156P2ZC",
};

/** Format amount for PDF without Unicode rupee symbol */
function fmtAmt(amount: number | undefined | null): string {
  return formatCurrencyPDF(amount || 0);
}

/**
 * Generate a professional PDF bill and return it as a Buffer.
 */
export async function generateBillPDF(bill: BillPDFData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: "A4",
        margins: { top: 40, bottom: 40, left: 50, right: 50 },
      });

      const chunks: Uint8Array[] = [];
      doc.on("data", (chunk: Uint8Array) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageWidth = doc.page.width - 100; // 50 margin each side
      let y = 40;

      // Page-break helper
      const ensureSpace = (needed: number) => {
        if (y + needed > 740) {
          doc.addPage();
          y = 50;
        }
      };

      // ─── HEADER ─────────────────────────────────────
      doc.rect(50, y, pageWidth, 3).fill("#B8860B");
      y += 8;

      doc.fontSize(22).font("Helvetica-Bold").fillColor("#1a1a1a");
      doc.text(SHOP.name, 50, y, { width: pageWidth, align: "center" });
      y += 28;

      doc.fontSize(9).font("Helvetica").fillColor("#666666");
      doc.text(SHOP.tagline, 50, y, { width: pageWidth, align: "center" });
      y += 14;

      doc.fontSize(8).fillColor("#888888");
      doc.text(SHOP.address, 50, y, { width: pageWidth, align: "center" });
      y += 12;
      doc.text(`Phone: ${SHOP.phone} | GSTIN: ${SHOP.gstin}`, 50, y, {
        width: pageWidth,
        align: "center",
      });
      y += 16;

      doc.moveTo(50, y).lineTo(50 + pageWidth, y).strokeColor("#dddddd").lineWidth(0.5).stroke();
      y += 12;

      // ─── BILL INFO ──────────────────────────────────
      doc.fontSize(14).font("Helvetica-Bold").fillColor("#1a1a1a");
      doc.text("TAX INVOICE", 50, y, { width: pageWidth, align: "center" });
      y += 22;

      const billDate = bill.createdAt
        ? format(new Date(bill.createdAt), "dd MMM yyyy, hh:mm a")
        : "N/A";

      const paymentLabel =
        bill.paymentMode === "bank_transfer"
          ? "Bank Transfer"
          : bill.paymentMode.charAt(0).toUpperCase() + bill.paymentMode.slice(1);

      doc.fontSize(9).font("Helvetica-Bold").fillColor("#333333");
      doc.text("Bill Number:", 50, y);
      doc.font("Helvetica").text(bill.billNumber, 140, y);
      doc.font("Helvetica-Bold").text("Date:", 350, y);
      doc.font("Helvetica").text(billDate, 390, y);
      y += 14;
      doc.font("Helvetica-Bold").text("Payment:", 50, y);
      doc.font("Helvetica").text(paymentLabel, 140, y);
      y += 20;

      // ─── CUSTOMER DETAILS ───────────────────────────
      doc.rect(50, y, pageWidth, 22).fill("#f5f5f5");
      doc.fontSize(10).font("Helvetica-Bold").fillColor("#333333");
      doc.text("Customer Details", 58, y + 6);
      y += 28;

      doc.fontSize(9).font("Helvetica").fillColor("#333333");
      doc.font("Helvetica-Bold").text("Name:", 58, y);
      doc.font("Helvetica").text(bill.customer.name, 140, y);
      doc.font("Helvetica-Bold").text("Phone:", 350, y);
      doc.font("Helvetica").text(bill.customer.phone, 400, y);
      y += 14;

      if (bill.customer.email) {
        doc.font("Helvetica-Bold").text("Email:", 58, y);
        doc.font("Helvetica").text(bill.customer.email, 140, y);
        y += 14;
      }
      if (bill.customer.address) {
        doc.font("Helvetica-Bold").text("Address:", 58, y);
        doc.font("Helvetica").text(bill.customer.address, 140, y, { width: pageWidth - 100 });
        y += 14;
      }
      y += 10;

      // ─── Determine items to render ─────────────────
      const itemList: Array<{ snap: ProductSnapshotPDF; qty: number }> =
        bill.items && bill.items.length > 0
          ? bill.items.map((item) => ({ snap: item.productSnapshot, qty: item.quantity || 1 }))
          : [{ snap: bill.productSnapshot, qty: 1 }];

      // ─── Render each product item ──────────────────
      for (let itemIdx = 0; itemIdx < itemList.length; itemIdx++) {
        const { snap, qty } = itemList[itemIdx];

        ensureSpace(80);

        // Product header
        const itemLabel = itemList.length > 1 ? `Item ${itemIdx + 1}` : "Product Details";
        doc.rect(50, y, pageWidth, 22).fill("#f5f5f5");
        doc.fontSize(10).font("Helvetica-Bold").fillColor("#333333");
        doc.text(itemLabel, 58, y + 6);
        y += 28;

        doc.fontSize(9).font("Helvetica-Bold").text("Product:", 58, y);
        doc.font("Helvetica").text(snap.name + (qty > 1 ? ` (x${qty})` : ""), 140, y, {
          width: pageWidth - 100,
        });
        y += 14;

        doc.font("Helvetica-Bold").text("Code:", 58, y);
        doc.font("Helvetica").text(snap.productCode, 140, y);

        if (snap.category && typeof snap.category === "object" && "name" in snap.category) {
          doc.font("Helvetica-Bold").text("Category:", 300, y);
          doc.font("Helvetica").text(snap.category.name, 360, y);
        }
        y += 20;

        // Variant row (size / color)
        if (snap.selectedSize || snap.selectedColor) {
          let variantStr = snap.selectedSize ? `Size: ${snap.selectedSize}` : "";
          if (snap.selectedColor)
            variantStr += `${snap.selectedSize ? "  \u00b7  " : ""}Colour: ${snap.selectedColor}`;
          doc.font("Helvetica-Bold").text("Variant:", 58, y);
          doc.font("Helvetica").text(variantStr, 140, y);
          y += 14;
        }

        // ─── PRICE TABLE ────────────────────────────
        ensureSpace(30);
        doc.rect(50, y, pageWidth, 22).fill("#B8860B");
        doc.fontSize(9).font("Helvetica-Bold").fillColor("#ffffff");
        doc.text("Description", 58, y + 7);
        doc.text("Details", 270, y + 7);
        doc.text("Amount (Rs.)", 420, y + 7, { width: 80, align: "right" });
        y += 26;

        doc.fillColor("#333333");
        let rowBg = false;

        const drawRow = (desc: string, details: string, amount: string, bold = false) => {
          ensureSpace(20);
          if (rowBg) {
            doc.rect(50, y - 2, pageWidth, 18).fill("#fafafa");
          }
          doc.fillColor("#333333");
          const font = bold ? "Helvetica-Bold" : "Helvetica";
          doc.fontSize(8.5).font(font);
          doc.text(desc, 58, y + 2, { width: 200 });
          doc.text(details, 270, y + 2, { width: 140 });
          doc.font(bold ? "Helvetica-Bold" : "Helvetica").text(amount, 420, y + 2, {
            width: 80,
            align: "right",
          });
          y += 18;
          rowBg = !rowBg;
        };

        // Metal composition
        if (snap.metalComposition && snap.metalComposition.length > 0) {
          drawRow("Metal Composition", "", "", true);
          for (const comp of snap.metalComposition) {
            const metalName =
              comp.metal && typeof comp.metal === "object" && "name" in comp.metal
                ? comp.metal.name
                : "";
            drawRow(
              `  ${metalName} ${comp.variantName}`,
              `${comp.weightInGrams}g x Rs.${fmtAmt(comp.pricePerGram)}/g`,
              fmtAmt(comp.subtotal)
            );
            if (comp.wastageCharges && comp.wastageCharges.value > 0) {
              const wastageAmt =
                comp.wastageCharges.type === "percentage"
                  ? comp.subtotal * (comp.wastageCharges.value / 100)
                  : comp.wastageCharges.value;
              const wastageLabel =
                comp.wastageCharges.type === "percentage"
                  ? `${comp.wastageCharges.value}% of subtotal`
                  : "Fixed";
              drawRow(`    Wastage (${metalName})`, wastageLabel, fmtAmt(wastageAmt));
            }
          }
          drawRow("Metal Total", "", fmtAmt(snap.metalTotal), true);
        }

        // Gemstone composition
        if (snap.gemstoneComposition && snap.gemstoneComposition.length > 0) {
          drawRow("Gemstone Composition", "", "", true);
          for (const comp of snap.gemstoneComposition) {
            const gemName =
              comp.gemstone && typeof comp.gemstone === "object" && "name" in comp.gemstone
                ? comp.gemstone.name
                : "";
            const qtyInfo = comp.quantity > 1 ? ` x ${comp.quantity}` : "";
            drawRow(
              `  ${gemName} ${comp.variantName}`,
              `${comp.weightInCarats}ct${qtyInfo} x Rs.${fmtAmt(comp.pricePerCarat)}/ct`,
              fmtAmt(comp.subtotal)
            );
            if (comp.wastageCharges && comp.wastageCharges.value > 0) {
              const wastageAmt =
                comp.wastageCharges.type === "percentage"
                  ? comp.subtotal * (comp.wastageCharges.value / 100)
                  : comp.wastageCharges.value;
              const wastageLabel =
                comp.wastageCharges.type === "percentage"
                  ? `${comp.wastageCharges.value}% of subtotal`
                  : "Fixed";
              drawRow(`    Wastage (${gemName})`, wastageLabel, fmtAmt(wastageAmt));
            }
          }
          drawRow("Gemstone Total", "", fmtAmt(snap.gemstoneTotal), true);
        }

        // Separator
        doc.moveTo(50, y).lineTo(50 + pageWidth, y).strokeColor("#dddddd").lineWidth(0.5).stroke();
        y += 6;

        // Making charges
        if (snap.makingCharges && snap.makingChargeAmount) {
          const chargeLabel =
            snap.makingCharges.type === "percentage"
              ? `${snap.makingCharges.value}% of metal`
              : "Fixed";
          drawRow("Making Charges", chargeLabel, fmtAmt(snap.makingChargeAmount));
        }

        // Wastage charges total
        if (snap.wastageChargeAmount && snap.wastageChargeAmount > 0) {
          const hasPerItem =
            snap.metalComposition?.some((c) => c.wastageCharges && c.wastageCharges.value > 0) ||
            snap.gemstoneComposition?.some((c) => c.wastageCharges && c.wastageCharges.value > 0);
          const label = hasPerItem
            ? "Per-material wastage (see above)"
            : snap.wastageCharges
              ? snap.wastageCharges.type === "percentage"
                ? `${snap.wastageCharges.value}% of metal`
                : "Fixed"
              : "";
          drawRow("Wastage Charges (Total)", label, fmtAmt(snap.wastageChargeAmount));
        }

        // Other charges
        if (snap.otherCharges && snap.otherCharges.length > 0) {
          for (const charge of snap.otherCharges) {
            drawRow(charge.name, "", fmtAmt(charge.amount));
          }
        }

        // Subtotal for this item
        doc.moveTo(50, y).lineTo(50 + pageWidth, y).strokeColor("#dddddd").lineWidth(0.5).stroke();
        y += 6;
        drawRow("Subtotal", "", fmtAmt(snap.subtotal), true);

        // GST
        drawRow(`GST (${snap.gstPercentage || 3}%)`, "", fmtAmt(snap.gstAmount));

        // Item total
        doc.moveTo(50, y).lineTo(50 + pageWidth, y).strokeColor("#B8860B").lineWidth(1).stroke();
        y += 6;
        const itemTotal = (snap.totalPrice || 0) * qty;
        drawRow(
          qty > 1 ? `Item Total (x${qty})` : "Item Total",
          "",
          fmtAmt(itemTotal),
          true
        );

        // Space between items
        if (itemIdx < itemList.length - 1) {
          y += 10;
        }
      }

      // ─── BILL SUMMARY ──────────────────────────────
      ensureSpace(80);
      y += 8;

      // Discount
      if (bill.discount && bill.discount.amount > 0) {
        doc.fontSize(9).font("Helvetica").fillColor("#333333");
        const discLabel =
          bill.discount.type === "percentage"
            ? `${bill.discount.value}% discount`
            : "Flat discount";
        doc.text("Discount:", 300, y);
        doc.text(discLabel, 370, y);
        doc.font("Helvetica-Bold").text(`- Rs.${fmtAmt(bill.discount.amount)}`, 420, y, {
          width: 80,
          align: "right",
        });
        y += 18;
      }

      // ─── FINAL AMOUNT (large, prominent) ───────────
      y += 6;
      ensureSpace(50);

      // Large highlighted box
      doc.rect(50, y - 4, pageWidth, 36).fill("#B8860B");

      doc.fontSize(14).font("Helvetica-Bold").fillColor("#ffffff");
      doc.text("FINAL AMOUNT", 62, y + 7);

      doc.fontSize(16).font("Helvetica-Bold").fillColor("#ffffff");
      doc.text(`Rs. ${fmtAmt(bill.finalAmount)}`, 300, y + 5, {
        width: 200,
        align: "right",
      });
      y += 44;

      // Amount in words (optional touch)
      doc.fontSize(8).font("Helvetica").fillColor("#666666");
      doc.text(
        `(Rupees ${numberToWords(Math.round(bill.finalAmount))} Only)`,
        58,
        y,
        { width: pageWidth - 16 }
      );
      y += 16;

      // ─── NOTES ──────────────────────────────────────
      if (bill.notes) {
        ensureSpace(40);
        doc.fontSize(9).font("Helvetica-Bold").fillColor("#333333");
        doc.text("Notes:", 58, y);
        y += 14;
        doc.font("Helvetica").fontSize(8).fillColor("#666666");
        doc.text(bill.notes, 58, y, { width: pageWidth - 16 });
        y += 20;
      }

      // ─── FOOTER ─────────────────────────────────────
      if (y > 680) {
        doc.addPage();
        y = 50;
      }
      y = Math.max(y + 20, 680);

      doc.moveTo(50, y).lineTo(50 + pageWidth, y).strokeColor("#dddddd").lineWidth(0.5).stroke();
      y += 10;

      doc.fontSize(7.5).font("Helvetica").fillColor("#999999");
      doc.text("Terms & Conditions:", 58, y);
      y += 12;
      doc.text(
        "1. Goods once sold will not be returned or exchanged.",
        58, y, { width: pageWidth - 16 }
      );
      y += 12;
      doc.text(
        "2. Gold/diamond rates are subject to market fluctuations.",
        58, y, { width: pageWidth - 16 }
      );
      y += 12;
      doc.text(
        "3. Please verify the weight and quality at the time of purchase.",
        58, y, { width: pageWidth - 16 }
      );
      y += 12;
      doc.text(
        "4. This is a computer generated bill.",
        58, y, { width: pageWidth - 16 }
      );
      y += 20;

      doc.fontSize(8).font("Helvetica-Bold").fillColor("#B8860B");
      doc.text("Thank you for shopping with Evaan Jewels!", 50, y, {
        width: pageWidth,
        align: "center",
      });
      y += 14;
      doc.fontSize(7).font("Helvetica").fillColor("#cccccc");
      doc.text(
        `Generated on ${format(new Date(), "dd MMM yyyy, hh:mm a")}${
          bill.generatedBy && typeof bill.generatedBy === "object" && "name" in bill.generatedBy
            ? ` by ${bill.generatedBy.name}`
            : ""
        }`,
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

/**
 * Convert a number to Indian English words (e.g. 106642 → "One Lakh Six Thousand Six Hundred Forty Two")
 */
function numberToWords(num: number): string {
  if (num === 0) return "Zero";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen",
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
  ];

  function twoDigits(n: number): string {
    if (n < 20) return ones[n];
    return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
  }

  function threeDigits(n: number): string {
    if (n >= 100) {
      return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + twoDigits(n % 100) : "");
    }
    return twoDigits(n);
  }

  const parts: string[] = [];
  let remaining = Math.abs(num);

  // Indian numbering: Crore, Lakh, Thousand, Hundred
  if (remaining >= 10000000) {
    parts.push(threeDigits(Math.floor(remaining / 10000000)) + " Crore");
    remaining %= 10000000;
  }
  if (remaining >= 100000) {
    parts.push(twoDigits(Math.floor(remaining / 100000)) + " Lakh");
    remaining %= 100000;
  }
  if (remaining >= 1000) {
    parts.push(twoDigits(Math.floor(remaining / 1000)) + " Thousand");
    remaining %= 1000;
  }
  if (remaining > 0) {
    parts.push(threeDigits(remaining));
  }

  const result = parts.join(" ");
  return num < 0 ? "Minus " + result : result;
}
