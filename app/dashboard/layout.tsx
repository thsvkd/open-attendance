import { Sidebar } from "@/components/dashboard/sidebar";
import { Header } from "@/components/dashboard/header";
import { requireSetupComplete } from "@/lib/check-setup";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireSetupComplete();

  return (
    <div className="h-full relative">
      <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
        <Sidebar />
      </div>
      <main className="md:pl-72 h-full">
        <Header />
        <div className="p-8">
            {children}
        </div>
      </main>
    </div>
  );
}
