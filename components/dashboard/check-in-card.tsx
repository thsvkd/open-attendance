"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, MapPin, AlertCircle } from "lucide-react";
import { useTranslations, useFormatter } from "next-intl";
import { isMobileDevice } from "@/lib/location-utils";
import { useLocation } from "@/hooks/use-location";
import { QRCodeCanvas } from "qrcode.react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Attendance {
  id: string;
  checkIn: string | null;
  checkOut: string | null;
}

interface CheckInCardProps {
  isCompanyLocationConfigured: boolean;
  isAdmin: boolean;
}

export function CheckInCard({
  isCompanyLocationConfigured: isLocationConfigured,
  isAdmin,
}: CheckInCardProps) {
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrSessionToken, setQrSessionToken] = useState<string | null>(null);
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null,
  );

  const t = useTranslations("dashboard");
  const formatter = useFormatter();
  const isMobile = isMobileDevice();

  // Use the new useLocation hook with @uidotdev/usehooks' useGeolocation
  const {
    loading: checkingLocation,
    accuracy: currentAccuracy,
    error: locationError,
    validation: locationValidation,
    validating,
    refresh: checkLocation,
    getLocationData,
  } = useLocation({
    enabled: isLocationConfigured,
    validateOnServer: isLocationConfigured,
  });

  // Get translated error message
  const getLocationErrorMessage = useCallback(
    (error: string | null): string | null => {
      if (!error) return null;
      switch (error) {
        case "PERMISSION_DENIED":
          return t("locationPermissionDenied");
        case "POSITION_UNAVAILABLE":
          return t("failedToGetLocation");
        case "TIMEOUT":
          return t("failedToGetLocation");
        case "INSECURE_ORIGIN":
          return t("locationRequiresHttps");
        default:
          return t("failedToGetLocation");
      }
    },
    [t],
  );

  const translatedLocationError = getLocationErrorMessage(locationError);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await axios.get("/api/attendance/today");
      setAttendance(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  useEffect(() => {
    // Cleanup polling on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const handleCheckIn = async () => {
    if (isMobile) {
      // Direct check-in on mobile
      await performCheckIn();
    } else {
      // Show QR code on web
      await initiateQrFlow("CHECK_IN");
    }
  };

  const handleCheckOut = async () => {
    if (isMobile) {
      // Direct check-out on mobile
      await performCheckOut();
    } else {
      // Show QR code on web
      await initiateQrFlow("CHECK_OUT");
    }
  };

  const performCheckIn = async () => {
    setActionLoading(true);
    try {
      const locationData = getLocationData();
      if (!locationData) {
        toast.error(t("failedToGetLocation"));
        return;
      }

      await axios.post("/api/attendance/check-in", locationData);
      toast.success(t("checkInSuccess"));
      fetchAttendance();
      await checkLocation();
    } catch (error: unknown) {
      console.error(
        "Check-in error:",
        error instanceof Error ? error.message : error,
      );
      const data = (
        error as { response?: { data?: { error?: string; message?: string } } }
      ).response?.data;
      toast.error(data?.error || data?.message || t("checkInFailed"));
    } finally {
      setActionLoading(false);
    }
  };

  const performCheckOut = async () => {
    setActionLoading(true);
    try {
      const locationData = getLocationData();
      if (!locationData) {
        toast.error(t("failedToGetLocation"));
        return;
      }

      await axios.post("/api/attendance/check-out", locationData);
      toast.success(t("checkOutSuccess"));
      fetchAttendance();
      await checkLocation();
    } catch (error: unknown) {
      console.error(
        "Check-out error:",
        error instanceof Error ? error.message : error,
      );
      const data = (
        error as { response?: { data?: { error?: string; message?: string } } }
      ).response?.data;
      toast.error(data?.error || data?.message || t("checkOutFailed"));
    } finally {
      setActionLoading(false);
    }
  };

  const initiateQrFlow = async (action: "CHECK_IN" | "CHECK_OUT") => {
    setActionLoading(true);
    try {
      // Create QR session
      const res = await axios.post("/api/attendance/qr-session", { action });
      setQrSessionToken(res.data.sessionToken);
      setShowQrModal(true);

      // Start polling for verification
      const interval = setInterval(async () => {
        try {
          const statusRes = await axios.get(
            `/api/attendance/qr-session/${res.data.sessionToken}`,
          );

          if (statusRes.data.status === "VERIFIED") {
            clearInterval(interval);
            setPollingInterval(null);
            setShowQrModal(false);
            toast.success(
              action === "CHECK_IN"
                ? t("checkInSuccess")
                : t("checkOutSuccess"),
            );
            fetchAttendance();
            await checkLocation();
          } else if (
            statusRes.data.status === "EXPIRED" ||
            statusRes.data.status === "FAILED"
          ) {
            clearInterval(interval);
            setPollingInterval(null);
            setShowQrModal(false);
            toast.error(
              statusRes.data.status === "EXPIRED"
                ? t("verificationExpired")
                : t("locationVerificationFailed"),
            );
          }
        } catch (error) {
          console.error("Polling error:", error);
        }
      }, 2000);

      setPollingInterval(interval);
    } catch (error) {
      console.error("QR session error:", error);
      toast.error("Failed to create verification session");
    } finally {
      setActionLoading(false);
    }
  };

  const closeQrModal = () => {
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setShowQrModal(false);
    setQrSessionToken(null);
  };

  const isButtonDisabled: boolean =
    actionLoading ||
    checkingLocation ||
    validating ||
    !!(locationValidation && !locationValidation.isWithinRadius);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const qrUrl =
    qrSessionToken && typeof window !== "undefined"
      ? `${window.location.origin}/verify-attendance?token=${qrSessionToken}`
      : "";

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("todayAttendance")}</CardTitle>
          <CardDescription>
            {formatter.dateTime(now, {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "numeric",
              minute: "numeric",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Unified Location Status Alert */}
          {(checkingLocation ||
            validating ||
            translatedLocationError ||
            locationValidation ||
            !isLocationConfigured) && (
            <Alert
              variant={
                translatedLocationError ||
                (locationValidation && !locationValidation.isWithinRadius) ||
                !isLocationConfigured
                  ? "destructive"
                  : "default"
              }
            >
              <div className="flex items-center gap-2 w-full">
                {checkingLocation || validating ? (
                  <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                ) : translatedLocationError ||
                  (locationValidation && !locationValidation.isWithinRadius) ||
                  !isLocationConfigured ? (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                ) : (
                  <MapPin className="h-4 w-4 shrink-0" />
                )}
                <AlertDescription className="flex flex-col gap-1 w-full text-balance">
                  {/* 1. Configuration Error */}
                  {!isLocationConfigured && (
                    <div className="flex flex-col">
                      <span>
                        {t("locationNotConfigured")}
                        {isAdmin && (
                          <Button
                            variant="link"
                            className="p-0 h-auto ml-2 font-bold underline align-baseline"
                            onClick={() =>
                              (window.location.href = "/dashboard/settings")
                            }
                          >
                            {t("goToSettings")}
                          </Button>
                        )}
                      </span>
                    </div>
                  )}

                  {/* 2. Location Error */}
                  {isLocationConfigured && translatedLocationError && (
                    <span className="font-medium">
                      {translatedLocationError}
                    </span>
                  )}

                  {/* 3. Validation Status */}
                  {isLocationConfigured &&
                    locationValidation &&
                    !checkingLocation &&
                    !validating && (
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {!locationValidation.isWithinRadius &&
                            `${t("tooFarFromOffice")}`}
                        </span>
                        <span className="font-medium">
                          {t("distanceFromOffice", {
                            distance: locationValidation.distance,
                          })}
                        </span>
                      </div>
                    )}

                  {/* 4. Checking Status (Sub-info) */}
                  {(checkingLocation || validating) && !locationValidation && (
                    <div className="flex flex-col gap-1">
                      <span className="animate-pulse font-medium">
                        {t("updatingLocation")}
                      </span>
                      {currentAccuracy && (
                        <span className="text-xs font-mono text-primary animate-pulse">
                          {t("locationAccuracy", {
                            accuracy: Math.round(currentAccuracy),
                          })}
                        </span>
                      )}
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
          )}

          <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm text-center font-medium text-muted-foreground">
                {t("checkIn")}
              </p>
              <p className="text-xl text-center font-bold">
                {attendance?.checkIn
                  ? formatter.dateTime(new Date(attendance.checkIn), {
                      hour: "numeric",
                      minute: "numeric",
                    })
                  : "--:--"}
              </p>
            </div>
            <div>
              <p className="text-sm text-center font-medium text-muted-foreground">
                {t("checkOut")}
              </p>
              <p className="text-xl text-center font-bold">
                {attendance?.checkOut
                  ? formatter.dateTime(new Date(attendance.checkOut), {
                      hour: "numeric",
                      minute: "numeric",
                    })
                  : "--:--"}
              </p>
            </div>
          </div>

          {!attendance?.checkIn && (
            <Button
              className="w-full"
              size="lg"
              onClick={handleCheckIn}
              disabled={isButtonDisabled}
            >
              {actionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("checkIn")}
            </Button>
          )}

          {attendance?.checkIn && !attendance.checkOut && (
            <Button
              className="w-full"
              variant="outline"
              size="lg"
              onClick={handleCheckOut}
              disabled={isButtonDisabled}
            >
              {actionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("checkOut")}
            </Button>
          )}

          {attendance?.checkIn && attendance.checkOut && (
            <Button className="w-full" variant="secondary" size="lg" disabled>
              {t("dayComplete")}
            </Button>
          )}

          {/* Refresh location button */}
          {!checkingLocation && !validating && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => checkLocation()}
              className="w-full"
            >
              {/* <MapPin className="mr-2 h-4 w-4" /> */}
              {t("refreshLocation")}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      <Dialog open={showQrModal} onOpenChange={closeQrModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("scanQrToVerify")}</DialogTitle>
            <DialogDescription>{t("waitingForVerification")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 py-4">
            {qrUrl && (
              <>
                <QRCodeCanvas value={qrUrl} size={256} level="H" />
                <p className="text-sm text-muted-foreground text-center">
                  {t("scanQrToVerify")}
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
