export type SnackKind = 'ok' | 'no';

interface SnackState {
  open: boolean;
  msg: string;
  kind: SnackKind;
}

const state = $state<SnackState>({ open: false, msg: '', kind: 'ok' });
let timer: ReturnType<typeof setTimeout> | null = null;

export const snackbar = {
  get open() {
    return state.open;
  },
  get msg() {
    return state.msg;
  },
  get kind() {
    return state.kind;
  },
  show(msg: string, kind: SnackKind = 'ok', duration = 2400) {
    state.msg = msg;
    state.kind = kind;
    state.open = true;
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      state.open = false;
    }, duration);
  },
  hide() {
    if (timer) clearTimeout(timer);
    timer = null;
    state.open = false;
  }
};
