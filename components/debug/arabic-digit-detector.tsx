"use client";

import { useEffect } from "react";
import { hasArabicDigits } from "@/lib/formatters/numbers";

export function ArabicDigitDetector() {
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;

    const scan = () => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const badNodes: string[] = [];

      while (walker.nextNode()) {
        const text = walker.currentNode.textContent || "";
        if (hasArabicDigits(text)) {
          badNodes.push(text);
        }
      }

      if (badNodes.length) {
        console.warn("Arabic/Hindi digits found in UI:", badNodes.slice(0, 50));
      }
    };

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  return null;
}
