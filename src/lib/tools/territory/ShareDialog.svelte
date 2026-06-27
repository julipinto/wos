<script lang="ts">
  import { i18n } from '$lib/i18n/index.svelte';
  import Modal from '$lib/components/Modal.svelte';
  import Button from '$lib/components/Button.svelte';
  import Icon from '$lib/components/Icon.svelte';

  // "Share project" hub: the layout blueprint as a link / code / file, plus import.
  // (Visual exports — PNG/draw.io/xlsx — live in the separate Export dialog.)
  interface Props {
    open: boolean;
    onClose: () => void;
    hasObjects: boolean;
    urlTooLong: boolean;
    copied: boolean;
    codeCopied: boolean;
    onShare: () => void;
    onCopyCode: () => void;
    onDownload: () => void;
    importText: string;
    onImport: () => void;
    onImportFile: (e: Event) => void;
  }
  let {
    open,
    onClose,
    hasObjects,
    urlTooLong,
    copied,
    codeCopied,
    onShare,
    onCopyCode,
    onDownload,
    importText = $bindable(),
    onImport,
    onImportFile
  }: Props = $props();
</script>

<Modal {open} {onClose} label={i18n.m.territory.shareProject}>
  <div class="sd">
    <span class="sd-h">{i18n.m.territory.shareProject}</span>

    <section class="sd-sec">
      <span class="sd-sec-h">{i18n.m.territory.share}</span>
      <div class="sd-row">
        <Button
          variant={urlTooLong ? 'secondary' : 'primary'}
          size="sm"
          onclick={onShare}
          disabled={!hasObjects || urlTooLong}
          title={urlTooLong ? i18n.m.territory.urlLong : ''}
        >
          <Icon name={copied ? 'check' : 'share-2'} size={13} />
          {copied ? i18n.m.territory.copied : i18n.m.territory.share}
        </Button>
        <Button
          variant={urlTooLong ? 'primary' : 'secondary'}
          size="sm"
          onclick={onCopyCode}
          disabled={!hasObjects}
        >
          <Icon name={codeCopied ? 'check' : 'copy'} size={13} />
          {codeCopied ? i18n.m.territory.codeCopied : i18n.m.territory.copyCode}
        </Button>
        <Button variant="secondary" size="sm" onclick={onDownload} disabled={!hasObjects}>
          <Icon name="download" size={13} />
          {i18n.m.territory.download}
        </Button>
      </div>
      {#if urlTooLong}
        <p class="sd-warn">⚠️ {i18n.m.territory.urlLong}</p>
      {/if}
    </section>

    <section class="sd-sec">
      <span class="sd-sec-h">{i18n.m.territory.import}</span>
      <textarea
        bind:value={importText}
        placeholder={i18n.m.territory.importHint}
        rows="2"
        aria-label={i18n.m.territory.import}
      ></textarea>
      <div class="sd-row">
        <Button variant="secondary" size="sm" onclick={onImport} disabled={!importText.trim()}>
          {i18n.m.territory.import}
        </Button>
        <label class="file-btn">
          <Icon name="upload" size={13} />
          {i18n.m.territory.fromFile}
          <input type="file" accept=".txt,text/plain" onchange={onImportFile} />
        </label>
      </div>
    </section>
  </div>
</Modal>

<style>
  .sd {
    display: flex;
    flex-direction: column;
    gap: 16px;
    /* Stay within Modal's content box (420px − 2×28px padding) so nothing spills. */
    min-width: min(78vw, 360px);
  }
  .sd-h {
    font-family: var(--font-mono);
    font-size: 12px;
    letter-spacing: 1px;
    text-transform: uppercase;
    color: var(--text-mid);
  }
  .sd-sec {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .sd-sec-h {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: var(--text-dim);
  }
  .sd-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  .sd-warn {
    margin: 0;
    color: #fbbf24;
    font-family: var(--font-mono);
    font-size: 11px;
    line-height: 1.5;
  }
  textarea {
    width: 100%;
    box-sizing: border-box;
    background: var(--bg-soft);
    border: 1px solid var(--border);
    border-radius: var(--r-card);
    color: var(--text);
    font-family: var(--font-mono);
    font-size: 12px;
    padding: 8px 10px;
    resize: vertical;
  }
  textarea:focus-visible {
    outline: none;
    border-color: var(--accent);
  }
  .file-btn {
    position: relative;
    overflow: hidden;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: var(--r-pill);
    color: var(--text-mid);
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 1px;
    text-transform: uppercase;
    padding: 8px 16px;
    cursor: pointer;
  }
  .file-btn:hover {
    color: var(--text);
    border-color: var(--border-accent);
  }
  .file-btn input[type='file'] {
    position: absolute;
    inset: 0;
    opacity: 0;
    cursor: pointer;
  }
</style>
