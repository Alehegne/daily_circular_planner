"use client";

import { useState } from "react";
import type { Task } from "@/types";

interface TaskListProps {
  tasks: Task[];
  onTaskUpdate: (taskId: string, newLabel: string, newColor: string) => void;
  onTaskDelete: (taskId: string) => void;
  onTaskAdd: (label: string, color: string) => void;
  snapMinutes: number;
  onSnapMinutesChange: (minutes: number) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExport: () => void;
  onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
  darkMode: boolean;
}

export function TaskList({
  tasks,
  onTaskUpdate,
  onTaskDelete,
  onTaskAdd,
  snapMinutes,
  onSnapMinutesChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExport,
  onImport,
  darkMode,
}: TaskListProps) {
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [newTaskColor, setNewTaskColor] = useState("#93c5e4");

  const handleTaskDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    task: Task
  ) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("taskId", task.id);
    e.dataTransfer.setData("taskLabel", task.label);
    e.dataTransfer.setData("taskColor", task.color);
  };

  const handleAddTask = () => {
    if (newTaskLabel.trim()) {
      onTaskAdd(newTaskLabel, newTaskColor);
      setNewTaskLabel("");
      setNewTaskColor("#93c5e4");
      setShowNewTaskForm(false);
    }
  };

  const cardBg = darkMode ? "bg-slate-800" : "bg-white";
  const textColor = darkMode ? "text-slate-100" : "text-slate-900";
  const borderColor = darkMode ? "border-slate-700" : "border-slate-200";

  return (
    <div className={`w-72 shrink-0`}>
      <div
        className={`${cardBg} rounded-lg shadow-md p-6 border ${borderColor}`}
      >
        <h2 className={`text-lg font-semibold ${textColor} mb-4`}>Tasks</h2>

        {/* Snap minutes setting */}
        <div className={`mb-4 pb-4 border-b ${borderColor}`}>
          <label className={`text-sm font-medium ${textColor} block mb-2`}>
            Snap to:
          </label>
          <select
            value={snapMinutes}
            onChange={(e) => onSnapMinutesChange(Number(e.target.value))}
            className={`w-full px-3 py-2 rounded-lg text-sm border ${borderColor} ${
              darkMode ? "bg-slate-700 text-white" : "bg-white"
            }`}
          >
            <option value={5}>5 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
          </select>
        </div>

        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="group relative">
              <div
                draggable
                onDragStart={(e) => handleTaskDragStart(e, task)}
                className="p-4 rounded-lg cursor-move transition-all hover:shadow-lg active:opacity-75"
                style={{
                  backgroundColor: task.color,
                  color: "#1e293b",
                }}
              >
                <p className="font-medium text-sm">
                  {task.icon} {task.label}
                </p>
              </div>
              <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                <button
                  onClick={() => {
                    const newLabel = prompt("Edit task name:", task.label);
                    if (newLabel !== null) {
                      onTaskUpdate(task.id, newLabel, task.color);
                    }
                  }}
                  className="bg-slate-700 text-white rounded px-2 py-1 text-xs hover:bg-slate-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => onTaskDelete(task.id)}
                  className="bg-red-500 text-white rounded px-2 py-1 text-xs hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className={`mt-4 pt-4 border-t ${borderColor}`}>
          {!showNewTaskForm ? (
            <button
              onClick={() => setShowNewTaskForm(true)}
              className="w-full px-4 py-2 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors text-sm"
            >
              + Add Task
            </button>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Task name"
                value={newTaskLabel}
                onChange={(e) => setNewTaskLabel(e.target.value)}
                className={`w-full px-3 py-2 border ${borderColor} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 ${
                  darkMode ? "bg-slate-700 text-white" : "bg-white"
                }`}
              />
              <div className="flex gap-2">
                <input
                  type="color"
                  value={newTaskColor}
                  onChange={(e) => setNewTaskColor(e.target.value)}
                  className="w-12 h-10 rounded-lg cursor-pointer border border-slate-300"
                />
                <button
                  onClick={handleAddTask}
                  className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors text-sm"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowNewTaskForm(false)}
                  className="flex-1 px-3 py-2 bg-slate-300 text-slate-900 rounded-lg font-medium hover:bg-slate-400 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* History controls */}
        <div className={`mt-4 pt-4 border-t ${borderColor} flex gap-2`}>
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 text-sm"
          >
            ↶ Undo
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 text-sm"
          >
            ↷ Redo
          </button>
        </div>

        {/* Export/Import */}
        <div className={`mt-4 pt-4 border-t ${borderColor} space-y-2`}>
          <button
            onClick={onExport}
            className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 text-sm"
          >
            📥 Export JSON
          </button>
          <label className="block">
            <input
              type="file"
              accept=".json"
              onChange={onImport}
              className="hidden"
            />
            <span className="w-full block px-3 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 text-sm text-center cursor-pointer">
              📤 Import JSON
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}

