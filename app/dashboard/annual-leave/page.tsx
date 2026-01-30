import { getTranslations } from "next-intl/server";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { AnnualLeaveForm } from "@/components/annual-leave/annual-leave-form";
import type { UserBalance, LeaveRequestRecord, LeaveType } from "@/types";

async function getAnnualLeaveData(userId: string) {
  // First, ensure user exists in database
  let user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      joinDate: true,
      country: true,
    },
  });

  // If user doesn't exist, try to recover by fetching from session
  // This handles the case where JWT token exists but user record is missing
  if (!user) {
    const session = await getServerSession(authOptions);
    if (session?.user?.email) {
      // Try to find user by email
      const userByEmail = await db.user.findUnique({
        where: { email: session.user.email },
        select: {
          id: true,
          joinDate: true,
          country: true,
        },
      });

      if (!userByEmail) {
        // User not found by ID or email - need to create/fix user record
        console.error("User record missing for session", {
          userId,
          email: session.user.email,
        });
        throw new Error(
          "User profile not found. Please contact your administrator to set up your profile.",
        );
      }
      user = userByEmail;
    } else {
      console.error("User not found in database. UserId:", userId);
      throw new Error(
        "User profile not found. Please ensure your profile is properly configured.",
      );
    }
  }

  // Now fetch leave requests for the confirmed user
  const leaves = await db.leaveRequest.findMany({
    where: {
      userId: user.id,
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
      reason: true,
      status: true,
      leaveType: true,
      startTime: true,
      endTime: true,
      createdAt: true,
    },
  });

  // Calculate leave balance
  const currentYear = new Date().getFullYear();
  const joinDate = user.joinDate ? new Date(user.joinDate) : null;

  let totalLeaves = 15; // Default

  if (joinDate) {
    const joinYear = joinDate.getFullYear();
    const joinMonth = joinDate.getMonth();

    if (joinYear === currentYear) {
      totalLeaves = Math.max(1, Math.floor((12 - joinMonth) * (15 / 12)));
    } else {
      const yearsSinceJoin = currentYear - joinYear;
      if (yearsSinceJoin >= 20) totalLeaves = 25;
      else if (yearsSinceJoin >= 15) totalLeaves = 24;
      else if (yearsSinceJoin >= 10) totalLeaves = 23;
      else if (yearsSinceJoin >= 8) totalLeaves = 21;
      else if (yearsSinceJoin >= 6) totalLeaves = 19;
      else if (yearsSinceJoin >= 4) totalLeaves = 17;
      else if (yearsSinceJoin >= 2) totalLeaves = 16;
    }
  }

  const usedLeaves = leaves
    .filter((leave) => leave.status === "APPROVED")
    .reduce((acc, leave) => acc + leave.days, 0);

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

  console.log("Session data:", {
    hasSession: !!session,
    hasUser: !!session?.user,
    userId: session?.user?.id,
    userName: session?.user?.name,
  });

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
