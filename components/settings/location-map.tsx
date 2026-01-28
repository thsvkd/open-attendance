"use client";

import { useEffect, useRef } from "react";
import { Map, MapMarker } from "react-kakao-maps-sdk";

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
  const mapRef = useRef<{ relayout: () => void } | null>(null);

  useEffect(() => {
    const handleResize = () => {
      mapRef.current?.relayout();
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Map
      center={{ lat: latitude, lng: longitude }}
      style={{ width: "100%", height: "100%" }}
      level={3}
      onCreate={(map) => {
        mapRef.current = map;
        requestAnimationFrame(() => map.relayout());
      }}
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
