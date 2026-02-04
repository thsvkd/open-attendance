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
import { PageLoading } from "@/components/ui/page-loading";
import type { LeaveRequestRecord } from "@/types";

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<LeaveRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [leaveType, setLeaveType] = useState<string>("SICK");
  const t = useTranslations("earlyLeave");

  const fetchLeaves = async () => {
    try {
      const res = await axios.get("/api/leaves");
      setLeaves(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      toast.error(t("selectStartEnd"));
      return;
    }

    setSubmitting(true);
    const data = {
      type: leaveType,
      startDate: format(startDate, "yyyy-MM-dd"),
      endDate: format(endDate, "yyyy-MM-dd"),
      reason:
        (document.getElementById("reason") as HTMLInputElement)?.value || "",
    };

    try {
      await axios.post("/api/leaves", data);
      toast.success(t("submitRequest"));
      fetchLeaves();
      setStartDate(undefined);
      setEndDate(undefined);
      setLeaveType("SICK");
      (e.target as HTMLFormElement).reset();
    } catch {
      toast.error(t("submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelLeave = async (leaveId: string) => {
    setCancelling(leaveId);
    try {
      await axios.patch("/api/leaves", { id: leaveId });
      toast.success(t("cancelSuccess"));
      fetchLeaves();
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

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t("title")}</h2>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("requestLeave")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t("type")}</Label>
                <Select value={leaveType} onValueChange={setLeaveType}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SICK">{t("types.SICK")}</SelectItem>
                    <SelectItem value="OFFICIAL">
                      {t("types.OFFICIAL")}
                    </SelectItem>
                    <SelectItem value="OTHER">{t("types.OTHER")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
      </div>

      <div className="space-y-6">
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
                    <TableHead className="text-center">{t("days")}</TableHead>
                    <TableHead className="text-center">{t("status")}</TableHead>
                    <TableHead className="text-center">
                      {t("common.actions")}
                    </TableHead>
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
                        <TableCell>{t(`types.${leave.type}`)}</TableCell>
                        <TableCell className="text-xs">
                          {format(new Date(leave.startDate), "MM/dd")} -{" "}
                          {format(new Date(leave.endDate), "MM/dd")}
                        </TableCell>
                        <TableCell className="text-center">
                          {leave.days}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            statusType="leave"
                            status={leave.status}
                            label={t(`statuses.${leave.status}`)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center">
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
                          </div>
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
                          <span className="font-semibold">
                            {t(`types.${leave.type}`)}
                          </span>
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
                              {format(new Date(leave.startDate), "MM/dd")} -{" "}
                              {format(new Date(leave.endDate), "MM/dd")}
                            </div>
                          </div>
                          <div className="space-y-1 text-right mr-2">
                            <div className="text-xs text-muted-foreground">
                              {t("days")}
                            </div>
                            <div className="text-sm font-medium">
                              {leave.days}
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
