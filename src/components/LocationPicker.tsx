"use client";

import dynamic from "next/dynamic";
import { useState, useCallback, useRef, useEffect } from "react";
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

interface Suggestion {
  display_name: string;
  lat: string;
  lon: string;
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

async function fetchSuggestions(query: string): Promise<Suggestion[]> {
  if (query.trim().length < 3) return [];
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&countrycodes=in&addressdetails=1`,
    { headers: { "Accept-Language": "en" } }
  );
  return res.json();
}

export function LocationPicker({
  label = "Location",
  placeholder = "e.g. Anna Nagar, Trichy or pincode 641001",
  onSelect,
  defaultValue = "",
}: Props) {
  const [mapOpen, setMapOpen] = useState(false);
  const [address, setAddress] = useState(defaultValue);
  const [searchQuery, setSearchQuery] = useState("");
  const [flyTo, setFlyTo] = useState<[number, number] | null>(null);
  const [pinLat, setPinLat] = useState<number | null>(null);
  const [pinLng, setPinLng] = useState<number | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  // Autocomplete state
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const autocompleteRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pinDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced autocomplete as user types
  function handleSearchInput(value: string) {
    setSearchQuery(value);
    setShowDropdown(true);

    if (autocompleteRef.current) clearTimeout(autocompleteRef.current);

    if (value.trim().length < 3) {
      setSuggestions([]);
      setLoadingSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    autocompleteRef.current = setTimeout(async () => {
      try {
        const results = await fetchSuggestions(value);
        setSuggestions(results);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 350); // 350ms debounce — fast but not hammering Nominatim
  }

  // User selects a suggestion from dropdown
  function handleSuggestionSelect(s: Suggestion) {
    const lat = parseFloat(s.lat);
    const lng = parseFloat(s.lon);
    const shortName = s.display_name.split(",").slice(0, 3).join(", ");
    setSearchQuery(shortName);
    setFlyTo([lat, lng]);
    setAddress(s.display_name);
    setSuggestions([]);
    setShowDropdown(false);
    if (!mapOpen) setMapOpen(true);
    toast({ title: "Found! Click on the map to pin exact spot.", description: shortName });
  }

  // GPS Detection
  async function handleDetect() {
    if (!navigator.geolocation) {
      toast({ title: "Geolocation not supported", description: "Use map to pin manually.", variant: "destructive" });
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
          toast({ title: "Reverse geocode failed", variant: "destructive" });
        } finally {
          setDetecting(false);
        }
      },
      () => {
        setDetecting(false);
        toast({ title: "Location access denied", description: "Allow access or pin manually.", variant: "destructive" });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Map pin moved — reverse geocode with debounce
  const handlePinChange = useCallback(
    async (lat: number, lng: number) => {
      setPinLat(lat);
      setPinLng(lng);
      if (pinDebounceRef.current) clearTimeout(pinDebounceRef.current);
      pinDebounceRef.current = setTimeout(async () => {
        try {
          const addr = await reverseGeocode(lat, lng);
          setAddress(addr);
          onSelect({ address: addr, lat, lng });
          setConfirmed(true);
        } catch { /* ignore */ }
      }, 600);
    },
    [onSelect]
  );

  function handleConfirm() {
    if (!pinLat || !pinLng) {
      toast({ title: "Pin a location first", description: "Click on the map to drop a pin.", variant: "destructive" });
      return;
    }
    onSelect({ address, lat: pinLat, lng: pinLng });
    setConfirmed(true);
    setMapOpen(false);
    toast({ title: "Location saved ✓" });
  }

  function handleClear() {
    setAddress("");
    setSearchQuery("");
    setPinLat(null);
    setPinLng(null);
    setFlyTo(null);
    setConfirmed(false);
    setSuggestions([]);
    onSelect({ address: "", lat: 0, lng: 0 });
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>

      {/* Confirmed address display */}
      {confirmed && address ? (
        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-800 truncate">
              {address.split(",").slice(0, 3).join(", ")}
            </p>
            {pinLat && (
              <p className="text-[10px] text-green-600 mt-0.5">
                {pinLat.toFixed(5)}, {pinLng?.toFixed(5)}
              </p>
            )}
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
          type="button" variant="outline" size="sm"
          className="gap-1.5 text-xs flex-1 border-primary/40 text-primary hover:bg-primary/5"
          onClick={handleDetect} disabled={detecting}
        >
          {detecting
            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Detecting...</>
            : <><Locate className="h-3.5 w-3.5" /> Detect My Location</>
          }
        </Button>
        <Button
          type="button" variant="outline" size="sm"
          className="gap-1.5 text-xs flex-1"
          onClick={() => setMapOpen(v => !v)}
        >
          <MapPin className="h-3.5 w-3.5" />
          {mapOpen ? "Hide Map" : "Pin on Map"}
        </Button>
      </div>

      {/* Map panel */}
      {mapOpen && (
        <div className="rounded-xl border overflow-visible shadow-sm">

          {/* Autocomplete search bar */}
          <div className="p-3 bg-white border-b relative" ref={dropdownRef}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  value={searchQuery}
                  onChange={e => handleSearchInput(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                  onKeyDown={e => {
                    if (e.key === "Escape") setShowDropdown(false);
                    if (e.key === "Enter" && suggestions.length > 0) {
                      handleSuggestionSelect(suggestions[0]);
                    }
                  }}
                  placeholder="Area name or pincode (e.g. Anna Nagar or 641001)"
                  className="text-sm h-9 pr-8"
                  autoComplete="off"
                />
                {loadingSuggestions && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground absolute right-2.5 top-2.5" />
                )}
              </div>
            </div>

            {/* Suggestions Dropdown */}
            {showDropdown && (suggestions.length > 0 || loadingSuggestions) && (
              <div className="absolute left-3 right-3 top-full mt-1 z-[1000] bg-white border rounded-xl shadow-xl overflow-hidden">
                {loadingSuggestions && suggestions.length === 0 ? (
                  <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching...
                  </div>
                ) : (
                  suggestions.map((s, i) => {
                    const parts = s.display_name.split(",");
                    const main = parts.slice(0, 2).join(",").trim();
                    const sub = parts.slice(2, 5).join(",").trim();
                    return (
                      <button
                        key={i}
                        type="button"
                        className="w-full text-left px-4 py-2.5 hover:bg-primary/5 border-b last:border-b-0 transition-colors"
                        onMouseDown={() => handleSuggestionSelect(s)} // mouseDown fires before blur
                      >
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-800 truncate">{main}</p>
                            {sub && <p className="text-[11px] text-muted-foreground truncate">{sub}</p>}
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
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

          {/* Address preview + confirm */}
          {address && (
            <div className="px-3 py-2 bg-white border-t flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
              <p className="text-xs text-slate-600 flex-1 truncate">
                {address.split(",").slice(0, 4).join(", ")}
              </p>
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
