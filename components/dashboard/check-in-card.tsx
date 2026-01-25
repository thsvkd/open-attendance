"use client";

import { useEffect, useState } from "react";
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
import { format } from "date-fns";
import axios from "axios";
import { toast } from "sonner";
import { Loader2, MapPin, AlertCircle } from "lucide-react";
import { useTranslations, useFormatter } from "next-intl";
import { getCurrentLocation, isMobileDevice } from "@/lib/location-utils";
import { QRCodeCanvas } from "qrcode.react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Attendance {
  id: string;
  checkIn: string | null;
  checkOut: string | null;
}

interface LocationValidation {
  isWithinRadius: boolean;
  distance: number;
  allowedRadius: number;
}

export function CheckInCard() {
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [attendance, setAttendance] = useState<Attendance | null>(null);
  const [locationValidation, setLocationValidation] =
    useState<LocationValidation | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrSessionToken, setQrSessionToken] = useState<string | null>(null);
  const [qrAction, setQrAction] = useState<"CHECK_IN" | "CHECK_OUT" | null>(
    null,
  );
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(
    null,
  );

  const t = useTranslations("dashboard");
  const formatter = useFormatter();
  const isMobile = isMobileDevice();

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchAttendance();
    checkLocation();
  }, []);

  useEffect(() => {
    // Cleanup polling on unmount
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const fetchAttendance = async () => {
    try {
      const res = await axios.get("/api/attendance/today");
      setAttendance(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const checkLocation = async () => {
    setCheckingLocation(true);
    setLocationError(null);

    try {
      const coords = await getCurrentLocation();

      // Validate location with server
      const res = await axios.post("/api/location/validate", {
        latitude: coords.latitude,
        longitude: coords.longitude,
      });

      setLocationValidation(res.data);
    } catch (error: unknown) {
      console.error("Location check error:", error);
      setLocationError(
        (error as { response?: { data?: { error?: string } } }).response?.data
          ?.error || "Failed to get location",
      );
    } finally {
      setCheckingLocation(false);
    }
  };

  const getLocationData = async () => {
    const coords = await getCurrentLocation();
    return {
      latitude: coords.latitude,
      longitude: coords.longitude,
    };
  };

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
      const locationData = await getLocationData();

      await axios.post("/api/attendance/check-in", locationData);
      toast.success(t("checkInSuccess"));
      fetchAttendance();
      checkLocation();
    } catch (error: unknown) {
      console.error("Check-in error:", error);
      toast.error(
        (error as { response?: { data?: { error?: string } } }).response?.data
          ?.error || t("checkInFailed"),
      );
    } finally {
      setActionLoading(false);
    }
  };

  const performCheckOut = async () => {
    setActionLoading(true);
    try {
      const locationData = await getLocationData();

      await axios.post("/api/attendance/check-out", locationData);
      toast.success(t("checkOutSuccess"));
      fetchAttendance();
      checkLocation();
    } catch (error: unknown) {
      console.error("Check-out error:", error);
      toast.error(
        (error as { response?: { data?: { error?: string } } }).response?.data
          ?.error || t("checkOutFailed"),
      );
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
      setQrAction(action);
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
            checkLocation();
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
    setQrAction(null);
  };

  const isButtonDisabled: boolean =
    actionLoading ||
    checkingLocation ||
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
          {/* Location Status */}
          {checkingLocation && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                {t("grantLocationPermission")}
              </AlertDescription>
            </Alert>
          )}

          {locationError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{locationError}</AlertDescription>
            </Alert>
          )}

          {locationValidation && !locationValidation.isWithinRadius && (
            <Alert variant="destructive">
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                {t("tooFarFromOffice")} -{" "}
                {t("distanceFromOffice", {
                  distance: locationValidation.distance,
                })}
              </AlertDescription>
            </Alert>
          )}

          {locationValidation && locationValidation.isWithinRadius && (
            <Alert>
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                {t("distanceFromOffice", {
                  distance: locationValidation.distance,
                })}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("checkIn")}
              </p>
              <p className="text-xl font-bold">
                {attendance?.checkIn
                  ? format(new Date(attendance.checkIn), "p")
                  : "--:--"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {t("checkOut")}
              </p>
              <p className="text-xl font-bold">
                {attendance?.checkOut
                  ? format(new Date(attendance.checkOut), "p")
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
          {!checkingLocation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={checkLocation}
              className="w-full"
            >
              <MapPin className="mr-2 h-4 w-4" />
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
                  Scan this QR code with your smartphone to complete{" "}
                  {qrAction === "CHECK_IN" ? "check-in" : "check-out"}
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
