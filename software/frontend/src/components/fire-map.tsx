// software/frontend/src/components/fire-map.tsx
"use client";

import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";
import { MapPin, Layers, Loader2, Palette } from "lucide-react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useGoogleMapsApi } from "@/contexts/GoogleMapsApiContext";

// --- Interfaces ---
interface CommunityMapPoint {
  id: string | number;
  name: string;
  lat: number;
  lng: number;
  severity: "low" | "medium" | "high"; // Backend will only send medium/high now
}

interface FireMapProps {
  selectedCounty: string | null;
  selectedStateAbbr: string | null;
  centerOnLocation: string | null;
}

// --- Constants and Config ---
const containerStyle: React.CSSProperties = { width: "100%", height: "100%" };
const defaultCenter = { lat: 37.0902, lng: -95.7129 };
const libraries: ("visualization" | "geocoding")[] = [
  "visualization",
  "geocoding",
];
const severityColors = { low: "#22c55e", medium: "#f97316", high: "#ef4444" };

const getMarkerIcon = (
  severity: "low" | "medium" | "high"
): google.maps.Symbol => ({
  path: google.maps.SymbolPath.CIRCLE,
  fillColor: severityColors[severity] || "#808080",
  fillOpacity: 0.9,
  strokeColor: "#ffffff",
  strokeWeight: 1,
  scale: 7,
});

const severityWeightMapping: Record<"low" | "medium" | "high", number> = {
  low: 0,
  medium: 6,
  high: 10,
};
const severityGradient = [
  "rgba(255, 255, 0, 0)", // Transparent yellow (start of medium)
  "rgba(255, 255, 0, 1)", // Solid Yellow
  "rgba(255, 170, 0, 1)", // Orange
  "rgba(255, 85, 0, 1)", // Darker Orange
  "rgba(255, 0, 0, 1)", // Solid Red
];
const monotoneStyles: google.maps.MapTypeStyle[] = [
  { featureType: "all", elementType: "all", stylers: [{ saturation: -100 }] },
];
const coloredStyles: google.maps.MapTypeStyle[] = [];

const FireMap: React.FC<FireMapProps> = ({
  selectedCounty,
  selectedStateAbbr,
  centerOnLocation,
}) => {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [currentMapZoom, setCurrentMapZoom] = useState(6);
  const [geocodingError, setGeocodingError] = useState<string | null>(null);
  const [mapView, setMapView] = useState<"pins" | "heatmap">("pins");
  const [mapStyleMode, setMapStyleMode] = useState<"colored" | "monotone">(
    "colored"
  );

  const [countyCommunityPoints, setCountyCommunityPoints] = useState<
    CommunityMapPoint[]
  >([]);
  const [isFetchingMapPoints, setIsFetchingMapPoints] =
    useState<boolean>(false);
  const [mapPointsError, setMapPointsError] = useState<string | null>(null);

  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(
    null
  );
  const markersRef = useRef<google.maps.Marker[]>([]);

  const { isLoaded: isGoogleMapsApiLoaded, loadError: googleMapsLoadError } =
    useGoogleMapsApi();

  const clearOverlays = useCallback(() => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];
    if (heatmapRef.current) {
      heatmapRef.current.setMap(null);
      heatmapRef.current = null;
    }
  }, []);

  const hasFetchedForCurrentLocation = useRef(false);

  useEffect(() => {
    if (isGoogleMapsApiLoaded && centerOnLocation && google?.maps?.Geocoder) {
      setGeocodingError(null);
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: centerOnLocation }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const location = results[0].geometry.location;
          const newCenter = { lat: location.lat(), lng: location.lng() };
          setMapCenter(newCenter);
          setCurrentMapZoom(9);
          if (map) {
            map.panTo(newCenter);
            map.setZoom(9);
          }
        } else {
          setGeocodingError(
            `Could not geocode "${centerOnLocation}" for map centering.`
          );
          setCurrentMapZoom(6);
          if (map) {
            map.setZoom(6);
          }
        }
      });
    } else if (
      !centerOnLocation &&
      selectedCounty &&
      selectedStateAbbr &&
      google?.maps?.Geocoder
    ) {
      setGeocodingError(null);
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode(
        { address: `${selectedCounty} County, ${selectedStateAbbr}` },
        (results, status) => {
          if (status === "OK" && results && results[0]) {
            const location = results[0].geometry.location;
            const newCenter = { lat: location.lat(), lng: location.lng() };
            setMapCenter(newCenter);
            setCurrentMapZoom(8);
            if (map) {
              map.panTo(newCenter);
              map.setZoom(8);
            }
          } else {
            setMapCenter(defaultCenter);
            setCurrentMapZoom(6);
            if (map) {
              map.panTo(defaultCenter);
              map.setZoom(6);
            }
          }
        }
      );
    } else if (!centerOnLocation && !selectedCounty) {
      setMapCenter(defaultCenter);
      setCurrentMapZoom(4);
      if (map) {
        map.panTo(defaultCenter);
        map.setZoom(4);
      }
      setGeocodingError(null);
    }
  }, [
    centerOnLocation,
    selectedCounty,
    selectedStateAbbr,
    isGoogleMapsApiLoaded,
    map,
  ]);

  useEffect(() => {
    if (!selectedCounty || !selectedStateAbbr) {
      setCountyCommunityPoints([]);
      setMapPointsError(null);
      hasFetchedForCurrentLocation.current = false;
      return;
    }
    const fetchCountyCommunities = async () => {
      setIsFetchingMapPoints(true);
      setMapPointsError(null);
      console.log(
        `Fetching communities for County: ${selectedCounty}, State: ${selectedStateAbbr}`
      );
      try {
        const apiUrl =
          import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
        const response = await fetch(
          `${apiUrl}/api/v1/predictor/county-map-communities?county_name=${encodeURIComponent(
            selectedCounty
          )}&state_abbr=${encodeURIComponent(selectedStateAbbr)}`
        );
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(
            errData.detail ||
              `Failed to fetch map points (Status: ${response.status})`
          );
        }
        const data: { communities: CommunityMapPoint[]; error?: string } =
          await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        console.log(
          `Received ${data.communities?.length || 0} map points from backend.`
        );
        setCountyCommunityPoints(data.communities || []);
      } catch (error: any) {
        console.error("Error fetching county map points:", error);
        setMapPointsError(error.message);
        setCountyCommunityPoints([]);
      } finally {
        setIsFetchingMapPoints(false);
      }
    };
    fetchCountyCommunities();
  }, [selectedCounty, selectedStateAbbr]);

  const onLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      setMap(mapInstance);
      mapInstance.setZoom(currentMapZoom);
      mapInstance.setCenter(mapCenter);
    },
    [currentMapZoom, mapCenter]
  );
  const onUnmount = useCallback(() => {
    clearOverlays();
    setMap(null);
  }, [clearOverlays]);

  useEffect(() => {
    if (!isGoogleMapsApiLoaded || !map || !google?.maps?.visualization) {
      clearOverlays();
      return;
    }
    if (countyCommunityPoints.length === 0 && !isFetchingMapPoints) {
      clearOverlays();
      return;
    }
    if (isFetchingMapPoints) {
      clearOverlays();
      return;
    }

    console.log(
      `Overlay effect: mapView: ${mapView}, points: ${countyCommunityPoints.length}`
    );
    clearOverlays();

    if (mapView === "pins") {
      const newMarkers: google.maps.Marker[] = [];
      countyCommunityPoints.forEach((point) => {
        if (
          typeof point.lat !== "number" ||
          typeof point.lng !== "number" ||
          isNaN(point.lat) ||
          isNaN(point.lng)
        )
          return;
        const marker = new google.maps.Marker({
          position: { lat: point.lat, lng: point.lng },
          map: map,
          title: `${point.name} - Severity: ${point.severity}`,
          icon: getMarkerIcon(point.severity),
          clickable: true,
        });
        newMarkers.push(marker);
      });
      markersRef.current = newMarkers;
    } else if (mapView === "heatmap") {
      const weightedHeatmapData = countyCommunityPoints
        .map((point) => {
          if (
            typeof point.lat !== "number" ||
            typeof point.lng !== "number" ||
            isNaN(point.lat) ||
            isNaN(point.lng)
          )
            return null;
          const weight =
            point.severity === "low"
              ? 0
              : severityWeightMapping[point.severity] || 0; // Low severity points won't contribute
          if (!google.maps.LatLng) return null;
          return {
            location: new google.maps.LatLng(point.lat, point.lng),
            weight: weight,
          };
        })
        .filter(
          (p) => p !== null && p.weight > 0
        ) as google.maps.visualization.WeightedLocation[];

      if (weightedHeatmapData.length > 0) {
        if (!google.maps.visualization?.HeatmapLayer) return;
        heatmapRef.current = new google.maps.visualization.HeatmapLayer({
          data: weightedHeatmapData,
          map: map,
          radius: 20,
          opacity: 0.75,
          gradient: severityGradient,
          maxIntensity: 10,
        });
      } else {
        console.log("No medium or high severity data points for heatmap.");
      }
    }
  }, [
    map,
    countyCommunityPoints,
    mapView,
    isGoogleMapsApiLoaded,
    clearOverlays,
    isFetchingMapPoints,
  ]);

  const toggleMapStyle = () =>
    setMapStyleMode((prev) => (prev === "colored" ? "monotone" : "colored"));

  if (googleMapsLoadError)
    return (
      <div className="flex h-full w-full items-center justify-center bg-red-100 p-4 text-center text-sm text-red-700">
        Error loading Google Maps.
      </div>
    );

  return (
    <div className="relative h-full w-full">
      {(!isGoogleMapsApiLoaded || isFetchingMapPoints) && (
        <div className="absolute inset-0 z-20 flex h-full w-full items-center justify-center bg-gray-200/70 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
          <span className="ml-2 text-gray-600">
            {!isGoogleMapsApiLoaded
              ? "Loading Map API..."
              : "Fetching County Data..."}
          </span>
        </div>
      )}
      {mapPointsError && !isFetchingMapPoints && (
        <div className="absolute inset-0 z-20 flex h-full w-full items-center justify-center bg-orange-100/70 backdrop-blur-sm p-4 text-center">
          <p className="text-sm text-orange-700">
            Map Data Error: {mapPointsError}
          </p>
        </div>
      )}

      <div className="h-full w-full">
        {isGoogleMapsApiLoaded && (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={mapCenter}
            zoom={currentMapZoom}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              zoomControl: true,
              styles:
                mapStyleMode === "monotone" ? monotoneStyles : coloredStyles,
            }}
          />
        )}
      </div>

      <div className="absolute right-4 top-4 z-10 flex flex-col gap-2">
        <ToggleGroup
          type="single"
          value={mapView}
          onValueChange={(value) => {
            if (value === "pins" || value === "heatmap") {
              setMapView(value);
            }
          }}
          className="rounded-md bg-white shadow-md"
        >
          <ToggleGroupItem value="pins" aria-label="Show pins">
            <MapPin className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="heatmap" aria-label="Show heatmap">
            <Layers className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
        <Button
          variant="outline"
          size="icon"
          onClick={toggleMapStyle}
          className="bg-white shadow-md"
          aria-label={`Switch to ${
            mapStyleMode === "colored" ? "monotone" : "colored"
          } map style`}
          title={`Switch to ${
            mapStyleMode === "colored" ? "monotone" : "colored"
          } map style`}
        >
          <Palette className="h-4 w-4" />
        </Button>
      </div>
      {/* UPDATED Legend: Low severity removed */}
      <div className="absolute bottom-4 left-4 z-10 rounded-md bg-white p-3 shadow-md">
        <h4 className="mb-2 text-sm font-medium">Legend</h4>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: severityColors.high }}
            ></span>
            <span className="text-xs">High Severity</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: severityColors.medium }}
            ></span>
            <span className="text-xs">Medium Severity</span>
          </div>
        </div>
      </div>
      {geocodingError && !isFetchingMapPoints && (
        <div className="absolute bottom-4 right-4 z-10 max-w-xs rounded-md bg-red-100 p-3 text-sm text-red-700 shadow-md">
          {" "}
          {geocodingError}{" "}
        </div>
      )}
    </div>
  );
};

export default FireMap;
