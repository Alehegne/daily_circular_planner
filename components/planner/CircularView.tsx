"use client";

import type { Arc } from "@/types";
import {
  CIRCLE_RADIUS,
  CIRCLE_CENTER_X,
  CIRCLE_CENTER_Y,
  HANDLE_RADIUS,
  polarToCartesian,
  cartesianToPolar,
  snapAngle,
  createSectorPath,
  checkOverlap,
} from "@/lib/circular-planner-utils";

interface CircularViewProps {
  arcs: Arc[];
  selectedArcId: string | number | null;
  snapMinutes: number;
  darkMode: boolean;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onArcClick: (arcId: string | number, e: React.MouseEvent) => void;
  onCircleDrop: (e: React.DragEvent<SVGSVGElement>) => void;
  onCircleDragOver: (e: React.DragEvent<SVGSVGElement>) => void;
  onHandleMouseDown: (
    e: React.MouseEvent,
    arcId: string | number,
    handleType: "start" | "end"
  ) => void;
}

export function CircularView({
  arcs,
  selectedArcId,
  snapMinutes,
  darkMode,
  svgRef,
  onArcClick,
  onCircleDrop,
  onCircleDragOver,
  onHandleMouseDown,
}: CircularViewProps) {
  const getConflicts = (arcId: string | number) => {
    const arc = arcs.find((a) => a.id === arcId);
    if (!arc) return [];
    return arcs.filter((a) => a.id !== arcId && checkOverlap(arc, a));
  };

  const conflicts = selectedArcId ? getConflicts(selectedArcId) : [];

  const cardBg = darkMode ? "bg-slate-800" : "bg-white";
  const borderColor = darkMode ? "border-slate-700" : "border-slate-200";
  const textColor = darkMode ? "text-slate-100" : "text-slate-900";

  return (
    <div className={`${cardBg} rounded-lg shadow-xl p-8 border ${borderColor}`}>
      <svg
        ref={svgRef}
        width="700"
        height="700"
        onDrop={onCircleDrop}
        onDragOver={onCircleDragOver}
        className={`border ${borderColor} rounded-lg ${
          darkMode
            ? "bg-slate-700"
            : "bg-gradient-to-b from-white to-slate-50"
        }`}
      >
        {/* Grid rings */}
        <circle
          cx={CIRCLE_CENTER_X}
          cy={CIRCLE_CENTER_Y}
          r={CIRCLE_RADIUS}
          fill="none"
          stroke={darkMode ? "#475569" : "#e2e8f0"}
          strokeWidth="1"
        />
        <circle
          cx={CIRCLE_CENTER_X}
          cy={CIRCLE_CENTER_Y}
          r={CIRCLE_RADIUS * 0.67}
          fill="none"
          stroke={darkMode ? "#334155" : "#f1f5f9"}
          strokeWidth="1"
        />
        <circle
          cx={CIRCLE_CENTER_X}
          cy={CIRCLE_CENTER_Y}
          r={CIRCLE_RADIUS * 0.34}
          fill="none"
          stroke={darkMode ? "#334155" : "#f1f5f9"}
          strokeWidth="1"
        />

        {/* Hour ticks and labels */}
        {Array.from({ length: 24 }).map((_, i) => {
          const angle = i * 15;
          const isMajor = i % 3 === 0;
          const tickRadius = isMajor
            ? CIRCLE_RADIUS + 20
            : CIRCLE_RADIUS + 10;
          const innerRadius = CIRCLE_RADIUS - (isMajor ? 15 : 8);

          const outerEnd = {
            x:
              CIRCLE_CENTER_X +
              (CIRCLE_RADIUS + (isMajor ? 15 : 8)) *
                Math.cos(((angle - 90) * Math.PI) / 180),
            y:
              CIRCLE_CENTER_Y +
              (CIRCLE_RADIUS + (isMajor ? 15 : 8)) *
                Math.sin(((angle - 90) * Math.PI) / 180),
          };

          const innerEnd = {
            x:
              CIRCLE_CENTER_X +
              (CIRCLE_RADIUS - (isMajor ? 15 : 8)) *
                Math.cos(((angle - 90) * Math.PI) / 180),
            y:
              CIRCLE_CENTER_Y +
              (CIRCLE_RADIUS - (isMajor ? 15 : 8)) *
                Math.sin(((angle - 90) * Math.PI) / 180),
          };

          const labelRadius = CIRCLE_RADIUS + 35;
          const labelPoint = {
            x:
              CIRCLE_CENTER_X +
              labelRadius * Math.cos(((angle - 90) * Math.PI) / 180),
            y:
              CIRCLE_CENTER_Y +
              labelRadius * Math.sin(((angle - 90) * Math.PI) / 180),
          };

          return (
            <g key={`hour-${i}`}>
              <line
                x1={innerEnd.x}
                y1={innerEnd.y}
                x2={outerEnd.x}
                y2={outerEnd.y}
                stroke={darkMode ? "#94a3b8" : "#0f172a"}
                strokeWidth={isMajor ? 2 : 1}
              />
              {isMajor && (
                <text
                  x={labelPoint.x}
                  y={labelPoint.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="text-xs font-semibold"
                  fill={darkMode ? "#cbd5e1" : "#475569"}
                >
                  {i}h
                </text>
              )}
            </g>
          );
        })}

        {/* Center label */}
        <circle
          cx={CIRCLE_CENTER_X}
          cy={CIRCLE_CENTER_Y}
          r={40}
          fill={darkMode ? "#475569" : "#f1f5f9"}
          stroke={darkMode ? "#64748b" : "#cbd5e1"}
          strokeWidth="2"
        />
        <text
          x={CIRCLE_CENTER_X}
          y={CIRCLE_CENTER_Y - 8}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs font-bold"
          fill={darkMode ? "#cbd5e1" : "#475569"}
        >
          24-Hour
        </text>
        <text
          x={CIRCLE_CENTER_X}
          y={CIRCLE_CENTER_Y + 8}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-xs font-bold"
          fill={darkMode ? "#cbd5e1" : "#475569"}
        >
          Timetable
        </text>

        {/* Sector segments */}
        {arcs.map((arc) => {
          const midAngle =
            (arc.startAngle +
              (arc.endAngle - arc.startAngle) / 2 +
              360) %
            360;
          const labelPoint = polarToCartesian(midAngle);
          const isSelected = selectedArcId === arc.id;
          const hasConflict = conflicts.some((c) => c.id === arc.id);

          return (
            <g key={arc.id}>
              <path
                d={createSectorPath(arc.startAngle, arc.endAngle)}
                fill={arc.color}
                opacity={isSelected ? 0.8 : hasConflict ? 0.4 : 0.6}
                stroke={hasConflict ? "#ef4444" : arc.color}
                strokeWidth={hasConflict ? "3" : "2"}
                onClick={(e) => onArcClick(arc.id, e)}
                className="cursor-pointer hover:opacity-90 transition-opacity"
                style={{
                  filter: isSelected
                    ? "drop-shadow(0 0 8px rgba(0, 0, 0, 0.3))"
                    : hasConflict
                    ? "drop-shadow(0 0 6px rgba(239, 68, 68, 0.5))"
                    : "none",
                }}
              />

              {/* Start handle */}
              {isSelected && (
                <>
                  <circle
                    cx={polarToCartesian(arc.startAngle).x}
                    cy={polarToCartesian(arc.startAngle).y}
                    r={HANDLE_RADIUS}
                    fill="white"
                    stroke={arc.color}
                    strokeWidth="3"
                    onMouseDown={(e) =>
                      onHandleMouseDown(e, arc.id, "start")
                    }
                    className="cursor-grab active:cursor-grabbing"
                  />
                  {/* End handle */}
                  <circle
                    cx={polarToCartesian(arc.endAngle).x}
                    cy={polarToCartesian(arc.endAngle).y}
                    r={HANDLE_RADIUS}
                    fill="white"
                    stroke={arc.color}
                    strokeWidth="3"
                    onMouseDown={(e) => onHandleMouseDown(e, arc.id, "end")}
                    className="cursor-grab active:cursor-grabbing"
                  />
                </>
              )}

              {/* Arc label */}
              <text
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs font-semibold pointer-events-none select-none"
                fill={darkMode ? "#f1f5f9" : "#1e293b"}
                style={{
                  textShadow: darkMode
                    ? "0 0 3px #1e293b"
                    : "0 0 3px white",
                }}
              >
                {arc.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

