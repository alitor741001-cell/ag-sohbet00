import { useState, useRef, useCallback, useEffect } from 'react';

const MIN_ZOOM = 100;
const MAX_ZOOM = 180;
const SAVE_DELAY = 500;

function pinchDistance(touches) {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

function panLimitFor(zoom) {
  return Math.max(0, (1 - MIN_ZOOM / zoom) * 50);
}

function clampPan(zoom, panX, panY) {
  const limit = panLimitFor(zoom);
  return {
    panX: Math.max(-limit, Math.min(limit, panX)),
    panY: Math.max(-limit, Math.min(limit, panY)),
  };
}

/**
 * Pinch-to-zoom + pan gesture hook for the profile photo.
 * Mobile: two-finger pinch zooms, one-finger drag pans.
 * Desktop: mouse wheel zooms, mouse drag pans.
 * Reports zoom/pan changes and debounces a save via onCommit.
 */
export default function usePhotoGestures({ initialZoom = 100, initialPanX = 0, initialPanY = 0, onCommit }) {
  const [zoom, setZoom] = useState(initialZoom);
  const [panX, setPanX] = useState(initialPanX);
  const [panY, setPanY] = useState(initialPanY);

  const stateRef = useRef({ zoom: initialZoom, panX: initialPanX, panY: initialPanY });
  const gestureRef = useRef(null);
  const commitTimer = useRef(null);
  const onCommitRef = useRef(onCommit);

  useEffect(() => { onCommitRef.current = onCommit; }, [onCommit]);
  useEffect(() => { stateRef.current.zoom = initialZoom; setZoom(initialZoom); }, [initialZoom]);
  useEffect(() => { stateRef.current.panX = initialPanX; setPanX(initialPanX); }, [initialPanX]);
  useEffect(() => { stateRef.current.panY = initialPanY; setPanY(initialPanY); }, [initialPanY]);

  const update = useCallback((newZoom, newPanX, newPanY) => {
    const z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    const clamped = clampPan(z, newPanX, newPanY);
    stateRef.current = { zoom: z, panX: clamped.panX, panY: clamped.panY };
    setZoom(z);
    setPanX(clamped.panX);
    setPanY(clamped.panY);
  }, []);

  const commit = useCallback(() => {
    if (commitTimer.current) clearTimeout(commitTimer.current);
    commitTimer.current = setTimeout(() => {
      const { zoom: z, panX: px, panY: py } = stateRef.current;
      onCommitRef.current?.({
        profile_frame_scale: Math.round(z),
        profile_avatar_x: Math.round(px),
        profile_avatar_y: Math.round(py),
      });
    }, SAVE_DELAY);
  }, []);

  // Button helpers (Y/X position buttons)
  const adjustY = useCallback((delta) => {
    update(stateRef.current.zoom, stateRef.current.panX, stateRef.current.panY + delta);
    commit();
  }, [update, commit]);

  const adjustX = useCallback((delta) => {
    update(stateRef.current.zoom, stateRef.current.panX + delta, stateRef.current.panY);
    commit();
  }, [update, commit]);

  const isInteractive = (target) => target.closest?.('label, button, input');

  // --- Touch ---
  const onTouchStart = useCallback((e) => {
    if (isInteractive(e.target)) return;
    if (e.touches.length === 2) {
      gestureRef.current = { type: 'pinch', startDist: pinchDistance(e.touches), startZoom: stateRef.current.zoom };
    } else if (e.touches.length === 1) {
      const rect = e.currentTarget.getBoundingClientRect();
      gestureRef.current = { type: 'pan', startX: e.touches[0].clientX, startY: e.touches[0].clientY, startPanX: stateRef.current.panX, startPanY: stateRef.current.panY, size: rect.width };
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    const g = gestureRef.current;
    if (!g) return;
    if (g.type === 'pinch' && e.touches.length === 2) {
      e.preventDefault();
      const ratio = pinchDistance(e.touches) / g.startDist;
      update(g.startZoom * ratio, stateRef.current.panX, stateRef.current.panY);
    } else if (g.type === 'pan' && e.touches.length === 1) {
      e.preventDefault();
      const z = stateRef.current.zoom;
      const factor = z / 100;
      const dx = ((e.touches[0].clientX - g.startX) / g.size) * 100 / factor;
      const dy = ((e.touches[0].clientY - g.startY) / g.size) * 100 / factor;
      update(z, g.startPanX + dx, g.startPanY + dy);
    }
  }, [update]);

  const onTouchEnd = useCallback((e) => {
    if (!gestureRef.current) return;
    if (e.touches.length === 1) {
      const rect = e.currentTarget.getBoundingClientRect();
      gestureRef.current = { type: 'pan', startX: e.touches[0].clientX, startY: e.touches[0].clientY, startPanX: stateRef.current.panX, startPanY: stateRef.current.panY, size: rect.width };
    } else {
      gestureRef.current = null;
      commit();
    }
  }, [commit]);

  // --- Mouse wheel ---
  const onWheel = useCallback((e) => {
    if (isInteractive(e.target)) return;
    e.preventDefault();
    const delta = -e.deltaY * 0.15;
    update(stateRef.current.zoom + delta, stateRef.current.panX, stateRef.current.panY);
    commit();
  }, [update, commit]);

  // --- Mouse drag ---
  const onMouseDown = useCallback((e) => {
    if (isInteractive(e.target)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    gestureRef.current = { type: 'mouse-pan', startX: e.clientX, startY: e.clientY, startPanX: stateRef.current.panX, startPanY: stateRef.current.panY, size: rect.width };
  }, []);

  useEffect(() => {
    const onMouseMove = (e) => {
      const g = gestureRef.current;
      if (!g || g.type !== 'mouse-pan') return;
      const z = stateRef.current.zoom;
      const factor = z / 100;
      const dx = ((e.clientX - g.startX) / g.size) * 100 / factor;
      const dy = ((e.clientY - g.startY) / g.size) * 100 / factor;
      update(z, g.startPanX + dx, g.startPanY + dy);
    };
    const onMouseUp = () => {
      if (gestureRef.current?.type === 'mouse-pan') { gestureRef.current = null; commit(); }
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => { window.removeEventListener('mousemove', onMouseMove); window.removeEventListener('mouseup', onMouseUp); };
  }, [update, commit]);

  useEffect(() => () => { if (commitTimer.current) clearTimeout(commitTimer.current); }, []);

  return { zoom, panX, panY, adjustY, adjustX, handlers: { onTouchStart, onTouchMove, onTouchEnd, onWheel, onMouseDown } };
}