<script lang="ts">
  import Modal from './Modal.svelte';
  import { i18n } from '$lib/i18n/index.svelte';

  /** A yes/no confirmation built on Modal, so destructive actions can ask first. */
  interface Props {
    open: boolean;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmLabel?: string;
    cancelLabel?: string;
  }
  let { open, message, onConfirm, onCancel, confirmLabel, cancelLabel }: Props = $props();
</script>

<Modal {open} onClose={onCancel} label={message}>
  <div class="confirm">
    <p class="confirm-msg">{message}</p>
    <div class="confirm-actions">
      <button class="btn ghost" type="button" onclick={onCancel}
        >{cancelLabel ?? i18n.m.common.cancel}</button
      >
      <button class="btn primary" type="button" onclick={onConfirm}
        >{confirmLabel ?? i18n.m.common.confirm}</button
      >
    </div>
  </div>
</Modal>

<style>
  .confirm {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
  .confirm-msg {
    margin: 0;
    color: var(--text);
    font-size: 15px;
    line-height: 1.5;
  }
  .confirm-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
  }
  .btn {
    border-radius: var(--r-pill);
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 8px 16px;
    cursor: pointer;
    border: 1px solid var(--border);
  }
  .btn.ghost {
    background: transparent;
    color: var(--text-mid);
  }
  .btn.primary {
    background: var(--accent-glow);
    border-color: var(--border-accent);
    color: var(--text);
  }
</style>
