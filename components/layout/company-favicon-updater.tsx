"use client";

import { useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/auth-context";
import { getPublicFileUrl } from "@/lib/api/files";

const FALLBACK_FAVICON_HREF = "/favicon.ico";

export function CompanyFaviconUpdater() {
  const { company } = useAuth();

  const faviconHref = useMemo(() => {
    // Future precedence: custom favicon > company logo > static fallback.
    const companyLogoHref = getPublicFileUrl(company?.logo || "");
    return companyLogoHref || FALLBACK_FAVICON_HREF;
  }, [company?.logo]);

  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"], link[rel~="icon"]');

    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }

    if (link.href !== new URL(faviconHref, window.location.origin).href) {
      link.href = faviconHref;
    }
  }, [faviconHref]);

  return null;
}
