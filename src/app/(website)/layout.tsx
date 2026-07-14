import { Header } from "@/components/website/Header";
import { Footer } from "@/components/website/Footer";
import { MobileBottomNav } from "@/components/website/MobileBottomNav";
import { ScrollToTop } from "@/components/website/ScrollToTop";
import { CartDrawer } from "@/components/website/CartDrawer";
import { LanguageProvider } from "@/components/providers/LanguageProvider";
import { WishlistProvider } from "@/components/providers/WishlistProvider";
import { RecentlyViewedProvider } from "@/components/providers/RecentlyViewedProvider";
import { CartProvider } from "@/components/providers/CartProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { Toaster } from "sonner";

export default function WebsiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <RecentlyViewedProvider>
              <div className="flex min-h-screen flex-col">
                <ScrollToTop />
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
            </RecentlyViewedProvider>
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}
