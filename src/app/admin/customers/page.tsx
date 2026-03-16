"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Plus,
  Search,
  Trash2,
  Users,
  Phone,
  IndianRupee,
  Edit,
  Eye,
  AlertTriangle,
  Filter,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SearchBar } from "@/components/ui/SearchBar";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { formatCurrency } from "@/lib/utils";
import { staggerContainer, staggerItem } from "@/lib/animations";
import { ITEMS_PER_PAGE } from "@/constants";

interface CustomerItem {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  totalDebt: number;
  totalPurchases: number;
  totalPaid: number;
  billCount: number;
  isActive: boolean;
  createdAt: string;
}

export default function CustomersListPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debtFilter, setDebtFilter] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<CustomerItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fetchCustomers = useCallback(async (retries = 3) => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        setIsLoading(true);
        const params = new URLSearchParams({
          page: String(page),
          limit: String(ITEMS_PER_PAGE),
          _t: String(Date.now()),
        });
        if (search) params.set("search", search);
        if (debtFilter) params.set("hasDebt", "true");

        const res = await fetch(`/api/customers?${params}`, { cache: "no-store" });
        const data = await res.json();
        if (data.success) {
          setCustomers(data.data);
          setTotalPages(data.pagination.totalPages);
          setTotal(data.pagination.total);
          setIsLoading(false);
          return;
        }
      } catch {
        if (attempt === retries - 1) toast.error("Failed to load customers");
      }
      if (attempt < retries - 1) await new Promise((r) => setTimeout(r, 600 * (attempt + 1)));
    }
    setIsLoading(false);
  }, [page, search, debtFilter]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    setPage(1);
  }, [search, debtFilter]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);

    const previousCustomers = [...customers];
    setCustomers((prev) => prev.filter((c) => c._id !== deleteTarget._id));
    setTotal((prev) => Math.max(0, prev - 1));

    try {
      const res = await fetch(`/api/customers/${deleteTarget._id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Customer deleted");
      } else {
        setCustomers(previousCustomers);
        setTotal((prev) => prev + 1);
        toast.error(data.error || "Failed to delete");
      }
    } catch {
      setCustomers(previousCustomers);
      setTotal((prev) => prev + 1);
      toast.error("Failed to delete customer");
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleExportDebts = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/customers/export-debts");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      const disposition = res.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="(.+)"/);
      a.download = filenameMatch ? filenameMatch[1] : "Customer-Debts.xlsx";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      toast.success("Debts exported successfully");
    } catch {
      toast.error("Failed to export debts");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Customers" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-bold text-charcoal-700">
            Customers
          </h1>
          <p className="text-sm text-charcoal-400 mt-1">
            {total} {total === 1 ? "customer" : "customers"} registered
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            variant="outline"
            onClick={handleExportDebts}
            disabled={isExporting}
          >
            <FileSpreadsheet size={18} />
            {isExporting ? "Exporting..." : "Export Debts"}
          </Button>
          <Link href="/admin/customers/new">
            <Button variant="primary">
              <Plus size={18} />
              Add Customer
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
            placeholder="Search by name, phone, or email..."
          />
        </div>
        <Button
          variant={debtFilter ? "primary" : "outline"}
          size="sm"
          onClick={() => setDebtFilter(!debtFilter)}
          className="shrink-0"
        >
          <Filter size={14} />
          {debtFilter ? "Showing Debtors" : "Filter Debtors"}
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <div className="flex items-center gap-4 p-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            </Card>
          ))}
        </div>
      ) : customers.length === 0 ? (
        <EmptyState
          icon={search || debtFilter ? Search : Users}
          title={
            search || debtFilter
              ? "No customers match your filters"
              : "No customers yet"
          }
          description={
            search || debtFilter
              ? "Try adjusting your search or filters"
              : "Add your first customer to get started"
          }
          action={
            !search && !debtFilter ? (
              <Link href="/admin/customers/new">
                <Button variant="primary">
                  <Plus size={18} />
                  Add Customer
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
          {customers.map((customer) => (
            <motion.div key={customer._id} variants={staggerItem}>
              <Card hover>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
                  {/* Customer avatar & info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="h-12 w-12 rounded-full bg-gold-50 flex items-center justify-center shrink-0">
                      <Users size={20} className="text-gold-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-charcoal-700 truncate">
                          {customer.name}
                        </h3>
                        {customer.totalDebt > 0 && (
                          <Badge variant="rose" size="sm">
                            <AlertTriangle size={10} className="mr-0.5" />
                            Debt
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-charcoal-400 flex items-center gap-1">
                        <Phone size={12} />
                        {customer.phone}
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 sm:gap-8 shrink-0">
                    <div className="text-center">
                      <p className="text-xs text-charcoal-400">Bills</p>
                      <p className="text-sm font-bold text-charcoal-700">
                        {customer.billCount}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-charcoal-400">Purchases</p>
                      <p className="text-sm font-bold text-charcoal-700">
                        {formatCurrency(customer.totalPurchases)}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-charcoal-400">Debt</p>
                      <p
                        className={`text-sm font-bold ${
                          customer.totalDebt > 0
                            ? "text-red-600"
                            : "text-green-600"
                        }`}
                      >
                        {customer.totalDebt > 0 ? (
                          <span className="flex items-center gap-0.5">
                            <IndianRupee size={12} />
                            {formatCurrency(customer.totalDebt)}
                          </span>
                        ) : (
                          "Clear"
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Link href={`/admin/customers/${customer._id}`}>
                      <Button variant="ghost" size="icon" title="View Details">
                        <Eye size={16} />
                      </Button>
                    </Link>
                    <Link href={`/admin/customers/${customer._id}/edit`}>
                      <Button variant="ghost" size="icon" title="Edit">
                        <Edit size={16} />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(customer)}
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
        title="Delete Customer"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? Their bills will remain but won't be linked to this customer anymore.`}
        confirmLabel="Delete"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
