"use client";

import { format } from "date-fns";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, X, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AdminLeave } from "@/types/admin";

interface AdminLeavesTabProps {
  leaves: AdminLeave[];
  onRefresh: () => void;
}

export function AdminLeavesTab({ leaves, onRefresh }: AdminLeavesTabProps) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const tl = useTranslations("earlyLeave");
  const ta = useTranslations("annualLeave");

  const onUpdateStatus = async (id: string, status: string) => {
    try {
      await axios.patch("/api/admin/leaves", { id, status });
      toast.success(
        status === "APPROVED"
          ? t("leaves.approveSuccess")
          : t("leaves.rejectSuccess"),
      );
      onRefresh();
    } catch {
      toast.error(t("leaves.actionFailed"));
    }
  };

  const onDeleteLeave = async (id: string) => {
    try {
      await axios.delete(`/api/admin/leaves/${id}`);
      toast.success(t("leaves.deleteSuccess") || "휴가 기록이 삭제되었습니다.");
      onRefresh();
    } catch {
      toast.error(t("leaves.deleteFailed") || "휴가 기록 삭제에 실패했습니다.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("leaves.title")}</CardTitle>
        <CardDescription>{t("leaves.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.employee")}</TableHead>
                <TableHead>{tl("type")}</TableHead>
                <TableHead>{tl("dates")}</TableHead>
                <TableHead>{tl("days")}</TableHead>
                <TableHead>{tl("status")}</TableHead>
                <TableHead className="text-right">{tc("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    {t("leaves.noRequests")}
                  </TableCell>
                </TableRow>
              ) : (
                leaves.map((leave: AdminLeave) => (
                  <TableRow key={leave.id}>
                    <TableCell className="font-medium">
                      {leave.user.name}
                      <p className="text-xs text-muted-foreground font-normal">
                        {leave.user.email}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div>
                        {tl(`types.${leave.type}`)}
                        {leave.type === "ANNUAL" &&
                          leave.leaveType &&
                          leave.leaveType !== "FULL_DAY" && (
                            <p className="text-xs text-muted-foreground">
                              {ta(`leaveTypes.${leave.leaveType}`)}
                              {leave.leaveType === "QUARTER_DAY" &&
                                leave.startTime &&
                                leave.endTime && (
                                  <span className="block">
                                    {leave.startTime} - {leave.endTime}
                                  </span>
                                )}
                            </p>
                          )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {leave.leaveType === "FULL_DAY" || !leave.leaveType ? (
                        <>
                          {format(new Date(leave.startDate), "MM/dd")} -{" "}
                          {format(new Date(leave.endDate), "MM/dd")}
                        </>
                      ) : (
                        format(new Date(leave.startDate), "MM/dd")
                      )}
                    </TableCell>
                    <TableCell>{leave.days}</TableCell>
                    <TableCell>
                      <Badge
                        statusType="leave"
                        status={leave.status}
                        label={tl(`statuses.${leave.status}`)}
                      />
                    </TableCell>
                    <TableCell className="text-right space-x-2 min-w-[140px]">
                      {leave.status === "PENDING" && (
                        <>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => onUpdateStatus(leave.id, "APPROVED")}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => onUpdateStatus(leave.id, "REJECTED")}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {leave.status !== "PENDING" && (
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => onDeleteLeave(leave.id)}
                          title={t("leaves.delete") || "삭제"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {leaves.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {t("leaves.noRequests")}
            </div>
          ) : (
            leaves.map((leave: AdminLeave) => (
              <Card key={leave.id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">
                          {leave.user.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {leave.user.email}
                        </div>
                      </div>
                      <Badge
                        statusType="leave"
                        status={leave.status}
                        label={tl(`statuses.${leave.status}`)}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {tl("type")}
                        </span>
                        <div className="text-right">
                          <div className="font-medium">
                            {tl(`types.${leave.type}`)}
                          </div>
                          {leave.type === "ANNUAL" &&
                            leave.leaveType &&
                            leave.leaveType !== "FULL_DAY" && (
                              <div className="text-xs text-muted-foreground">
                                {ta(`leaveTypes.${leave.leaveType}`)}
                                {leave.leaveType === "QUARTER_DAY" &&
                                  leave.startTime &&
                                  leave.endTime && (
                                    <div>
                                      {leave.startTime} - {leave.endTime}
                                    </div>
                                  )}
                              </div>
                            )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {tl("dates")}
                        </span>
                        <span className="font-medium">
                          {leave.leaveType === "FULL_DAY" ||
                          !leave.leaveType ? (
                            <>
                              {format(new Date(leave.startDate), "MM/dd")} -{" "}
                              {format(new Date(leave.endDate), "MM/dd")}
                            </>
                          ) : (
                            format(new Date(leave.startDate), "MM/dd")
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {tl("days")}
                        </span>
                        <span className="font-medium">{leave.days}</span>
                      </div>
                    </div>
                    {leave.status === "PENDING" && (
                      <div className="flex gap-2 pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                          onClick={() => onUpdateStatus(leave.id, "APPROVED")}
                        >
                          <Check className="mr-1 h-4 w-4" />
                          {t("leaves.approve")}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          onClick={() => onUpdateStatus(leave.id, "REJECTED")}
                        >
                          <X className="mr-1 h-4 w-4" />
                          {t("leaves.reject")}
                        </Button>
                      </div>
                    )}
                    {leave.status !== "PENDING" && (
                      <div className="pt-2 border-t">
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                          onClick={() => onDeleteLeave(leave.id)}
                        >
                          <Trash2 className="mr-1 h-4 w-4" />
                          {t("leaves.delete") || "삭제"}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
