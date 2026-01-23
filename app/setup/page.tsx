import { SetupForm } from "@/components/auth/setup-form";
import { requireSetupNeeded } from "@/lib/check-setup";

export default async function SetupPage() {
  await requireSetupNeeded();

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <SetupForm />
    </div>
  );
}
