"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

type Language = "en" | "hi";

// Translation dictionary
const translations: Record<string, Record<Language, string>> = {
  // Navigation
  "nav.home": { en: "Home", hi: "होम" },
  "nav.categories": { en: "Categories", hi: "श्रेणियाँ" },
  "nav.newArrivals": { en: "New Arrivals", hi: "नई कलेक्शन" },
  "nav.trackOrder": { en: "Track Order", hi: "ऑर्डर ट्रैक करें" },
  "nav.about": { en: "About", hi: "हमारे बारे में" },
  "nav.contact": { en: "Contact", hi: "संपर्क" },
  "nav.enquireNow": { en: "Enquire Now", hi: "पूछताछ करें" },
  "nav.callUs": { en: "Call Us", hi: "कॉल करें" },
  "nav.enquireWhatsApp": { en: "Enquire on WhatsApp", hi: "WhatsApp पर पूछें" },

  // Hero Section
  "hero.badge": { en: "BIS Hallmark Certified Jewelry", hi: "BIS हॉलमार्क प्रमाणित आभूषण" },
  "hero.heading1": { en: "Where", hi: "जहाँ" },
  "hero.heading2": { en: "Elegance", hi: "सुंदरता" },
  "hero.heading3": { en: "Meets Tradition", hi: "मिलती है परंपरा से" },
  "hero.subheading": {
    en: "Discover handcrafted gold, diamond & precious gemstone jewelry — each piece a masterwork of artistry passed down through generations.",
    hi: "हाथ से बने सोने, हीरे और कीमती रत्नों के आभूषण खोजें — हर टुकड़ा पीढ़ियों से चली आ रही कलाकृति।",
  },
  "hero.explore": { en: "Explore Collection", hi: "कलेक्शन देखें" },
  "hero.visitStore": { en: "Visit Our Store", hi: "हमारी दुकान पर आएं" },
  "hero.yearsTrust": { en: "Years of Trust", hi: "वर्षों का भरोसा" },
  "hero.hallmarkCertified": { en: "Hallmark Certified", hi: "हॉलमार्क प्रमाणित" },
  "hero.pureGold": { en: "22K Pure Gold", hi: "22K शुद्ध सोना" },

  // Price Ticker
  "ticker.liveRates": { en: "Live Rates", hi: "लाइव भाव" },

  // Category Section
  "section.categories": { en: "Shop by Category", hi: "श्रेणी के अनुसार खरीदें" },
  "section.categoriesSubtitle": { en: "Browse our curated collections", hi: "हमारे चुनिंदा संग्रह देखें" },
  "section.viewAll": { en: "View All", hi: "सभी देखें" },

  // Product Section
  "section.newArrivals": { en: "New Arrivals", hi: "नई कलेक्शन" },
  "section.newArrivalsSubtitle": { en: "The latest additions to our collection", hi: "हमारे संग्रह में नवीनतम" },
  "section.featured": { en: "Featured Collection", hi: "विशेष संग्रह" },
  "section.featuredSubtitle": { en: "Handpicked pieces from our finest selection", hi: "हमारे बेहतरीन चयन से चुने हुए" },
  "section.viewAllNew": { en: "View All New Arrivals", hi: "सभी नई कलेक्शन देखें" },
  "section.viewFeatured": { en: "View Featured", hi: "विशेष संग्रह देखें" },

  // Trust Badges
  "trust.hallmark": { en: "BIS Hallmark", hi: "BIS हॉलमार्क" },
  "trust.hallmarkDesc": { en: "Every piece is BIS certified", hi: "हर आभूषण BIS प्रमाणित" },
  "trust.purity": { en: "100% Purity", hi: "100% शुद्धता" },
  "trust.purityDesc": { en: "Guaranteed purity", hi: "गारंटीकृत शुद्धता" },
  "trust.craftsmen": { en: "Master Craftsmen", hi: "कुशल कारीगर" },
  "trust.craftsmenDesc": { en: "20+ years expertise", hi: "20+ वर्षों का अनुभव" },
  "trust.exchange": { en: "Easy Exchange", hi: "आसान विनिमय" },
  "trust.exchangeDesc": { en: "Hassle-free exchange policy", hi: "परेशानी-मुक्त विनिमय नीति" },

  // About Section
  "about.title": { en: "About Evaan Jewels", hi: "इवान ज्वेल्स के बारे में" },
  "about.p1": {
    en: "For over two decades, Evaan Jewels has been crafting exquisite jewelry that celebrates life's most precious moments. Every piece in our collection is BIS Hallmark certified, ensuring the highest standards of purity and craftsmanship.",
    hi: "दो दशकों से अधिक समय से, इवान ज्वेल्स जीवन के सबसे कीमती पलों को मनाने वाले बेहतरीन आभूषण बना रहा है। हमारे संग्रह का हर आभूषण BIS हॉलमार्क प्रमाणित है।",
  },
  "about.p2": {
    en: "From timeless gold bangles to stunning diamond rings, our master artisans blend traditional techniques with contemporary design to create jewelry that tells your unique story.",
    hi: "क्लासिक सोने की चूड़ियों से लेकर शानदार हीरे की अंगूठियों तक, हमारे कारीगर पारंपरिक तकनीकों को आधुनिक डिजाइन के साथ मिलाकर आपकी अनूठी कहानी बताने वाले आभूषण बनाते हैं।",
  },

  // Footer
  "footer.shop": { en: "Shop", hi: "खरीदें" },
  "footer.company": { en: "Company", hi: "कंपनी" },
  "footer.getInTouch": { en: "Get In Touch", hi: "संपर्क करें" },
  "footer.allCategories": { en: "All Categories", hi: "सभी श्रेणियाँ" },
  "footer.aboutUs": { en: "About Us", hi: "हमारे बारे में" },
  "footer.privacyPolicy": { en: "Privacy Policy", hi: "गोपनीयता नीति" },
  "footer.terms": { en: "Terms & Conditions", hi: "नियम और शर्तें" },
  "footer.allRights": { en: "All rights reserved.", hi: "सर्वाधिकार सुरक्षित।" },
  "footer.madeInIndia": { en: "Crafted with love in India", hi: "भारत में प्रेम से निर्मित" },
  "footer.timing": { en: "Mon–Sat: 10 AM – 8 PM", hi: "सोम–शनि: सुबह 10 – शाम 8" },

  // Product Details
  "product.addToWishlist": { en: "Add to Wishlist", hi: "विशलिस्ट में जोड़ें" },
  "product.outOfStock": { en: "Out of Stock", hi: "स्टॉक में नहीं" },
  "product.newArrival": { en: "New Arrival", hi: "नई कलेक्शन" },
  "product.featured": { en: "Featured", hi: "विशेष" },
  "product.enquireNow": { en: "Enquire Now", hi: "पूछताछ करें" },
  "product.priceBreakdown": { en: "Price Breakdown", hi: "मूल्य विवरण" },
  "product.metalComposition": { en: "Metal Composition", hi: "धातु संरचना" },
  "product.gemstoneComposition": { en: "Gemstone Composition", hi: "रत्न संरचना" },
  "product.makingCharges": { en: "Making Charges", hi: "बनाने का शुल्क" },
  "product.wastageCharges": { en: "Wastage Charges", hi: "वेस्टेज शुल्क" },
  "product.subtotal": { en: "Subtotal", hi: "उप-योग" },
  "product.gst": { en: "GST", hi: "GST" },
  "product.totalPrice": { en: "Total Price", hi: "कुल मूल्य" },

  // Contact
  "contact.title": { en: "Get In Touch", hi: "संपर्क करें" },
  "contact.subtitle": { en: "Have a question? We'd love to hear from you.", hi: "कोई सवाल है? हम आपसे सुनना चाहेंगे।" },
  "contact.name": { en: "Your Name", hi: "आपका नाम" },
  "contact.email": { en: "Email Address", hi: "ईमेल पता" },
  "contact.phone": { en: "Phone Number", hi: "फ़ोन नंबर" },
  "contact.message": { en: "Message", hi: "संदेश" },
  "contact.send": { en: "Send Message", hi: "संदेश भेजें" },

  // Common
  "common.loading": { en: "Loading...", hi: "लोड हो रहा है..." },
  "common.error": { en: "Something went wrong", hi: "कुछ गलत हो गया" },
  "common.noResults": { en: "No results found", hi: "कोई परिणाम नहीं मिला" },
  "common.language": { en: "हिंदी", hi: "English" },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  toggleLanguage: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("aj-language") as Language | null;
      if (saved === "en" || saved === "hi") return saved;
    }
    return "en";
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem("aj-language", lang);
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === "en" ? "hi" : "en");
  }, [language, setLanguage]);

  const t = useCallback(
    (key: string): string => {
      return translations[key]?.[language] || key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
