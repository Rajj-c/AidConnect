"use client";
// This file is loaded dynamically (SSR: false) from LocationPicker.tsx
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default Leaflet icon in Next.js
const icon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface Props {
  initialLat?: number;
  initialLng?: number;
  flyTo?: [number, number] | null;
  onPinChange: (lat: number, lng: number) => void;
}

/** Handles clicks on the map to move the pin */
function ClickHandler({ onPinChange }: { onPinChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPinChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

/** Flies the map to a new location when flyTo changes */
function FlyController({ flyTo }: { flyTo: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (flyTo) map.flyTo(flyTo, 16, { animate: true, duration: 1.2 });
  }, [flyTo, map]);
  return null;
}

export default function LocationPickerMap({ initialLat, initialLng, flyTo, onPinChange }: Props) {
  const [pin, setPin] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  );

  // Sync external flyTo to local pin
  useEffect(() => {
    if (flyTo) {
      setPin(flyTo);
      onPinChange(flyTo[0], flyTo[1]);
    }
  }, [flyTo]);

  function handleClick(lat: number, lng: number) {
    setPin([lat, lng]);
    onPinChange(lat, lng);
  }

  const center: [number, number] = pin ?? flyTo ?? [13.0827, 80.2707]; // Default: Chennai

  return (
    <MapContainer
      center={center}
      zoom={pin || flyTo ? 16 : 12}
      className="w-full h-full rounded-xl"
      style={{ cursor: "crosshair" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="© OpenStreetMap contributors"
      />
      <ClickHandler onPinChange={handleClick} />
      <FlyController flyTo={flyTo} />
      {pin && <Marker position={pin} icon={icon} />}
    </MapContainer>
  );
}
