import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Bill from "@/models/Bill";
import Product from "@/models/Product";
import Customer from "@/models/Customer";
import { getNextSequence } from "@/models/Counter";
import { billCreateSchema } from "@/lib/validators/bill";
import { generateBillNumber } from "@/lib/utils";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

// GET /api/bills — List all bills with search and pagination
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    const skip = (page - 1) * limit;

    // Build filter
    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { billNumber: { $regex: search, $options: "i" } },
        { "customer.name": { $regex: search, $options: "i" } },
        { "customer.phone": { $regex: search, $options: "i" } },
      ];
    }

    if (from || to) {
      filter.createdAt = {};
      if (from) (filter.createdAt as Record<string, Date>).$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        (filter.createdAt as Record<string, Date>).$lte = toDate;
      }
    }

    const [bills, total] = await Promise.all([
      Bill.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Bill.countDocuments(filter),
    ]);

    return NextResponse.json({
      success: true,
      data: bills,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("GET /api/bills error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch bills" },
      { status: 500 }
    );
  }
}

// POST /api/bills — Create a new bill
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = billCreateSchema.parse(body);

    /** Build a denormalised product snapshot for a lean product document */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const buildSnapshot = (p: any) => ({
      _id: p._id,
      name: p.name,
      productCode: p.productCode,
      description: p.description,
      category: p.category,
      gender: p.gender,
      metalComposition: p.metalComposition,
      gemstoneComposition: p.gemstoneComposition,
      makingCharges: p.makingCharges,
      wastageCharges: p.wastageCharges,
      gstPercentage: p.gstPercentage,
      otherCharges: p.otherCharges,
      metalTotal: p.metalTotal,
      gemstoneTotal: p.gemstoneTotal,
      makingChargeAmount: p.makingChargeAmount,
      wastageChargeAmount: p.wastageChargeAmount,
      otherChargesTotal: p.otherChargesTotal,
      subtotal: p.subtotal,
      gstAmount: p.gstAmount,
      totalPrice: p.totalPrice,
      images: p.images,
      thumbnailImage: p.thumbnailImage,
    });

    // ── Resolve items ──────────────────────────────────────────────────────
    // New multi-item flow: validatedData.items[]
    // Legacy single-product flow: validatedData.product
    let resolvedItems: Array<{
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      product: any;
      quantity: number;
      productSnapshot: Record<string, unknown>;
    }> = [];

    if (validatedData.items && validatedData.items.length > 0) {
      // Fetch all products in parallel
      const products = await Promise.all(
        validatedData.items.map(async (item) => {
          const p = await Product.findById(item.product)
            .populate("category", "name slug")
            .populate("metalComposition.metal", "name")
            .populate("gemstoneComposition.gemstone", "name")
            .lean();
          if (!p) throw new Error(`Product ${item.product} not found`);
          return { product: p, quantity: item.quantity, selectedSize: item.selectedSize, selectedColor: item.selectedColor };
        })
      );
      resolvedItems = products.map(({ product: p, quantity, selectedSize, selectedColor }) => ({
        product: p._id,
        quantity,
        selectedSize,
        selectedColor,
        productSnapshot: { ...buildSnapshot(p), selectedSize, selectedColor },
      }));
    } else if (validatedData.product) {
      // Legacy single-product
      const p = await Product.findById(validatedData.product)
        .populate("category", "name slug")
        .populate("metalComposition.metal", "name")
        .populate("gemstoneComposition.gemstone", "name")
        .lean();
      if (!p) {
        return NextResponse.json(
          { success: false, error: "Product not found" },
          { status: 404 }
        );
      }
      resolvedItems = [{ product: p._id, quantity: 1, productSnapshot: buildSnapshot(p) }];
    }

    if (resolvedItems.length === 0) {
      return NextResponse.json(
        { success: false, error: "No valid products provided" },
        { status: 400 }
      );
    }

    // Generate bill number
    const year = new Date().getFullYear();
    const seq = await getNextSequence("bill", "AJ", year);
    const billNumber = generateBillNumber(year, seq);

    // Use the first item's snapshot as top-level productSnapshot (backward compat)
    const primarySnapshot = resolvedItems[0].productSnapshot;

    // Determine amount paid (default: full payment)
    const amountPaid =
      validatedData.amountPaid !== undefined
        ? validatedData.amountPaid
        : validatedData.finalAmount;
    const unpaidAmount = Math.max(0, validatedData.finalAmount - amountPaid);

    // Calculate discount against total (client already calculated, but re-validate)
    const bill = await Bill.create({
      billNumber,
      product: resolvedItems[0].product,
      customer: validatedData.customer,
      customerRef: validatedData.customerRef || undefined,
      productSnapshot: primarySnapshot,
      items: resolvedItems,
      discount: validatedData.discount,
      finalAmount: validatedData.finalAmount,
      amountPaid,
      paymentMode: validatedData.paymentMode,
      notes: validatedData.notes,
      generatedBy: session.user.id,
    });

    // ── Customer debt management ───────────────────────────────────────────
    // If a customerRef is provided, update the existing customer's debt
    // If not, try to find by phone or create a new customer record
    let customerRecord = null;

    if (validatedData.customerRef) {
      customerRecord = await Customer.findById(validatedData.customerRef);
    }

    if (!customerRecord && validatedData.customer.phone) {
      customerRecord = await Customer.findOne({
        phone: validatedData.customer.phone,
      });
    }

    if (customerRecord) {
      // Update existing customer
      const debtBefore = customerRecord.totalDebt;
      const debtAfter = debtBefore + unpaidAmount;

      customerRecord.totalDebt = debtAfter;
      customerRecord.totalPurchases += validatedData.finalAmount;
      customerRecord.totalPaid += amountPaid;
      customerRecord.billCount += 1;

      // Update basic info if changed
      customerRecord.name = validatedData.customer.name;
      if (validatedData.customer.email)
        customerRecord.email = validatedData.customer.email;
      if (validatedData.customer.address)
        customerRecord.address = validatedData.customer.address;

      customerRecord.paymentHistory.push({
        bill: bill._id,
        billNumber,
        billAmount: validatedData.finalAmount,
        amountPaid,
        debtAdded: unpaidAmount,
        debtBefore,
        debtAfter,
        note:
          amountPaid >= validatedData.finalAmount
            ? "Full payment"
            : amountPaid > 0
            ? `Partial payment — ₹${unpaidAmount} added to debt`
            : `No payment — ₹${unpaidAmount} added to debt`,
        date: new Date(),
      });

      await customerRecord.save();

      // Link bill to customer
      bill.customerRef = customerRecord._id;
      await bill.save();
    } else {
      // Create a new customer record automatically
      const newCustomer = await Customer.create({
        name: validatedData.customer.name,
        phone: validatedData.customer.phone,
        email: validatedData.customer.email || "",
        address: validatedData.customer.address || "",
        totalDebt: unpaidAmount,
        totalPurchases: validatedData.finalAmount,
        totalPaid: amountPaid,
        billCount: 1,
        paymentHistory: [
          {
            bill: bill._id,
            billNumber,
            billAmount: validatedData.finalAmount,
            amountPaid,
            debtAdded: unpaidAmount,
            debtBefore: 0,
            debtAfter: unpaidAmount,
            note:
              amountPaid >= validatedData.finalAmount
                ? "Full payment — new customer"
                : amountPaid > 0
                ? `Partial payment — ₹${unpaidAmount} debt`
                : `No payment — ₹${unpaidAmount} debt`,
            date: new Date(),
          },
        ],
      });

      bill.customerRef = newCustomer._id;
      await bill.save();
    }

    return NextResponse.json(
      {
        success: true,
        data: bill,
        message: `Bill ${billNumber} created successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { success: false, error: "Validation failed", details: error },
        { status: 400 }
      );
    }
    console.error("POST /api/bills error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create bill" },
      { status: 500 }
    );
  }
}
