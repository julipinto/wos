<script lang="ts">
  import { onMount, tick } from 'svelte';
  import { goto } from '$app/navigation';
  import { base } from '$app/paths';
  import { i18n, fmt } from '$lib/i18n/index.svelte';
  import PageHeader from '$lib/components/PageHeader.svelte';
  import Icon from '$lib/components/Icon.svelte';
  import ConfirmDialog from '$lib/components/ConfirmDialog.svelte';
  import Tutorial from '$lib/components/Tutorial.svelte';
  import ModeBar from '$lib/tools/territory/ModeBar.svelte';
  import Controls from '$lib/tools/territory/Controls.svelte';
  import Rail from '$lib/tools/territory/Rail.svelte';
  import Board from '$lib/tools/territory/Board.svelte';
  import MiniMap from '$lib/tools/territory/MiniMap.svelte';
  import ContextMenu from '$lib/tools/territory/ContextMenu.svelte';
  import Search from '$lib/tools/territory/Search.svelte';
  import Editor from '$lib/tools/territory/Editor.svelte';
  import MapsPanel from '$lib/tools/territory/MapsPanel.svelte';
  import RosterPanel from '$lib/tools/territory/RosterPanel.svelte';
  import Select from '$lib/components/Select.svelte';
  import NumberInput from '$lib/components/NumberInput.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Button from '$lib/components/Button.svelte';
  import IconButton from '$lib/components/IconButton.svelte';
  import TextInput from '$lib/components/TextInput.svelte';
  import CollabBar from '$lib/tools/territory/CollabBar.svelte';
  import ExportDialog from '$lib/tools/territory/ExportDialog.svelte';
  import ShareDialog from '$lib/tools/territory/ShareDialog.svelte';
  import type { CollabSession, CollabStatus, PeerState } from '$lib/tools/territory/collab';
  import { TERRITORY_SLIDES } from '$lib/tools/territory/tutorial';
  import { readJson, writeJson } from '$lib/utils/storage';
  import {
    OBJECT_DEFS,
    MODES,
    modeById,
    FURNACE_LEVELS,
    exportLayout,
    importLayout,
    normalizeObject,
    collides,
    type PlacedObject,
    type TerritoryType
  } from '$lib/tools/territory/territory';
  import { savedMaps } from '$lib/tools/territory/maps.svelte';
  import { createHistory } from '$lib/tools/territory/history.svelte';

  const VIEW_KEY = 'territory-view-v1';
  const MODE_KEY = 'territory-mode-v1';

  type View = 'flat' | 'iso';
  let view = $state<View>(readJson<View>(VIEW_KEY) === 'iso' ? 'iso' : 'flat');
  function setView(v: View) {
    view = v;
    writeJson(VIEW_KEY, v);
  }

  // Planner mode (hive / sunfire / state) — each has its own palette + storage.
  const initialMode = modeById(readJson<string>(MODE_KEY) ?? 'hive').id;
  let mode = $state<string>(initialMode);
  const activeMode = $derived(modeById(mode));
  const modeOptions = $derived(
    MODES.map((m) => ({
      id: m.id,
      label: (i18n.m.territory.modes as Record<string, string>)[m.i18n]
    }))
  );
  // Hive keeps the original key so existing layouts survive.
  const layoutKey = (m: string) => (m === 'hive' ? 'territory-layout-v1' : `territory-layout-${m}`);

  function loadLayout(m: string): PlacedObject[] {
    const raw = readJson<PlacedObject[]>(layoutKey(m));
    if (!Array.isArray(raw)) return [];
    const allowed = new Set(modeById(m).types);
    const kept = raw.filter((o) => o && allowed.has(o.type));
    // normalizeObject sanitises legacy/odd bear tags (e.g. a raw number) that
    // would otherwise throw "bear is not iterable" when cloned/rendered.
    const cleaned = kept.map(normalizeObject);
    // Self-heal storage when legacy data was found, so localStorage is corrected.
    const dirty =
      kept.length !== raw.length ||
      kept.some(
        (o) =>
          (o.bear !== undefined && !Array.isArray(o.bear as unknown)) ||
          (o.bearMain !== undefined && !Array.isArray(o.bearMain as unknown))
      );
    if (dirty) writeJson(layoutKey(m), cleaned);
    return cleaned;
  }
  const objects = $state<PlacedObject[]>(loadLayout(initialMode));

  // ── Undo / redo (bounded) — logic lives in history.svelte.ts ─────────────
  const cloneLayout = (a: PlacedObject[]) =>
    a.map((o) => ({
      ...o,
      bear: Array.isArray(o.bear) ? [...o.bear] : undefined,
      bearMain: Array.isArray(o.bearMain) ? [...o.bearMain] : undefined
    }));
  // A GUEST (joined someone else's room) edits the host's shared map, but must
  // NEVER persist it over their own saved hive — like joining an Excalidraw room.
  // The host (room owner) persists normally; their map is the source of truth.
  const save = () => {
    if (collabGuest) return;
    writeJson(layoutKey(mode), cloneLayout(objects));
  };

  const undoRedo = createHistory<PlacedObject[]>({
    snapshot: () => cloneLayout(objects),
    restore: (s) => {
      objects.splice(0, objects.length, ...cloneLayout(s));
      selectedIds = [];
      save();
    }
  });
  const undo = () => (collabActive ? collabSession?.undo() : undoRedo.undo());
  const redo = () => (collabActive ? collabSession?.redo() : undoRedo.redo());
  // Loading a different layout (mode switch / load / import) is a new document.
  const clearHist = () => undoRedo.reset();

  function persist() {
    if (!iAmEditor) return; // a read-only guest can't mutate the shared map
    // In a room the Yjs UndoManager records (per-user); solo, the local history does.
    if (!collabActive) undoRedo.record();
    save();
    // Mirror the change to the room (no-op when not collaborating).
    if (collabSession && !applyingRemote) collabSession.pushLocal();
  }

  function setMode(m: string) {
    if (m === mode) return;
    mode = m;
    writeJson(MODE_KEY, m);
    objects.splice(0, objects.length, ...loadLayout(m));
    selectedIds = [];
    bearFocus = 0;
    highlight = '';
    tool = modeById(m).types[0];
    clearHist();
    autoFit();
  }

  let tool = $state<TerritoryType>(modeById(initialMode).types[0]);
  // Selection is a set so several objects can be moved/removed together. The tag
  // editor only shows when exactly one is selected.
  let selectedIds = $state<string[]>([]);
  const selected = $derived(
    selectedIds.length === 1 ? (objects.find((o) => o.id === selectedIds[0]) ?? null) : null
  );
  // Edit ⟷ View, like Excalidraw: Edit places/moves/marquee-selects; View just
  // pans the board by dragging (so drag-to-pan and marquee don't fight).
  const BOARDMODE_KEY = 'territory-boardmode-v1';
  let boardMode = $state<'edit' | 'view'>(
    readJson<'edit' | 'view'>(BOARDMODE_KEY) === 'view' ? 'view' : 'edit'
  );
  function setBoardMode(b: 'edit' | 'view') {
    if (b === 'edit' && !iAmEditor) return; // read-only guests stay in View
    boardMode = b;
    writeJson(BOARDMODE_KEY, b);
    if (b === 'view') selectedIds = [];
  }
  let zoom = $state(1);
  let showLabels = $state(false);
  const LABELBY_KEY = 'territory-labelby-v1';
  let labelField = $state<'furnace' | 'name'>(
    readJson<'furnace' | 'name'>(LABELBY_KEY) === 'name' ? 'name' : 'furnace'
  );
  function setLabelField(f: 'furnace' | 'name') {
    labelField = f;
    writeJson(LABELBY_KEY, f);
  }
  let heatmap = $state(false);
  let colorByPrimary = $state(false); // colour cities by their primary bear trap
  let highlight = $state(''); // '' = off · a type · 'orphaned'
  let importText = $state('');
  let copied = $state(false);
  let mapName = $state('');
  const HELP_KEY = 'territory-help-seen-v1';
  let helpOpen = $state(false);
  let exportOpen = $state(false);
  let shareOpen = $state(false);
  const exportTitle = $derived(
    `${(i18n.m.territory.modes as Record<string, string>)[activeMode.i18n]} — ${new Date().toLocaleDateString()}`
  );

  // A confirm dialog (e.g. before overwriting a saved map).
  let confirmMsg = $state('');
  let confirmAction = $state<(() => void) | null>(null);
  function askConfirm(message: string, onYes: () => void) {
    confirmMsg = message;
    confirmAction = onYes;
  }
  function doConfirm() {
    confirmAction?.();
    confirmAction = null;
    confirmMsg = '';
  }

  function saveMap() {
    const name = mapName.trim();
    if (!name || objects.length === 0) return;
    const existing = savedMaps.all(mode).find((m) => m.name.toLowerCase() === name.toLowerCase());
    const commit = () => {
      savedMaps.save(mode, name, objects);
      mapName = '';
    };
    if (existing) askConfirm(fmt(i18n.m.territory.maps.overwrite, { name }), commit);
    else commit();
  }
  function updateMap(id: string, name: string) {
    askConfirm(fmt(i18n.m.territory.maps.overwrite, { name }), () =>
      savedMaps.update(mode, id, objects)
    );
  }
  function loadMap(id: string) {
    objects.splice(0, objects.length, ...savedMaps.objectsOf(mode, id).map(normalizeObject));
    selectedIds = [];
    save();
    clearHist();
    autoFit();
  }
  // Compare a saved map (the "before" baseline) against the current board ("after").
  // Hand both layouts to the compare screen via sessionStorage (avoids huge URLs).
  function compareMap(id: string) {
    const seed = {
      before: savedMaps.objectsOf(mode, id).map(normalizeObject),
      after: cloneLayout(objects)
    };
    sessionStorage.setItem('territory-compare-seed', JSON.stringify(seed));
    goto(`${base}/territory/compare`);
  }

  const furnaceOptions = [
    { value: '', label: '—' },
    ...FURNACE_LEVELS.map((l) => ({ value: l, label: l }))
  ];

  const objName = (k: string) => (i18n.m.territory.obj as Record<string, string>)[k];
  const count = (t: TerritoryType) => objects.filter((o) => o.type === t).length;

  const hasBears = $derived(activeMode.types.includes('bearTrap'));
  const bearCount = $derived(objects.filter((o) => o.type === 'bearTrap').length);
  // Per-trap load: how many cities take it as primary vs backup (balance view).
  const bearTally = $derived.by(() => {
    const stats: { n: number; main: number; backup: number }[] = [];
    for (let n = 1; n <= bearCount; n++) {
      let main = 0;
      let backup = 0;
      for (const o of objects) {
        if (o.type !== 'city' || !o.bear?.includes(n)) continue;
        if (o.bearMain?.includes(n)) main++;
        else backup++;
      }
      stats.push({ n, main, backup });
    }
    return stats;
  });
  let bearFocus = $state(0); // 0 = show all; 1..3 = highlight that bear's group
  // A city can join several bear traps (different days) — toggle each on/off.
  function toggleBear(n: number) {
    const o = selected;
    if (!o) return;
    const set = new Set(o.bear ?? []);
    if (set.has(n)) {
      set.delete(n);
      // leaving a trap also drops it as a primary
      if (o.bearMain?.includes(n)) {
        const m = o.bearMain.filter((x) => x !== n);
        if (m.length) o.bearMain = m;
        else delete o.bearMain;
      }
    } else set.add(n);
    if (set.size) o.bear = [...set].sort((a, b) => a - b);
    else delete o.bear;
    persist();
  }
  // Mark/unmark a trap as a PRIMARY for the selected city (joins it if needed).
  function toggleBearMain(n: number) {
    const o = selected;
    if (!o) return;
    const join = new Set(o.bear ?? []);
    join.add(n);
    o.bear = [...join].sort((a, b) => a - b);
    const main = new Set(o.bearMain ?? []);
    if (main.has(n)) main.delete(n);
    else main.add(n);
    if (main.size) o.bearMain = [...main].sort((a, b) => a - b);
    else delete o.bearMain;
    persist();
  }

  // Toggle the farm / support-account flag on the selected city.
  function toggleFarm() {
    const o = selected;
    if (!o) return;
    if (o.farm) delete o.farm;
    else o.farm = true;
    persist();
  }

  function setTag<K extends 'name' | 'label' | 'furnace' | 'power' | 'uid'>(
    k: K,
    v: PlacedObject[K]
  ) {
    const o = selected;
    if (!o) return;
    if (v === '' || v === 0 || v === undefined) delete o[k];
    else o[k] = v;
    persist();
  }
  // Bulk edit: apply a label/furnace/power across the whole multi-selection
  // (furnace/power only land on cities). Empty/zero clears the tag, like setTag.
  function bulkSet<K extends 'label' | 'furnace' | 'power'>(k: K, v: PlacedObject[K]) {
    for (const o of selectedObjects()) {
      if ((k === 'furnace' || k === 'power') && !OBJECT_DEFS[o.type].city) continue;
      if (v === '' || v === 0 || v === undefined) delete o[k];
      else o[k] = v;
    }
    persist();
  }
  // Convert a single object to another type in place, clamped to the grid and
  // rejected if the new footprint would collide. City-only tags drop if it stops
  // being a city.
  function convertSelected(type: string) {
    const o = selected;
    if (!o || o.type === type) return;
    const def = OBJECT_DEFS[type];
    const x = Math.min(o.x, N - def.w);
    const y = Math.min(o.y, N - def.h);
    if (collides(objects, { ...o, type, x, y }, o.id)) return;
    o.type = type;
    o.x = x;
    o.y = y;
    if (!OBJECT_DEFS[type].city) {
      delete o.furnace;
      delete o.power;
      delete o.bear;
    }
    persist();
  }
  function removeSelected() {
    if (!selectedIds.length) return;
    const ids = new Set(selectedIds);
    for (let i = objects.length - 1; i >= 0; i--) if (ids.has(objects[i].id)) objects.splice(i, 1);
    selectedIds = [];
    persist();
  }
  // Arrow-key nudge: shift the whole selection by (dx,dy) cells, clamped to the
  // 60×60 grid and rejected if it would collide with an unselected footprint.
  const N = 60;
  function nudge(dx: number, dy: number) {
    const sel = selectedObjects();
    if (!sel.length) return;
    const ids = new Set(sel.map((o) => o.id));
    const others = objects.filter((o) => !ids.has(o.id));
    const next = sel.map((o) => {
      const def = OBJECT_DEFS[o.type];
      return {
        o,
        x: Math.min(Math.max(0, o.x + dx), N - def.w),
        y: Math.min(Math.max(0, o.y + dy), N - def.h)
      };
    });
    if (next.some((n) => collides(others, { ...n.o, x: n.x, y: n.y }, n.o.id))) return;
    let changed = false;
    for (const n of next) {
      if (n.o.x !== n.x || n.o.y !== n.y) {
        n.o.x = n.x;
        n.o.y = n.y;
        changed = true;
      }
    }
    if (changed) persist();
  }

  // ── Duplicate / copy-paste ──────────────────────────────────────────────
  const newId = (type: string) =>
    `${type}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  /** Drop clones of `src` onto the board at the first diagonal offset that fits. */
  function placeClones(src: PlacedObject[]) {
    if (!src.length) return;
    let off = 2;
    const fits = (k: number) =>
      src.every((o) => !collides(objects, { ...o, id: '__t', x: o.x + k, y: o.y + k }, '__t'));
    while (off <= 16 && !fits(off)) off++;
    const copies = src.map((o) => ({
      ...o,
      bear: o.bear ? [...o.bear] : undefined,
      bearMain: o.bearMain ? [...o.bearMain] : undefined,
      id: newId(o.type),
      x: o.x + off,
      y: o.y + off
    }));
    objects.push(...copies);
    selectedIds = copies.map((c) => c.id);
    persist();
  }
  const selectedObjects = () => objects.filter((o) => selectedIds.includes(o.id));
  function duplicateSelected() {
    placeClones(selectedObjects());
  }
  let clipboard: PlacedObject[] = [];
  function copySelection() {
    clipboard = selectedObjects().map((o) => ({
      ...o,
      bear: o.bear ? [...o.bear] : undefined,
      bearMain: o.bearMain ? [...o.bearMain] : undefined
    }));
  }
  function pasteClipboard() {
    placeClones(clipboard);
  }
  function reset() {
    objects.splice(0, objects.length);
    selectedIds = [];
    persist();
  }

  // ── Search / go-to ──────────────────────────────────────────────────────
  let board = $state<ReturnType<typeof Board>>();
  /** Frame the freshly-loaded hive once the new objects have rendered. */
  function autoFit() {
    tick().then(() => requestAnimationFrame(() => board?.fit()));
  }
  function focusObject(o: PlacedObject) {
    const def = OBJECT_DEFS[o.type];
    selectedIds = [o.id];
    board?.focusCell(o.x + def.w / 2, o.y + def.h / 2);
  }
  function gotoCoord(x: number, y: number) {
    selectedIds = [];
    board?.focusCell(x + 0.5, y + 0.5);
  }
  // Minimap viewport (filled by Board) + right-click context menu position.
  let viewport = $state<{ x: number; y: number; w: number; h: number }>({
    x: 0,
    y: 0,
    w: 60,
    h: 60
  });
  let ctx = $state<{ x: number; y: number } | null>(null);
  function openContext(id: string, x: number, y: number) {
    selectedIds = [id];
    ctx = { x, y };
  }
  // Quick-jump targets for the top-bar presets.
  const seedObj = $derived(objects.find((o) => OBJECT_DEFS[o.type].seed) ?? null);
  const firstBear = $derived(objects.find((o) => o.type === 'bearTrap') ?? null);
  // Highlight filter options: off · each type · orphaned (when connectivity matters).
  const highlightOptions = $derived([
    { value: '', label: '—' },
    ...activeMode.types.map((t) => ({ value: t, label: objName(OBJECT_DEFS[t].i18n) })),
    ...(activeMode.connectivity
      ? [{ value: 'orphaned', label: i18n.m.territory.legend.orphan }]
      : [])
  ]);

  // ── Live collaboration (P2P via Yjs/WebRTC; lazy-loaded) ─────────────────
  const COLLAB_USER_KEY = 'territory-collab-user-v1';
  function loadUser(): { id: string; name: string; color: string } {
    const saved = readJson<{ id?: string; name: string; color: string }>(COLLAB_USER_KEY);
    // A stable id (persisted) keeps a peer's identity across reconnects, so a brief
    // network drop doesn't read as someone leaving + a new person joining, and so
    // host permissions stick to the right person.
    const id = saved?.id || crypto.randomUUID();
    if (saved?.name) {
      if (!saved.id) writeJson(COLLAB_USER_KEY, { ...saved, id }); // migrate older saves
      return { id, name: saved.name, color: saved.color };
    }
    const colors = ['#60a5fa', '#f472b6', '#34d399', '#fbbf24', '#a78bfa', '#fb7185', '#22d3ee'];
    const animals = ['Fox', 'Bear', 'Wolf', 'Owl', 'Lynx', 'Seal', 'Hawk', 'Yeti', 'Crane'];
    const u = {
      id,
      name: `${animals[Math.floor(Math.random() * animals.length)]}-${Math.floor(100 + Math.random() * 900)}`,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
    writeJson(COLLAB_USER_KEY, u);
    return u;
  }
  let me = $state(loadUser());
  let collabActive = $state(false);
  let collabStatus = $state<CollabStatus>('disconnected');
  let collabPeers = $state<PeerState[]>([]);
  let collabCopied = $state(false);
  // Host-controlled permissions (peerIds). viewers = forced read-only; kicked = removed.
  let collabViewers = $state<string[]>([]);
  let collabKicked = $state<string[]>([]);
  // True for a JOINER until the room's shared layout first syncs in — lets us cover
  // the board with a "connecting" state instead of flashing this device's old hive.
  let collabJoining = $state(false);
  // True for the whole session when we JOINED someone else's room (vs created our
  // own). A guest's edits sync to the host but never persist over its own hive.
  let collabGuest = $state(false);
  // May this client edit the shared map? Solo and the host always can; a guest can
  // unless the host marked it read-only.
  const iAmEditor = $derived(
    !collabActive || !collabGuest || (collabPeers.find((p) => p.self)?.editor ?? true)
  );
  // In a room, undo/redo is per-user (Yjs UndoManager); solo it's the local history.
  let collabCanUndo = $state(false);
  let collabCanRedo = $state(false);
  // peerId of the peer whose viewport we're following (camera follows them).
  let followId = $state<string | null>(null);
  const canUndo = $derived(collabActive ? collabCanUndo : undoRedo.canUndo);
  const canRedo = $derived(collabActive ? collabCanRedo : undoRedo.canRedo);
  // The guest's own layout, stashed on join and restored on leave.
  let guestBackup: PlacedObject[] | null = null;
  let joinFallback: ReturnType<typeof setTimeout> | null = null;
  // Whether a host peer has been seen this session — so we can close the room for
  // guests once the host leaves (but not before they've ever connected).
  let hostSeen = false;
  // The current room id (for the sessionStorage host marker below).
  let currentRoom = '';
  // sessionStorage marker so the HOST survives a page refresh (F5): it remembers
  // "I created room X (secret …)" only for this tab, so reloading rejoins as host
  // (not as a guest, which would falsely trip the "host left → close" logic).
  const hostKey = (room: string) => `territory-host-${room}`;
  const rememberHost = (room: string, secret: string) => {
    try {
      sessionStorage.setItem(hostKey(room), secret);
    } catch {
      /* sessionStorage may be unavailable (privacy mode) — non-fatal */
    }
  };
  const forgetHost = (room: string) => {
    try {
      sessionStorage.removeItem(hostKey(room));
    } catch {
      /* ignore */
    }
  };
  const recallHostSecret = (room: string): string | null => {
    try {
      return sessionStorage.getItem(hostKey(room));
    } catch {
      return null;
    }
  };
  let collabSession: CollabSession | null = null;
  let applyingRemote = false; // guards the remote→local apply from echoing back

  function renamePeer(name: string) {
    const n = name.trim().slice(0, 18) || me.name;
    me = { ...me, name: n };
    writeJson(COLLAB_USER_KEY, me);
    collabSession?.setUser(me);
  }

  // Join / leave toasts: diff the remote peer set whenever awareness changes.
  let toasts = $state<{ id: number; text: string; color: string }[]>([]);
  let toastN = 0;
  let prevPeers = new Map<number, { name: string; color: string }>();
  function pushToast(text: string, color: string) {
    const id = ++toastN;
    toasts = [...toasts, { id, text, color }];
    setTimeout(() => (toasts = toasts.filter((t) => t.id !== id)), 3500);
  }
  $effect(() => {
    const cur = new Map(
      collabPeers.filter((p) => !p.self).map((p) => [p.id, { name: p.name, color: p.color }])
    );
    for (const [id, p] of cur)
      if (!prevPeers.has(id))
        pushToast(fmt(i18n.m.territory.collab.joined, { name: p.name }), p.color);
    for (const [id, p] of prevPeers)
      if (!cur.has(id)) pushToast(fmt(i18n.m.territory.collab.left, { name: p.name }), p.color);
    prevPeers = cur;
  });

  async function startCollabSession(room: string, key: string | undefined, seed: boolean) {
    if (collabSession) return;
    currentRoom = room;
    collabActive = true;
    collabStatus = 'connecting';
    // A joiner waits for the room's layout; show the overlay until it arrives, with
    // a safety timeout so an empty/slow room never leaves it stuck.
    collabJoining = !seed;
    collabGuest = !seed;
    hostSeen = seed; // the host trivially "sees" itself; a guest waits for the host
    // Stash the guest's own map so leaving restores it (its storage is left alone).
    guestBackup = seed ? null : cloneLayout(objects);
    if (joinFallback) clearTimeout(joinFallback);
    if (!seed) joinFallback = setTimeout(() => (collabJoining = false), 12000);
    const { startCollab: createCollab } = await import('$lib/tools/territory/collab');
    collabSession = createCollab({
      room,
      password: key,
      seed,
      user: me,
      getObjects: () => objects,
      applyRemote: (objs) => {
        applyingRemote = true;
        objects.splice(0, objects.length, ...objs.map(normalizeObject));
        selectedIds = selectedIds.filter((id) => objects.some((o) => o.id === id));
        save();
        undoRedo.rebase(); // keep the undo baseline aligned with the room
        applyingRemote = false;
        collabJoining = false; // shared layout received → reveal the board
      },
      onPeers: (p) => (collabPeers = p),
      onStatus: (s) => (collabStatus = s),
      onKicked: () => {
        pushToast(i18n.m.territory.collab.kicked, '#fb7185');
        setTimeout(leaveCollab, 0);
      },
      onUndoState: (u, r) => {
        collabCanUndo = u;
        collabCanRedo = r;
      }
    });
  }
  // Host: toggle a guest read-only ⟷ editor.
  function toggleEditor(peerId: string) {
    collabViewers = collabViewers.includes(peerId)
      ? collabViewers.filter((x) => x !== peerId)
      : [...collabViewers, peerId];
    collabSession?.setViewers(collabViewers);
  }
  // Host: remove a guest from the room.
  function kickPeer(peerId: string) {
    if (!collabKicked.includes(peerId)) collabKicked = [...collabKicked, peerId];
    collabSession?.setKicked(collabKicked);
  }
  // Toggle following a peer's camera; jump to them immediately on enable.
  function toggleFollow(peerId: string) {
    followId = followId === peerId ? null : peerId;
    if (followId) {
      const p = collabPeers.find((x) => x.peerId === followId);
      if (p?.viewport)
        board?.focusCell(p.viewport.x + p.viewport.w / 2, p.viewport.y + p.viewport.h / 2);
    }
  }
  // Leaving: a host with guests confirms first (it ends the room for everyone);
  // a guest (or a host alone) just leaves.
  function requestLeave() {
    const guests = collabPeers.filter((p) => !p.self).length;
    if (!collabGuest && guests > 0) {
      askConfirm(fmt(i18n.m.territory.collab.endSessionConfirm, { n: guests }), leaveCollab);
    } else {
      leaveCollab();
    }
  }
  // Create / join dialogs (optional password). No password → the E2E key lives in
  // the link (anyone with the link joins). With a password → the link is clean
  // (#room=ID&pw=1) and the password (shared out-of-band) is the secret.
  let collabCreateOpen = $state(false);
  let collabPassInput = $state('');
  let joinPrompt = $state<{ room: string } | null>(null);

  function openCreate() {
    collabPassInput = '';
    collabCreateOpen = true;
  }
  function confirmCreate() {
    const room = crypto.randomUUID();
    const pw = collabPassInput.trim();
    collabCreateOpen = false;
    collabPassInput = '';
    const base = `${location.pathname}${location.search}`;
    if (pw) {
      history.replaceState(null, '', `${base}#room=${room}&pw=1`);
      rememberHost(room, pw); // survive F5 (the password isn't in the link)
      startCollabSession(room, pw, true);
    } else {
      const key = crypto.randomUUID().replace(/-/g, ''); // E2E key — stays in the hash
      history.replaceState(null, '', `${base}#room=${room}&key=${key}`);
      rememberHost(room, key);
      startCollabSession(room, key, true);
    }
  }
  function confirmJoin() {
    if (!joinPrompt) return;
    const room = joinPrompt.room;
    const pw = collabPassInput.trim();
    joinPrompt = null;
    collabPassInput = '';
    startCollabSession(room, pw || undefined, false);
    // Wrong password (or empty room) can't be told apart cleanly — nudge after a bit.
    setTimeout(() => {
      if (collabSession && collabPeers.filter((p) => !p.self).length === 0)
        pushToast(i18n.m.territory.collab.joinFailed, '#fb7185');
    }, 9000);
  }
  function copyCollabLink() {
    navigator.clipboard.writeText(location.href).then(() => {
      collabCopied = true;
      setTimeout(() => (collabCopied = false), 1800);
    });
  }
  function leaveCollab() {
    const wasGuest = collabGuest;
    const backup = guestBackup;
    if (currentRoom) forgetHost(currentRoom); // explicit leave → no longer the host
    currentRoom = '';
    collabSession?.destroy();
    collabSession = null;
    collabActive = false;
    collabPeers = [];
    collabStatus = 'disconnected';
    collabJoining = false;
    collabGuest = false;
    collabViewers = [];
    collabKicked = [];
    collabCanUndo = false;
    collabCanRedo = false;
    followId = null;
    guestBackup = null;
    hostSeen = false;
    if (joinFallback) clearTimeout(joinFallback);
    // Back to Edit after a session — so nobody is stranded in (now read-only) View,
    // whether a guest was forced there or the host had switched to View to look around.
    setBoardMode('edit');
    history.replaceState(null, '', location.pathname + location.search);
    // A guest returns to its own hive (the room's layout was never persisted).
    if (wasGuest) {
      objects.splice(0, objects.length, ...(backup ?? loadLayout(mode)));
      selectedIds = [];
      save();
      autoFit();
    }
    // Reset the local history to the current board (the room used the Yjs undo).
    clearHist();
  }
  // Broadcast this peer's selection (live highlight comes in the next phase).
  $effect(() => {
    if (collabSession) collabSession.setSelection(selectedIds);
  });
  // Broadcast our viewport so others can follow it.
  $effect(() => {
    if (collabSession) collabSession.setViewport(viewport);
  });
  // While following a peer, recentre on their viewport whenever it moves.
  $effect(() => {
    if (!followId) return;
    const p = collabPeers.find((x) => x.peerId === followId && !x.self);
    if (p?.viewport)
      board?.focusCell(p.viewport.x + p.viewport.w / 2, p.viewport.y + p.viewport.h / 2);
  });
  // A read-only guest is forced into View (no editing).
  $effect(() => {
    if (collabActive && collabGuest && !iAmEditor && boardMode !== 'view') {
      boardMode = 'view';
      selectedIds = [];
    }
  });
  // Close the room for a guest once the host leaves — the host owns the map, so
  // without it there's no source of truth to keep editing.
  $effect(() => {
    if (!collabActive || !collabGuest) return;
    if (collabPeers.some((p) => !p.self && p.host)) {
      hostSeen = true;
    } else if (hostSeen) {
      hostSeen = false;
      pushToast(i18n.m.territory.collab.hostLeft, '#fb7185');
      setTimeout(leaveCollab, 0); // defer out of the reactive flush
    }
  });

  // Precompute the share link (off the current page URL, so it follows the host)
  // whenever the layout/mode changes. Compression is async, so doing it here and
  // copying synchronously on click keeps the clipboard gesture valid (Safari).
  let shareUrl = $state('');
  let shareCode = $state('');
  let codeCopied = $state(false);
  // ~2000 chars is the safe cross-app ceiling (Chrome address bar / Discord
  // message). Past it, nudge users to the code+import path instead of the link.
  const urlTooLong = $derived(shareUrl.length > 2000);
  $effect(() => {
    const snapshot = objects.map((o) => ({ ...o }));
    const m = mode;
    exportLayout(m, snapshot).then((code) => {
      shareCode = code;
      shareUrl = `${location.origin}${location.pathname}?t=${encodeURIComponent(code)}`;
    });
  });
  function doExport() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(
      () => {
        copied = true;
        setTimeout(() => (copied = false), 1800);
      },
      () => (copied = false)
    );
  }
  function doCopyCode() {
    if (!shareCode) return;
    navigator.clipboard.writeText(shareCode).then(
      () => {
        codeCopied = true;
        setTimeout(() => (codeCopied = false), 1800);
      },
      () => (codeCopied = false)
    );
  }
  function applyImport(parsed: { mode: string; objects: PlacedObject[] }) {
    mode = parsed.mode;
    writeJson(MODE_KEY, mode);
    objects.splice(0, objects.length, ...parsed.objects.map(normalizeObject));
    tool = modeById(mode).types[0];
    selectedIds = [];
    save();
    clearHist();
    autoFit();
  }
  // Accept a full share link OR a raw code; apply if it parses.
  async function parseAndApply(text: string): Promise<boolean> {
    const m = text.match(/[?&]t=([^&\s]+)/);
    const parsed = await importLayout(m ? decodeURIComponent(m[1]) : text.trim());
    if (parsed) applyImport(parsed);
    return !!parsed;
  }
  async function doImport() {
    if (await parseAndApply(importText)) {
      importText = '';
      shareOpen = false;
      pushToast(fmt(i18n.m.territory.imported, { n: objects.length }), '#34d399');
    } else {
      pushToast(i18n.m.territory.importFailed, '#fb7185');
    }
  }
  // Download the layout as a .txt file — the no-length-limit way to share a big hive.
  function doDownload() {
    if (!shareCode) return;
    const blob = new Blob([shareCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wos-${mode}-territory.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function onImportFile(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const text = await file.text();
    input.value = ''; // let the same file be picked again later
    if (await parseAndApply(text)) {
      shareOpen = false;
      pushToast(fmt(i18n.m.territory.imported, { n: objects.length }), '#34d399');
    } else {
      pushToast(i18n.m.territory.importFailed, '#fb7185');
    }
  }

  function closeHelp() {
    helpOpen = false;
    writeJson(HELP_KEY, true);
  }

  // A shared layout link (?t=CODE) loads on open — into its embedded mode.
  // A collab link (#room=ID) joins that live room instead.
  onMount(async () => {
    savedMaps.reload(); // ensure saved maps reflect localStorage on the client
    if (!readJson<boolean>(HELP_KEY)) helpOpen = true; // first visit → quick tour
    const hashParams = new URLSearchParams(location.hash.slice(1));
    const room = hashParams.get('room');
    if (room) {
      // This tab created the room and is just refreshing → rejoin as the host.
      const hostSecret = recallHostSecret(room);
      if (hostSecret !== null) {
        startCollabSession(room, hostSecret || undefined, true);
        return;
      }
      const key = hashParams.get('key');
      if (key) startCollabSession(room, key, false);
      else if (hashParams.get('pw'))
        joinPrompt = { room }; // ask for the password
      else startCollabSession(room, undefined, false);
      return;
    }
    const code = new URLSearchParams(location.search).get('t');
    if (!code) return;
    const parsed = await importLayout(code);
    if (parsed && parsed.objects.length) applyImport(parsed);
  });

  // Keyboard shortcuts. Skip while typing in a field so the browser's own
  // editing (text undo, copy, etc.) still works there.
  onMount(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = document.activeElement?.tagName;
      if (el === 'INPUT' || el === 'TEXTAREA' || el === 'SELECT') return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && (e.key === 'z' || e.key === 'y')) {
        e.preventDefault();
        if (e.key === 'y' || e.shiftKey) redo();
        else undo();
      } else if (mod && e.key === 'd') {
        e.preventDefault();
        duplicateSelected();
      } else if (mod && e.key === 'c') {
        copySelection();
      } else if (mod && e.key === 'v') {
        e.preventDefault();
        pasteClipboard();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length) {
          e.preventDefault();
          removeSelected();
        }
      } else if (e.key === 'Escape') {
        selectedIds = [];
      } else if (e.key.startsWith('Arrow') && selectedIds.length) {
        e.preventDefault();
        const d = e.shiftKey ? 5 : 1;
        if (e.key === 'ArrowUp') nudge(0, -d);
        else if (e.key === 'ArrowDown') nudge(0, d);
        else if (e.key === 'ArrowLeft') nudge(-d, 0);
        else if (e.key === 'ArrowRight') nudge(d, 0);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });
</script>

<svelte:head>
  <title>{i18n.m.landing.territory.title} · {i18n.m.landing.kicker}</title>
</svelte:head>

<div class="wrap">
  <PageHeader title={i18n.m.landing.territory.title} sub={i18n.m.territory.sub} backHref="/" />

  <ModeBar
    modes={modeOptions}
    active={mode}
    ariaLabel={i18n.m.territory.modes.label}
    onSelect={setMode}
  />

  <CollabBar
    active={collabActive}
    status={collabStatus}
    peers={collabPeers}
    copied={collabCopied}
    myName={me.name}
    myColor={me.color}
    iAmHost={collabActive && !collabGuest}
    {followId}
    onStart={openCreate}
    onCopy={copyCollabLink}
    onLeave={requestLeave}
    onRename={renamePeer}
    onToggleEditor={toggleEditor}
    onKick={kickPeer}
    onFollow={toggleFollow}
  />

  <div class="topbar">
    <Controls bind:zoom onFit={() => board?.fit()} />
    <div class="tb-actions">
      {#if seedObj}
        <IconButton
          label={i18n.m.territory.jumpHq}
          size="sm"
          onclick={() => seedObj && focusObject(seedObj)}>⌂</IconButton
        >
      {/if}
      {#if firstBear}
        <IconButton
          label={i18n.m.territory.jumpBear}
          size="sm"
          onclick={() => firstBear && focusObject(firstBear)}>🐻</IconButton
        >
      {/if}
      <IconButton label={i18n.m.territory.undo} size="sm" onclick={undo} disabled={!canUndo}
        >↶</IconButton
      >
      <IconButton label={i18n.m.territory.redo} size="sm" onclick={redo} disabled={!canRedo}
        >↷</IconButton
      >
      <IconButton label={i18n.m.territory.help.title} size="sm" onclick={() => (helpOpen = true)}>
        <Icon name="circle-help" size={15} />
      </IconButton>
    </div>
  </div>

  <div class="stage">
    <div class="rail-col">
      <Rail
        {boardMode}
        onBoardMode={setBoardMode}
        canEdit={iAmEditor}
        {view}
        onView={setView}
        types={activeMode.types}
        {tool}
        nameOf={objName}
        {count}
        onPick={(t) => (tool = tool === t ? '' : t)}
        bind:showLabels
        {labelField}
        onLabelField={setLabelField}
        bind:heatmap
        bind:colorByPrimary
        bind:bearFocus
        bind:highlight
        {highlightOptions}
        {hasBears}
        {bearCount}
        bearStats={bearTally}
        connectivity={!!activeMode.connectivity}
      />
    </div>

    <div class="stage-board">
      {#if collabActive && collabJoining}
        <div class="join-overlay" role="status" aria-live="polite">
          <span class="join-spinner" aria-hidden="true"></span>
          <span class="join-text">{i18n.m.territory.collab.joining}</span>
        </div>
      {/if}
      {#if collabActive && collabGuest && !iAmEditor && !collabJoining}
        <p class="readonly-banner">👁 {i18n.m.territory.collab.readOnly}</p>
      {/if}
      {#if objects.length > 0}
        <Search {objects} nameOf={objName} onPick={focusObject} onGoto={gotoCoord} />
        <p class="obj-count">
          {fmt(i18n.m.territory.objectsN, { n: objects.length })}{#if selectedIds.length > 0}
            · {fmt(i18n.m.territory.selectedN, { n: selectedIds.length })}{/if}
        </p>
      {/if}
      <Board
        bind:this={board}
        {objects}
        bind:selectedIds
        bind:bearFocus
        {view}
        bind:zoom
        {boardMode}
        {tool}
        {showLabels}
        {labelField}
        {heatmap}
        {highlight}
        {colorByPrimary}
        connectivity={!!activeMode.connectivity}
        bind:viewport
        peers={collabPeers}
        onContextMenu={openContext}
        onCursor={(p) => collabSession?.setCursor(p)}
        onLiveSync={() => collabSession?.pushLocal()}
        onPersist={persist}
      />
      {#if objects.length > 0}
        <div class="minimap-wrap">
          <MiniMap {objects} {viewport} onJump={(cx, cy) => board?.focusCell(cx, cy)} />
        </div>
      {/if}
    </div>

    <div class="stage-side">
      {#if selectedIds.length > 1}
        <div class="group-bar">
          <span class="group-count"
            >{fmt(i18n.m.territory.selectedN, { n: selectedIds.length })}</span
          >
          <div class="bulk-fields">
            <span class="bulk-title">{i18n.m.territory.bulkEdit}</span>
            <TextInput
              class="bulk-input"
              placeholder={i18n.m.territory.tag.label}
              aria-label={i18n.m.territory.tag.label}
              oninput={(e) => bulkSet('label', e.currentTarget.value)}
            />
            <Select
              value=""
              options={furnaceOptions}
              onChange={(v) => bulkSet('furnace', v)}
              ariaLabel={i18n.m.territory.tag.furnace}
            />
            <NumberInput
              value={0}
              onChange={(n) => bulkSet('power', n)}
              ariaLabel={i18n.m.territory.tag.power}
              placeholder={i18n.m.territory.tag.power}
            />
          </div>
          <div class="bulk-actions">
            <Button variant="secondary" size="sm" onclick={duplicateSelected}>
              ⧉ {i18n.m.territory.duplicate}
            </Button>
            <Button variant="danger" size="sm" onclick={removeSelected}>
              {i18n.m.territory.remove}
            </Button>
            <Button variant="ghost" size="sm" onclick={() => (selectedIds = [])}>
              {i18n.m.common.close}
            </Button>
          </div>
        </div>
      {:else if selected}
        <Editor
          {selected}
          typeLabel={objName(OBJECT_DEFS[selected.type].i18n)}
          isCity={!!OBJECT_DEFS[selected.type].city}
          editable={boardMode === 'edit' && iAmEditor}
          {hasBears}
          {bearCount}
          {furnaceOptions}
          convertOptions={activeMode.types
            .filter((t) => t !== selected.type)
            .map((t) => ({ value: t, label: objName(OBJECT_DEFS[t].i18n) }))}
          {setTag}
          {toggleFarm}
          {toggleBear}
          {toggleBearMain}
          onConvert={convertSelected}
          onDuplicate={duplicateSelected}
          onRemove={removeSelected}
          onClose={() => (selectedIds = [])}
        />
      {:else}
        <p class="side-hint">{i18n.m.territory.selectHint}</p>
      {/if}
    </div>
  </div>

  <div class="footer">
    <p class="hint">{i18n.m.territory.hint}</p>
    <div class="footer-actions">
      <Button variant="secondary" size="sm" onclick={() => (shareOpen = true)}>
        <Icon name="share-2" size={13} />
        {i18n.m.territory.shareProject}
      </Button>
      <Button
        variant="secondary"
        size="sm"
        onclick={() => (exportOpen = true)}
        disabled={objects.length === 0}
      >
        <Icon name="image" size={13} />
        {i18n.m.territory.export.button}
      </Button>
      <Button variant="ghost" size="sm" onclick={() => goto(`${base}/territory/compare`)}>
        <Icon name="git-compare" size={13} />
        {i18n.m.territory.compare.link}
      </Button>
      <Button variant="ghost" size="sm" onclick={reset} disabled={objects.length === 0}>
        {i18n.m.common.reset}
      </Button>
    </div>
  </div>

  <MapsPanel
    {mode}
    hasObjects={objects.length > 0}
    bind:mapName
    onSave={saveMap}
    onUpdate={updateMap}
    onLoad={loadMap}
    onCompare={compareMap}
  />

  <RosterPanel {objects} onPick={focusObject} />

  <Modal
    open={collabCreateOpen || !!joinPrompt}
    onClose={() => {
      collabCreateOpen = false;
      joinPrompt = null;
    }}
    label={collabCreateOpen
      ? i18n.m.territory.collab.start
      : i18n.m.territory.collab.passwordRequired}
  >
    <div class="cm">
      <span class="cm-title">
        {collabCreateOpen
          ? i18n.m.territory.collab.start
          : i18n.m.territory.collab.passwordRequired}
      </span>
      <TextInput
        bind:value={collabPassInput}
        placeholder={collabCreateOpen
          ? i18n.m.territory.collab.passwordOptional
          : i18n.m.territory.collab.password}
        autocomplete="off"
        onkeydown={(e) => e.key === 'Enter' && (collabCreateOpen ? confirmCreate() : confirmJoin())}
      />
      <Button variant="primary" size="sm" onclick={collabCreateOpen ? confirmCreate : confirmJoin}>
        {collabCreateOpen ? i18n.m.territory.collab.createRoom : i18n.m.territory.collab.enter}
      </Button>
    </div>
  </Modal>

  {#if toasts.length}
    <div class="toasts">
      {#each toasts as t (t.id)}
        <div class="toast">
          <span class="toast-dot" style="background: {t.color}"></span>{t.text}
        </div>
      {/each}
    </div>
  {/if}

  {#if ctx}
    <ContextMenu
      x={ctx.x}
      y={ctx.y}
      items={[
        { label: i18n.m.territory.duplicate, onClick: duplicateSelected },
        { label: i18n.m.territory.remove, danger: true, onClick: removeSelected }
      ]}
      onClose={() => (ctx = null)}
    />
  {/if}

  <ShareDialog
    open={shareOpen}
    onClose={() => (shareOpen = false)}
    hasObjects={objects.length > 0}
    {urlTooLong}
    {copied}
    {codeCopied}
    onShare={doExport}
    onCopyCode={doCopyCode}
    onDownload={doDownload}
    bind:importText
    onImport={doImport}
    {onImportFile}
  />

  <ExportDialog
    open={exportOpen}
    onClose={() => (exportOpen = false)}
    {objects}
    connectivity={!!activeMode.connectivity}
    defaultTitle={exportTitle}
    {objName}
  />

  <ConfirmDialog
    open={!!confirmAction}
    message={confirmMsg}
    onConfirm={doConfirm}
    onCancel={() => (confirmAction = null)}
  />

  <Tutorial
    open={helpOpen}
    onClose={closeHelp}
    slides={[
      {
        title: i18n.m.territory.tour.welcomeTitle,
        caption: i18n.m.territory.tour.welcomeCaption,
        svg: TERRITORY_SLIDES[0]()
      },
      {
        title: i18n.m.territory.tour.modesTitle,
        caption: i18n.m.territory.tour.modesCaption,
        svg: TERRITORY_SLIDES[1]()
      },
      {
        title: i18n.m.territory.tour.placeTitle,
        caption: i18n.m.territory.tour.placeCaption,
        svg: TERRITORY_SLIDES[2]()
      },
      {
        title: i18n.m.territory.tour.tagTitle,
        caption: i18n.m.territory.tour.tagCaption,
        svg: TERRITORY_SLIDES[3]()
      },
      {
        title: i18n.m.territory.tour.bearsTitle,
        caption: i18n.m.territory.tour.bearsCaption,
        svg: TERRITORY_SLIDES[4]()
      },
      {
        title: i18n.m.territory.tour.insightsTitle,
        caption: i18n.m.territory.tour.insightsCaption,
        svg: TERRITORY_SLIDES[5]()
      },
      {
        title: i18n.m.territory.tour.collabTitle,
        caption: i18n.m.territory.tour.collabCaption,
        svg: TERRITORY_SLIDES[6]()
      },
      {
        title: i18n.m.territory.tour.shareExportTitle,
        caption: i18n.m.territory.tour.shareExportCaption,
        svg: TERRITORY_SLIDES[7]()
      }
    ]}
  />
</div>

<style>
  .wrap {
    width: 100%;
    max-width: 640px;
    margin: 0 auto;
    padding: 32px 24px 96px;
  }
  .stage {
    display: grid;
    gap: 14px;
  }
  .stage-board {
    position: relative;
  }
  /* Read-only banner for a guest the host hasn't given edit access. */
  .readonly-banner {
    margin: 0 0 10px;
    padding: 7px 12px;
    border-radius: var(--r-pill);
    background: rgba(251, 191, 36, 0.12);
    border: 1px solid rgba(251, 191, 36, 0.4);
    color: #fbbf24;
    font-family: var(--font-mono);
    font-size: 11px;
    text-align: center;
  }
  /* "Connecting" cover for a joiner — hides this device's old hive until the
     room's shared layout syncs in. */
  .join-overlay {
    position: absolute;
    inset: 0;
    z-index: 30;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    background: color-mix(in srgb, var(--bg) 82%, transparent);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    border-radius: var(--r-card);
  }
  .join-text {
    font-family: var(--font-mono);
    font-size: 12px;
    letter-spacing: 1px;
    color: var(--text-mid);
  }
  .join-spinner {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    animation: join-spin 0.8s linear infinite;
  }
  @keyframes join-spin {
    to {
      transform: rotate(360deg);
    }
  }
  /* Minimap floats over the board's bottom-right; desktop only (no hover/room on
     phones, where you pan the small board directly). */
  .minimap-wrap {
    display: none;
  }
  @media (min-width: 1024px) {
    .minimap-wrap {
      display: block;
      position: absolute;
      right: 10px;
      bottom: 10px;
      z-index: 6;
      opacity: 0.9;
    }
    .minimap-wrap:hover {
      opacity: 1;
    }
  }
  /* Wide desktop: three columns — the left rail, the board, and a sticky editor
     column on the right (Figma style) so editing a piece never scrolls the page.
     Below this the rail collapses into a horizontal band above the board. */
  @media (min-width: 1024px) {
    .wrap {
      max-width: 1240px;
    }
    .stage {
      grid-template-columns: 200px minmax(0, 1fr) 300px;
      gap: 20px;
      align-items: start;
    }
    .rail-col,
    .stage-side {
      position: sticky;
      top: 20px;
    }
    .stage-side :global(.editor),
    .stage-side .group-bar {
      margin-top: 0;
    }
  }
  .obj-count {
    margin: -4px 0 10px;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text-dim);
  }
  .side-hint {
    display: none;
  }
  @media (min-width: 1024px) {
    .side-hint {
      display: block;
      margin: 0;
      font-family: var(--font-mono);
      font-size: 12px;
      line-height: 1.5;
      color: var(--text-dim);
      text-align: center;
      padding: 28px 18px;
      border: 1px dashed var(--border);
      border-radius: var(--r-card);
    }
  }
  .topbar {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    flex-wrap: wrap;
  }
  /* Create / join collab dialog (inside the shared Modal). */
  .cm {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .cm-title {
    font-family: var(--font-mono);
    font-size: 12px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-mid);
  }
  /* Transient join/leave notifications, bottom-centre. */
  .toasts {
    position: fixed;
    left: 50%;
    bottom: 24px;
    transform: translateX(-50%);
    z-index: 80;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    pointer-events: none;
  }
  .toast {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: var(--bg-soft);
    border: 1px solid var(--border-strong);
    border-radius: var(--r-pill);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 8px 14px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
    animation: toast-in 0.2s ease;
  }
  .toast-dot {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    flex: none;
  }
  @keyframes toast-in {
    from {
      opacity: 0;
      transform: translateY(6px);
    }
  }
  .tb-actions {
    margin-inline-start: auto;
    display: inline-flex;
    gap: 8px;
  }
  .group-bar {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 14px;
    padding: 10px 14px;
    background: var(--surface);
    border: 1px solid var(--border-accent);
    border-radius: var(--r-card);
  }
  .group-count {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--text);
    margin-inline-end: auto;
  }
  .bulk-fields {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    flex-basis: 100%;
  }
  .bulk-title {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  /* Just the flex sizing — TextInput (passed this class) brings its own styling. */
  .bulk-fields :global(.bulk-input) {
    min-width: 0;
    flex: 1 1 120px;
  }
  .bulk-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    flex-basis: 100%;
  }
  .footer-actions {
    display: flex;
    gap: 8px;
    flex-shrink: 0;
    flex-wrap: wrap;
    justify-content: flex-end;
  }
  .footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-top: 16px;
  }
  .hint {
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.5;
    color: var(--text-dim);
    margin: 0;
  }
  @media (max-width: 540px) {
    .wrap {
      padding: 24px 18px 72px;
    }
    /* Stack the share row so the long hint + buttons stop overflowing. */
    .footer {
      flex-direction: column;
      align-items: stretch;
    }
    .footer-actions {
      justify-content: stretch;
    }
    .footer-actions :global(.btn) {
      flex: 1 1 auto;
    }
    /* Multi-select bar floats as a bottom sheet (like the editor) instead of
       pushing the page. */
    .group-bar {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 0;
      margin: 0;
      background: var(--bg-soft);
      border-top: 1px solid var(--border-accent);
      border-radius: 16px 16px 0 0;
      z-index: 60;
      padding: 14px 16px max(14px, env(safe-area-inset-bottom));
      box-shadow: 0 -14px 44px rgba(0, 0, 0, 0.6);
    }
  }
</style>
