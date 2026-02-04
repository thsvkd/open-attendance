import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { AnnualLeaveForm } from "@/components/annual-leave/annual-leave-form";
import { calculateAnnualLeave } from "@/lib/annual-leave-calculator";
import type { UserBalance, LeaveRequestRecord, LeaveType } from "@/types";

async function getAnnualLeaveData(userId: string) {
  const [leaves, user] = await Promise.all([
    db.leaveRequest.findMany({
      where: {
        userId,
        type: "ANNUAL",
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        type: true,
        startDate: true,
        endDate: true,
        days: true,
        effectiveDays: true,
        reason: true,
        status: true,
        leaveType: true,
        startTime: true,
        endTime: true,
        createdAt: true,
      },
    }),
    db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        joinDate: true,
        country: true,
      },
    }),
  ]);

  if (!user) {
    throw new Error("User not found");
  }

  // Calculate leave balance using Korean labor law (근로기준법 제60조)
  const joinDate = user.joinDate ? new Date(user.joinDate) : null;
  const totalLeaves = calculateAnnualLeave(joinDate);

  const usedLeaves = leaves
    .filter((leave) => leave.status === "APPROVED")
    .reduce((acc, leave) => acc + (leave.effectiveDays ?? leave.days), 0);

  const userBalance: UserBalance = {
    id: user.id,
    totalLeaves,
    usedLeaves,
    joinDate: user.joinDate,
  };

  const leaveRecords: LeaveRequestRecord[] = leaves.map((leave) => ({
    id: leave.id,
    type: leave.type,
    startDate: leave.startDate.toISOString(),
    endDate: leave.endDate.toISOString(),
    days: leave.days,
    effectiveDays: leave.effectiveDays ?? undefined,
    reason: leave.reason ?? "",
    status: leave.status,
    leaveType: (leave.leaveType as LeaveType) || undefined,
    startTime: leave.startTime || undefined,
    endTime: leave.endTime || undefined,
    createdAt: leave.createdAt.toISOString(),
  }));

  return { leaves: leaveRecords, userBalance };
}

export default async function AnnualLeavePage() {
  const session = await getServerSession(authOptions);
  const t = await getTranslations("annualLeave");

  if (!session?.user?.id) {
    redirect("/login");
  }

  const { leaves, userBalance } = await getAnnualLeaveData(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <AnnualLeaveForm initialLeaves={leaves} initialUserInfo={userBalance} />
    </div>
  );
}
