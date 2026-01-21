"use client"

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import axios from "axios";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

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
            toast.success("Checked in successfully");
            fetchAttendance();
        } catch (error) {
            toast.error("Failed to check in");
        } finally {
            setActionLoading(false);
        }
    }

    const onCheckOut = async () => {
        setActionLoading(true);
        try {
            await axios.post("/api/attendance/check-out");
            toast.success("Checked out successfully");
            fetchAttendance();
        } catch (error) {
            toast.error("Failed to check out");
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
                <CardTitle>Today&apos;s Attendance</CardTitle>
                <CardDescription>
                    {format(now, "PPP p")}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Check In</p>
                        <p className="text-xl font-bold">
                            {attendance?.checkIn ? format(new Date(attendance.checkIn), "p") : "--:--"}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Check Out</p>
                        <p className="text-xl font-bold">
                            {attendance?.checkOut ? format(new Date(attendance.checkOut), "p") : "--:--"}
                        </p>
                    </div>
                </div>

                {!attendance?.checkIn && (
                    <Button className="w-full" size="lg" onClick={onCheckIn} disabled={actionLoading}>
                        {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Check In
                    </Button>
                )}

                {attendance?.checkIn && !attendance.checkOut && (
                    <Button className="w-full" variant="outline" size="lg" onClick={onCheckOut} disabled={actionLoading}>
                         {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Check Out
                    </Button>
                )}

                {attendance?.checkIn && attendance.checkOut && (
                    <Button className="w-full" variant="secondary" size="lg" disabled>
                        Day Complete
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
