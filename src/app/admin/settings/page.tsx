"use client";

import { ChangePasswordForm } from "@/components/shared/ChangePasswordForm";
import { Card } from "@/components/ui/Card";
import { Breadcrumb } from "@/components/shared/Breadcrumb";
import { useSession } from "next-auth/react";

export default function AdminSettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/admin/dashboard" },
          { label: "Settings" },
        ]}
      />

      <div>
        <h1 className="text-xl font-bold text-charcoal-700">Settings</h1>
        <p className="mt-1 text-sm text-charcoal-400">
          {session?.user?.name} · {session?.user?.email}
        </p>
      </div>

      <Card className="max-w-md p-5">
        <ChangePasswordForm variant="admin" />
      </Card>
    </div>
  );
}
