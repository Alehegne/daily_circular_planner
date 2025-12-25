"use client";

import type { CategoryStats } from "@/types";

interface StatsPanelProps {
  stats: CategoryStats;
  darkMode: boolean;
}

export function StatsPanel({ stats, darkMode }: StatsPanelProps) {
  const cardBg = darkMode ? "bg-slate-800" : "bg-white";
  const textColor = darkMode ? "text-slate-100" : "text-slate-900";
  const borderColor = darkMode ? "border-slate-700" : "border-slate-200";
  const textSecondary = darkMode ? "text-slate-400" : "text-slate-600";

  const totalMinutes = Object.values(stats).reduce((a, b) => a + b, 0);

  return (
    <div
      className={`fixed bottom-8 left-8 ${cardBg} rounded-lg shadow-lg p-6 border ${borderColor} w-80`}
    >
      <h3 className={`text-lg font-semibold ${textColor} mb-4`}>
        Time Statistics
      </h3>
      <div className="space-y-3">
        {Object.entries(stats).length > 0 ? (
          Object.entries(stats).map(([category, minutes]) => (
            <div
              key={category}
              className={`p-3 rounded-lg ${
                darkMode ? "bg-slate-700" : "bg-slate-100"
              }`}
            >
              <div className="flex justify-between items-center mb-2">
                <p
                  className={`text-sm font-semibold ${textColor} capitalize`}
                >
                  {category}
                </p>
                <p className={`text-sm font-bold ${textColor}`}>
                  {minutes} min
                </p>
              </div>
              <div
                className={`w-full h-2 rounded-full ${
                  darkMode ? "bg-slate-600" : "bg-slate-300"
                }`}
              >
                <div
                  className="h-full rounded-full bg-blue-500"
                  style={{ width: `${(minutes / 1440) * 100}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className={textSecondary}>No scheduled tasks yet</p>
        )}
        <div className={`pt-3 border-t ${borderColor}`}>
          <p className={`text-xs ${textSecondary}`}>
            Total Scheduled: {totalMinutes} minutes
          </p>
        </div>
      </div>
    </div>
  );
}

