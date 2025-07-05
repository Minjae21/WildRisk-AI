import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import RiskScore from "./risk-score";
import "@testing-library/jest-dom"; // Keep this for matchers

// Mock the cn utility if it causes issues, though usually not necessary
// vi.mock('@/lib/utils', () => ({
//   cn: (...args: any[]) => args.filter(Boolean).join(' '),
// }));

describe("RiskScore Component", () => {
  it("renders correctly for low risk score", async () => {
    render(<RiskScore score={2} />);

    // Wait for potential animation/state update if needed (though SVG animation might be CSS based)
    // Using findByText which includes waitFor
    expect(await screen.findByText("2")).toBeInTheDocument();
    expect(screen.getByText("out of 10")).toBeInTheDocument();
    expect(screen.getByText("Low Risk")).toBeInTheDocument();

    // Check for approximate color class (more robust tests might check computed style)
    const scoreElement = screen.getByText("2");
    expect(scoreElement).toHaveClass("text-green-500");
    // You might need more specific SVG testing for the ring color/animation
  });

  it("renders correctly for medium risk score", async () => {
    render(<RiskScore score={5} />);
    expect(await screen.findByText("5")).toBeInTheDocument();
    expect(screen.getByText("Medium Risk")).toBeInTheDocument();
    expect(screen.getByText("5")).toHaveClass("text-orange-500");
  });

  it("renders correctly for high risk score", async () => {
    render(<RiskScore score={9} />);
    expect(await screen.findByText("9")).toBeInTheDocument();
    expect(screen.getByText("High Risk")).toBeInTheDocument();
    expect(screen.getByText("9")).toHaveClass("text-red-500");
  });

  it("clamps score above 10", async () => {
    render(<RiskScore score={15} />);
    expect(await screen.findByText("10")).toBeInTheDocument(); // Should display clamped score
    expect(screen.getByText("High Risk")).toBeInTheDocument();
    expect(screen.getByText("10")).toHaveClass("text-red-500");
  });

  it("clamps score below 0", async () => {
    render(<RiskScore score={-5} />);
    expect(await screen.findByText("0")).toBeInTheDocument();
    expect(screen.getByText("Low Risk")).toBeInTheDocument();
    expect(screen.getByText("0")).toHaveClass("text-green-500");
  });
});
