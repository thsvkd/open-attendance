import { redirect } from "next/navigation";
import { requireSetupComplete } from "@/lib/check-setup";

export default async function Home() {
  await requireSetupComplete();
  redirect("/dashboard");
}