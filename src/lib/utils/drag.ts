/**
 * Generic pointer-event drag helper.
 *
 * Why no `setPointerCapture`: it has rough edges on iOS Safari and a few Android
 * browsers — captures can be stolen mid-drag (e.g. by an iframe gaining focus)
 * leaving the dragged element stuck in its dragging state. The robust pattern is
 * to attach `pointermove`/`pointerup`/`pointercancel` on `document` and filter
 * by `pointerId`. That's what this helper does.
 *
 * Usage:
 *   const detach = attachDrag(handleEl, {
 *     threshold: 6,            // px before drag activates (distinguishes tap)
 *     axis: 'y',               // measure threshold along this axis (default: both)
 *     onStart: (e) => ...,
 *     onMove:  (e) => ...,
 *     onEnd:   (e, committed) => ...,  // committed = drag actually started
 *     onCancel: (e) => ...,
 *   });
 *
 * Caller responsibilities:
 *   - Set `touch-action: none` on `handleEl` so the browser doesn't claim the gesture.
 *   - Call `detach()` on unmount.
 */

export interface DragCallbacks {
  /** Called when the threshold is crossed and dragging genuinely starts. */
  onStart?: (e: PointerEvent) => void;
  /** Called for each pointermove during an active drag. */
  onMove?: (e: PointerEvent) => void;
  /** Called on pointerup. `committed` is true if drag actually started. */
  onEnd?: (e: PointerEvent, committed: boolean) => void;
  /** Called on pointercancel (interrupted by browser, OS, etc.). */
  onCancel?: (e: PointerEvent) => void;
}

export interface DragOptions extends DragCallbacks {
  /** Distance in px before drag is considered started. Default 6. */
  threshold?: number;
  /** Which axis to measure threshold along. Default 'both'. */
  axis?: 'x' | 'y' | 'both';
}

export function attachDrag(handle: HTMLElement, opts: DragOptions): () => void {
  const threshold = opts.threshold ?? 6;
  const axis = opts.axis ?? 'both';

  let startX = 0;
  let startY = 0;
  let pointerId: number | null = null;
  let dragging = false;

  function distanceExceeded(e: PointerEvent): boolean {
    const dx = Math.abs(e.clientX - startX);
    const dy = Math.abs(e.clientY - startY);
    if (axis === 'x') return dx >= threshold;
    if (axis === 'y') return dy >= threshold;
    return dx >= threshold || dy >= threshold;
  }

  function onMove(e: PointerEvent) {
    if (e.pointerId !== pointerId) return;
    if (!dragging) {
      if (!distanceExceeded(e)) return;
      dragging = true;
      opts.onStart?.(e);
    }
    // Prevent the page from scrolling along with the drag.
    e.preventDefault();
    opts.onMove?.(e);
  }

  function finalize(e: PointerEvent, kind: 'up' | 'cancel') {
    if (e.pointerId !== pointerId) return;
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onCancel);
    const wasDragging = dragging;
    dragging = false;
    pointerId = null;
    if (kind === 'cancel') opts.onCancel?.(e);
    else opts.onEnd?.(e, wasDragging);
  }
  function onUp(e: PointerEvent) {
    finalize(e, 'up');
  }
  function onCancel(e: PointerEvent) {
    finalize(e, 'cancel');
  }

  function onDown(e: PointerEvent) {
    // Multi-touch guard: only one pointer at a time.
    if (pointerId !== null) return;
    startX = e.clientX;
    startY = e.clientY;
    pointerId = e.pointerId;
    document.addEventListener('pointermove', onMove, { passive: false });
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onCancel);
  }

  handle.addEventListener('pointerdown', onDown);

  return () => {
    handle.removeEventListener('pointerdown', onDown);
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', onCancel);
  };
}
