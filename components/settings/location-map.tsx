"use client";

import { Map, MapMarker, useKakaoLoader } from "react-kakao-maps-sdk";
import { Loader2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LocationMapProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lng: number) => void;
}

export default function LocationMap({
  latitude,
  longitude,
  onLocationChange,
}: LocationMapProps) {
  const [loading, error] = useKakaoLoader({
    appkey: process.env.NEXT_PUBLIC_KAKAO_API_KEY as string,
    libraries: ["services", "clusterer", "drawing"],
  });

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-muted rounded-lg">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-destructive/5 text-destructive rounded-lg border border-destructive/20 p-6 text-center space-y-4">
        <div className="flex flex-col items-center gap-2">
          <p className="font-bold text-lg">Kakao Maps 로드 실패</p>
          <p className="text-sm opacity-80 max-w-xs">
            JavaScript 키가 올바른지, 그리고 Kakao Developers 설정에서 현재
            도메인(localhost)이 등록되어 있는지 확인해주세요.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() =>
            window.open("https://developers.kakao.com/console/app", "_blank")
          }
        >
          <ExternalLink className="h-4 w-4" />
          카카오 설정으로 이동
        </Button>
      </div>
    );
  }

  return (
    <Map
      center={{ lat: latitude, lng: longitude }}
      style={{ width: "100%", height: "100%" }}
      level={3}
      onClick={(_t, mouseEvent) => {
        onLocationChange(
          mouseEvent.latLng.getLat(),
          mouseEvent.latLng.getLng(),
        );
      }}
    >
      <MapMarker
        position={{ lat: latitude, lng: longitude }}
        draggable={true}
        onDragEnd={(marker) => {
          onLocationChange(
            marker.getPosition().getLat(),
            marker.getPosition().getLng(),
          );
        }}
      />
    </Map>
  );
}
