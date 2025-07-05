// software/frontend/src/pages/ModelPage.tsx

import React, { useState, useEffect, Suspense, useMemo } from "react";
import { AlertTriangle, MapPin, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import RiskScore from "@/components/risk-score";
import LocationSearch, { PlaceDetails } from "@/components/location-search";
import RiskFactors from "@/components/risk-factors";
import FireMap from "@/components/fire-map";
import ChatbotInterface from "@/components/chatbot-interface";
import { Input } from "@/components/ui/input";

interface PredictorResultData {
  bp_prediction?: number | null;
  confidence?: number | null;
  levels_used?: string[];
  individual_predictions?: Record<string, number | null>;
  error?: string | null;
  risk_factors_summary?: string;
}

export default function ModelPage() {
  const [communityPart, setCommunityPart] = useState<string>("");
  const [countyPart, setCountyPart] = useState<string>("");
  const [stateAbbr, setStateAbbr] = useState<string>("");
  const [centerMapOnCommunityString, setCenterMapOnCommunityString] =
    useState<string>("");

  const [assessmentResult, setAssessmentResult] =
    useState<PredictorResultData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (centerMapOnCommunityString) {
      console.log(
        "ModelPage: Location to center map on:",
        centerMapOnCommunityString
      );
    }
  }, [centerMapOnCommunityString]);

  const handlePlaceDetailsSelected = (details: PlaceDetails | null) => {
    if (details) {
      setCommunityPart(details.community);
      setCountyPart(details.county);
      setStateAbbr(details.stateAbbr);
      setCenterMapOnCommunityString(details.fullString);
      setError(null);
    } else {
      setCommunityPart("");
      setCountyPart("");
      setStateAbbr("");
      setCenterMapOnCommunityString("");
      setAssessmentResult(null);
      setError(null);
    }
  };

  const handleAssessRisk = async () => {
    if (!communityPart || !countyPart || !stateAbbr) {
      setError(
        "Please select a valid location to auto-fill community, county, and state."
      );
      return;
    }
    if (stateAbbr.length !== 2) {
      setError("State abbreviation is invalid. Please re-select location.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setAssessmentResult(null);
    try {
      const apiUrl =
        import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const endpoint = `${apiUrl}/api/v1/predictor/predict-bp-risk`;
      const requestBody = {
        community_name_part: communityPart,
        county_name_part: countyPart,
        state_abbr: stateAbbr.toUpperCase(),
      };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const data: PredictorResultData = await response.json();
      if (!response.ok || data.error) {
        throw new Error(
          data.error || `Error: ${response.status} ${response.statusText}`
        );
      }
      setAssessmentResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch risk assessment.");
    } finally {
      setIsLoading(false);
    }
  };

  const formatRiskFactors = (result: PredictorResultData | null): string[] => {
    if (!result) return ["No data."];
    const factors: string[] = [];
    if (result.risk_factors_summary) factors.push(result.risk_factors_summary);
    if (result.individual_predictions) {
      Object.entries(result.individual_predictions).forEach(([level, pred]) => {
        factors.push(
          `${
            level.charAt(0).toUpperCase() + level.slice(1)
          } Level Prediction: ${
            pred !== null && pred !== undefined ? pred.toFixed(3) : "N/A"
          }`
        );
      });
    }
    if (result.levels_used && result.levels_used.length > 0)
      factors.push(`Levels Used: ${result.levels_used.join(", ")}`);
    return factors.length > 0 ? factors : ["No detailed factors."];
  };

  const scaledRiskScoreForDisplay = useMemo(() => {
    if (
      assessmentResult &&
      assessmentResult.bp_prediction !== null &&
      assessmentResult.bp_prediction !== undefined
    ) {
      return Math.round(assessmentResult.bp_prediction * 10);
    }
    return null;
  }, [assessmentResult]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <h1 className="text-3xl font-bold text-gray-900">FireLLM</h1>
            </div>
            {/* <Button variant="outline">Sign In</Button> */}
          </div>
          <p className="mt-2 text-gray-600">
            Advanced wildfire risk assessment powered by AI
          </p>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-3">
            <CardHeader className="pb-4">
              <CardTitle>Assess Your Fire Risk</CardTitle>
              <CardDescription>
                Search for a community. County and State will be auto-filled.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* Row 1: Inputs */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-1">
                  <label
                    htmlFor="location-search-input"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Search Community
                  </label>
                  <LocationSearch
                    onPlaceDetailsSelected={handlePlaceDetailsSelected}
                  />
                </div>
                <div className="lg:col-span-1">
                  <label
                    htmlFor="county-display"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    County
                  </label>
                  <Input
                    id="county-display"
                    value={countyPart}
                    placeholder="Auto-filled"
                    readOnly
                    className="bg-gray-100 text-gray-500 cursor-not-allowed"
                  />
                </div>
                <div className="lg:col-span-1">
                  <label
                    htmlFor="state-display"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    State Abbr.
                  </label>
                  <Input
                    id="state-display"
                    value={stateAbbr}
                    placeholder="Auto-filled"
                    className="bg-gray-100 text-gray-500 cursor-not-allowed"
                    readOnly
                    maxLength={2}
                  />
                </div>
              </div>

              {/* Row 2: Assess Risk Button */}
              {/* On large screens, this button div will take the full width available in its row */}
              {/* If the parent of this button div is the CardContent (flex-col), it will be a new row */}
              <div className="w-full pt-2">
                {" "}
                {/* Added pt-2 for a bit of space from inputs above */}
                <Button
                  // size="lg" // Default size is often fine, text-base will control font. Or use specific h-10, h-12.
                  className="w-full bg-orange-600 hover:bg-orange-700 text-base px-6 py-3 cursor-pointer font-semibold" // MODIFIED: text-base, specific padding, font-semibold
                  onClick={handleAssessRisk}
                  disabled={
                    isLoading ||
                    !communityPart ||
                    !countyPart ||
                    !stateAbbr ||
                    stateAbbr.length !== 2
                  }
                >
                  {isLoading ? "Assessing..." : "Assess Risk"}
                </Button>
              </div>

              {error && (
                <p className="mt-4 text-center text-sm text-red-600">{error}</p>
              )}
            </CardContent>
          </Card>

          {/* Result Display */}
          {assessmentResult && !isLoading && (
            <>
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>BP Risk Prediction</CardTitle>
                  <CardDescription>
                    Model's Burning Potential
                    {assessmentResult.confidence !== null &&
                      assessmentResult.confidence !== undefined &&
                      ` (Confidence: ${(
                        assessmentResult.confidence * 100
                      ).toFixed(0)}%)`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  {scaledRiskScoreForDisplay !== null ? (
                    <RiskScore score={scaledRiskScoreForDisplay} />
                  ) : (
                    <p className="text-gray-500">N/A</p>
                  )}
                  <div className="mt-6 w-full">
                    <Button variant="outline" className="w-full cursor-pointer">
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Why Am I At Risk?
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Assessment Factors</CardTitle>
                  <CardDescription>
                    Summary and contributing level predictions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Suspense fallback={<div>Loading factors...</div>}>
                    <RiskFactors
                      factors={formatRiskFactors(assessmentResult)}
                    />
                  </Suspense>
                </CardContent>
              </Card>

              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>
                    Fire Risk Map for{" "}
                    {countyPart ? `${countyPart} County, ` : ""}
                    {stateAbbr || "Selected Area"}
                  </CardTitle>
                  <CardDescription>
                    Community risk point distribution within the selected
                    county.
                  </CardDescription>
                </CardHeader>
                <CardContent className="h-[500px] p-0 md:h-[600px] lg:h-[700px]">
                  <Suspense
                    fallback={
                      <div className="flex h-full items-center justify-center">
                        Loading map...
                      </div>
                    }
                  >
                    <FireMap
                      selectedCounty={countyPart || null}
                      selectedStateAbbr={stateAbbr || null}
                      centerOnLocation={centerMapOnCommunityString || null}
                    />
                  </Suspense>
                </CardContent>
              </Card>
            </>
          )}
          {!assessmentResult && !isLoading && (
            <div className="lg:col-span-3 py-10 text-center text-gray-500">
              Please search for a community to assess the risk.
            </div>
          )}
          {isLoading && (
            <div className="lg:col-span-3 py-10 text-center text-gray-500">
              Loading assessment results...
            </div>
          )}
        </div>
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            className="h-14 w-14 rounded-full bg-orange-600 p-3 shadow-lg hover:bg-orange-700 cursor-pointer"
            aria-label="Open chat assistant"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
        </div>
        <div className="hidden">
          {" "}
          <ChatbotInterface />{" "}
        </div>
      </div>
    </main>
  );
}
