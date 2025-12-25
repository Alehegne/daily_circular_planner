"use client";

import { ChartArea, Moon, Sun } from "lucide-react";

interface HeaderProps {
  darkMode: boolean;
  showStats: boolean;
  onDarkModeToggle: () => void;
  onStatsToggle: () => void;
}

export function Header({
  darkMode,
  showStats,
  onDarkModeToggle,
  onStatsToggle,
}: HeaderProps) {
  const textColor = darkMode ? "text-slate-100" : "text-slate-900";
  const textSecondary = darkMode ? "text-slate-400" : "text-slate-600";
  const cardBg = darkMode ? "bg-slate-800" : "bg-white";
  const borderColor = darkMode ? "border-slate-700" : "border-slate-200";

  return (
    <div className="mb-8 flex items-center justify-between">
      <div>
        <h1 className={`text-4xl font-bold ${textColor} mb-2`}>
          Daily Circular Planner
        </h1>
        <p className={textSecondary}>
          Drag tasks onto the 24-hour timeline to schedule your day
        </p>
      </div>
      <div className="flex gap-4">
        <button
          onClick={onDarkModeToggle}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            darkMode
              ? "bg-yellow-500 text-slate-900"
              : "bg-slate-700 text-white"
          }`}
        >
          {darkMode ? <Sun /> : <Moon />}
        </button>
        <button
          onClick={onStatsToggle}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            showStats
              ? "bg-blue-500 text-white"
              : `${cardBg} ${textColor} border ${borderColor}`
          }`}
        >
          <ChartArea className="inline-flex" /> Stats
        </button>
      </div>
    </div>
  );
}

