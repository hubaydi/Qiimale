"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";

export function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const t = useTranslations("AddPlace");

  const steps = [
    { num: 1, key: "stepCity" },
    { num: 2, key: "stepCategory" },
    { num: 3, key: "stepDetails" },
  ] as const;

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, i) => {
        const isActive = step === s.num;
        const isComplete = step > s.num;
        return (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all ${
                isActive
                  ? "bg-blue-600 text-white"
                  : isComplete
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-500"
              }`}
            >
              {isComplete ? <Check size={16} /> : <span>{s.num}</span>}
            </div>
            <span
              className={`text-sm font-medium ${
                isActive
                  ? "text-blue-600"
                  : isComplete
                    ? "text-green-600"
                    : "text-gray-400"
              }`}
            >
              {t(s.key)}
            </span>
            {i < steps.length - 1 && (
              <div
                className={`w-8 h-0.5 ${
                  isComplete ? "bg-green-500" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
