import { CheckInCard } from "@/components/dashboard/check-in-card";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getTranslations } from "next-intl/server";

import { db } from "@/lib/db";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const t = await getTranslations("dashboard");

  // Check if company location is configured
  const companyLocation = await db.companyLocation.findFirst({
    where: { isActive: true },
  });
  const isCompanyLocationConfigured = !!companyLocation;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
        <p className="text-muted-foreground">
          {t("welcomeBack")}, {session?.user?.name}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <CheckInCard
          isCompanyLocationConfigured={isCompanyLocationConfigured}
          isAdmin={session?.user?.role === "ADMIN"}
        />
        {/* We can add stats cards here later */}
      </div>
    </div>
  );
}
