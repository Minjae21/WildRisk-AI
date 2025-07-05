import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import ModelPage from "./ModelPage";
import "@testing-library/jest-dom";

// --- Mock Child Components (Optional, for pure unit testing) ---
// If you want to purely test ModelPage logic without testing children:
vi.mock("@/components/location-search", () => ({
  // Provide a default export that mimics the component's props interface
  default: ({
    selectedLocation,
    onLocationChange,
  }: {
    selectedLocation: string;
    onLocationChange: (loc: string) => void;
  }) => (
    <input
      data-testid="location-search"
      value={selectedLocation}
      onChange={(e) => onLocationChange(e.target.value)}
      placeholder="Mock Location Search"
    />
  ),
}));

vi.mock("@/components/date-selector", () => ({
  default: ({
    selectedDate,
    onDateChange,
  }: {
    selectedDate: Date | undefined;
    onDateChange: (date?: Date) => void;
  }) => (
    <input
      data-testid="date-selector"
      type="date" // Simple date input for testing
      value={selectedDate ? selectedDate.toISOString().split("T")[0] : ""}
      onChange={(e) =>
        onDateChange(
          e.target.value ? new Date(e.target.value + "T00:00:00") : undefined
        )
      }
      placeholder="Mock Date Selector"
    />
  ),
}));

// Mock other display components if they interfere or are complex
vi.mock("@/components/risk-score", () => ({
  default: ({ score }: { score: number }) => (
    <div data-testid="risk-score">Score: {score}</div>
  ),
}));
vi.mock("@/components/risk-factors", () => ({
  default: ({ factors }: { factors: string[] }) => (
    <div data-testid="risk-factors">{factors.join(", ")}</div>
  ),
}));
vi.mock("@/components/fire-map", () => ({
  default: () => <div data-testid="fire-map">Mock Map</div>,
}));
vi.mock("@/components/neighborhood-comparison", () => ({
  default: () => (
    <div data-testid="neighborhood-comparison">Mock Comparison</div>
  ),
}));

// --- Mock fetch API ---
const mockFetch = vi.fn();
beforeEach(() => {
  // Assign the mock to the global fetch before each test
  vi.stubGlobal("fetch", mockFetch);
  // Reset mocks history before each test
  mockFetch.mockClear();
});
afterEach(() => {
  // Restore original fetch after each test
  vi.unstubAllGlobals();
});

describe("ModelPage", () => {
  it("renders initial state correctly", () => {
    render(<ModelPage />);
    expect(screen.getByText("Assess Your Fire Risk")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Assess Risk/i })).toBeDisabled();
    expect(
      screen.getByText(/Please enter a location and date/i)
    ).toBeInTheDocument();
  });

  it("enables Assess Risk button when location and date are selected", async () => {
    const user = userEvent.setup();
    render(<ModelPage />);

    const locationInput = screen.getByTestId("location-search");
    const dateInput = screen.getByTestId("date-selector");
    const assessButton = screen.getByRole("button", { name: /Assess Risk/i });

    expect(assessButton).toBeDisabled();

    // Simulate user input
    await user.type(locationInput, "Test Location");
    await user.type(dateInput, "2024-01-15"); // Use YYYY-MM-DD format for date input

    // Use waitFor to handle potential state update delays
    await waitFor(() => {
      expect(assessButton).toBeEnabled();
    });
  });

  it("calls API on Assess Risk click and displays results on success", async () => {
    const user = userEvent.setup();
    const mockSuccessResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        risk_score: 8,
        risk_factors: ["Factor A", "Factor B"],
        map_data: { type: "FeatureCollection", features: [] },
        comparison_data: { average_score: 5, your_score: 8 },
        generated_at: new Date().toISOString(),
      }),
    };
    mockFetch.mockResolvedValue(mockSuccessResponse as Response);

    render(<ModelPage />);

    // Simulate input
    await user.type(screen.getByTestId("location-search"), "Test Location");
    await user.type(screen.getByTestId("date-selector"), "2024-01-15");
    const assessButton = screen.getByRole("button", { name: /Assess Risk/i });
    await user.click(assessButton);

    // Check loading state (optional)
    expect(
      await screen.findByRole("button", { name: /Assessing.../i })
    ).toBeDisabled();

    // Check fetch call arguments
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(1);
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/api/v1/assessment/assess-risk"), // Check URL contains the endpoint
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            location: "Test Location",
            selected_date: "2024-01-15",
          }),
        })
      );
    });

    // Check results are displayed after API call completes
    expect(await screen.findByTestId("risk-score")).toHaveTextContent(
      "Score: 8"
    );
    expect(screen.getByTestId("risk-factors")).toHaveTextContent(
      "Factor A, Factor B"
    );
    expect(screen.getByTestId("fire-map")).toBeInTheDocument(); // Check mocked components render
    expect(screen.getByTestId("neighborhood-comparison")).toBeInTheDocument();
    expect(
      screen.queryByText(/Please enter a location and date/i)
    ).not.toBeInTheDocument(); // Initial message gone
    expect(screen.queryByText(/Assessing.../i)).not.toBeInTheDocument(); // Loading text gone
  });

  it("displays error message on API failure", async () => {
    const user = userEvent.setup();
    const mockErrorResponse = {
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({ detail: "Backend simulation failed" }), // Simulate FastAPI error detail
    };
    mockFetch.mockResolvedValue(mockErrorResponse as Response);

    render(<ModelPage />);

    // Simulate input and click
    await user.type(screen.getByTestId("location-search"), "Bad Location");
    await user.type(screen.getByTestId("date-selector"), "2024-01-16");
    await user.click(screen.getByRole("button", { name: /Assess Risk/i }));

    // Check for error message
    // Using findBy queries which include waitFor
    expect(
      await screen.findByText(/Backend simulation failed/i)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Assess Risk/i })).toBeEnabled(); // Button should be enabled after error
    expect(screen.queryByTestId("risk-score")).not.toBeInTheDocument(); // Results should not be displayed
  });
});
