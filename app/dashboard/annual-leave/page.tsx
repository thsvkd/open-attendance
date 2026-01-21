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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslations } from 'next-intl';

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
}

export default function AnnualLeavePage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const t = useTranslations('annualLeave');

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
    const data = Object.fromEntries(formData.entries());

    try {
      await axios.post("/api/annual-leave", data);
      toast.success(t('leaveSuccess'));
      fetchData();
      (e.target as HTMLFormElement).reset();
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
                  <TableHead>{t('dates')}</TableHead>
                  <TableHead>{t('duration')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leaves.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      {t('noRequests')}
                    </TableCell>
                  </TableRow>
                ) : (
                  leaves.map((leave) => (
                    <TableRow key={leave.id}>
                      <TableCell className="text-xs">
                        {format(new Date(leave.startDate), "MM/dd")} - {format(new Date(leave.endDate), "MM/dd")}
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
