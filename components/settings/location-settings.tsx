"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import axios from "axios";
import { Loader2, MapPin, Wifi, X, Search } from "lucide-react";
import dynamic from "next/dynamic";
import { getCurrentLocation } from "@/lib/location-utils";
import { useKakaoLoader } from "react-kakao-maps-sdk";

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

interface SearchResult {
  x: string; // longitude
  y: string; // latitude
  address_name: string;
  place_name?: string;
  category_name?: string;
  type: "address" | "place";
}

interface ReverseGeocodeResult {
  address: {
    address_name: string;
  };
  road_address: {
    address_name: string;
  } | null;
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
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [newWifiSsid, setNewWifiSsid] = useState("");
  const [newWifiBssid, setNewWifiBssid] = useState("");
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isManualChange = useRef(false);

  // Load Kakao Maps SDK at the settings level
  const [isKakaoLoading, kakaoLoadError] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_API_KEY as string,
    libraries: ["services"],
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (isManualChange.current && searchQuery.length > 2) {
        searchAddress(searchQuery);
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 500);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const searchAddress = async (query: string) => {
    if (typeof window === "undefined" || !window.kakao || !window.kakao.maps)
      return;

    setIsSearching(true);
    try {
      const ps = new window.kakao.maps.services.Places();
      const geocoder = new window.kakao.maps.services.Geocoder();

      // Run both keyword and address search
      const [places, addresses] = await Promise.all([
        new Promise<SearchResult[]>((resolve) => {
          ps.keywordSearch(query, (data: unknown, status: string) => {
            if (status === window.kakao.maps.services.Status.OK) {
              const list = data as Array<{
                x: string;
                y: string;
                address_name: string;
                road_address_name?: string;
                place_name?: string;
                category_name?: string;
              }>;
              resolve(
                list.map((item) => ({
                  x: item.x,
                  y: item.y,
                  address_name: item.road_address_name || item.address_name,
                  place_name: item.place_name,
                  category_name: item.category_name?.split(">").pop()?.trim(),
                  type: "place",
                })),
              );
            } else {
              resolve([]);
            }
          });
        }),
        new Promise<SearchResult[]>((resolve) => {
          geocoder.addressSearch(query, (data: unknown, status: string) => {
            if (status === window.kakao.maps.services.Status.OK) {
              const list = data as Array<{
                x: string;
                y: string;
                address_name: string;
              }>;
              resolve(
                list.map((item) => ({
                  x: item.x,
                  y: item.y,
                  address_name: item.address_name,
                  type: "address",
                })),
              );
            } else {
              resolve([]);
            }
          });
        }),
      ]);

      const combined = [...places, ...addresses];
      setSearchResults(combined);
      setShowDropdown(combined.length > 0);
      setIsSearching(false);
    } catch (error) {
      console.error("Search error:", error);
      setIsSearching(false);
    }
  };

  const handleSelectAddress = (result: SearchResult) => {
    const lat = parseFloat(result.y);
    const lon = parseFloat(result.x);

    isManualChange.current = false;
    setLocation((prev: CompanyLocation) => ({
      ...prev,
      latitude: lat,
      longitude: lon,
      address: result.address_name,
    }));

    setSearchQuery(result.place_name || result.address_name);
    setShowDropdown(false);
    setSearchResults([]);
  };

  const reverseGeocode = (lat: number, lng: number) => {
    if (typeof window === "undefined" || !window.kakao || !window.kakao.maps)
      return;

    isManualChange.current = false;
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.coord2Address(
      lng,
      lat,
      (result: ReverseGeocodeResult[], status: string) => {
        if (status === window.kakao.maps.services.Status.OK && result[0]) {
          const addr = result[0].address.address_name;
          setLocation((prev: CompanyLocation) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            address: addr,
          }));
          setSearchQuery(addr);
        } else {
          setLocation((prev: CompanyLocation) => ({
            ...prev,
            latitude: lat,
            longitude: lng,
          }));
        }
      },
    );
  };

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
      setSearchResults([]);
      setShowDropdown(false);
      setIsUpdatingLocation(true); // 버튼 클릭 시 즉시 로딩 상태 표시
      const coords = await getCurrentLocation();
      reverseGeocode(coords.latitude, coords.longitude);
      toast.success(t("currentLocationSet"));
    } catch (error) {
      console.error(
        "Failed to get current location:",
        error instanceof Error ? error.message : error,
      );
      toast.error(t("failedToGetCurrentLocation"));
    } finally {
      setIsUpdatingLocation(false);
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
      toast.error(t("wifiSsidRequired"));
      return;
    }

    if (newWifiBssid.trim()) {
      const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
      if (!macRegex.test(newWifiBssid.trim())) {
        toast.error(t("invalidMacAddress"));
        return;
      }
    }

    try {
      await axios.post("/api/settings/location/wifi", {
        ssid: newWifiSsid,
        bssid: newWifiBssid.trim().toUpperCase() || undefined,
      });
      toast.success(t("wifiAdded"));
      setNewWifiSsid("");
      setNewWifiBssid("");
      fetchLocation();
    } catch (error) {
      console.error("Failed to add WiFi network:", error);
      toast.error(t("wifiAddFailed"));
    }
  };

  const handleRemoveWifiNetwork = async (wifiId: string) => {
    try {
      await axios.delete(`/api/settings/location/wifi/${wifiId}`);
      toast.success(t("wifiRemoved"));
      fetchLocation();
    } catch (error) {
      console.error("Failed to remove WiFi network:", error);
      toast.error(t("wifiRemoveFailed"));
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
            <div className="flex flex-col gap-2 md:flex-row">
              <div
                className="order-2 md:order-1 relative flex-1"
                ref={dropdownRef}
              >
                <div className="relative">
                  <Input
                    placeholder={t("searchPlaceholder")}
                    value={searchQuery}
                    onChange={(e) => {
                      isManualChange.current = true;
                      setSearchQuery(e.target.value);
                      setShowDropdown(true);
                    }}
                    onFocus={() => {
                      if (searchResults.length > 0) setShowDropdown(true);
                    }}
                    className="pl-10 pr-10"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Search Results Dropdown */}
                {showDropdown && searchResults.length > 0 && (
                  <div className="absolute z-50 w-full mt-2 bg-popover border rounded-xl shadow-2xl max-h-72 overflow-auto py-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-accent hover:text-accent-foreground flex items-start gap-3 transition-all first:pt-2 last:pb-2"
                        onClick={() => handleSelectAddress(result)}
                      >
                        <MapPin className="h-5 w-5 mt-0.5 shrink-0 text-primary/70" />
                        <div className="flex flex-col gap-0.5 min-w-0">
                          {result.place_name ? (
                            <>
                              <div className="flex items-center gap-2">
                                <span className="font-bold truncate text-base">
                                  {result.place_name}
                                </span>
                                {result.category_name && (
                                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold uppercase tracking-wider shrink-0">
                                    {result.category_name}
                                  </span>
                                )}
                              </div>
                              <span className="text-muted-foreground truncate leading-relaxed">
                                {result.address_name}
                              </span>
                            </>
                          ) : (
                            <span className="font-medium truncate text-base py-1">
                              {result.address_name}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searchQuery.length > 2 &&
                  !isSearching &&
                  showDropdown &&
                  searchResults.length === 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-popover border rounded-xl shadow-xl py-8 text-center animate-in fade-in slide-in-from-top-2 duration-300">
                      <div className="flex flex-col items-center gap-2">
                        <Search className="h-8 w-8 text-muted-foreground/30" />
                        <p className="text-sm font-medium text-muted-foreground">
                          {t("noResultsFound")}
                        </p>
                      </div>
                    </div>
                  )}
              </div>
              <Button
                variant="outline"
                onClick={handleUseCurrentLocation}
                className="order-1 md:order-2 shrink-0 relative"
                disabled={isUpdatingLocation}
              >
                <div className="flex items-center gap-2">
                  {isUpdatingLocation ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      <span className="text-sm animate-pulse">
                        {t("updatingLocation")}
                      </span>
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 shrink-0" />
                      <span>{t("currentLocation")}</span>
                    </>
                  )}
                </div>
              </Button>
            </div>
          </div>

          {/* Map */}
          <div className="h-96 rounded-lg overflow-hidden border">
            {kakaoLoadError ? (
              <div className="h-full flex items-center justify-center bg-muted/30 px-6 text-center">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-destructive">
                    {t("kakaoLoadFailed")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("kakaoLoadErrorDescription")}
                  </p>
                </div>
              </div>
            ) : isKakaoLoading ? (
              <div className="h-full flex items-center justify-center bg-muted/20">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <LocationMap
                latitude={location.latitude}
                longitude={location.longitude}
                onLocationChange={(lat, lng) => {
                  reverseGeocode(lat, lng);
                }}
              />
            )}
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
          <CardDescription>{t("wifiDescription")}</CardDescription>
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
                  placeholder={t("wifiSsidPlaceholder")}
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
