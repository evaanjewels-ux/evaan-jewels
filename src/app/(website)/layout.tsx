import { Header } from "@/components/website/Header";
import { Footer } from "@/components/website/Footer";
import { MobileBottomNav } from "@/components/website/MobileBottomNav";
import { CartDrawer } from "@/components/website/CartDrawer";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { CartProvider } from "@/components/providers/CartProvider";
import { Toaster } from "sonner";

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <CartProvider>
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <MobileBottomNav />
          <CartDrawer />
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              style: { fontFamily: "var(--font-body)" },
            }}
          />
        </div>
      </CartProvider>
    </LanguageProvider>
  );
}
