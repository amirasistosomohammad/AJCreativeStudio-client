import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import fallbackLogo from "../assets/images/logo.jpg";

const BrandingContext = createContext(null);

export const useBranding = () => {
  const ctx = useContext(BrandingContext);
  if (!ctx) throw new Error("useBranding must be used within a BrandingProvider");
  return ctx;
};

export const BrandingProvider = ({ children }) => {
  const apiBaseUrl =
    import.meta.env.VITE_LARAVEL_API ||
    import.meta.env.VITE_API_URL ||
    "http://localhost:8000";

  const [branding, setBranding] = useState({
    logoText: "",
    logoUrl: null,
    isLoading: true,
    hasLoadedOnce: false,
  });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/branding`, {
          headers: { Accept: "application/json" },
        });
        const data = await res.json().catch(() => null);
        if (!cancelled && res.ok && data?.success && data?.branding) {
          const resolvedLogoUrl = data.branding.logo_url
            ? new URL(data.branding.logo_url, apiBaseUrl).toString()
            : null;
          setBranding({
            logoText: data.branding.logo_text || "AJ Creative Studio",
            logoUrl: resolvedLogoUrl,
            isLoading: false,
            hasLoadedOnce: true,
          });
        } else if (!cancelled) {
          setBranding((prev) => ({ ...prev, isLoading: false, hasLoadedOnce: true }));
        }
      } catch (_e) {
        if (!cancelled) setBranding((prev) => ({ ...prev, isLoading: false, hasLoadedOnce: true }));
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [apiBaseUrl]);

  const value = useMemo(() => {
    // Important UX: don't flash the hardcoded logo on first paint.
    // Only show fallback AFTER we have loaded once and confirmed there's no custom logo.
    const logoSrc = branding.logoUrl || (branding.hasLoadedOnce ? fallbackLogo : null);
    return {
      logoText: branding.logoText || (branding.hasLoadedOnce ? "AJ Creative Studio" : ""),
      logoUrl: branding.logoUrl,
      logoSrc,
      isLoading: branding.isLoading,
      hasLoadedOnce: branding.hasLoadedOnce,
      refresh: async () => {
        setBranding((prev) => ({ ...prev, isLoading: true }));
        try {
          const res = await fetch(`${apiBaseUrl}/branding`, {
            headers: { Accept: "application/json" },
          });
          const data = await res.json().catch(() => null);
          if (res.ok && data?.success && data?.branding) {
            const resolvedLogoUrl = data.branding.logo_url
              ? new URL(data.branding.logo_url, apiBaseUrl).toString()
              : null;
            setBranding({
              logoText: data.branding.logo_text || "AJ Creative Studio",
              logoUrl: resolvedLogoUrl,
              isLoading: false,
              hasLoadedOnce: true,
            });
          } else {
            setBranding((prev) => ({ ...prev, isLoading: false, hasLoadedOnce: true }));
          }
        } catch (_e) {
          setBranding((prev) => ({ ...prev, isLoading: false, hasLoadedOnce: true }));
        }
      },
    };
  }, [apiBaseUrl, branding.hasLoadedOnce, branding.isLoading, branding.logoText, branding.logoUrl]);

  return <BrandingContext.Provider value={value}>{children}</BrandingContext.Provider>;
};


