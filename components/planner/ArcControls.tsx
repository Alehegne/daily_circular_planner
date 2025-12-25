"use client";

import { useState } from "react";
import type { Arc } from "@/types";
import { getArcDuration, checkOverlap } from "@/lib/circular-planner-utils";

interface ArcControlsProps {
  selectedArc: Arc | undefined;
  allArcs: Arc[];
  darkMode: boolean;
  onUpdateLabel: (arcId: string | number, newLabel: string) => void;
  onDelete: (arcId: string | number) => void;
  onClose: () => void;
}

export function ArcControls({
  selectedArc,
  allArcs,
  darkMode,
  onUpdateLabel,
  onDelete,
  onClose,
}: ArcControlsProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState(selectedArc?.label || "");

  if (!selectedArc) return null;

  const conflicts = allArcs.filter(
    (a) => a.id !== selectedArc.id && checkOverlap(selectedArc, a)
  );

  const cardBg = darkMode ? "bg-slate-800" : "bg-white";
  const textColor = darkMode ? "text-slate-100" : "text-slate-900";
  const borderColor = darkMode ? "border-slate-700" : "border-slate-200";
  const textSecondary = darkMode ? "text-slate-400" : "text-slate-600";

  const handleSave = () => {
    if (editLabel.trim()) {
      onUpdateLabel(selectedArc.id, editLabel);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditLabel(selectedArc.label);
    setIsEditing(false);
  };

  return (
    <div
      className={`fixed bottom-8 right-8 ${cardBg} rounded-lg shadow-lg p-6 border ${borderColor} w-96`}
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-semibold ${textColor}`}>
          Edit Scheduled Task
        </h3>
        <button
          onClick={onClose}
          className={`text-${textSecondary} hover:${textColor}`}
        >
          ✕
        </button>
      </div>

      {/* Conflict alert */}
      {conflicts.length > 0 && (
        <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
          <p className="text-sm font-semibold text-red-800">
            Scheduling Conflict!
          </p>
          <p className="text-xs text-red-700 mt-1">
            This task overlaps with: {conflicts.map((c) => c.label).join(", ")}
          </p>
        </div>
      )}

      {isEditing ? (
        <div className="mb-4 space-y-2">
          <input
            type="text"
            value={editLabel}
            onChange={(e) => setEditLabel(e.target.value)}
            placeholder="Enter task name"
            className={`w-full px-3 py-2 border ${borderColor} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 ${
              darkMode ? "bg-slate-700 text-white" : "bg-white"
            }`}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors text-sm"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="flex-1 px-3 py-2 bg-slate-300 text-slate-900 rounded-lg font-medium hover:bg-slate-400 transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div
            className={`mb-4 p-3 rounded-lg ${
              darkMode ? "bg-slate-700" : "bg-slate-100"
            }`}
          >
            <p className={`text-sm ${textColor}`}>
              <strong>Task:</strong> {selectedArc.label}
            </p>
            <p className={`text-sm ${textColor} mt-1`}>
              <strong>Duration:</strong> {getArcDuration(selectedArc)} minutes
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditLabel(selectedArc.label);
                setIsEditing(true);
              }}
              className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors text-sm"
            >
              Edit
            </button>
            <button
              onClick={() => onDelete(selectedArc.id)}
              className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

