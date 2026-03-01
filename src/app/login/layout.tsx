import { Suspense } from "react";

export const metadata = {
  title: "Admin Login",
  description: "Sign in to Evaan Jewels Admin Panel",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense>{children}</Suspense>;
}
