import { redirect } from "next/navigation";

interface LegacySupplierReceiveRedirectProps {
  params: Promise<{ locale: string }>;
}

export default async function LegacySupplierReceiveRedirect({ params }: LegacySupplierReceiveRedirectProps) {
  const { locale } = await params;
  redirect(`/${locale}/inventory`);
}
