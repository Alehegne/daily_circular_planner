"use client";

import { ChartArea, Moon, Sun, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function CircularPlanner() {
  const [arcs, setArcs] = useState([]);
  const [weeklyTasks, setWeeklyTasks] = useState({}); // Add state for weekly tasks
  const [selectedArcId, setSelectedArcId] = useState(null);
  const [draggingHandle, setDraggingHandle] = useState(null);
  const [editingArcId, setEditingArcId] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTaskLabel, setNewTaskLabel] = useState("");
  const [newTaskColor, setNewTaskColor] = useState("#93c5e4");
  const [snapMinutes, setSnapMinutes] = useState(15);
  const [darkMode, setDarkMode] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [view, setView] = useState("daily"); // daily, weekly
  const [weeklyStartDate, setWeeklyStartDate] = useState(
    new Date(2025, 10, 17)
  );
  const [selectedWeeklyDay, setSelectedWeeklyDay] = useState(0);
  const [editingWeeklyTaskId, setEditingWeeklyTaskId] = useState(null);
  const svgRef = useRef(null);
  const containerRef = useRef(null);

  const CIRCLE_RADIUS = 300;
  const CIRCLE_CENTER_X = 350;
  const CIRCLE_CENTER_Y = 350;
  const HANDLE_RADIUS = 12;

  const defaultTasks = [
    {
      id: "sleep",
      label: "Sleep",
      color: "#93c5e4",
      icon: "🌙",
      category: "rest",
    },
    {
      id: "work",
      label: "Work",
      color: "#fbbf24",
      icon: "💼",
      category: "productivity",
    },
    {
      id: "exercise",
      label: "Exercise",
      color: "#86efac",
      icon: "🏃",
      category: "health",
    },
    {
      id: "study",
      label: "Study",
      color: "#d8b4fe",
      icon: "📚",
      category: "learning",
    },
    {
      id: "free-time",
      label: "Free Time",
      color: "#67e8f9",
      icon: "🎮",
      category: "leisure",
    },
  ];

  const [taskList, setTaskList] = useState(defaultTasks);

  useEffect(() => {
    if (Object.keys(weeklyTasks).length === 0) {
      const initWeekly = {};
      for (let i = 0; i < 7; i++) {
        initWeekly[i] = [];
      }
      setWeeklyTasks(initWeekly);
    }
  }, []);

  const getDayName = (dayIndex) => {
    const days = [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ];
    return days[dayIndex];
  };

  const getDateForDay = (dayIndex) => {
    const date = new Date(weeklyStartDate);
    date.setDate(weeklyStartDate.getDate() + dayIndex);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const polarToCartesian = (angle) => {
    const radians = ((angle - 90) * Math.PI) / 180;
    return {
      x: CIRCLE_CENTER_X + CIRCLE_RADIUS * Math.cos(radians),
      y: CIRCLE_CENTER_Y + CIRCLE_RADIUS * Math.sin(radians),
    };
  };

  const cartesianToPolar = (x, y) => {
    const dx = x - CIRCLE_CENTER_X;
    const dy = y - CIRCLE_CENTER_Y;
    let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (angle < 0) angle += 360;
    return angle;
  };

  const snapAngle = (angle) => {
    const degreesPerMinute = 360 / 1440; // 1440 minutes in a day
    const snapDegrees = snapMinutes * degreesPerMinute;
    return Math.round(angle / snapDegrees) * snapDegrees;
  };

  const checkOverlap = (arc1, arc2) => {
    const normalizeAngle = (a) => ((a % 360) + 360) % 360;
    const start1 = normalizeAngle(arc1.startAngle);
    const end1 = normalizeAngle(arc1.endAngle);
    const start2 = normalizeAngle(arc2.startAngle);
    const end2 = normalizeAngle(arc2.endAngle);

    const angleInRange = (angle, rangeStart, rangeEnd) => {
      if (rangeStart <= rangeEnd) {
        return angle >= rangeStart && angle <= rangeEnd;
      }
      return angle >= rangeStart || angle <= rangeEnd;
    };

    return (
      angleInRange(start2, start1, end1) ||
      angleInRange(end2, start1, end1) ||
      angleInRange(start1, start2, end2)
    );
  };

  const getConflicts = (arcId) => {
    const arc = arcs.find((a) => a.id === arcId);
    if (!arc) return [];
    return arcs.filter((a) => a.id !== arcId && checkOverlap(arc, a));
  };

  const getArcDuration = (arc) => {
    let duration = arc.endAngle - arc.startAngle;
    if (duration < 0) duration += 360;
    return Math.round((duration / 360) * 1440);
  };

  const calculateStats = () => {
    const categoryStats = {};
    arcs.forEach((arc) => {
      const task = taskList.find((t) => t.label === arc.label);
      const category = task?.category || "other";
      const duration = getArcDuration(arc);
      categoryStats[category] = (categoryStats[category] || 0) + duration;
    });
    return categoryStats;
  };

  const addToHistory = (newArcs) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newArcs);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    // Ensure arcs are updated as well
    setArcs(newArcs);
  };

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setArcs(history[historyIndex - 1]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setArcs(history[historyIndex + 1]);
    }
  };

  const exportJSON = () => {
    const data = {
      date: new Date().toISOString(),
      arcs,
      tasks: taskList,
      // Include weekly tasks in export
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
    URL.revokeObjectURL(url); // Clean up the object URL
  };

  const importJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result);
        setArcs(data.arcs || []);
        setTaskList(data.tasks || defaultTasks);
        // Load weekly tasks from imported data
        setWeeklyTasks(data.weeklyTasks || {});
        addToHistory(data.arcs || []); // Add imported arcs to history
      } catch (error) {
        alert("Error importing file");
        console.error("Import error:", error);
      }
    };
    reader.readAsText(file);
  };

  const addWeeklyTask = (dayIndex, hour) => {
    const taskToAdd =
      taskList.find((t) => t.id === taskList[0]?.id) || taskList[0]; // Ensure a task exists
    const newTask = {
      id: Date.now(),
      taskId: taskToAdd?.id || "work", // Default to 'work' if no tasks
      hour: hour,
      duration: 1, // Default duration to 1 hour
      label: taskToAdd?.label || "Task",
      color: taskToAdd?.color || "#93c5e4",
    };
    setWeeklyTasks((prevWeeklyTasks) => ({
      ...prevWeeklyTasks,
      [dayIndex]: [...(prevWeeklyTasks[dayIndex] || []), newTask],
    }));
  };

  const updateWeeklyTask = (dayIndex, taskId, updates) => {
    setWeeklyTasks((prevWeeklyTasks) => ({
      ...prevWeeklyTasks,
      [dayIndex]: (prevWeeklyTasks[dayIndex] || []).map((t) =>
        t.id === taskId ? { ...t, ...updates } : t
      ),
    }));
  };

  const deleteWeeklyTask = (dayIndex, taskId) => {
    setWeeklyTasks((prevWeeklyTasks) => ({
      ...prevWeeklyTasks,
      [dayIndex]: (prevWeeklyTasks[dayIndex] || []).filter(
        (t) => t.id !== taskId
      ),
    }));
  };

  const createSectorPath = (startAngle, endAngle) => {
    const start = polarToCartesian(startAngle);
    const end = polarToCartesian(endAngle);
    const center = { x: CIRCLE_CENTER_X, y: CIRCLE_CENTER_Y };

    let angleDiff = endAngle - startAngle;
    if (angleDiff < 0) angleDiff += 360;

    const largeArcFlag = angleDiff > 180 ? 1 : 0;

    return `M ${center.x} ${center.y} L ${start.x} ${start.y} A ${CIRCLE_RADIUS} ${CIRCLE_RADIUS} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
  };

  // Load from localStorage
  useEffect(() => {
    const savedArcs = localStorage.getItem("plannerArcs");
    const savedTasks = localStorage.getItem("plannerTasks");
    const savedSnapMinutes = localStorage.getItem("plannerSnapMinutes");
    const savedDarkMode = localStorage.getItem("plannerDarkMode");
    // Load weekly tasks from localStorage
    const savedWeeklyTasks = localStorage.getItem("plannerWeeklyTasks");
    const savedWeeklyStartDate = localStorage.getItem("plannerWeeklyStartDate");

    if (savedArcs) {
      try {
        const arcsData = JSON.parse(savedArcs);
        setArcs(arcsData);
        addToHistory(arcsData); // Initialize history with loaded data
      } catch (e) {
        console.error("Error loading arcs:", e);
      }
    }
    if (savedTasks) {
      try {
        setTaskList(JSON.parse(savedTasks));
      } catch (e) {
        console.error("Error loading tasks:", e);
      }
    }
    if (savedSnapMinutes) {
      setSnapMinutes(JSON.parse(savedSnapMinutes));
    }
    if (savedDarkMode) {
      setDarkMode(JSON.parse(savedDarkMode));
    }
    // Load and set weekly tasks and start date
    if (savedWeeklyTasks) {
      try {
        setWeeklyTasks(JSON.parse(savedWeeklyTasks));
      } catch (e) {
        console.error("Error loading weekly tasks:", e);
      }
    }
    if (savedWeeklyStartDate) {
      try {
        setWeeklyStartDate(new Date(JSON.parse(savedWeeklyStartDate)));
      } catch (e) {
        console.error("Error loading weekly start date:", e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem("plannerArcs", JSON.stringify(arcs));
  }, [arcs]);

  useEffect(() => {
    localStorage.setItem("plannerTasks", JSON.stringify(taskList));
  }, [taskList]);

  useEffect(() => {
    localStorage.setItem("plannerSnapMinutes", JSON.stringify(snapMinutes));
  }, [snapMinutes]);

  useEffect(() => {
    localStorage.setItem("plannerDarkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  // Save weekly tasks and start date to localStorage
  useEffect(() => {
    localStorage.setItem("plannerWeeklyTasks", JSON.stringify(weeklyTasks));
  }, [weeklyTasks]);

  useEffect(() => {
    localStorage.setItem(
      "plannerWeeklyStartDate",
      JSON.stringify(weeklyStartDate.toISOString())
    );
  }, [weeklyStartDate]);

  // Handle drag start from task list
  const handleTaskDragStart = (e, task) => {
    e.dataTransfer.effectAllowed = "copy";
    e.dataTransfer.setData("taskId", task.id);
    e.dataTransfer.setData("taskLabel", task.label); // Keep this for potential use in drop handlers
    e.dataTransfer.setData("taskColor", task.color); // Keep this for potential use in drop handlers
  };

  // Handle drop on circle
  const handleCircleDrop = (e) => {
    e.preventDefault();
    const taskLabel = e.dataTransfer.getData("taskLabel");
    const taskColor = e.dataTransfer.getData("taskColor");

    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const dropAngle = cartesianToPolar(x, y);
    const snappedAngle = snapAngle(dropAngle);
    // Default duration of 1 hour (60 minutes)
    const endAngle = (snappedAngle + 60 * (360 / 1440)) % 360;

    const newArc = {
      id: Date.now(),
      startAngle: snappedAngle,
      endAngle: endAngle,
      label: taskLabel,
      color: taskColor,
    };

    const newArcs = [...arcs, newArc];
    setArcs(newArcs); // Directly update arcs state
    addToHistory(newArcs); // Add to history after update
  };

  // Handle drag over circle
  const handleCircleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  // Handle handle drag
  const handleHandleMouseDown = (e, arcId, handleType) => {
    e.preventDefault();
    setDraggingHandle({ arcId, handleType });
  };

  // Handle mouse move for resizing
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!draggingHandle || !svgRef.current) return;

      const svg = svgRef.current;
      const rect = svg.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const angle = cartesianToPolar(x, y);
      const snappedAngle = snapAngle(angle);

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
        addToHistory(arcs); // Save to history when drag ends
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
  }, [draggingHandle, arcs, history]); // Added history to dependency array to ensure addToHistory is current

  // Handle arc click
  const handleArcClick = (arcId, e) => {
    e.stopPropagation();
    setSelectedArcId(selectedArcId === arcId ? null : arcId);
    setEditingArcId(null);
  };

  // Delete arc
  const deleteArc = (arcId) => {
    const newArcs = arcs.filter((arc) => arc.id !== arcId);
    setArcs(newArcs);
    addToHistory(newArcs);
    setSelectedArcId(null);
    setEditingArcId(null);
  };

  const updateArcLabel = (arcId, newLabel) => {
    if (newLabel.trim()) {
      const newArcs = arcs.map((arc) =>
        arc.id === arcId ? { ...arc, label: newLabel } : arc
      );
      setArcs(newArcs);
      addToHistory(newArcs);
      setEditingArcId(null);
    }
  };

  const addCustomTask = () => {
    if (newTaskLabel.trim()) {
      const newTask = {
        id: `custom-${Date.now()}`,
        label: newTaskLabel,
        color: newTaskColor,
        icon: "⭐",
        category: "other",
      };
      setTaskList([...taskList, newTask]);
      setNewTaskLabel("");
      setNewTaskColor("#93c5e4");
      setShowNewTaskForm(false);
    }
  };

  const deleteTask = (taskId) => {
    // Find the task being deleted to potentially remove associated arcs
    const taskToDelete = taskList.find((task) => task.id === taskId);
    if (taskToDelete) {
      // Filter out arcs that match the label of the deleted task
      const updatedArcs = arcs.filter(
        (arc) => arc.label !== taskToDelete.label
      );
      setArcs(updatedArcs);
      addToHistory(updatedArcs); // Add this change to history as well
    }
    // Remove the task from the task list
    setTaskList(taskList.filter((task) => task.id !== taskId));
  };

  const updateTask = (taskId, newLabel, newColor) => {
    if (newLabel.trim()) {
      const oldLabel = taskList.find((t) => t.id === taskId)?.label;
      setTaskList(
        taskList.map((task) =>
          task.id === taskId
            ? { ...task, label: newLabel, color: newColor }
            : task
        )
      );
      // If the label changed, update the label of existing arcs with the old label
      if (oldLabel && oldLabel !== newLabel) {
        const updatedArcs = arcs.map((arc) =>
          arc.label === oldLabel
            ? { ...arc, label: newLabel, color: newColor }
            : arc
        );
        setArcs(updatedArcs);
        addToHistory(updatedArcs);
      }
    }
  };

  const conflicts = selectedArcId ? getConflicts(selectedArcId) : [];
  const stats = calculateStats();

  const bgColor = darkMode
    ? "bg-slate-900"
    : "bg-gradient-to-br from-slate-50 to-slate-100";
  const cardBg = darkMode ? "bg-slate-800" : "bg-white";
  const textColor = darkMode ? "text-slate-100" : "text-slate-900";
  const textSecondary = darkMode ? "text-slate-400" : "text-slate-600";
  const borderColor = darkMode ? "border-slate-700" : "border-slate-200";

  return (
    <div
      className={`min-h-screen ${bgColor} p-8 transition-colors duration-300`}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header with dark mode toggle */}
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
              onClick={() => setDarkMode(!darkMode)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                darkMode
                  ? "bg-yellow-500 text-slate-900"
                  : "bg-slate-700 text-white"
              }`}
            >
              {darkMode ? <Sun /> : <Moon />}
            </button>
            <button
              onClick={() => setShowStats(!showStats)}
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

        <div className="flex gap-8" ref={containerRef}>
          {/* Task List */}

          <div className="w-72 shrink-0">
            <div
              className={`${cardBg} rounded-lg shadow-md p-6 border ${borderColor}`}
            >
              <h2 className={`text-lg font-semibold ${textColor} mb-4`}>
                Tasks
              </h2>

              {/* Snap minutes setting */}
              <div className={`mb-4 pb-4 border-b ${borderColor}`}>
                <label
                  className={`text-sm font-medium ${textColor} block mb-2`}
                >
                  Snap to:
                </label>
                <select
                  value={snapMinutes}
                  onChange={(e) => setSnapMinutes(Number(e.target.value))}
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
                {taskList.map((task) => (
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
                          const newLabel = prompt(
                            "Edit task name:",
                            task.label
                          );
                          if (newLabel !== null) {
                            updateTask(task.id, newLabel, task.color);
                          }
                        }}
                        className="bg-slate-700 text-white rounded px-2 py-1 text-xs hover:bg-slate-800"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
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
                        onClick={addCustomTask}
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
                  onClick={undo}
                  disabled={historyIndex <= 0}
                  className="flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 text-sm"
                >
                  ↶ Undo
                </button>
                <button
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                  className="flex-1 px-3 py-2 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-800 disabled:opacity-50 text-sm"
                >
                  ↷ Redo
                </button>
              </div>

              {/* Export/Import */}
              <div className={`mt-4 pt-4 border-t ${borderColor} space-y-2`}>
                <button
                  onClick={exportJSON}
                  className="w-full px-3 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 text-sm"
                >
                  📥 Export JSON
                </button>
                <label className="block">
                  <input
                    type="file"
                    accept=".json"
                    onChange={importJSON}
                    className="hidden"
                  />
                  <span className="w-full block px-3 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 text-sm text-center cursor-pointer">
                    📤 Import JSON
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Main View */}
          <div className="flex-1 flex items-center justify-center flex-col gap-4">
            {/* View selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setView("daily")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  view === "daily"
                    ? "bg-blue-500 text-white"
                    : `${cardBg} ${textColor} border ${borderColor}`
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setView("weekly")}
                className={`px-4 py-2 rounded-lg font-medium ${
                  view === "weekly"
                    ? "bg-blue-500 text-white"
                    : `${cardBg} ${textColor} border ${borderColor}`
                }`}
              >
                Weekly
              </button>
            </div>

            {view === "daily" ? (
              <div
                className={`${cardBg} rounded-lg shadow-xl p-8 border ${borderColor}`}
              >
                <svg
                  ref={svgRef}
                  width="700"
                  height="700"
                  onDrop={handleCircleDrop}
                  onDragOver={handleCircleDragOver}
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
                    const labelRadius = CIRCLE_RADIUS * 0.6;
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
                          onClick={(e) => handleArcClick(arc.id, e)}
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
                                handleHandleMouseDown(e, arc.id, "start")
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
                              onMouseDown={(e) =>
                                handleHandleMouseDown(e, arc.id, "end")
                              }
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
            ) : (
              <div
                className={`w-full ${cardBg} rounded-lg shadow-xl p-6 border ${borderColor}`}
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-2xl font-bold ${textColor}`}>
                    Weekly Schedule
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setWeeklyStartDate(
                          new Date(
                            weeklyStartDate.getTime() - 7 * 24 * 60 * 60 * 1000
                          )
                        )
                      }
                      className={`px-3 py-2 rounded-lg font-medium ${`${cardBg} ${textColor} border ${borderColor}`}`}
                    >
                      ← Previous
                    </button>
                    <button
                      onClick={() => setWeeklyStartDate(new Date())}
                      className={`px-3 py-2 rounded-lg font-medium ${`${cardBg} ${textColor} border ${borderColor}`}`}
                    >
                      Today
                    </button>
                    <button
                      onClick={() =>
                        setWeeklyStartDate(
                          new Date(
                            weeklyStartDate.getTime() + 7 * 24 * 60 * 60 * 1000
                          )
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
                      <div
                        className={`font-bold mb-3 text-center ${textColor}`}
                      >
                        <div>{getDayName(dayIndex)}</div>
                        <div className="text-xs text-slate-500">
                          {getDateForDay(dayIndex)}
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
                                    {task.hour}:00 -{" "}
                                    {(task.hour + task.duration) % 24}:00
                                  </div>
                                </div>
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                                  <button
                                    onClick={() => {
                                      const newLabel = prompt(
                                        "Edit task:",
                                        task.label
                                      );
                                      if (newLabel !== null) {
                                        updateWeeklyTask(dayIndex, task.id, {
                                          label: newLabel,
                                        });
                                      }
                                    }}
                                    className="bg-slate-600 text-white px-1 py-0.5 rounded text-xs hover:bg-slate-700"
                                  >
                                    ✏️
                                  </button>
                                  <button
                                    onClick={() =>
                                      deleteWeeklyTask(dayIndex, task.id)
                                    }
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
                        onClick={() => addWeeklyTask(dayIndex, 9)} // Default to adding at 9 AM
                        className="w-full px-3 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 text-xs"
                      >
                        + Add Task
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected arc controls with conflict alerts */}
        {selectedArcId && (
          <div
            className={`fixed bottom-8 right-8 ${cardBg} rounded-lg shadow-lg p-6 border ${borderColor} w-96`}
          >
            <h3 className={`text-lg font-semibold ${textColor} mb-4`}>
              Edit Scheduled Task
            </h3>

            {/* Conflict alert */}
            {conflicts.length > 0 && (
              <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
                <p className="text-sm font-semibold text-red-800">
                  Scheduling Conflict!
                </p>
                <p className="text-xs text-red-700 mt-1">
                  This task overlaps with:{" "}
                  {conflicts.map((c) => c.label).join(", ")}
                </p>
              </div>
            )}

            {editingArcId === selectedArcId ? (
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
                    onClick={() => updateArcLabel(selectedArcId, editLabel)}
                    className="flex-1 px-3 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors text-sm"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingArcId(null)}
                    className="flex-1 px-3 py-2 bg-slate-300 text-slate-900 rounded-lg font-medium hover:bg-slate-400 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                {arcs.find((a) => a.id === selectedArcId) && (
                  <>
                    <div
                      className={`mb-4 p-3 rounded-lg ${
                        darkMode ? "bg-slate-700" : "bg-slate-100"
                      }`}
                    >
                      <p className={`text-sm ${textColor}`}>
                        <strong>Task:</strong>{" "}
                        {arcs.find((a) => a.id === selectedArcId)?.label}
                      </p>
                      <p className={`text-sm ${textColor} mt-1`}>
                        <strong>Duration:</strong>{" "}
                        {getArcDuration(
                          arcs.find((a) => a.id === selectedArcId)
                        )}{" "}
                        minutes
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditingArcId(selectedArcId);
                          setEditLabel(
                            arcs.find((a) => a.id === selectedArcId)?.label ||
                              ""
                          );
                        }}
                        className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteArc(selectedArcId)}
                        className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Statistics Dashboard */}
        {showStats && (
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
                  Total Scheduled:{" "}
                  {Object.values(stats).reduce((a, b) => a + b, 0)} minutes
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global mouse event listeners */}
      {typeof document !== "undefined" && (
        <div
          onMouseMove={(e) => {
            if (draggingHandle && svgRef.current) {
              const rect = svgRef.current.getBoundingClientRect();
              const x = e.clientX - rect.left;
              const y = e.clientY - rect.top;
              const angle = snapAngle(cartesianToPolar(x, y));

              const updatedArcs = arcs.map((arc) => {
                if (arc.id === draggingHandle.arcId) {
                  if (draggingHandle.handleType === "start") {
                    return { ...arc, startAngle: angle };
                  } else {
                    return { ...arc, endAngle: angle };
                  }
                }
                return arc;
              });
              setArcs(updatedArcs);
            }
          }}
          onMouseUp={() => {
            if (draggingHandle) {
              addToHistory(arcs); // Save to history when drag ends
              setDraggingHandle(null);
            }
          }}
          className="w-full"
        />
      )}
    </div>
  );
}
