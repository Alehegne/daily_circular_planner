export interface Task {
  id: string;
  label: string;
  color: string;
  icon?: string;
  category?: string;
}

export interface Arc {
  id: string | number;
  startAngle: number;
  endAngle: number;
  label: string;
  color: string;
}

export interface WeeklyTask {
  id: number;
  taskId: string;
  hour: number;
  duration: number;
  label: string;
  color: string;
}

export type WeeklyTasks = {
  [key: number]: WeeklyTask[];
};

export interface DraggingHandle {
  arcId: string | number;
  handleType: "start" | "end";
}

export interface CategoryStats {
  [category: string]: number;
}

export interface PlannerData {
  date: string;
  arcs: Arc[];
  tasks: Task[];
  weeklyTasks: WeeklyTasks;
}

