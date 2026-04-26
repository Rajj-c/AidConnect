"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { subscribeToNeeds, subscribeToVolunteers, NeedDoc, VolunteerDoc } from "@/lib/firestore";

// Shared center for Hyderabad area
export const MAP_CENTER: [number, number] = [17.440080, 78.348916];

export function getCoords(m: { lat?: number, lng?: number, location?: string }, index: number): [number, number] {
  if (m.lat && m.lng) return [m.lat, m.lng];
  const hash = (m.location || "").split("").reduce((a, b) => a + b.charCodeAt(0), 0) + index * 10;
  return [MAP_CENTER[0] + (hash % 100 - 50) * 0.0008, MAP_CENTER[1] + ((hash * 7) % 100 - 50) * 0.0008];
}

function MapBoundsFitter({ items }: { items: { lat?: number, lng?: number }[] }) {
  const map = useMap();
  useEffect(() => {
    const coords = items.filter(n => n.lat && n.lng).map(n => [n.lat!, n.lng!] as [number, number]);
    if (coords.length > 0) map.fitBounds(L.latLngBounds(coords), { padding: [50, 50], maxZoom: 15 });
  }, [items, map]);
  return null;
}

/** Simple dashboard widget map — used on the main dashboard */
export default function MapComponent() {
  const [needs, setNeeds] = useState<NeedDoc[]>([]);

  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
    return subscribeToNeeds(setNeeds);
  }, []);

  const redIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
  });
  const orangeIcon = new L.Icon({
    iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
  });

  return (
    <MapContainer center={MAP_CENTER} zoom={13} className="w-full h-full z-0">
      <MapBoundsFitter items={needs} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {needs.map((m, idx) => {
        const isHigh = m.priority === "High";
        const pos = getCoords(m, idx);
        return (
          <Marker key={m.id || idx} position={pos} icon={isHigh ? redIcon : orangeIcon}>
            <Popup>
              <div className="font-sans">
                <strong>{m.description}</strong><br />
                {isHigh
                  ? <span className="text-red-500 font-bold text-xs uppercase">High Priority Alert</span>
                  : <span className="text-orange-500 font-bold text-xs uppercase">Moderate Need</span>}
                <div className="text-[10px] text-gray-400 mt-1">{m.location}</div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}

import { TaskDoc, FieldReport } from "@/lib/firestore";

/** Full heatmap version — used on the dedicated /dashboard/heatmap page */
export function HeatmapComponent({ tasks = [], reports = [], volunteers = [] }: { tasks?: TaskDoc[], reports?: FieldReport[], volunteers?: VolunteerDoc[] }) {
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
  }, []);

  // Volunteer icon — small green dot
  const volIcon = L.divIcon({
    html: `<div style="width:12px;height:12px;border-radius:50%;background:#22c55e;border:2px solid white;box-shadow:0 0 4px rgba(34,197,94,0.6)"></div>`,
    className: "",
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });

  return (
    <MapContainer center={MAP_CENTER} zoom={13} className="w-full h-full z-0">
      <MapBoundsFitter items={[...tasks, ...reports]} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Heat circles for each task */}
      {tasks.filter(t => t.status !== "Completed").map((m, idx) => {
        const pos = getCoords(m, idx);
        const isHigh = m.priority === "High";
        const isMed = m.priority === "Medium";
        const outerColor = isHigh ? "#ef4444" : isMed ? "#f59e0b" : "#22c55e";
        const outerOpacity = isHigh ? 0.18 : isMed ? 0.14 : 0.10;
        const innerColor = isHigh ? "#dc2626" : isMed ? "#d97706" : "#16a34a";
        const radius = isHigh ? 500 : isMed ? 350 : 220;

        return (
          <div key={m.id || idx}>
            <Circle center={pos} radius={radius} pathOptions={{ color: outerColor, fillColor: outerColor, fillOpacity: outerOpacity, weight: 0 }} />
            <Circle center={pos} radius={radius * 0.4} pathOptions={{ color: innerColor, fillColor: innerColor, fillOpacity: 0.45, weight: 1.5, dashArray: isHigh ? "4 2" : undefined }}>
              <Popup>
                <div className="font-sans min-w-[180px]">
                  <div className="font-bold text-sm mb-1">{m.title}</div>
                  <div className="flex gap-1 items-center mb-1">
                    <span style={{ background: outerColor }} className="inline-block w-2 h-2 rounded-full" />
                    <span className="text-xs font-bold" style={{ color: outerColor }}>{m.priority} Priority Task</span>
                    <span className="text-xs text-gray-400 ml-auto">{m.category}</span>
                  </div>
                  <div className="text-[11px] text-gray-500">{m.location}</div>
                  {m.fieldSummary?.totalBeneficiaries && (
                    <div className="text-[11px] mt-1 text-gray-500">~{m.fieldSummary.totalBeneficiaries} beneficiaries</div>
                  )}
                </div>
              </Popup>
            </Circle>
          </div>
        );
      })}

      {/* Heat circles for AI Reports */}
      {reports.filter(r => r.status !== "ActionTaken").map((r, idx) => {
        const pos = getCoords(r, idx + 1000); // offset index
        const isHigh = r.severity?.level === "Critical" || r.severity?.level === "High";
        const isMed = r.severity?.level === "Medium";
        const outerColor = isHigh ? "#ef4444" : isMed ? "#f59e0b" : "#3b82f6";
        const outerOpacity = isHigh ? 0.15 : isMed ? 0.10 : 0.08;
        const innerColor = isHigh ? "#b91c1c" : isMed ? "#b45309" : "#1d4ed8";
        const radius = isHigh ? 450 : isMed ? 300 : 200;

        return (
          <div key={r.id || idx}>
            <Circle center={pos} radius={radius} pathOptions={{ color: outerColor, fillColor: outerColor, fillOpacity: outerOpacity, weight: 0 }} />
            <Circle center={pos} radius={radius * 0.3} pathOptions={{ color: innerColor, fillColor: innerColor, fillOpacity: 0.3, weight: 1.5 }}>
              <Popup>
                <div className="font-sans min-w-[180px]">
                  <div className="font-bold text-xs mb-1 uppercase tracking-wider text-blue-600">AI Field Report</div>
                  <div className="text-sm mb-1">{r.summary?.substring(0, 80)}...</div>
                  <div className="flex gap-1 items-center mb-1">
                    <span style={{ background: outerColor }} className="inline-block w-2 h-2 rounded-full" />
                    <span className="text-[10px] font-bold" style={{ color: outerColor }}>{r.severity?.level || "Unknown"} Severity</span>
                  </div>
                  <div className="text-[11px] text-gray-500">{r.location}</div>
                </div>
              </Popup>
            </Circle>
          </div>
        );
      })}

      {/* Volunteer location dots */}
      {volunteers.map((v, idx) => {
        if (!v.lat && !v.lng) return null;
        return (
          <Marker
            key={v.id || idx}
            position={[v.lat!, v.lng!]}
            icon={volIcon}
          >
            <Popup>
              <div className="font-sans">
                <div className="font-bold text-xs">{v.name}</div>
                <div className="text-[10px] text-gray-500">{v.role}</div>
                <div className="text-[10px] mt-1">
                  <span className={`font-bold ${v.status === "Available" ? "text-green-600" : "text-amber-600"}`}>
                    ● {v.status}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
