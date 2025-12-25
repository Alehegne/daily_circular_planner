"use client";

import { useState, useEffect, useRef } from "react";
import type { Arc, Task, WeeklyTasks, WeeklyTask, CategoryStats, PlannerData, DraggingHandle } from "@/types";
import { defaultTasks } from "@/lib/default-tasks";
import {
  cartesianToPolar,
  snapAngle,
  getArcDuration,
  CIRCLE_CENTER_X,
  CIRCLE_CENTER_Y,
} from "@/lib/circular-planner-utils";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { usePlannerHistory } from "@/hooks/use-planner-history";
import { TaskList } from "@/components/planner/TaskList";
import { CircularView } from "@/components/planner/CircularView";
import { WeeklyView } from "@/components/planner/WeeklyView";
import { ArcControls } from "@/components/planner/ArcControls";
import { StatsPanel } from "@/components/planner/StatsPanel";
import { Header } from "@/components/planner/Header";

export default function CircularPlanner() {
  const [taskList, setTaskList] = useLocalStorage<Task[]>("plannerTasks", defaultTasks);
  const [snapMinutes, setSnapMinutes] = useLocalStorage<number>("plannerSnapMinutes", 15);
  const [darkMode, setDarkMode] = useLocalStorage<boolean>("plannerDarkMode", false);
  const [weeklyTasks, setWeeklyTasks] = useLocalStorage<WeeklyTasks>("plannerWeeklyTasks", {});
  const [weeklyStartDate, setWeeklyStartDate] = useLocalStorage<Date>(
    "plannerWeeklyStartDate",
    new Date(2025, 10, 17),
    (date) => date.toISOString(),
    (str) => new Date(str)
  );

  const {
    arcs,
    setArcs,
    addToHistory,
    undo,
    redo,
    canUndo,
    canRedo,
  } = usePlannerHistory();

  const [selectedArcId, setSelectedArcId] = useState<string | number | null>(null);
  const [draggingHandle, setDraggingHandle] = useState<DraggingHandle | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [view, setView] = useState<"daily" | "weekly">("daily");
  const svgRef = useRef<SVGSVGElement>(null);

  // Load arcs from localStorage on mount
  useEffect(() => {
    const savedArcs = localStorage.getItem("plannerArcs");
    if (savedArcs) {
      try {
        const arcsData: Arc[] = JSON.parse(savedArcs);
        if (arcsData.length > 0) {
          setArcs(arcsData);
          addToHistory(arcsData);
        }
      } catch (e) {
        console.error("Error loading arcs:", e);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save arcs to localStorage
  useEffect(() => {
    localStorage.setItem("plannerArcs", JSON.stringify(arcs));
  }, [arcs]);

  // Initialize weekly tasks if empty
  useEffect(() => {
    if (Object.keys(weeklyTasks).length === 0) {
      const initWeekly: WeeklyTasks = {};
      for (let i = 0; i < 7; i++) {
        initWeekly[i] = [];
      }
      setWeeklyTasks(initWeekly);
    }
  }, [weeklyTasks, setWeeklyTasks]);

  // Handle drop on circle
  const handleCircleDrop = (e: React.DragEvent<SVGSVGElement>) => {
    e.preventDefault();
    const taskLabel = e.dataTransfer.getData("taskLabel");
    const taskColor = e.dataTransfer.getData("taskColor");

    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dropAngle = cartesianToPolar(x, y);
    const snappedAngle = snapAngle(dropAngle, snapMinutes);
    // Default duration of 1 hour (60 minutes)
    const endAngle = (snappedAngle + 60 * (360 / 1440)) % 360;

    const newArc: Arc = {
      id: Date.now().toString(),
      startAngle: snappedAngle,
      endAngle: endAngle,
      label: taskLabel,
      color: taskColor,
    };

    const newArcs = [...arcs, newArc];
    setArcs(newArcs);
    addToHistory(newArcs);
  };

  // Handle drag over circle
  const handleCircleDragOver = (e: React.DragEvent<SVGSVGElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  // Handle handle drag
  const handleHandleMouseDown = (
    e: React.MouseEvent,
    arcId: string | number,
    handleType: "start" | "end"
  ) => {
    e.preventDefault();
    setDraggingHandle({ arcId, handleType });
  };

  // Track previous dragging state to save to history when drag ends
  const prevDraggingHandleRef = useRef<DraggingHandle | null>(null);

  useEffect(() => {
    // If dragging just ended (was dragging, now not), save to history
    if (prevDraggingHandleRef.current && !draggingHandle) {
      addToHistory(arcs);
    }
    prevDraggingHandleRef.current = draggingHandle;
  }, [draggingHandle, arcs, addToHistory]);

  // Handle mouse move for resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!draggingHandle || !svgRef.current) return;

      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const angle = cartesianToPolar(x, y);
      const snappedAngle = snapAngle(angle, snapMinutes);

      const newArcs = arcs.map((arc) => {
        if (arc.id === draggingHandle.arcId) {
          if (draggingHandle.handleType === "start") {
            return { ...arc, startAngle: snappedAngle };
          } else {
            return { ...arc, endAngle: snappedAngle };
          }
        }
        return arc;
      });
      setArcs(newArcs);
    };

    const handleMouseUp = () => {
      if (draggingHandle) {
        setDraggingHandle(null);
      }
    };

    if (draggingHandle) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [draggingHandle, arcs, snapMinutes, setArcs]);

  // Handle arc click
  const handleArcClick = (arcId: string | number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedArcId(selectedArcId === arcId ? null : arcId);
  };

  // Delete arc
  const deleteArc = (arcId: string | number) => {
    const newArcs = arcs.filter((arc) => arc.id !== arcId);
    setArcs(newArcs);
    addToHistory(newArcs);
    setSelectedArcId(null);
  };

  const updateArcLabel = (arcId: string | number, newLabel: string) => {
    if (newLabel.trim()) {
      const newArcs = arcs.map((arc) =>
        arc.id === arcId ? { ...arc, label: newLabel } : arc
      );
      setArcs(newArcs);
      addToHistory(newArcs);
    }
  };

  const addCustomTask = (label: string, color: string) => {
    if (label.trim()) {
      const newTask: Task = {
        id: `custom-${Date.now()}`,
        label,
        color,
        icon: "⭐",
        category: "other",
      };
      setTaskList([...taskList, newTask]);
    }
  };

  const deleteTask = (taskId: string) => {
    const taskToDelete = taskList.find((task) => task.id === taskId);
    if (taskToDelete) {
      const updatedArcs = arcs.filter((arc) => arc.label !== taskToDelete.label);
      setArcs(updatedArcs);
      addToHistory(updatedArcs);
    }
    setTaskList(taskList.filter((task) => task.id !== taskId));
  };

  const updateTask = (taskId: string, newLabel: string, newColor: string) => {
    if (newLabel.trim()) {
      const oldLabel = taskList.find((t) => t.id === taskId)?.label;
      setTaskList(
        taskList.map((task) =>
          task.id === taskId ? { ...task, label: newLabel, color: newColor } : task
        )
      );
      if (oldLabel && oldLabel !== newLabel) {
        const updatedArcs = arcs.map((arc) =>
          arc.label === oldLabel ? { ...arc, label: newLabel, color: newColor } : arc
        );
        setArcs(updatedArcs);
        addToHistory(updatedArcs);
      }
    }
  };

  const calculateStats = (): CategoryStats => {
    const categoryStats: CategoryStats = {};
    arcs.forEach((arc) => {
      const task = taskList.find((t) => t.label === arc.label);
      const category = task?.category || "other";
      const duration = getArcDuration(arc);
      categoryStats[category] = (categoryStats[category] || 0) + duration;
    });
    return categoryStats;
  };

  const exportJSON = () => {
    const data: PlannerData = {
      date: new Date().toISOString(),
      arcs,
      tasks: taskList,
      weeklyTasks,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `schedule-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string) as PlannerData;
        setArcs(data.arcs || []);
        setTaskList(data.tasks || defaultTasks);
        setWeeklyTasks(data.weeklyTasks || {});
        if (data.arcs && data.arcs.length > 0) {
          addToHistory(data.arcs);
        }
      } catch (error) {
        alert("Error importing file");
        console.error("Import error:", error);
      }
    };
    reader.readAsText(file);
  };

  const addWeeklyTask = (dayIndex: number, hour: number) => {
    const taskToAdd = taskList[0] || defaultTasks[0];
    const newTask: WeeklyTask = {
      id: Date.now(),
      taskId: taskToAdd?.id || "work",
      hour: hour,
      duration: 1,
      label: taskToAdd?.label || "Task",
      color: taskToAdd?.color || "#93c5e4",
    };
    setWeeklyTasks((prevWeeklyTasks) => ({
      ...prevWeeklyTasks,
      [dayIndex]: [...(prevWeeklyTasks[dayIndex] || []), newTask],
    }));
  };

  const updateWeeklyTask = (
    dayIndex: number,
    taskId: number,
    updates: Partial<WeeklyTask>
  ) => {
    setWeeklyTasks((prevWeeklyTasks) => ({
      ...prevWeeklyTasks,
      [dayIndex]: (prevWeeklyTasks[dayIndex] || []).map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    }));
  };

  const deleteWeeklyTask = (dayIndex: number, taskId: number) => {
    setWeeklyTasks((prevWeeklyTasks) => ({
      ...prevWeeklyTasks,
      [dayIndex]: (prevWeeklyTasks[dayIndex] || []).filter(
        (t) => t.id !== taskId
      ),
    }));
  };

  const stats = calculateStats();
  const selectedArc = arcs.find((a) => a.id === selectedArcId);

  const bgColor = darkMode
    ? "bg-slate-900"
    : "bg-gradient-to-br from-slate-50 to-slate-100";

  return (
    <div className={`min-h-screen ${bgColor} p-8 transition-colors duration-300`}>
      <div className="max-w-7xl mx-auto">
        <Header
          darkMode={darkMode}
          showStats={showStats}
          onDarkModeToggle={() => setDarkMode(!darkMode)}
          onStatsToggle={() => setShowStats(!showStats)}
        />

        <div className="flex gap-8">
          <TaskList
            tasks={taskList}
            onTaskUpdate={updateTask}
            onTaskDelete={deleteTask}
            onTaskAdd={addCustomTask}
            snapMinutes={snapMinutes}
            onSnapMinutesChange={setSnapMinutes}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            onExport={exportJSON}
            onImport={importJSON}
            darkMode={darkMode}
          />

          {/* Main View */}
          <div className="flex-1 flex items-center justify-center flex-col gap-4">
            {/* View selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setView("daily")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  view === "daily"
                    ? "bg-blue-500 text-white"
                    : `${darkMode ? "bg-slate-800" : "bg-white"} ${darkMode ? "text-slate-100" : "text-slate-900"} border ${darkMode ? "border-slate-700" : "border-slate-200"}`
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setView("weekly")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  view === "weekly"
                    ? "bg-blue-500 text-white"
                    : `${darkMode ? "bg-slate-800" : "bg-white"} ${darkMode ? "text-slate-100" : "text-slate-900"} border ${darkMode ? "border-slate-700" : "border-slate-200"}`
                }`}
              >
                Weekly
              </button>
            </div>

            {view === "daily" ? (
              <CircularView
                arcs={arcs}
                selectedArcId={selectedArcId}
                snapMinutes={snapMinutes}
                darkMode={darkMode}
                svgRef={svgRef}
                onArcClick={handleArcClick}
                onCircleDrop={handleCircleDrop}
                onCircleDragOver={handleCircleDragOver}
                onHandleMouseDown={handleHandleMouseDown}
              />
            ) : (
              <WeeklyView
                weeklyTasks={weeklyTasks}
                weeklyStartDate={weeklyStartDate}
                taskList={taskList}
                darkMode={darkMode}
                onWeeklyStartDateChange={setWeeklyStartDate}
                onAddWeeklyTask={addWeeklyTask}
                onUpdateWeeklyTask={updateWeeklyTask}
                onDeleteWeeklyTask={deleteWeeklyTask}
              />
            )}
          </div>
        </div>

        {/* Selected arc controls */}
        {selectedArc && (
          <ArcControls
            selectedArc={selectedArc}
            allArcs={arcs}
            darkMode={darkMode}
            onUpdateLabel={updateArcLabel}
            onDelete={deleteArc}
            onClose={() => setSelectedArcId(null)}
          />
        )}

        {/* Statistics Dashboard */}
        {showStats && <StatsPanel stats={stats} darkMode={darkMode} />}
      </div>
    </div>
  );
}
