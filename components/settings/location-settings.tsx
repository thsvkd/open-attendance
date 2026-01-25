"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import axios from "axios";
import { Loader2, MapPin, Wifi, X } from "lucide-react";
import dynamic from "next/dynamic";
import { getCurrentLocation } from "@/lib/location-utils";

// Dynamically import map component to avoid SSR issues
const LocationMap = dynamic(
  () => import("@/components/settings/location-map"),
  {
    ssr: false,
    loading: () => (
      <div className="h-96 flex items-center justify-center bg-muted rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    ),
  },
);

interface CompanyLocation {
  id?: string;
  latitude: number;
  longitude: number;
  radius: number;
  address?: string;
  registeredWifiNetworks?: Array<{
    id: string;
    ssid: string;
    bssid?: string;
  }>;
}

export function LocationSettings() {
  const t = useTranslations("settings.location");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [location, setLocation] = useState<CompanyLocation>({
    latitude: 37.5665,
    longitude: 126.978,
    radius: 100,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [newWifiSsid, setNewWifiSsid] = useState("");
  const [newWifiBssid, setNewWifiBssid] = useState("");

  useEffect(() => {
    fetchLocation();
  }, []);

  const fetchLocation = async () => {
    try {
      const res = await axios.get("/api/settings/location");
      if (res.data) {
        setLocation(res.data);
      }
    } catch (error) {
      console.error("Failed to fetch location:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    try {
      toast.info(t("gettingLocation"));
      const coords = await getCurrentLocation();
      setLocation((prev) => ({
        ...prev,
        latitude: coords.latitude,
        longitude: coords.longitude,
      }));
      toast.success("Current location set");
    } catch (error) {
      console.error("Failed to get current location:", error);
      toast.error("Failed to get current location");
    }
  };

  const handleSaveLocation = async () => {
    setSaving(true);
    try {
      await axios.post("/api/settings/location", {
        latitude: location.latitude,
        longitude: location.longitude,
        radius: location.radius,
        address: location.address,
      });
      toast.success(t("saveSuccess"));
      fetchLocation();
    } catch (error) {
      console.error("Failed to save location:", error);
      toast.error(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleAddWifiNetwork = async () => {
    if (!newWifiSsid.trim()) {
      toast.error("WiFi SSID is required");
      return;
    }

    try {
      await axios.post("/api/settings/location/wifi", {
        ssid: newWifiSsid,
        bssid: newWifiBssid || undefined,
      });
      toast.success("WiFi network added");
      setNewWifiSsid("");
      setNewWifiBssid("");
      fetchLocation();
    } catch (error) {
      console.error("Failed to add WiFi network:", error);
      toast.error("Failed to add WiFi network");
    }
  };

  const handleRemoveWifiNetwork = async (wifiId: string) => {
    try {
      await axios.delete(`/api/settings/location/wifi/${wifiId}`);
      toast.success("WiFi network removed");
      fetchLocation();
    } catch (error) {
      console.error("Failed to remove WiFi network:", error);
      toast.error("Failed to remove WiFi network");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Search and Current Location */}
          <div className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder={t("searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button
                variant="outline"
                onClick={handleUseCurrentLocation}
                className="shrink-0"
              >
                <MapPin className="h-4 w-4 mr-2" />
                {t("currentLocation")}
              </Button>
            </div>
          </div>

          {/* Map */}
          <div className="h-96 rounded-lg overflow-hidden border">
            <LocationMap
              latitude={location.latitude}
              longitude={location.longitude}
              onLocationChange={(lat, lng) => {
                setLocation((prev) => ({
                  ...prev,
                  latitude: lat,
                  longitude: lng,
                }));
              }}
            />
          </div>

          {/* Location Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t("latitude")}</Label>
              <Input
                type="number"
                step="any"
                value={location.latitude}
                onChange={(e) => {
                  const lat = parseFloat(e.target.value);
                  if (!isNaN(lat)) {
                    setLocation((prev) => ({
                      ...prev,
                      latitude: lat,
                    }));
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("longitude")}</Label>
              <Input
                type="number"
                step="any"
                value={location.longitude}
                onChange={(e) => {
                  const lng = parseFloat(e.target.value);
                  if (!isNaN(lng)) {
                    setLocation((prev) => ({
                      ...prev,
                      longitude: lng,
                    }));
                  }
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("radius")}</Label>
              <Input
                type="number"
                value={location.radius}
                onChange={(e) =>
                  setLocation((prev) => ({
                    ...prev,
                    radius: parseInt(e.target.value, 10),
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>{t("address")}</Label>
              <Input
                value={location.address || ""}
                onChange={(e) =>
                  setLocation((prev) => ({ ...prev, address: e.target.value }))
                }
              />
            </div>
          </div>

          <Button onClick={handleSaveLocation} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("saveLocation")}
          </Button>
        </CardContent>
      </Card>

      {/* WiFi Networks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            {t("wifiNetworks")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add WiFi Network */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>{t("wifiSsid")}</Label>
                <Input
                  value={newWifiSsid}
                  onChange={(e) => setNewWifiSsid(e.target.value)}
                  placeholder="Company WiFi"
                />
              </div>
              <div className="space-y-2">
                <Label>{t("wifiBssid")}</Label>
                <Input
                  value={newWifiBssid}
                  onChange={(e) => setNewWifiBssid(e.target.value)}
                  placeholder="AA:BB:CC:DD:EE:FF"
                />
              </div>
            </div>
            <Button onClick={handleAddWifiNetwork} variant="outline">
              {t("addWifiNetwork")}
            </Button>
          </div>

          {/* WiFi Network List */}
          <div className="space-y-2">
            {!location.registeredWifiNetworks ||
            location.registeredWifiNetworks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t("noWifiNetworks")}
              </p>
            ) : (
              location.registeredWifiNetworks.map((wifi) => (
                <div
                  key={wifi.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{wifi.ssid}</p>
                    {wifi.bssid && (
                      <p className="text-sm text-muted-foreground">
                        {wifi.bssid}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveWifiNetwork(wifi.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
