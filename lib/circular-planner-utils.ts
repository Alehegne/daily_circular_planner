import type { Arc } from "@/types";

export const CIRCLE_RADIUS = 300;
export const CIRCLE_CENTER_X = 350;
export const CIRCLE_CENTER_Y = 350;
export const HANDLE_RADIUS = 12;

export const polarToCartesian = (angle: number) => {
  const radians = ((angle - 90) * Math.PI) / 180;
  return {
    x: CIRCLE_CENTER_X + CIRCLE_RADIUS * Math.cos(radians),
    y: CIRCLE_CENTER_Y + CIRCLE_RADIUS * Math.sin(radians),
  };
};

export const cartesianToPolar = (x: number, y: number) => {
  const dx = x - CIRCLE_CENTER_X;
  const dy = y - CIRCLE_CENTER_Y;
  let angle = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  if (angle < 0) angle += 360;
  return angle;
};

export const snapAngle = (angle: number, snapMinutes: number) => {
  const degreesPerMinute = 360 / 1440; // 1440 minutes in a day
  const snapDegrees = snapMinutes * degreesPerMinute;
  return Math.round(angle / snapDegrees) * snapDegrees;
};

export const checkOverlap = (
  arc1: { startAngle: number; endAngle: number },
  arc2: { startAngle: number; endAngle: number }
) => {
  const normalizeAngle = (a: number) => ((a % 360) + 360) % 360;
  const start1 = normalizeAngle(arc1.startAngle);
  const end1 = normalizeAngle(arc1.endAngle);
  const start2 = normalizeAngle(arc2.startAngle);
  const end2 = normalizeAngle(arc2.endAngle);

  const angleInRange = (
    angle: number,
    rangeStart: number,
    rangeEnd: number
  ) => {
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

export const getArcDuration = (arc: { startAngle: number; endAngle: number }) => {
  let duration = arc.endAngle - arc.startAngle;
  if (duration < 0) duration += 360;
  return Math.round((duration / 360) * 1440);
};

export const createSectorPath = (startAngle: number, endAngle: number) => {
  const start = polarToCartesian(startAngle);
  const end = polarToCartesian(endAngle);
  const center = { x: CIRCLE_CENTER_X, y: CIRCLE_CENTER_Y };

  let angleDiff = endAngle - startAngle;
  if (angleDiff < 0) angleDiff += 360;

  const largeArcFlag = angleDiff > 180 ? 1 : 0;

  return `M ${center.x} ${center.y} L ${start.x} ${start.y} A ${CIRCLE_RADIUS} ${CIRCLE_RADIUS} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
};

export const getDayName = (dayIndex: number) => {
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

export const getDateForDay = (dayIndex: number, weeklyStartDate: Date) => {
  const date = new Date(weeklyStartDate);
  date.setDate(weeklyStartDate.getDate() + dayIndex);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

