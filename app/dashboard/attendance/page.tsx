"use client"

import { useEffect, useState } from "react";
import { format } from "date-fns";
import axios from "axios";
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
import { Loader2 } from "lucide-react";
import { useTranslations, useFormatter } from "next-intl";

interface Attendance {
  id: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: string;
}

export default function AttendancePage() {
  const [history, setHistory] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const t = useTranslations("attendance");
  const formatter = useFormatter();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get("/api/attendance/history");
        setHistory(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('title')}</h2>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('history')}</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('date')}</TableHead>
                  <TableHead>{t('checkIn')}</TableHead>
                  <TableHead>{t('checkOut')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      {t('noRecords')}
                    </TableCell>
                  </TableRow>
                ) : (
                  history.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">
                        {formatter.dateTime(new Date(record.date), {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        {record.checkIn ? format(new Date(record.checkIn), "p") : "-"}
                      </TableCell>
                      <TableCell>
                        {record.checkOut ? format(new Date(record.checkOut), "p") : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge statusType="attendance" status={record.status} label={t(`statuses.${record.status}`)} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {history.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                {t('noRecords')}
              </div>
            ) : (
              history.map((record) => (
                <Card key={record.id} className="shadow-sm">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-muted-foreground">{t('date')}</span>
                        <span className="font-medium text-sm">
                          {formatter.dateTime(new Date(record.date), {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">{t('checkIn')}</div>
                          <div className="font-medium">
                            {record.checkIn ? format(new Date(record.checkIn), "p") : "-"}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">{t('checkOut')}</div>
                          <div className="font-medium">
                            {record.checkOut ? format(new Date(record.checkOut), "p") : "-"}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                        <span className="text-xs text-muted-foreground">{t('status')}</span>
                        <Badge statusType="attendance" status={record.status} label={t(`statuses.${record.status}`)} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
