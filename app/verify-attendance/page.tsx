"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle, Loader2, MapPin } from "lucide-react";
import axios from "axios";
import { getCurrentLocation } from "@/lib/location-utils";

export default function VerifyAttendancePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<
    "loading" | "success" | "failed" | "expired"
  >(() => (!token ? "failed" : "loading"));
  const [message, setMessage] = useState(() =>
    !token ? "Invalid verification link" : "",
  );
  const [action, setAction] = useState<"CHECK_IN" | "CHECK_OUT" | null>(null);

  const verifyLocation = async () => {
    if (!token) {
      setStatus("failed");
      setMessage("Invalid verification link");
      return;
    }

    try {
      setStatus("loading");
      setMessage("Getting your location...");

      // Get current location
      const coords = await getCurrentLocation();

      setMessage("Verifying location...");

      // Submit location for verification
      const res = await axios.post("/api/attendance/qr-verify", {
        sessionToken: token,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      setStatus("success");
      setAction(res.data.action);
      setMessage(
        res.data.action === "CHECK_IN"
          ? "Check-in successful!"
          : "Check-out successful!",
      );
    } catch (error: unknown) {
      console.error("Verification error:", error);
      const errorMsg =
        (error as { response?: { data?: { error?: string } } }).response?.data
          ?.error || "Verification failed";

      if (errorMsg.includes("expired")) {
        setStatus("expired");
      } else {
        setStatus("failed");
      }

      setMessage(errorMsg);
    }
  };

  useEffect(() => {
    verifyLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Attendance Verification</CardTitle>
          <CardDescription className="text-center">
            Location-based attendance verification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          {status === "success" && (
            <>
              <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-600">
                  {message}
                </AlertDescription>
              </Alert>
              <p className="text-sm text-center text-muted-foreground">
                You can close this page now. Your{" "}
                {action === "CHECK_IN" ? "check-in" : "check-out"} has been
                recorded.
              </p>
            </>
          )}

          {status === "failed" && (
            <>
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              <Button onClick={verifyLocation} className="w-full">
                <MapPin className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </>
          )}

          {status === "expired" && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
