"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { subscribeToNeeds, NeedDoc } from "@/lib/firestore";

export default function MapComponent() {
  const [needs, setNeeds] = useState<NeedDoc[]>([]);

  useEffect(() => {
    return subscribeToNeeds(setNeeds);
  }, []);

  useEffect(() => {
    // Fix Leaflet's default icon path issues with Webpack
    delete (L.Icon.Default.prototype as any)._getIconUrl;

    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
  }, []);

  const redIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const orangeIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const center: [number, number] = [17.440080, 78.348916];

  function getCoords(m: NeedDoc, index: number): [number, number] {
    if (m.lat && m.lng) {
      return [m.lat, m.lng];
    }
    const hash = m.location.split('').reduce((a, b) => a + b.charCodeAt(0), 0) + index * 10;
    const offsetLat = (hash % 100 - 50) * 0.0008;
    const offsetLng = ((hash * 7) % 100 - 50) * 0.0008;
    return [center[0] + offsetLat, center[1] + offsetLng];
  }

  return (
    <MapContainer center={center} zoom={13} className="w-full h-full z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {needs.map((m: NeedDoc, idx: number) => {
        const isEmergency = m.priority === "High";
        return (
          <Marker key={m.id || idx} position={getCoords(m, idx)} icon={isEmergency ? redIcon : orangeIcon}>
            <Popup>
              <div className="font-sans">
                <strong>{m.description}</strong>
                <br />
                {isEmergency ? (
                  <span className="text-red-500 font-bold text-xs uppercase tracking-wide">High Priority Alert</span>
                ) : (
                  <span className="text-orange-500 font-bold text-xs uppercase tracking-wide">Moderate Need</span>
                )}
                <div className="text-[10px] text-muted-foreground mt-1">{m.location}</div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
