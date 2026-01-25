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
import { getPreciseLocation } from "@/lib/location-utils";
import { useTranslations } from "next-intl";

export default function VerifyAttendancePage() {
  const t = useTranslations("verification");
  const td = useTranslations("dashboard");
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<
    "loading" | "success" | "failed" | "expired"
  >(() => (!token ? "failed" : "loading"));
  const [message, setMessage] = useState(() =>
    !token ? t("invalidLink") : "",
  );
  const [action, setAction] = useState<"CHECK_IN" | "CHECK_OUT" | null>(null);
  const [currentAccuracy, setCurrentAccuracy] = useState<number | null>(null);

  const verifyLocation = async () => {
    if (!token) {
      setStatus("failed");
      setMessage(t("invalidLink"));
      return;
    }

    try {
      setStatus("loading");
      setMessage(t("gettingLocation"));

      // Get current location
      const coords = await getPreciseLocation((acc) => setCurrentAccuracy(acc));

      setMessage(t("verifyingLocation"));

      // Submit location for verification
      const res = await axios.post("/api/attendance/qr-verify", {
        sessionToken: token,
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      setStatus("success");
      const verifiedAction = res.data.action;
      setAction(verifiedAction);
      setMessage(
        verifiedAction === "CHECK_IN"
          ? t("checkInSuccess")
          : t("checkOutSuccess"),
      );
    } catch (error: unknown) {
      console.error("Verification error:", error);
      let errorMsg =
        (error as { response?: { data?: { error?: string } } }).response?.data
          ?.error || t("verifyFailed");

      // Attempt to localize known error messages
      if (errorMsg.includes("expired")) {
        setStatus("expired");
        errorMsg = td("verificationExpired");
      } else if (errorMsg.includes("too far")) {
        setStatus("failed");
        errorMsg = td("tooFarFromOffice");
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
          <CardTitle className="text-center">{t("title")}</CardTitle>
          <CardDescription className="text-center">
            {t("description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "loading" && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription className="flex flex-col gap-1">
                <span>{message}</span>
                {currentAccuracy && (
                  <span className="text-xs font-mono text-primary animate-pulse">
                    {t("locationAccuracy", {
                      accuracy: Math.round(currentAccuracy),
                    })}
                  </span>
                )}
              </AlertDescription>
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
                {t("closePage", {
                  action:
                    action === "CHECK_IN" ? td("checkIn") : td("checkOut"),
                })}
              </p>
            </>
          )}

          {(status === "failed" || status === "expired") && (
            <>
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              {status === "failed" && (
                <Button onClick={verifyLocation} className="w-full">
                  <MapPin className="mr-2 h-4 w-4" />
                  {t("tryAgain")}
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
