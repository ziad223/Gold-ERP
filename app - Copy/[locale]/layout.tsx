import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Providers } from "../providers";
import { ArabicDigitDetector } from "@/components/debug/arabic-digit-detector";
import "../globals.css";

export const metadata: Metadata = {
  title: "DARFUS Jewellery ERP",
  description: "Asset-centric jewellery ERP, POS, inventory and accounting system",
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) notFound();

  setRequestLocale(locale);
  const messages = await getMessages();
  const direction = locale === "ar" ? "rtl" : "ltr";

  return (
    <html lang={locale} dir={direction} data-scroll-behavior="smooth" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Providers>
            {children}
            {process.env.NODE_ENV !== "production" && <ArabicDigitDetector />}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
