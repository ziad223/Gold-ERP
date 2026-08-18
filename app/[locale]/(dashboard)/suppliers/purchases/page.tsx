import { redirect } from "next/navigation";

export default function LegacySupplierReceiveRedirect() {
  redirect("/inventory");
}
