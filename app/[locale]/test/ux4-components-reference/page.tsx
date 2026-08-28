import UX4ComponentsReferencePage from "../../../../components/ux4b-reference-surface";

export default async function UX4ComponentsReferenceRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <UX4ComponentsReferencePage locale={locale === "ar" ? "ar" : "en"} />;
}
