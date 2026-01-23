import { LoginForm } from "@/components/auth/login-form";
import { requireSetupComplete } from "@/lib/check-setup";

export default async function LoginPage() {
  await requireSetupComplete();

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <LoginForm />
    </div>
  );
}
