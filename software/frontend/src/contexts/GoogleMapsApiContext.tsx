import React, { createContext, useContext, ReactNode } from "react";
import { useJsApiLoader } from "@react-google-maps/api";

interface GoogleMapsApiContextType {
  isLoaded: boolean;
  loadError?: Error;
}

const GoogleMapsApiContext = createContext<
  GoogleMapsApiContextType | undefined
>(undefined);

type ValidGoogleMapsLibrary = "places" | "visualization" | "geocoding";

const appLibraries: ValidGoogleMapsLibrary[] = [
  "places",
  "visualization",
  "geocoding",
];

interface GoogleMapsApiProviderProps {
  children: ReactNode;
}

export const GoogleMapsApiProvider: React.FC<GoogleMapsApiProviderProps> = ({
  children,
}) => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-maps-script-loader",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: appLibraries,
  });

  return (
    <GoogleMapsApiContext.Provider value={{ isLoaded, loadError }}>
      {children}
    </GoogleMapsApiContext.Provider>
  );
};

export const useGoogleMapsApi = (): GoogleMapsApiContextType => {
  const context = useContext(GoogleMapsApiContext);
  if (context === undefined) {
    throw new Error(
      "useGoogleMapsApi must be used within a GoogleMapsApiProvider"
    );
  }
  return context;
};
