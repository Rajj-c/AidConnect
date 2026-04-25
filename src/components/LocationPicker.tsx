"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Locate, Search, Loader2, CheckCircle2, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const DynamicMap = dynamic(() => import("@/components/LocationPickerMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-blue-50 rounded-xl text-muted-foreground gap-2">
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      <span className="text-sm">Loading map...</span>
    </div>
  ),
});

export interface PickedLocation {
  address: string;
  lat: number;
  lng: number;
}

interface Props {
  label?: string;
  placeholder?: string;
  onSelect: (location: PickedLocation) => void;
  defaultValue?: string;
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
    { headers: { "Accept-Language": "en" } }
  );
  const data = await res.json();
  return data.display_name ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

async function searchLocation(query: string): Promise<{ lat: number; lng: number; display_name: string } | null> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
    { headers: { "Accept-Language": "en" } }
  );
  const results = await res.json();
  if (!results.length) return null;
  const r = results[0];
  return { lat: parseFloat(r.lat), lng: parseFloat(r.lon), display_name: r.display_name };
}

export function LocationPicker({ label = "Location", placeholder = "e.g. Anna Nagar, Trichy", onSelect, defaultValue = "" }: Props) {
  const [mapOpen, setMapOpen] = useState(false);
  const [address, setAddress] = useState(defaultValue);
  const [searchQuery, setSearchQuery] = useState("");
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [pinLat, setPinLat] = useState<number | null>(null);
  const [pinLng, setPinLng] = useState<number | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [searching, setSearching] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // ── GPS Detection ──────────────────────────────────────────────────────────
  async function handleDetect() {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", description: "Use map to pin location manually.", variant: "destructive" });
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const addr = await reverseGeocode(lat, lng);
          setAddress(addr);
          setPinLat(lat);
          setPinLng(lng);
          setFlyTo([lat, lng]);
          setConfirmed(true);
          setMapOpen(true);
          onSelect({ address: addr, lat, lng });
          toast({ title: "📍 Location detected!", description: addr.split(",").slice(0, 3).join(", ") });
        } catch {
          toast({ title: "Reverse geocode failed", description: "Got coordinates but couldn't fetch address.", variant: "destructive" });
        } finally {
          setDetecting(false);
        }
      },
      (err) => {
        setDetecting(false);
        toast({ title: "Location access denied", description: "Please allow location access or pin manually.", variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // ── Area Search ────────────────────────────────────────────────────────────
  async function handleAreaSearch() {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const result = await searchLocation(searchQuery);
      if (!result) {
        toast({ title: "Area not found", description: "Try a more specific area name.", variant: "destructive" });
        return;
      }
      setFlyTo([result.lat, result.lng]);
      setAddress(result.display_name);
      toast({ title: "Found! Click on the map to pin exact spot.", description: result.display_name.split(",").slice(0, 3).join(", ") });
    } finally {
      setSearching(false);
    }
  }

  // ── Map pin moved ──────────────────────────────────────────────────────────
  const handlePinChange = useCallback(async (lat: number, lng: number) => {
    setPinLat(lat);
    setPinLng(lng);
    // Debounced reverse geocode on pin movement
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const addr = await reverseGeocode(lat, lng);
        setAddress(addr);
        onSelect({ address: addr, lat, lng });
        setConfirmed(true);
      } catch { /* ignore */ }
    }, 600);
  }, [onSelect]);

  function handleConfirm() {
    if (!pinLat || !pinLng) {
      toast({ title: "Pin a location first", description: "Click on the map to pin an exact spot.", variant: "destructive" });
      return;
    }
    onSelect({ address, lat: pinLat, lng: pinLng });
    setConfirmed(true);
    setMapOpen(false);
    toast({ title: "Location saved ✓" });
  }

  function handleClear() {
    setAddress("");
    setPinLat(null);
    setPinLng(null);
    setFlyTo(null);
    setConfirmed(false);
    onSelect({ address: "", lat: 0, lng: 0 });
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {/* Current address display */}
      {confirmed && address ? (
        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800 truncate">{address.split(",").slice(0, 3).join(", ")}</p>
            {pinLat && <p className="text-[10px] text-green-600 mt-0.5">{pinLat.toFixed(5)}, {pinLng?.toFixed(5)}</p>}
          </div>
          <button onClick={handleClear} className="text-green-400 hover:text-green-600 shrink-0">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <Input
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder={placeholder}
          className="bg-white"
        />
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs flex-1 border-primary/40 text-primary hover:bg-primary/5"
          onClick={handleDetect}
          disabled={detecting}
        >
          {detecting
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Detecting...</>
            : <><Locate className="h-3.5 w-3.5" /> Detect My Location</>
          }
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs flex-1"
          onClick={() => setMapOpen(v => !v)}
        >
          <MapPin className="h-3.5 w-3.5" />
          {mapOpen ? "Hide Map" : "Pin on Map"}
        </Button>
      </div>

      {/* Expandable map panel */}
      {mapOpen && (
        <div className="rounded-xl border overflow-hidden shadow-sm space-y-0">
          {/* Area search bar */}
          <div className="flex gap-2 p-3 bg-white border-b">
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAreaSearch()}
              placeholder="Type area name to zoom in (e.g. Anna Nagar)"
              className="text-sm h-8"
            />
            <Button
              type="button"
              size="sm"
              className="h-8 gap-1.5 text-xs shrink-0"
              onClick={handleAreaSearch}
              disabled={searching}
            >
              {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
              Search
            </Button>
          </div>

          <p className="text-[10px] text-center text-muted-foreground bg-slate-50 py-1.5 border-b">
            🖱️ Click anywhere on the map to drop a pin at the exact location
          </p>

          {/* Map */}
          <div className="h-72 relative">
            <DynamicMap
              initialLat={pinLat ?? undefined}
              initialLng={pinLng ?? undefined}
              flyTo={flyTo}
              onPinChange={handlePinChange}
            />
          </div>

          {/* Reverse-geocoded address preview */}
          {address && (
            <div className="px-3 py-2 bg-white border-t flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <p className="text-xs text-slate-600 flex-1 truncate">{address.split(",").slice(0, 4).join(", ")}</p>
              <Button type="button" size="sm" className="h-7 text-xs gap-1 shrink-0" onClick={handleConfirm}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Use This
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
