import type { Metadata } from "next";
import BillForm from "@/components/admin/BillForm";

export const metadata: Metadata = {
  title: "Generate Bill | Evaan Jewels",
  description: "Generate a new bill for a product sale",
};

export default function NewBillPage() {
  return <BillForm />;
}
