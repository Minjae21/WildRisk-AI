import { vi } from "vitest";

export const mockGoogleMapsApi = () => {
  const google = {
    maps: {
      LatLng: vi.fn((lat, lng) => ({ lat: () => lat, lng: () => lng })),
      Map: vi.fn().mockImplementation(function (this: any, mapDiv, opts) {
        this.mapDiv = mapDiv;
        this.opts = opts;
        this.setCenter = vi.fn();
        this.setZoom = vi.fn();
        this.panTo = vi.fn();
        this.fitBounds = vi.fn();
        this.getCenter = vi.fn(() => ({ lat: () => 0, lng: () => 0 }));
        this.getZoom = vi.fn(() => 8);
        // Add other methods your components might call on the map instance
        return this;
      }),
      Marker: vi.fn().mockImplementation(function (this: any, opts) {
        this.opts = opts;
        this.setMap = vi.fn();
        this.addListener = vi.fn();
        this.getPosition = vi.fn(() => opts.position);
        return this;
      }),
      Geocoder: vi.fn(() => ({
        geocode: vi.fn((request, callback) => {
          // Default mock geocode response - override in specific tests
          if (request.address && request.address.includes("Error")) {
            callback(null, "ERROR");
          } else {
            callback(
              [
                {
                  geometry: {
                    location: { lat: () => 34.0522, lng: () => -118.2437 },
                  },
                },
              ],
              "OK"
            );
          }
        }),
      })),
      places: {
        Autocomplete: vi
          .fn()
          .mockImplementation(function (this: any, inputElement, opts) {
            this.inputElement = inputElement;
            this.opts = opts;
            this.getPlace = vi.fn(() => ({
              // Default mock place
              address_components: [
                { long_name: "Test City", types: ["locality"] },
                {
                  long_name: "Test County",
                  types: ["administrative_area_level_2"],
                },
                { short_name: "TS", types: ["administrative_area_level_1"] },
              ],
              name: "Test City",
              formatted_address: "Test City, TS, USA",
            }));
            this.addListener = vi.fn((event, callback) => {
              // Store callback to be triggered manually in tests if needed
              if (event === "place_changed") {
                (this as any)._placeChangedCallback = callback;
              }
            });
            return this;
          }),
        // Add other places services if needed
      },
      visualization: {
        HeatmapLayer: vi.fn().mockImplementation(function (this: any, opts) {
          this.opts = opts;
          this.setMap = vi.fn();
          this.setData = vi.fn();
          return this;
        }),
      },
      event: {
        // Mock google.maps.event
        clearInstanceListeners: vi.fn(),
        addListener: vi.fn(),
      },
      SymbolPath: {
        // Mock SymbolPath if getMarkerIcon uses it
        CIRCLE: 0, // Or appropriate mock value
      },
      // Add any other google.maps objects your components use
    },
  };
  vi.stubGlobal("google", google);
  return google;
};
