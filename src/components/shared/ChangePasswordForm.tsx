"use client";

import { useState } from "react";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface ChangePasswordFormProps {
  className?: string;
  /** Optional: slightly different chrome for admin vs storefront */
  variant?: "website" | "admin";
}

export function ChangePasswordForm({
  className,
  variant = "website",
}: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [show, setShow] = useState({ current: false, next: false, confirm: false });
  const [saving, setSaving] = useState(false);

  const inputClass =
    variant === "admin"
      ? "mt-1 w-full rounded-lg border border-charcoal-200 px-3 py-2 text-sm text-charcoal-700 placeholder:text-charcoal-300 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
      : "mt-1 w-full rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm text-charcoal-700 placeholder:text-charcoal-300 focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Failed to update password");
        return;
      }
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      toast.error("Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("space-y-4", className)}>
      <div className="flex items-center gap-2 text-base font-semibold text-charcoal-700">
        <KeyRound className="h-4 w-4 text-gold-600" />
        Change password
      </div>

      {(
        [
          {
            key: "current" as const,
            label: "Current password",
            value: currentPassword,
            set: setCurrentPassword,
            show: show.current,
            toggle: () => setShow((s) => ({ ...s, current: !s.current })),
          },
          {
            key: "next" as const,
            label: "New password",
            value: newPassword,
            set: setNewPassword,
            show: show.next,
            toggle: () => setShow((s) => ({ ...s, next: !s.next })),
          },
          {
            key: "confirm" as const,
            label: "Confirm new password",
            value: confirmPassword,
            set: setConfirmPassword,
            show: show.confirm,
            toggle: () => setShow((s) => ({ ...s, confirm: !s.confirm })),
          },
        ] as const
      ).map((field) => (
        <div key={field.key}>
          <label className="block text-sm font-medium text-charcoal-600">
            {field.label}
          </label>
          <div className="relative">
            <input
              type={field.show ? "text" : "password"}
              value={field.value}
              onChange={(e) => field.set(e.target.value)}
              required
              autoComplete={
                field.key === "current" ? "current-password" : "new-password"
              }
              className={cn(inputClass, "pr-10")}
            />
            <button
              type="button"
              onClick={field.toggle}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-charcoal-400 hover:text-charcoal-600"
              aria-label={field.show ? "Hide password" : "Show password"}
            >
              {field.show ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      ))}

      <Button type="submit" isLoading={saving} disabled={saving} size="sm">
        Update password
      </Button>
    </form>
  );
}
