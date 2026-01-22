"use client"

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import axios from "axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useTranslations, useFormatter } from "next-intl";

interface Attendance {
    id: string;
    checkIn: string | null;
    checkOut: string | null;
}

export function CheckInCard() {
    const [now, setNow] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [attendance, setAttendance] = useState<Attendance | null>(null);
    const t = useTranslations("dashboard");
    const formatter = useFormatter();

    useEffect(() => {
        const timer = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetchAttendance();
    }, []);

    const fetchAttendance = async () => {
        try {
            const res = await axios.get("/api/attendance/today");
            setAttendance(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }

    const onCheckIn = async () => {
        setActionLoading(true);
        try {
            await axios.post("/api/attendance/check-in");
            toast.success(t('checkInSuccess'));
            fetchAttendance();
        } catch (error) {
            toast.error(t('checkInFailed'));
        } finally {
            setActionLoading(false);
        }
    }

    const onCheckOut = async () => {
        setActionLoading(true);
        try {
            await axios.post("/api/attendance/check-out");
            toast.success(t('checkOutSuccess'));
            fetchAttendance();
        } catch (error) {
            toast.error(t('checkOutFailed'));
        } finally {
            setActionLoading(false);
        }
    }

    if (loading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex justify-center">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('todayAttendance')}</CardTitle>
                <CardDescription>
                    {formatter.dateTime(now, {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric'
                    })}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{t('checkIn')}</p>
                        <p className="text-xl font-bold">
                            {attendance?.checkIn ? format(new Date(attendance.checkIn), "p") : "--:--"}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">{t('checkOut')}</p>
                        <p className="text-xl font-bold">
                            {attendance?.checkOut ? format(new Date(attendance.checkOut), "p") : "--:--"}
                        </p>
                    </div>
                </div>

                {!attendance?.checkIn && (
                    <Button className="w-full" size="lg" onClick={onCheckIn} disabled={actionLoading}>
                        {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('checkIn')}
                    </Button>
                )}

                {attendance?.checkIn && !attendance.checkOut && (
                    <Button className="w-full" variant="outline" size="lg" onClick={onCheckOut} disabled={actionLoading}>
                        {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {t('checkOut')}
                    </Button>
                )}

                {attendance?.checkIn && attendance.checkOut && (
                    <Button className="w-full" variant="secondary" size="lg" disabled>
                        {t('dayComplete')}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
