// src/components/FireMap.test.tsx
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import FireMap from "./fire-map";
import { GoogleMapsApiProvider } from "@/contexts/GoogleMapsApiContext"; // Import context provider
import "@testing-library/jest-dom";

// Mock fetch for the county communities endpoint
const mockFetch = vi.fn();

describe("FireMap Component", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockClear();

    // Mock console.log and console.error to prevent polluting test output
    // vi.spyOn(console, 'log').mockImplementation(() => {});
    // vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    // vi.restoreAllMocks(); // if using spyOn
  });

  const renderWithProvider = (ui: React.ReactElement) => {
    return render(<GoogleMapsApiProvider>{ui}</GoogleMapsApiProvider>);
  };

  it("shows loading state initially then fetches and displays map points", async () => {
    const mockMapPoints = {
      county_name: "TestCounty",
      state_abbr: "TS",
      communities: [
        { id: "1", name: "TownA, TS", lat: 30.0, lng: -95.0, severity: "high" },
        {
          id: "2",
          name: "TownB, TS",
          lat: 30.1,
          lng: -95.1,
          severity: "medium",
        },
      ],
      error: null,
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockMapPoints,
    } as Response);

    renderWithProvider(
      <FireMap
        selectedCounty="TestCounty"
        selectedStateAbbr="TS"
        centerOnLocation="TestCity, TS"
      />
    );

    expect(
      screen.getByText(/Loading Map API...|Fetching County Data.../i)
    ).toBeInTheDocument(); // Initial Google API load or data fetch

    // Wait for data to be fetched and processed
    // Markers are added programmatically, so we might not see them via screen.getByText easily.
    // We can check if the fetch was called.
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "/api/v1/predictor/county-map-communities?county_name=TestCounty&state_abbr=TS"
        ),
        expect.anything()
      );
    });

    // After loading, check if map placeholder is there (actual map is hard to test in unit)
    // Or check if loading text is gone
    await waitFor(() => {
      expect(
        screen.queryByText(/Loading Map API...|Fetching County Data.../i)
      ).not.toBeInTheDocument();
    });

    // You could also check for the legend items
    expect(screen.getByText("High Severity")).toBeInTheDocument();
    expect(screen.getByText("Medium Severity")).toBeInTheDocument();
    expect(screen.queryByText("Low Severity")).not.toBeInTheDocument(); // Legend updated
  });

  it("handles error when fetching map points", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ detail: "Server error fetching map points" }),
    } as Response);

    renderWithProvider(
      <FireMap
        selectedCounty="ErrorCounty"
        selectedStateAbbr="ER"
        centerOnLocation="ErrorCity, ER"
      />
    );

    expect(
      await screen.findByText(
        /Map Data Error: Server error fetching map points/i
      )
    ).toBeInTheDocument();
  });

  // Add tests for toggling map view (pins/heatmap) and map style (colored/monotone)
  // This would involve checking if the internal state `mapView` or `mapStyleMode` changes
  // and potentially if the `clearOverlays` and drawing logic in useEffect is triggered (harder to test directly)
  it("toggles map view and style", async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValue({
      // Provide some data so overlays try to render
      ok: true,
      json: async () => ({
        communities: [
          { id: "1", name: "Point", lat: 1, lng: 1, severity: "high" },
        ],
      }),
    } as Response);
    renderWithProvider(
      <FireMap
        selectedCounty="Test"
        selectedStateAbbr="TS"
        centerOnLocation="Test, TS"
      />
    );
    await waitFor(() => expect(mockFetch).toHaveBeenCalled()); // Wait for initial data fetch

    const heatmapButton = screen.getByRole("button", { name: /show heatmap/i });
    await user.click(heatmapButton);
    // Check console.log for "Overlay effect running for mapView: heatmap" or assert internal state if exposed/testable

    const paletteButton = screen.getByRole("button", {
      name: /switch to monotone map style/i,
    });
    await user.click(paletteButton);
    // Check console.log for "Style: monotone" or assert internal state
  });
});
