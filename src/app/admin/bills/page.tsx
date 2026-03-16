"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Download,
  Trash2,
  Receipt,
  Calendar,
  User,
  Phone,
  FileSpreadsheet,
  ChevronDown,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { SearchBar } from "@/components/ui/SearchBar";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { formatDate } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { ITEMS_PER_PAGE } from "@/constants";

interface BillItem {
  _id: string;
  billNumber: string;
  customer: {
    name: string;
    phone: string;
    email?: string;
  };
  productSnapshot: {
    name: string;
    productCode: string;
    thumbnailImage?: string;
  };
  finalAmount: number;
  paymentMode: string;
  discount?: { type: string; value: number; amount: number };
  createdAt: string;
}

const paymentBadgeVariant: Record<string, "gold" | "info" | "success" | "rose"> = {
  cash: "success",
  card: "info",
  upi: "rose",
  bank_transfer: "gold",
};

const paymentLabels: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  upi: "UPI",
  bank_transfer: "Bank Transfer",
};

export default function BillsListPage() {
  const [bills, setBills] = useState<BillItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<BillItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchBills = useCallback(async (retries = 3) => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          page: String(page),
          limit: String(ITEMS_PER_PAGE),
          _t: String(Date.now()),
        });
        if (search) params.set("search", search);
        if (dateFrom) params.set("from", dateFrom);
        if (dateTo) params.set("to", dateTo);

        const res = await fetch(`/api/bills?${params}`, { cache: "no-store" });
        const data = await res.json();
        if (data.success) {
          setBills(data.data);
          setTotalPages(data.pagination.totalPages);
          setTotal(data.pagination.total);
          setIsLoading(false);
          return;
        }
      } catch {
        if (attempt === retries - 1) toast.error("Failed to load bills");
      }
      if (attempt < retries - 1) await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
    setIsLoading(false);
  }, [page, search, dateFrom, dateTo]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  useEffect(() => {
    setPage(1);
  }, [search, dateFrom, dateTo]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    // Optimistic removal
    const previousBills = [...bills];
    setBills((prev) => prev.filter((b) => b._id !== deleteTarget._id));
    setTotal((prev) => Math.max(0, prev - 1));

    try {
      const res = await fetch(`/api/bills/${deleteTarget._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Bill deleted");
      } else {
        // Revert on failure
        setBills(previousBills);
        setTotal((prev) => prev + 1);
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      // Revert on error
      setBills(previousBills);
      setTotal((prev) => prev + 1);
      toast.error("Failed to delete bill");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleExport = async (mode: "all" | "monthly" | "quarterly" | "custom") => {
    setIsExporting(true);
    setShowExportMenu(false);
    try {
      const params = new URLSearchParams();
      if (mode === "monthly") params.set("period", "monthly");
      else if (mode === "quarterly") params.set("period", "quarterly");
      else if (mode === "custom") {
        if (dateFrom) params.set("from", dateFrom);
        if (dateTo) params.set("to", dateTo);
      }
      const url = `/api/bills/export?${params}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      const disposition = res.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      a.download = filenameMatch ? filenameMatch[1] : "Bills-Export.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      toast.success("Bills exported successfully");
    } catch {
      toast.error("Failed to export bills");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Bills" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-charcoal-700">
            Bills
          </h1>
          <p className="text-sm text-charcoal-400 mt-1">
            {total} {total === 1 ? "bill" : "bills"} generated
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Button
              variant="outline"
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={isExporting}
            >
              <FileSpreadsheet size={18} />
              {isExporting ? "Exporting..." : "Export Excel"}
              <ChevronDown size={14} />
            </Button>
            {showExportMenu && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white border border-charcoal-200 rounded-xl shadow-lg z-50 py-1">
                <button
                  onClick={() => handleExport("all")}
                  className="w-full text-left px-4 py-2.5 text-sm text-charcoal-700 hover:bg-charcoal-50 transition-colors"
                >
                  All Bills
                </button>
                <button
                  onClick={() => handleExport("monthly")}
                  className="w-full text-left px-4 py-2.5 text-sm text-charcoal-700 hover:bg-charcoal-50 transition-colors"
                >
                  This Month
                </button>
                <button
                  onClick={() => handleExport("quarterly")}
                  className="w-full text-left px-4 py-2.5 text-sm text-charcoal-700 hover:bg-charcoal-50 transition-colors"
                >
                  This Quarter
                </button>
                {(dateFrom || dateTo) && (
                  <button
                    onClick={() => handleExport("custom")}
                    className="w-full text-left px-4 py-2.5 text-sm text-charcoal-700 hover:bg-charcoal-50 transition-colors border-t border-charcoal-100"
                  >
                    Custom Range ({dateFrom || "Start"} to {dateTo || "Present"})
                  </button>
                )}
              </div>
            )}
          </div>
          <Link href="/admin/bills/new">
            <Button variant="primary">
              <Plus size={18} />
              Generate Bill
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by bill number, name, or phone..."
          />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Calendar
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400 pointer-events-none"
            />
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-10 pl-8 pr-3 rounded-xl border border-charcoal-200 bg-white text-sm text-charcoal-600 focus:outline-none focus:ring-2 focus:ring-gold-500"
              title="From date"
            />
          </div>
          <div className="relative">
            <Calendar
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-charcoal-400 pointer-events-none"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-10 pl-8 pr-3 rounded-xl border border-charcoal-200 bg-white text-sm text-charcoal-600 focus:outline-none focus:ring-2 focus:ring-gold-500"
              title="To date"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <div className="flex items-center gap-4 p-4">
                <Skeleton className="h-12 w-12 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </Card>
          ))}
        </div>
      ) : bills.length === 0 ? (
        <EmptyState
          icon={search || dateFrom || dateTo ? Search : Receipt}
          title={
            search || dateFrom || dateTo
              ? "No bills match your filters"
              : "No bills generated yet"
          }
          description={
            search || dateFrom || dateTo
              ? "Try adjusting your search or date range"
              : "Generate your first bill to get started"
          }
          action={
            !search && !dateFrom && !dateTo ? (
              <Link href="/admin/bills/new">
                <Button variant="primary">
                  <Plus size={18} />
                  Generate Bill
                </Button>
              </Link>
            ) : undefined
          }
        />
      ) : (
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="space-y-3"
        >
          {bills.map((bill) => (
            <motion.div key={bill._id} variants={staggerItem}>
              <Card hover>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
                  {/* Bill info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="h-12 w-12 rounded-lg bg-gold-50 flex items-center justify-center shrink-0">
                      <Receipt size={20} className="text-gold-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-mono font-semibold text-charcoal-700">
                          {bill.billNumber}
                        </h3>
                        <Badge
                          variant={paymentBadgeVariant[bill.paymentMode] || "default"}
                          size="sm"
                        >
                          {paymentLabels[bill.paymentMode] || bill.paymentMode}
                        </Badge>
                        {bill.discount && bill.discount.amount > 0 && (
                          <Badge variant="success" size="sm">
                            Discount
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-charcoal-500 truncate mt-0.5">
                        {bill.productSnapshot.name} ({bill.productSnapshot.productCode})
                      </p>
                    </div>
                  </div>

                  {/* Customer */}
                  <div className="flex items-center gap-4 sm:w-48 shrink-0">
                    <div>
                      <p className="text-sm font-medium text-charcoal-600 flex items-center gap-1">
                        <User size={12} />
                        {bill.customer.name}
                      </p>
                      <p className="text-xs text-charcoal-400 flex items-center gap-1">
                        <Phone size={10} />
                        {bill.customer.phone}
                      </p>
                    </div>
                  </div>

                  {/* Amount & Date */}
                  <div className="text-right shrink-0">
                    <PriceDisplay amount={bill.finalAmount} />
                    <p className="text-xs text-charcoal-400 mt-0.5">
                      {formatDate(bill.createdAt)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <a
                      href={`/api/bills/${bill._id}/pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="ghost" size="icon" title="Download PDF">
                        <Download size={16} />
                      </Button>
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(bill)}
                      className="text-charcoal-400 hover:text-error"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="text-sm text-charcoal-500">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Bill"
        description={`Are you sure you want to delete bill "${deleteTarget?.billNumber}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
