"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

export default function CustomerRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Registration failed");
        return;
      }

      const result = await signIn("credentials", {
        email: form.email,
        password: form.password,
        accountType: "customer",
        redirect: false,
      });

      if (result?.error) {
        toast.success("Account created — please sign in");
        router.push("/account/login");
        return;
      }

      toast.success("Welcome to Evaan Jewels!");
      router.push("/account");
      router.refresh();
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="py-12 md:py-16">
      <div className="mx-auto max-w-md px-4">
        <div className="text-center">
          <h1 className="font-heading text-2xl font-bold text-charcoal-700 sm:text-3xl">
            Create account
          </h1>
          <p className="mt-2 text-sm text-charcoal-400">
            Track orders and get email receipts
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4 rounded-xl border border-charcoal-100 bg-white p-6 shadow-card sm:p-8"
        >
          <div>
            <label className="block text-sm font-medium text-charcoal-600">
              Full name
            </label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              autoComplete="name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-600">
              Email
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-600">
              Phone
            </label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) =>
                setForm({
                  ...form,
                  phone: e.target.value.replace(/\D/g, "").slice(0, 10),
                })
              }
              maxLength={10}
              className="mt-1 w-full rounded-lg border border-charcoal-200 px-4 py-2.5 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
              placeholder="10-digit mobile"
              autoComplete="tel"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-charcoal-600">
              Password
            </label>
            <div className="relative mt-1">
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border border-charcoal-200 px-4 py-2.5 pr-10 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-300"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-2 w-full rounded-lg bg-gold-500 px-6 py-3 text-sm font-semibold text-white hover:bg-gold-600 disabled:opacity-60"
          >
            {isLoading ? "Creating..." : "Create account"}
          </button>

          <p className="text-center text-sm text-charcoal-400">
            Already have an account?{" "}
            <Link
              href="/account/login"
              className="font-medium text-gold-600 hover:underline"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
