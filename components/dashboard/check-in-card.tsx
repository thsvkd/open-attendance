"use client";

import { useEffect, useReducer, useCallback, useRef } from "react";
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

// Consolidated state using reducer pattern
interface State {
  now: Date;
  loading: boolean;
  actionLoading: boolean;
  attendance: Attendance | null;
  showQrModal: boolean;
  qrSessionToken: string | null;
}

type Action =
  | { type: "SET_NOW"; payload: Date }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ACTION_LOADING"; payload: boolean }
  | { type: "SET_ATTENDANCE"; payload: Attendance | null }
  | { type: "SET_SHOW_QR_MODAL"; payload: boolean }
  | { type: "SET_QR_SESSION_TOKEN"; payload: string | null }
  | { type: "CLOSE_QR_MODAL" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_NOW":
      return { ...state, now: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "SET_ACTION_LOADING":
      return { ...state, actionLoading: action.payload };
    case "SET_ATTENDANCE":
      return { ...state, attendance: action.payload };
    case "SET_SHOW_QR_MODAL":
      return { ...state, showQrModal: action.payload };
    case "SET_QR_SESSION_TOKEN":
      return { ...state, qrSessionToken: action.payload };
    case "CLOSE_QR_MODAL":
      return { ...state, showQrModal: false, qrSessionToken: null };
    default:
      return state;
  }
}

const initialState: State = {
  now: new Date(),
  loading: true,
  actionLoading: false,
  attendance: null,
  showQrModal: false,
  qrSessionToken: null,
};

export function CheckInCard({
  isCompanyLocationConfigured: isLocationConfigured,
  isAdmin,
}: CheckInCardProps) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const t = useTranslations("dashboard");
  const formatter = useFormatter();
  const isMobile = isMobileDevice();

  const {
    loading: checkingLocation,
    accuracy: currentAccuracy,
    error: locationError,
    warning: locationWarning,
    validation: locationValidation,
    validating,
    refresh: checkLocation,
    getLocationData,
  } = useLocation({
    enabled: isLocationConfigured,
    validateOnServer: isLocationConfigured,
    autoFetch: true,
  });

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

  // Update clock every minute instead of every second for better performance
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      dispatch({ type: "SET_NOW", payload: now });
    };

    // Update immediately
    updateClock();

    // Then update every minute
    const timer = setInterval(updateClock, 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchAttendance = useCallback(async () => {
    try {
      const res = await axios.get("/api/attendance/today");
      dispatch({ type: "SET_ATTENDANCE", payload: res.data });
    } catch (error) {
      console.error(error);
    } finally {
      dispatch({ type: "SET_LOADING", payload: false });
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const handleCheckIn = async () => {
    if (isMobile) {
      await performCheckIn();
    } else {
      await initiateQrFlow("CHECK_IN");
    }
  };

  const handleCheckOut = async () => {
    if (isMobile) {
      await performCheckOut();
    } else {
      await initiateQrFlow("CHECK_OUT");
    }
  };

  const performCheckIn = async () => {
    dispatch({ type: "SET_ACTION_LOADING", payload: true });
    try {
      const locationData = getLocationData();
      if (!locationData) {
        toast.error(t("failedToGetLocation"));
        return;
      }

      // Parallel execution: check-in and location refresh
      await Promise.all([
        axios.post("/api/attendance/check-in", locationData),
        checkLocation(),
      ]);

      toast.success(t("checkInSuccess"));
      // Refresh attendance after successful check-in
      await fetchAttendance();
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
      dispatch({ type: "SET_ACTION_LOADING", payload: false });
    }
  };

  const performCheckOut = async () => {
    dispatch({ type: "SET_ACTION_LOADING", payload: true });
    try {
      const locationData = getLocationData();
      if (!locationData) {
        toast.error(t("failedToGetLocation"));
        return;
      }

      // Parallel execution: check-out and location refresh
      await Promise.all([
        axios.post("/api/attendance/check-out", locationData),
        checkLocation(),
      ]);

      toast.success(t("checkOutSuccess"));
      // Refresh attendance after successful check-out
      await fetchAttendance();
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
      dispatch({ type: "SET_ACTION_LOADING", payload: false });
    }
  };

  const initiateQrFlow = async (action: "CHECK_IN" | "CHECK_OUT") => {
    dispatch({ type: "SET_ACTION_LOADING", payload: true });
    try {
      const res = await axios.post("/api/attendance/qr-session", { action });
      dispatch({
        type: "SET_QR_SESSION_TOKEN",
        payload: res.data.sessionToken,
      });
      dispatch({ type: "SET_SHOW_QR_MODAL", payload: true });

      // Start polling for verification
      const interval = setInterval(async () => {
        try {
          const statusRes = await axios.get(
            `/api/attendance/qr-session/${res.data.sessionToken}`,
          );

          if (statusRes.data.status === "VERIFIED") {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            dispatch({ type: "CLOSE_QR_MODAL" });
            toast.success(
              action === "CHECK_IN"
                ? t("checkInSuccess")
                : t("checkOutSuccess"),
            );

            // Parallel execution: fetch attendance and check location
            await Promise.all([fetchAttendance(), checkLocation()]);
          } else if (
            statusRes.data.status === "EXPIRED" ||
            statusRes.data.status === "FAILED"
          ) {
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            dispatch({ type: "CLOSE_QR_MODAL" });
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

      pollingIntervalRef.current = interval;
    } catch (error) {
      console.error("QR session error:", error);
      toast.error("Failed to create verification session");
    } finally {
      dispatch({ type: "SET_ACTION_LOADING", payload: false });
    }
  };

  const closeQrModal = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    dispatch({ type: "CLOSE_QR_MODAL" });
  };

  const isButtonDisabled: boolean =
    state.actionLoading ||
    checkingLocation ||
    validating ||
    !!(locationValidation && !locationValidation.isWithinRadius);

  if (state.loading) {
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
    state.qrSessionToken && typeof window !== "undefined"
      ? `${window.location.origin}/verify-attendance?token=${state.qrSessionToken}`
      : "";

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("todayAttendance")}</CardTitle>
          <CardDescription>
            {formatter.dateTime(state.now, {
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
            locationWarning ||
            locationValidation ||
            !isLocationConfigured) && (
            <Alert
              variant={
                translatedLocationError ||
                (locationValidation && !locationValidation.isWithinRadius) ||
                !isLocationConfigured
                  ? "destructive"
                  : locationWarning
                    ? "default"
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

                  {/* 3. Location Warning (accuracy between 100m-500m) */}
                  {isLocationConfigured &&
                    !translatedLocationError &&
                    locationWarning && (
                      <span className="font-medium text-amber-600 dark:text-amber-500">
                        ⚠️ {locationWarning}
                      </span>
                    )}

                  {/* 4. Validation Status */}
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

                  {/* 5. Checking Status (Sub-info) */}
                  {(checkingLocation || validating) && !locationValidation && (
                    <div className="flex flex-col gap-1">
                      <span className="animate-pulse font-medium">
                        {t("updatingLocation")}
                      </span>
                      {currentAccuracy && currentAccuracy !== Infinity && (
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
                {state.attendance?.checkIn
                  ? formatter.dateTime(new Date(state.attendance.checkIn), {
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
                {state.attendance?.checkOut
                  ? formatter.dateTime(new Date(state.attendance.checkOut), {
                      hour: "numeric",
                      minute: "numeric",
                    })
                  : "--:--"}
              </p>
            </div>
          </div>

          {!state.attendance?.checkIn && (
            <Button
              className="w-full"
              size="lg"
              onClick={handleCheckIn}
              disabled={isButtonDisabled}
            >
              {state.actionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("checkIn")}
            </Button>
          )}

          {state.attendance?.checkIn && !state.attendance.checkOut && (
            <Button
              className="w-full"
              variant="outline"
              size="lg"
              onClick={handleCheckOut}
              disabled={isButtonDisabled}
            >
              {state.actionLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {t("checkOut")}
            </Button>
          )}

          {state.attendance?.checkIn && state.attendance.checkOut && (
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
              {t("refreshLocation")}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* QR Code Modal */}
      <Dialog open={state.showQrModal} onOpenChange={closeQrModal}>
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
