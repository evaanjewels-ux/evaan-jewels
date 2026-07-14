"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { toast } from "sonner";

export default function CustomerLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/account";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        accountType: "customer",
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid email or password");
        return;
      }

      toast.success("Welcome back!");
      router.push(callbackUrl);
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
            Sign in
          </h1>
          <p className="mt-2 text-sm text-charcoal-400">
            Access your orders and saved details
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 rounded-xl border border-charcoal-100 bg-white p-6 shadow-card sm:p-8"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal-600">
                Email
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-300" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-charcoal-200 py-2.5 pl-10 pr-4 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  placeholder="you@email.com"
                  autoComplete="email"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-charcoal-600">
                Password
              </label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-charcoal-300" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-charcoal-200 py-2.5 pl-10 pr-10 text-sm focus:border-gold-500 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                  placeholder="Your password"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-300 hover:text-charcoal-500"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 w-full rounded-lg bg-gold-500 px-6 py-3 text-sm font-semibold text-white hover:bg-gold-600 disabled:opacity-60"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </button>

          <p className="mt-4 text-center text-sm text-charcoal-400">
            New here?{" "}
            <Link
              href="/account/register"
              className="font-medium text-gold-600 hover:underline"
            >
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
