/**
 * Copy text with execCommand fallback for `file://` and older browsers.
 * iOS Safari needs a contentEditable + selection-range dance for the
 * selection to register inside a textarea.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy path */
  }

  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    // font-size: 16px prevents iOS auto-zoom on focused inputs.
    ta.style.cssText =
      'position:fixed;top:0;left:0;width:1px;height:1px;padding:0;border:0;outline:0;opacity:0;font-size:16px;';
    document.body.appendChild(ta);

    const isIOS = /ipad|iphone|ipod/i.test(navigator.userAgent);
    if (isIOS) {
      ta.contentEditable = 'true';
      const range = document.createRange();
      range.selectNodeContents(ta);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
      ta.setSelectionRange(0, 999999);
    } else {
      ta.focus();
      ta.select();
    }

    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
