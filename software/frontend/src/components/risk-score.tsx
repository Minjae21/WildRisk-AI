"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface RiskScoreProps {
  score: number; // 1-10 scale
}

// SVG Constants
const SIZE = 192; // Viewbox size (192px) - matches original h-48 w-48
const STROKE_WIDTH = 16; // Width of the ring stroke
const CENTER = SIZE / 2;
const RADIUS = CENTER - STROKE_WIDTH / 2; // Radius adjusted for stroke width
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function RiskScore({ score = 0 }: RiskScoreProps) {
  // Default score to 0
  const [displayScore, setDisplayScore] = useState(0);
  const [dashOffset, setDashOffset] = useState(CIRCUMFERENCE);

  useEffect(() => {
    // Clamp score between 0 and 10
    const clampedScore = Math.max(0, Math.min(score, 10));

    // Animate the score text (optional, simpler animation)
    const scoreTimer = setTimeout(() => {
      setDisplayScore(clampedScore);
    }, 150); // Slight delay for visual effect

    // Calculate the final dash offset for the SVG ring
    const targetOffset = CIRCUMFERENCE * (1 - clampedScore / 10);

    // Animate the SVG ring using dash offset
    // Use a timeout to ensure the initial offset is rendered before transitioning
    const ringTimer = setTimeout(() => {
      setDashOffset(targetOffset);
    }, 100); // Start ring animation slightly earlier than text

    // Cleanup timers on unmount or score change
    return () => {
      clearTimeout(scoreTimer);
      clearTimeout(ringTimer);
    };
  }, [score]); // Re-run effect when score prop changes

  // Determine color based on the *final* score prop for consistency
  const getScoreColorClass = (value: number) => {
    const clampedValue = Math.max(0, Math.min(value, 10));
    if (clampedValue <= 3) return "text-green-500 stroke-green-500";
    if (clampedValue <= 6) return "text-orange-500 stroke-orange-500";
    return "text-red-500 stroke-red-500";
  };

  const getScoreLabel = (value: number) => {
    const clampedValue = Math.max(0, Math.min(value, 10));
    if (clampedValue <= 3) return "Low Risk";
    if (clampedValue <= 6) return "Medium Risk";
    return "High Risk";
  };

  const colorClass = getScoreColorClass(score); // Use final score for color classes

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-48 w-48">
        {" "}
        {/* Container with fixed size */}
        {/* SVG replaces the complex div structure */}
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="absolute left-0 top-0 h-full w-full"
        >
          {/* Background Track */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="transparent"
            strokeWidth={STROKE_WIDTH}
            className="stroke-gray-200" // Use Tailwind for color
          />
          {/* Progress Ring */}
          <circle
            cx={CENTER}
            cy={CENTER}
            r={RADIUS}
            fill="transparent"
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset} // Controlled by state
            strokeLinecap="round" // Optional: makes ends rounded
            // Rotate -90 degrees to start from the top
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
            // Apply transition to the stroke-dashoffset property
            className={cn(
              "transition-[stroke-dashoffset] duration-1000 ease-out", // CSS Transition
              colorClass // Apply dynamic stroke color class
            )}
          />
        </svg>
        {/* Score text - centered on top */}
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">
          <span className={cn("text-5xl font-bold", colorClass)}>
            {displayScore} {/* Display the animated number */}
          </span>
          <span className="mt-1 text-sm font-medium text-gray-500">
            out of 10
          </span>
          <span className={cn("mt-2 font-semibold", colorClass)}>
            {getScoreLabel(score)} {/* Label based on final score */}
          </span>
        </div>
      </div>
    </div>
  );
}
