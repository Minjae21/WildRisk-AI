"use client";

import { useState, useRef } from "react";
import { Autocomplete } from "@react-google-maps/api";
import { MapPin, Loader2 } from "lucide-react"; // Removed Search for clear icon
import { X } from "lucide-react"; // Using X for clear icon
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useGoogleMapsApi } from "@/contexts/GoogleMapsApiContext"; // Import the hook

export interface PlaceDetails {
  community: string; // e.g., "Austin"
  county: string; // e.g., "Travis" (without "County")
  stateAbbr: string; // e.g., "TX"
  fullString: string; // e.g., "Austin, TX" for display or map centering
}

interface LocationSearchProps {
  // selectedLocationString: string; // Current full "City, ST" string from parent
  onPlaceDetailsSelected: (details: PlaceDetails | null) => void; // Callback with parsed parts
}

const LocationSearch = ({ onPlaceDetailsSelected }: LocationSearchProps) => {
  const [inputValue, setInputValue] = useState<string>("");
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // --- Use the context to get loading status ---
  const { isLoaded, loadError } = useGoogleMapsApi();

  // useEffect to update input value if parent changes selectedLocation (if you re-add selectedLocationString prop)
  // ...

  const onLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    /* ... (no changes needed in the logic itself) ... */
    if (autocomplete !== null) {
      const place = autocomplete.getPlace();
      console.log("Google Place Selected:", place);
      if (
        place &&
        place.address_components &&
        (place.name || place.formatted_address)
      ) {
        let community = "",
          county = "",
          stateAbbr = "",
          displayCity = place.name || "";
        for (const component of place.address_components) {
          if (component.types.includes("locality")) {
            community = component.long_name;
            displayCity = component.long_name;
          } else if (
            component.types.includes("sublocality_level_1") &&
            !community
          ) {
            community = component.long_name;
            displayCity = component.long_name;
          } else if (component.types.includes("neighborhood") && !community) {
            community = component.long_name;
            displayCity = component.long_name;
          } else if (component.types.includes("administrative_area_level_2")) {
            county = component.long_name.replace(/ County$/i, "").trim();
          } else if (component.types.includes("administrative_area_level_1")) {
            stateAbbr = component.short_name;
          }
        }
        if (
          !community &&
          place.name &&
          !place.types?.includes("administrative_area_level_2") &&
          !place.types?.includes("administrative_area_level_1") &&
          !place.types?.includes("country")
        ) {
          community = place.name;
        }
        if (community && stateAbbr) {
          const fullString = `${displayCity}, ${stateAbbr}`;
          setInputValue(fullString);
          onPlaceDetailsSelected({ community, county, stateAbbr, fullString });
        } else {
          const fallbackDisplay = place.formatted_address || place.name || "";
          setInputValue(fallbackDisplay);
          if (community || county || stateAbbr) {
            onPlaceDetailsSelected({
              community,
              county,
              stateAbbr,
              fullString: fallbackDisplay,
            });
          } else {
            onPlaceDetailsSelected(null);
          }
          console.warn(
            "Could not robustly extract City, County, ST. Parts found:",
            { community, county, stateAbbr }
          );
        }
      } else {
        console.warn(
          "No place details available for the selected item or input cleared."
        );
      }
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    /* ... (no changes) ... */
    setInputValue(event.target.value);
    if (event.target.value === "") {
      onPlaceDetailsSelected(null);
    }
  };
  const handleClear = () => {
    /* ... (no changes) ... */
    setInputValue("");
    onPlaceDetailsSelected(null);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // --- Render Logic (updated to use context's isLoaded/loadError) ---
  if (loadError) {
    console.error("Google Places API Load Error (from context):", loadError);
    return (
      <div className="text-red-500 text-sm p-2 border border-red-300 rounded">
        Location search error.
      </div>
    );
  }
  if (!isLoaded) {
    return (
      <div className="flex items-center p-2 border rounded-md bg-gray-100 h-[40px]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin text-gray-500" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>
    );
  }

  // Return JSX... (no changes to the actual JSX structure of LocationSearch itself)
  return (
    <div className="relative w-full">
      {isLoaded && ( // Only render Autocomplete when script is loaded
        <Autocomplete
          onLoad={onLoad}
          onPlaceChanged={onPlaceChanged}
          options={{
            types: ["(cities)"],
            componentRestrictions: { country: "us" },
            fields: [
              "address_components",
              "name",
              "formatted_address",
              "types",
              "geometry",
            ],
          }}
        >
          <div className="relative flex items-center">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Enter City or Town"
              value={inputValue}
              onChange={handleInputChange}
              className="w-full pl-10 pr-10 py-2"
            />
            {inputValue && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 p-0 text-gray-500 hover:text-gray-700"
                onClick={handleClear}
                aria-label="Clear location input"
              >
                {" "}
                <X className="h-4 w-4" />{" "}
              </Button>
            )}
          </div>
        </Autocomplete>
      )}
      {!isLoaded &&
        !loadError && ( // Fallback input if not loaded for some reason, or just show loader
          <div className="relative flex items-center">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Loading location search..."
              value={inputValue}
              readOnly
              className="w-full pl-10 pr-10 py-2 bg-gray-100"
            />
          </div>
        )}
    </div>
  );
};

export default LocationSearch;
