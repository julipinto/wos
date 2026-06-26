// Bounded undo/redo for the territory planner, extracted from the page so the
// route file stays focused. Snapshots are kept off-reactive and capped, and rapid
// edits coalesce into one step (so typing a label doesn't spam the stack). Only
// `canUndo`/`canRedo` are reactive — the stacks themselves don't need to be.
//
// The page wires it with two callbacks: `snapshot()` clones the current layout and
// `restore(s)` applies a snapshot back. `record()` is called after every change;
// `rebase()` realigns the baseline without pushing a step (used when a collab peer
// replaces the document, so the next local edit diffs against the room's state).

export interface History {
  readonly canUndo: boolean;
  readonly canRedo: boolean;
  /** Note a change (coalesced within `coalesceMs`). */
  record(): void;
  undo(): void;
  redo(): void;
  /** New document (mode switch / load / import) — drop all steps. */
  reset(): void;
  /** Realign the baseline to the current state without recording a step. */
  rebase(): void;
}

export function createHistory<T>(opts: {
  snapshot: () => T;
  restore: (s: T) => void;
  max?: number;
  coalesceMs?: number;
}): History {
  const max = opts.max ?? 50;
  const coalesce = opts.coalesceMs ?? 400;
  let undoStack: T[] = [];
  let redoStack: T[] = [];
  let last = opts.snapshot();
  let lastPush = 0;
  let canUndo = $state(false);
  let canRedo = $state(false);
  const refresh = () => {
    canUndo = undoStack.length > 0;
    canRedo = redoStack.length > 0;
  };

  return {
    get canUndo() {
      return canUndo;
    },
    get canRedo() {
      return canRedo;
    },
    record() {
      const now = Date.now();
      if (now - lastPush > coalesce) {
        undoStack.push(last);
        if (undoStack.length > max) undoStack.shift();
        redoStack = [];
      }
      lastPush = now;
      last = opts.snapshot();
      refresh();
    },
    undo() {
      if (!undoStack.length) return;
      redoStack.push(opts.snapshot());
      if (redoStack.length > max) redoStack.shift();
      opts.restore(undoStack.pop()!);
      last = opts.snapshot();
      lastPush = 0;
      refresh();
    },
    redo() {
      if (!redoStack.length) return;
      undoStack.push(opts.snapshot());
      if (undoStack.length > max) undoStack.shift();
      opts.restore(redoStack.pop()!);
      last = opts.snapshot();
      lastPush = 0;
      refresh();
    },
    reset() {
      undoStack = [];
      redoStack = [];
      last = opts.snapshot();
      lastPush = 0;
      refresh();
    },
    rebase() {
      last = opts.snapshot();
      lastPush = 0;
    }
  };
}
