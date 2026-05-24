/**
 * FLIP-animate vertical reordering of a child within its parent.
 *
 * Snapshots positions, commits the DOM move, then inverts + plays back to
 * natural position on the displaced siblings. The dragged row itself is
 * deliberately not animated — the user is moving it, so a snap is expected.
 *
 * The `excludeSelector` lets you skip the actively-dragged row when collecting
 * siblings to animate (Svelte's :not() chained on a class flag).
 */
export function flipReorder(
  parent: HTMLElement,
  row: HTMLElement,
  beforeNode: Node | null,
  options: { excludeSelector?: string; duration?: number; easing?: string } = {}
): void {
  const excludeSelector = options.excludeSelector ?? '.dragging';
  const duration = options.duration ?? 220;
  const easing = options.easing ?? 'cubic-bezier(.2,.6,.3,1)';

  if (row.nextElementSibling === beforeNode && beforeNode !== row) return;

  const others = [...parent.children].filter(
    (c): c is HTMLElement => c instanceof HTMLElement && !c.matches(excludeSelector)
  );

  const firstTops = new Map<HTMLElement, number>();
  for (const r of others) firstTops.set(r, r.getBoundingClientRect().top);

  if (beforeNode) parent.insertBefore(row, beforeNode);
  else parent.appendChild(row);

  for (const r of others) {
    const firstTop = firstTops.get(r);
    if (firstTop === undefined) continue;
    const lastTop = r.getBoundingClientRect().top;
    const dy = firstTop - lastTop;
    if (Math.abs(dy) < 0.5) continue;
    r.style.transition = 'none';
    r.style.transform = `translateY(${dy}px)`;
    // Force reflow so the next state actually animates.
    void r.offsetHeight;
    r.style.transition = `transform ${duration}ms ${easing}`;
    r.style.transform = '';
  }
}
