export type OrbitPose = { x: number; y: number; zoom: number };
export type TouchPoint = { pageX: number; pageY: number };
export type OrbitGesture = {
  count: number;
  x: number;
  y: number;
  distance: number;
};
export const initialOrbit = (): OrbitPose => ({ x: 0.06, y: -0.28, zoom: 1 });
export function centeredOrbit(pose: OrbitPose): OrbitPose {
  const start = initialOrbit();
  const nearest = (angle: number, base: number) =>
    base + Math.round((angle - base) / (Math.PI * 2)) * Math.PI * 2;
  return { x: nearest(pose.x, start.x), y: nearest(pose.y, start.y), zoom: 1 };
}
const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

// Track incremental finger motion. Rebase when fingers enter/leave so pinch
// transitions never reuse the previous drag origin or suddenly jump.
export function moveOrbit(
  pose: OrbitPose,
  previous: OrbitGesture | null,
  touches: TouchPoint[],
) {
  if (!touches.length) return { pose, gesture: null };
  const count = Math.min(touches.length, 2);
  const x =
    touches.slice(0, count).reduce((sum, touch) => sum + touch.pageX, 0) /
    count;
  const y =
    touches.slice(0, count).reduce((sum, touch) => sum + touch.pageY, 0) /
    count;
  const distance =
    count === 2
      ? Math.hypot(
          touches[0].pageX - touches[1].pageX,
          touches[0].pageY - touches[1].pageY,
        )
      : 0;
  const gesture = { count, x, y, distance };
  if (!previous || previous.count !== count) return { pose, gesture };
  return {
    pose:
      count === 2
        ? {
            ...pose,
            zoom: clamp(
              (pose.zoom * distance) / Math.max(previous.distance, 1),
              0.8,
              1.28,
            ),
          }
        : {
            ...pose,
            x: pose.x + (y - previous.y) * 0.005,
            y: pose.y + (x - previous.x) * 0.006,
          },
    gesture,
  };
}
