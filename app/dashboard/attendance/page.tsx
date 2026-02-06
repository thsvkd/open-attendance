import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { AttendanceTable } from "@/components/attendance/attendance-table";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

export default async function AttendancePage() {
  const session = await getServerSession(authOptions);
  const t = await getTranslations("attendance");

  if (!session?.user?.id) {
    redirect("/login");
  }

  // Ensure user exists in database before querying attendance
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true },
  });

  if (!user) {
    // Try to find by email as fallback
    if (session.user.email) {
      const userByEmail = await db.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });

      if (!userByEmail) {
        throw new Error(
          "User profile not found. Please contact your administrator.",
        );
      }
      // Continue with the correct userId
      session.user.id = userByEmail.id;
    } else {
      throw new Error(
        "User profile not found. Please contact your administrator.",
      );
    }
  }

  // Fetch attendance history server-side
  const rawHistory = await db.attendance.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    take: 30,
  });

  // Convert Date objects to ISO strings for type compatibility
  const history = rawHistory.map((record) => ({
    ...record,
    date: record.date.toISOString(),
    checkIn: record.checkIn?.toISOString() ?? null,
    checkOut: record.checkOut?.toISOString() ?? null,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <AttendanceTable history={history} />
    </div>
  );
}
