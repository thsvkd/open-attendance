import { RegisterForm } from "@/components/auth/register-form";
import { requireSetupComplete } from "@/lib/check-setup";

export default async function RegisterPage() {
  await requireSetupComplete();

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <RegisterForm />
    </div>
  );
}
