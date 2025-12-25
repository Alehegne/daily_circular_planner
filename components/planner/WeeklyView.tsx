"use client";

import type { WeeklyTasks, WeeklyTask } from "@/types";
import { getDayName, getDateForDay } from "@/lib/circular-planner-utils";
import type { Task } from "@/types";

interface WeeklyViewProps {
  weeklyTasks: WeeklyTasks;
  weeklyStartDate: Date;
  taskList: Task[];
  darkMode: boolean;
  onWeeklyStartDateChange: (date: Date) => void;
  onAddWeeklyTask: (dayIndex: number, hour: number) => void;
  onUpdateWeeklyTask: (
    dayIndex: number,
    taskId: number,
    updates: Partial<WeeklyTask>
  ) => void;
  onDeleteWeeklyTask: (dayIndex: number, taskId: number) => void;
}

export function WeeklyView({
  weeklyTasks,
  weeklyStartDate,
  taskList,
  darkMode,
  onWeeklyStartDateChange,
  onAddWeeklyTask,
  onUpdateWeeklyTask,
  onDeleteWeeklyTask,
}: WeeklyViewProps) {
  const cardBg = darkMode ? "bg-slate-800" : "bg-white";
  const textColor = darkMode ? "text-slate-100" : "text-slate-900";
  const borderColor = darkMode ? "border-slate-700" : "border-slate-200";

  return (
    <div className={`w-full ${cardBg} rounded-lg shadow-xl p-6 border ${borderColor}`}>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-bold ${textColor}`}>Weekly Schedule</h2>
        <div className="flex gap-2">
          <button
            onClick={() =>
              onWeeklyStartDateChange(
                new Date(weeklyStartDate.getTime() - 7 * 24 * 60 * 60 * 1000)
              )
            }
            className={`px-3 py-2 rounded-lg font-medium ${`${cardBg} ${textColor} border ${borderColor}`}`}
          >
            ← Previous
          </button>
          <button
            onClick={() => onWeeklyStartDateChange(new Date())}
            className={`px-3 py-2 rounded-lg font-medium ${`${cardBg} ${textColor} border ${borderColor}`}`}
          >
            Today
          </button>
          <button
            onClick={() =>
              onWeeklyStartDateChange(
                new Date(weeklyStartDate.getTime() + 7 * 24 * 60 * 60 * 1000)
              )
            }
            className={`px-3 py-2 rounded-lg font-medium ${`${cardBg} ${textColor} border ${borderColor}`}`}
          >
            Next →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
        {Array.from({ length: 7 }).map((_, dayIndex) => (
          <div
            key={dayIndex}
            className={`${
              darkMode ? "bg-slate-700" : "bg-slate-50"
            } rounded-lg p-4 border ${borderColor}`}
          >
            <div className={`font-bold mb-3 text-center ${textColor}`}>
              <div>{getDayName(dayIndex)}</div>
              <div className="text-xs text-slate-500">
                {getDateForDay(dayIndex, weeklyStartDate)}
              </div>
            </div>

            <div className="space-y-2 mb-3 max-h-96 overflow-y-auto">
              {(weeklyTasks[dayIndex] || []).map((task) => (
                <div
                  key={task.id}
                  className="group relative"
                  style={{
                    backgroundColor: task.color,
                    opacity: 0.8,
                  }}
                >
                  <div className="p-2 rounded-lg text-xs text-slate-900 font-medium">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-bold">{task.label}</div>
                        <div className="text-xs opacity-75">
                          {task.hour}:00 - {(task.hour + task.duration) % 24}:00
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                          onClick={() => {
                            const newLabel = prompt("Edit task:", task.label);
                            if (newLabel !== null) {
                              onUpdateWeeklyTask(dayIndex, task.id, {
                                label: newLabel,
                              });
                            }
                          }}
                          className="bg-slate-600 text-white px-1 py-0.5 rounded text-xs hover:bg-slate-700"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => onDeleteWeeklyTask(dayIndex, task.id)}
                          className="bg-red-500 text-white px-1 py-0.5 rounded text-xs hover:bg-red-600"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => onAddWeeklyTask(dayIndex, 9)}
              className="w-full px-3 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 text-xs"
            >
              + Add Task
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

