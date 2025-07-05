"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface RiskFactorsProps {
  factors: string[];
}

const RiskFactors: React.FC<RiskFactorsProps> = ({ factors }) => {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
          <div>
            <h3 className="font-medium text-amber-800">Contributing Factors</h3>
            <p className="text-sm text-amber-700">
              Based on the selected location and date, the following factors
              were considered in the assessment:
            </p>
          </div>
        </div>
      </div>

      {factors && factors.length > 0 ? (
        <ul className="list-disc space-y-1 rounded-lg border p-4 pl-9 shadow-sm">
          {factors.map((factor, index) => (
            <li key={index} className="text-sm text-gray-700">
              {factor}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500">
          Risk factor details will appear here after assessment.
        </p>
      )}
    </div>
  );
};

export default RiskFactors;
