"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { APP_NAME } from "@/constants";
import { cn } from "@/lib/utils";
import { fadeUp } from "@/lib/animations";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-charcoal-50 px-4">
      {/* Decorative background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-150 h-150 bg-gold-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-100 h-100 bg-gold-500/3 rounded-full blur-3xl" />
      </div>

      <motion.div
        {...fadeUp}
        className="w-full max-w-sm"
      >
        {/* Logo and heading */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-500/10 mb-5">
            <Lock className="w-7 h-7 text-gold-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-heading font-bold text-charcoal-700 mb-2">
            Welcome Back
          </h1>
          <p className="text-charcoal-400 text-sm">
            Sign in to {APP_NAME} Admin Panel
          </p>
        </div>

        {/* Login form card */}
        <div className="bg-white rounded-2xl shadow-card p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 rounded-lg bg-error/10 border border-error/20 text-error text-sm px-4 py-3"
                role="alert"
              >
                <span>{error}</span>
              </motion.div>
            )}

            {/* Email field */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-charcoal-600"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-300 pointer-events-none"
                  size={18}
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@evaanjewels.com"
                  required
                  autoComplete="email"
                  className={cn(
                    "w-full h-12 pl-11 pr-4 rounded-lg border border-charcoal-200 bg-white text-charcoal-700 placeholder:text-charcoal-300",
                    "text-base transition-colors duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  )}
                />
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-charcoal-600"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-300 pointer-events-none"
                  size={18}
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className={cn(
                    "w-full h-12 pl-11 pr-12 rounded-lg border border-charcoal-200 bg-white text-charcoal-700 placeholder:text-charcoal-300",
                    "text-base transition-colors duration-200",
                    "focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-gold-500"
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-600 transition-colors p-1"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>
        </div>

        {/* Footer text */}
        <p className="text-center text-xs text-charcoal-300 mt-6">
          {APP_NAME} · Admin Portal
        </p>
      </motion.div>
    </div>
  );
}
