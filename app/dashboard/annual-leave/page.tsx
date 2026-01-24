"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { DatePickerField } from "@/components/ui/date-picker-field";
import { TimePickerField } from "@/components/ui/time-picker-field";
import { PageLoading } from "@/components/ui/page-loading";
import type {
  LeaveType,
  LeaveTypeSelection,
  HalfDayPeriod,
  UserBalance,
  LeaveRequestRecord,
} from "@/types";

export default function AnnualLeavePage() {
  const [leaves, setLeaves] = useState<LeaveRequestRecord[]>([]);
  const [userInfo, setUserInfo] = useState<UserBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [leaveTypeSelection, setLeaveTypeSelection] =
    useState<LeaveTypeSelection>("FULL_DAY");
  const [halfDayPeriod, setHalfDayPeriod] = useState<HalfDayPeriod>("AM");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const t = useTranslations("annualLeave");

  const getActualLeaveType = (): LeaveType => {
    if (leaveTypeSelection === "HALF_DAY") {
      return halfDayPeriod === "AM" ? "HALF_DAY_AM" : "HALF_DAY_PM";
    }
    return leaveTypeSelection as LeaveType;
  };

  const handleStartTimeChange = (newStartTime: string) => {
    setStartTime(newStartTime);
    // 2시간 이후를 종료 시간으로 자동 설정
    const [hours, minutes] = newStartTime.split(":").map(Number);
    const endHours = (hours + 2) % 24;
    const endTimeStr = `${String(endHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    setEndTime(endTimeStr);
  };

  const handleEndTimeChange = (newEndTime: string) => {
    setEndTime(newEndTime);
    // 2시간 전을 시작 시간으로 자동 설정
    const [hours, minutes] = newEndTime.split(":").map(Number);
    const startHours = (hours - 2 + 24) % 24;
    const startTimeStr = `${String(startHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
    setStartTime(startTimeStr);
  };

  const fetchData = async () => {
    try {
      const [leavesRes, userRes] = await Promise.all([
        axios.get("/api/annual-leave"),
        axios.get("/api/annual-leave/balance"),
      ]);
      setLeaves(leavesRes.data);
      setUserInfo(userRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (leaveTypeSelection === "FULL_DAY" && (!startDate || !endDate)) {
      toast.error(t("selectStartEnd"));
      return;
    }
    if (leaveTypeSelection !== "FULL_DAY" && !startDate) {
      toast.error(t("selectDate"));
      return;
    }

    setSubmitting(true);

    const actualLeaveType = getActualLeaveType();
    const data = {
      startDate: startDate ? format(startDate, "yyyy-MM-dd") : "",
      endDate:
        leaveTypeSelection === "FULL_DAY" && endDate
          ? format(endDate, "yyyy-MM-dd")
          : startDate
            ? format(startDate, "yyyy-MM-dd")
            : "",
      leaveType: actualLeaveType,
      startTime: leaveTypeSelection === "QUARTER_DAY" ? startTime : undefined,
      endTime: leaveTypeSelection === "QUARTER_DAY" ? endTime : undefined,
      reason:
        (document.getElementById("reason") as HTMLInputElement)?.value || "",
    };

    try {
      await axios.post("/api/annual-leave", data);
      toast.success(t("leaveSuccess"));
      fetchData();
      setLeaveTypeSelection("FULL_DAY");
      setHalfDayPeriod("AM");
      setStartDate(undefined);
      setEndDate(undefined);
      setStartTime("09:00");
      setEndTime("11:00");
    } catch (error) {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : t("leaveFailed");
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeave = async (leaveId: string) => {
    setCancelling(leaveId);
    try {
      await axios.patch("/api/leaves", { id: leaveId });
      toast.success(t("cancelSuccess"));
      fetchData();
    } catch (error) {
      const errorMessage =
        axios.isAxiosError(error) && error.response?.data?.message
          ? error.response.data.message
          : t("cancelFailed");
      toast.error(errorMessage);
    } finally {
      setCancelling(null);
    }
  };

  if (loading) {
    return <PageLoading />;
  }

  const remainingLeaves = userInfo
    ? userInfo.totalLeaves - userInfo.usedLeaves
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("totalLeaves")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userInfo?.totalLeaves || 0} {t("days")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("usedLeaves")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {userInfo?.usedLeaves || 0} {t("days")}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("remainingLeaves")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {remainingLeaves} {t("days")}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("requestLeave")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("leaveType")}</Label>
                <Select
                  value={leaveTypeSelection}
                  onValueChange={(value: string) =>
                    setLeaveTypeSelection(value as LeaveTypeSelection)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectLeaveType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL_DAY">
                      {t("leaveTypes.FULL_DAY")}
                    </SelectItem>
                    <SelectItem value="HALF_DAY">
                      {t("leaveTypes.HALF_DAY")}
                    </SelectItem>
                    <SelectItem value="QUARTER_DAY">
                      {t("leaveTypes.QUARTER_DAY")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {leaveTypeSelection === "FULL_DAY" ? (
                <div className="grid grid-cols-2 gap-4">
                  <DatePickerField
                    label={t("startDate")}
                    selected={startDate}
                    onSelect={setStartDate}
                    placeholder={t("pickDate")}
                  />
                  <DatePickerField
                    label={t("endDate")}
                    selected={endDate}
                    onSelect={setEndDate}
                    placeholder={t("pickDate")}
                  />
                </div>
              ) : (
                <DatePickerField
                  label={t("date")}
                  selected={startDate}
                  onSelect={setStartDate}
                  placeholder={t("pickDate")}
                />
              )}

              {leaveTypeSelection === "HALF_DAY" && (
                <div className="space-y-2">
                  <Label>{t("halfDayPeriod")}</Label>
                  <Select
                    value={halfDayPeriod}
                    onValueChange={(value: string) =>
                      setHalfDayPeriod(value as HalfDayPeriod)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">{t("halfDayAM")}</SelectItem>
                      <SelectItem value="PM">{t("halfDayPM")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {leaveTypeSelection === "QUARTER_DAY" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold">
                      {t("duration")}
                    </Label>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-normal"
                    >
                      {t("twoHoursFixed")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <TimePickerField
                        label={t("startTime")}
                        value={startTime}
                        onChange={handleStartTimeChange}
                        placeholder={t("selectTime") || "Select time"}
                      />
                    </div>
                    <div className="flex flex-col justify-end h-[68px] pb-3 text-muted-foreground font-light">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M5 12h14" />
                        <path d="m13 18 6-6-6-6" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <TimePickerField
                        label={t("endTime")}
                        value={endTime}
                        onChange={handleEndTimeChange}
                        placeholder={t("selectTime") || "Select time"}
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground text-center">
                    {t("twoHoursAutoAdjust")}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reason">{t("reason")}</Label>
                <Input
                  id="reason"
                  name="reason"
                  placeholder={t("reasonPlaceholder")}
                />
              </div>
              <Button className="w-full" type="submit" disabled={submitting}>
                {submitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t("submitRequest")}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("myRequests")}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("type")}</TableHead>
                    <TableHead>{t("dates")}</TableHead>
                    <TableHead>{t("duration")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={5}
                        className="text-center text-muted-foreground"
                      >
                        {t("noRequests")}
                      </TableCell>
                    </TableRow>
                  ) : (
                    leaves.map((leave) => (
                      <TableRow key={leave.id}>
                        <TableCell className="text-xs">
                          {t(`leaveTypes.${leave.leaveType || "FULL_DAY"}`)}
                          {leave.leaveType === "QUARTER_DAY" &&
                            leave.startTime &&
                            leave.endTime && (
                              <span className="block text-muted-foreground">
                                {leave.startTime} - {leave.endTime}
                              </span>
                            )}
                        </TableCell>
                        <TableCell className="text-xs">
                          {leave.leaveType === "FULL_DAY" ? (
                            <>
                              {format(new Date(leave.startDate), "MM/dd")} -{" "}
                              {format(new Date(leave.endDate), "MM/dd")}
                            </>
                          ) : (
                            format(new Date(leave.startDate), "MM/dd")
                          )}
                        </TableCell>
                        <TableCell>
                          {leave.days} {t("days")}
                        </TableCell>
                        <TableCell>
                          <Badge
                            statusType="leave"
                            status={leave.status}
                            label={t(`statuses.${leave.status}`)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          {leave.status === "PENDING" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleCancelLeave(leave.id)}
                              disabled={cancelling === leave.id}
                            >
                              {cancelling === leave.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                t("cancel")
                              )}
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
                  {t("noRequests")}
                </div>
              ) : (
                leaves.map((leave) => (
                  <Card key={leave.id} className="shadow-sm">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold">
                              {t(`leaveTypes.${leave.leaveType || "FULL_DAY"}`)}
                            </div>
                            {leave.leaveType === "QUARTER_DAY" &&
                              leave.startTime &&
                              leave.endTime && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  {leave.startTime} - {leave.endTime}
                                </div>
                              )}
                          </div>
                          <Badge
                            statusType="leave"
                            status={leave.status}
                            label={t(`statuses.${leave.status}`)}
                          />
                        </div>
                        <div className="flex justify-between items-start gap-3">
                          <div className="space-y-1">
                            <div className="text-xs text-muted-foreground">
                              {t("dates")}
                            </div>
                            <div className="text-sm font-medium">
                              {leave.leaveType === "FULL_DAY" ? (
                                <>
                                  {format(new Date(leave.startDate), "MM/dd")} -{" "}
                                  {format(new Date(leave.endDate), "MM/dd")}
                                </>
                              ) : (
                                format(new Date(leave.startDate), "MM/dd")
                              )}
                            </div>
                          </div>
                          <div className="space-y-1 text-right mr-2">
                            <div className="text-xs text-muted-foreground">
                              {t("duration")}
                            </div>
                            <div className="text-sm font-medium">
                              {leave.days} {t("days")}
                            </div>
                          </div>
                        </div>
                        {leave.status === "PENDING" && (
                          <div className="pt-2 border-t">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              onClick={() => handleCancelLeave(leave.id)}
                              disabled={cancelling === leave.id}
                            >
                              {cancelling === leave.id ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : null}
                              {t("cancel")}
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
      </div>
    </div>
  );
}
