export type SearchRoot = Document | Element | ShadowRoot;

// root plus every open shadow root inside it
export function collectRoots(root: SearchRoot): SearchRoot[] {
  const roots: SearchRoot[] = [root];

  for (let i = 0; i < roots.length; i++) {
    const current = roots[i]!;
    if (current instanceof Element && current.shadowRoot) {
      roots.push(current.shadowRoot);
    }
    for (const el of current.querySelectorAll('*')) {
      if (el.shadowRoot) {
        roots.push(el.shadowRoot);
      }
    }
  }

  return roots;
}

export function queryAll(roots: SearchRoot[], selector: string): HTMLElement[] {
  const matches: HTMLElement[] = [];
  for (const root of roots) {
    for (const el of root.querySelectorAll(selector)) {
      if (el instanceof HTMLElement) {
        matches.push(el);
      }
    }
  }
  return matches;
}

// steps out of a shadow root to its host
export function parentAcrossShadow(el: Element): Element | null {
  if (el.parentElement) {
    return el.parentElement;
  }
  const root = el.getRootNode();
  return root instanceof ShadowRoot ? root.host : null;
}

// style-based only, jsdom has no layout to measure
export function isVisible(el: Element): boolean {
  const view = el.ownerDocument.defaultView;
  if (!view) {
    return false;
  }

  // visibility is inherited
  const visibility = view.getComputedStyle(el).visibility;
  if (visibility === 'hidden' || visibility === 'collapse') {
    return false;
  }

  // display and opacity are not, so check every ancestor
  let node: Element | null = el;
  while (node) {
    const style = view.getComputedStyle(node);
    if (style.display === 'none' || style.opacity === '0') {
      return false;
    }
    node = parentAcrossShadow(node);
  }

  return true;
}

export function isUsable(el: HTMLElement): boolean {
  if (el.getAttribute('aria-disabled') === 'true') {
    return false;
  }
  if (
    (el instanceof HTMLButtonElement || el instanceof HTMLInputElement) &&
    el.disabled
  ) {
    return false;
  }
  return isVisible(el);
}

export function getButtonText(el: HTMLElement): string {
  const text =
    el instanceof HTMLInputElement ? el.value : (el.textContent ?? '');
  if (text.trim()) {
    return text;
  }
  return el.getAttribute('aria-label') ?? el.getAttribute('title') ?? '';
}

// "  Don't  Accept → " becomes "dont accept"
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}
