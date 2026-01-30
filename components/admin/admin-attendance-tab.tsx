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
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AdminAttendance } from "@/types/admin";

interface AdminAttendanceTabProps {
  attendance: AdminAttendance[];
  onRefresh: () => void;
}

export function AdminAttendanceTab({
  attendance,
  onRefresh,
}: AdminAttendanceTabProps) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");

  const onDeleteAttendance = async (id: string) => {
    try {
      await axios.delete("/api/admin/attendance", { data: { id } });
      toast.success(
        t("attendance.deleteSuccess") || "근태 기록이 삭제되었습니다.",
      );
      onRefresh();
    } catch {
      toast.error(
        t("attendance.deleteFailed") || "근태 기록 삭제에 실패했습니다.",
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("tabs.attendance") || "근무 기록"}</CardTitle>
        <CardDescription>
          {t("attendance.description") || "직원 근무 기록 관리"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("table.employee")}</TableHead>
                <TableHead>{t("attendance.date") || "날짜"}</TableHead>
                <TableHead>{t("attendance.checkIn") || "체크인"}</TableHead>
                <TableHead>{t("attendance.checkOut") || "체크아웃"}</TableHead>
                <TableHead>{t("attendance.status") || "상태"}</TableHead>
                <TableHead className="text-right">{tc("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendance.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="text-center text-muted-foreground py-8"
                  >
                    {t("attendance.noRecords") || "근무 기록이 없습니다"}
                  </TableCell>
                </TableRow>
              ) : (
                attendance.map((record: AdminAttendance) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.user.name}
                      <p className="text-xs text-muted-foreground font-normal">
                        {record.user.email}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">
                      {format(new Date(record.date), "yyyy-MM-dd")}
                    </TableCell>
                    <TableCell className="text-sm">
                      {record.checkIn
                        ? format(new Date(record.checkIn), "HH:mm:ss")
                        : "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {record.checkOut
                        ? format(new Date(record.checkOut), "HH:mm:ss")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        statusType="attendance"
                        status={record.status}
                        label={
                          t(`attendance.statuses.${record.status}`) ||
                          record.status
                        }
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => onDeleteAttendance(record.id)}
                        title={t("attendance.delete") || "삭제"}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-4">
          {attendance.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              {t("attendance.noRecords") || "근무 기록이 없습니다"}
            </div>
          ) : (
            attendance.map((record: AdminAttendance) => (
              <Card key={record.id} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">
                          {record.user.name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {record.user.email}
                        </div>
                      </div>
                      <Badge
                        statusType="attendance"
                        status={record.status}
                        label={
                          t(`attendance.statuses.${record.status}`) ||
                          record.status
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t("attendance.date") || "날짜"}
                        </span>
                        <span className="font-medium">
                          {format(new Date(record.date), "yyyy-MM-dd")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t("attendance.checkIn") || "체크인"}
                        </span>
                        <span className="font-medium">
                          {record.checkIn
                            ? format(new Date(record.checkIn), "HH:mm:ss")
                            : "-"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t("attendance.checkOut") || "체크아웃"}
                        </span>
                        <span className="font-medium">
                          {record.checkOut
                            ? format(new Date(record.checkOut), "HH:mm:ss")
                            : "-"}
                        </span>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                        onClick={() => onDeleteAttendance(record.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t("attendance.delete") || "삭제"}
                      </Button>
                    </div>
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
