import type { Task } from "@/types";

export const defaultTasks: Task[] = [
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

