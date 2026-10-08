import React from 'react';
import { FLIGHT_CURVE, flightPoint } from './rocketPath';

const { start, control, end } = FLIGHT_CURVE;
// Roketin izlediği kavis: tek karesel Bezier, sahne oranlarıyla çizilir.
const ROUTE = `M ${start.x * 100} ${start.y * 100} Q ${control.x * 100} ${control.y * 100} ${end.x * 100} ${end.y * 100}`;

/**
 * Uçuş rotası: soluk kesikli hedef hattı, ilerledikçe dolan camgöbeği hat,
 * fırlatma noktası ve uçuşun ucundaki parlak baş.
 */
export default function RocketFlightPath({ progress }) {
  const done = Math.min(1, Math.max(0, progress || 0));
  const head = flightPoint(done);

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
      fill="none"
      aria-hidden="true"
    >
      <path d={ROUTE} pathLength="1" vectorEffect="non-scaling-stroke" className="rk-path-ghost" />
      <path
        d={ROUTE}
        pathLength="1"
        vectorEffect="non-scaling-stroke"
        className="rk-path-live"
        style={{ strokeDashoffset: 1 - done }}
      />
      <circle cx={start.x * 100} cy={start.y * 100} r="0.55" className="rk-pad-mark" />
      <circle cx={head.x * 100} cy={head.y * 100} r="0.5" className="rk-path-head" />
    </svg>
  );
}