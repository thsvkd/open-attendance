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

interface LeaveRequest {
  id: string;
  type: string;
  startDate: string;
  endDate: string;
  days: number;
  status: string;
}

export default function LeavesPage() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const t = useTranslations('earlyLeave');

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
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData.entries());

    try {
      await axios.post("/api/leaves", data);
      toast.success(t('submitRequest'));
      fetchLeaves();
      (e.target as HTMLFormElement).reset();
    } catch {
      toast.error(t('submitFailed'));
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

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground">{t('description')}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('requestLeave')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">{t('type')}</Label>
                <select name="type" id="type" className="w-full border rounded-md p-2 bg-background">
                  <option value="SICK">{t('types.SICK')}</option>
                  <option value="OFFICIAL">{t('types.OFFICIAL')}</option>
                  <option value="OTHER">{t('types.OTHER')}</option>
                </select>
              </div>
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
      </div>

      <div className="space-y-6">
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
                  <TableHead>{t('days')}</TableHead>
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
                      <TableCell>{t(`types.${leave.type}`)}</TableCell>
                      <TableCell className="text-xs">
                        {format(new Date(leave.startDate), "MM/dd")} - {format(new Date(leave.endDate), "MM/dd")}
                      </TableCell>
                      <TableCell>{leave.days}</TableCell>
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
