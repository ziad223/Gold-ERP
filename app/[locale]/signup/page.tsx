import { redirect } from "@/i18n/navigation";

/**
 * Public sign-up has been removed. User accounts are created only by an admin
 * from the Users management panel. Any hit on /signup is redirected to /login.
 */
export default async function SignupRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/login", locale });
}
