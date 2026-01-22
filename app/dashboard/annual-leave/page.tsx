"use client"

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
import { useTranslations } from 'next-intl';

type LeaveType = "FULL_DAY" | "HALF_DAY_AM" | "HALF_DAY_PM" | "QUARTER_DAY";
type LeaveTypeSelection = "FULL_DAY" | "HALF_DAY" | "QUARTER_DAY";
type HalfDayPeriod = "AM" | "PM";

interface UserInfo {
  totalLeaves: number;
  usedLeaves: number;
  joinDate: string;
}

interface LeaveRequest {
  id: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
  leaveType: LeaveType;
  startTime?: string;
  endTime?: string;
}

export default function AnnualLeavePage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [leaveTypeSelection, setLeaveTypeSelection] = useState<LeaveTypeSelection>("FULL_DAY");
  const [halfDayPeriod, setHalfDayPeriod] = useState<HalfDayPeriod>("AM");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("11:00");
  const t = useTranslations('annualLeave');

  // Compute actual leaveType based on selection and period
  const getActualLeaveType = (): LeaveType => {
    if (leaveTypeSelection === "HALF_DAY") {
      return halfDayPeriod === "AM" ? "HALF_DAY_AM" : "HALF_DAY_PM";
    }
    return leaveTypeSelection as LeaveType;
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
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const formEntries = Object.fromEntries(formData.entries());

    const actualLeaveType = getActualLeaveType();
    const data = {
      ...formEntries,
      leaveType: actualLeaveType,
      startTime: leaveTypeSelection === "QUARTER_DAY" ? startTime : undefined,
      endTime: leaveTypeSelection === "QUARTER_DAY" ? endTime : undefined,
    };

    try {
      await axios.post("/api/annual-leave", data);
      toast.success(t('leaveSuccess'));
      fetchData();
      (e.target as HTMLFormElement).reset();
      setLeaveTypeSelection("FULL_DAY");
      setHalfDayPeriod("AM");
    } catch (error) {
      const errorMessage = axios.isAxiosError(error) && error.response?.data?.message
        ? error.response.data.message
        : t('leaveFailed');
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const remainingLeaves = userInfo ? userInfo.totalLeaves - userInfo.usedLeaves : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {/* Leave Balance Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('totalLeaves')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {userInfo?.totalLeaves || 0} {t('days')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('usedLeaves')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {userInfo?.usedLeaves || 0} {t('days')}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('remainingLeaves')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {remainingLeaves} {t('days')}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('requestLeave')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>{t('leaveType')}</Label>
                <Select value={leaveTypeSelection} onValueChange={(value: LeaveTypeSelection) => setLeaveTypeSelection(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('selectLeaveType')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FULL_DAY">{t('leaveTypes.FULL_DAY')}</SelectItem>
                    <SelectItem value="HALF_DAY">{t('leaveTypes.HALF_DAY')}</SelectItem>
                    <SelectItem value="QUARTER_DAY">{t('leaveTypes.QUARTER_DAY')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {leaveTypeSelection === "FULL_DAY" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">{t('startDate')}</Label>
                    <Input type="date" id="startDate" name="startDate" required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">{t('endDate')}</Label>
                    <Input type="date" id="endDate" name="endDate" required />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="startDate">{t('date')}</Label>
                  <Input type="date" id="startDate" name="startDate" required />
                  <input type="hidden" name="endDate" value="" />
                </div>
              )}

              {leaveTypeSelection === "HALF_DAY" && (
                <div className="space-y-2">
                  <Label>{t('halfDayPeriod')}</Label>
                  <Select value={halfDayPeriod} onValueChange={(value: HalfDayPeriod) => setHalfDayPeriod(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AM">{t('halfDayAM')}</SelectItem>
                      <SelectItem value="PM">{t('halfDayPM')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {leaveTypeSelection === "QUARTER_DAY" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">{t('startTime')}</Label>
                    <Input
                      type="time"
                      id="startTime"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">{t('endTime')}</Label>
                    <Input
                      type="time"
                      id="endTime"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="reason">{t('reason')}</Label>
                <Input id="reason" name="reason" placeholder={t('reasonPlaceholder')} />
              </div>
              <Button className="w-full" type="submit" disabled={submitting}>
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('submitRequest')}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('myRequests')}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('type')}</TableHead>
                  <TableHead>{t('dates')}</TableHead>
                  <TableHead>{t('duration')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      {t('noRequests')}
                    </TableCell>
                  </TableRow>
                ) : (
                  leaves.map((leave) => (
                    <TableRow key={leave.id}>
                      <TableCell className="text-xs">
                        {t(`leaveTypes.${leave.leaveType || 'FULL_DAY'}`)}
                        {leave.leaveType === "QUARTER_DAY" && leave.startTime && leave.endTime && (
                          <span className="block text-muted-foreground">
                            {leave.startTime} - {leave.endTime}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {leave.leaveType === "FULL_DAY" ? (
                          <>
                            {format(new Date(leave.startDate), "MM/dd")} - {format(new Date(leave.endDate), "MM/dd")}
                          </>
                        ) : (
                          format(new Date(leave.startDate), "MM/dd")
                        )}
                      </TableCell>
                      <TableCell>{leave.days} {t('days')}</TableCell>
                      <TableCell>
                        <Badge variant={leave.status === "APPROVED" ? "default" : leave.status === "PENDING" ? "secondary" : "destructive"}>
                          {t(`statuses.${leave.status}`)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
