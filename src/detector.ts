import {
  collectRoots,
  getButtonText,
  isUsable,
  isVisible,
  normalizeText,
  parentAcrossShadow,
  queryAll,
  type SearchRoot,
} from './dom';
import { cmpRules } from './rules/cmp-rules';
import { en } from './rules/phrases/en';
import type { CmpRule, Detection, PhraseSet } from './types';

const BUTTON_SELECTOR =
  'button, a, [role="button"], input[type="button"], input[type="submit"]';

// longer text is a sentence, not a button label
const MAX_BUTTON_TEXT_LENGTH = 60;

const CONTAINER_NAME_PATTERN = /cookie|consent|gdpr|cmp/i;

// known platforms first, then text fallback. never clicks anything
export function detect(
  doc: Document = document,
  phrases: PhraseSet = en,
  rules: CmpRule[] = cmpRules,
): Detection | null {
  const roots = collectRoots(doc);
  return detectKnownCmp(roots, rules, phrases) ?? detectByText(roots, phrases);
}

// layer 1: known platforms
export function detectKnownCmp(
  roots: SearchRoot[],
  rules: CmpRule[],
  phrases: PhraseSet,
): Detection | null {
  for (const rule of rules) {
    const banner = firstMatch(roots, rule.banner, isVisible);
    if (!banner) {
      continue;
    }

    // only search inside the banner
    const bannerRoots = collectRoots(banner);
    const canUse = (el: HTMLElement) =>
      isUsable(el) && !isPayWall(getButtonText(el), phrases);

    return {
      source: 'cmp',
      cmpId: rule.id,
      cmpName: rule.name,
      banner,
      rejectButton: firstMatch(bannerRoots, rule.reject, canUse),
      necessaryButton: firstMatch(bannerRoots, rule.necessary, canUse),
    };
  }
  return null;
}

// layer 2: text fallback
export function detectByText(
  roots: SearchRoot[],
  phrases: PhraseSet,
): Detection | null {
  const rejectPhrases = new Set(phrases.reject);
  const necessaryPhrases = new Set(phrases.necessary);

  // matching buttons grouped by banner
  const found = new Map<
    HTMLElement,
    { reject: HTMLElement | null; necessary: HTMLElement | null }
  >();

  for (const button of queryAll(roots, BUTTON_SELECTOR)) {
    const rawText = getButtonText(button);
    if (rawText.length > MAX_BUTTON_TEXT_LENGTH) {
      continue;
    }

    const text = normalizeText(rawText);
    const isReject = rejectPhrases.has(text);
    const isNecessary = !isReject && necessaryPhrases.has(text);
    if (!isReject && !isNecessary) {
      continue;
    }
    if (isPayWall(rawText, phrases) || !isUsable(button)) {
      continue;
    }

    const banner = findBannerContainer(button, phrases);
    if (!banner) {
      continue;
    }

    const entry = found.get(banner) ?? { reject: null, necessary: null };
    if (isReject && !entry.reject) {
      entry.reject = button;
    }
    if (isNecessary && !entry.necessary) {
      entry.necessary = button;
    }
    found.set(banner, entry);
  }

  // prefer reject over necessary-only
  const entries = [...found.entries()];
  const best =
    entries.find(([, buttons]) => buttons.reject) ??
    entries.find(([, buttons]) => buttons.necessary);
  if (!best) {
    return null;
  }

  const [banner, buttons] = best;
  return {
    source: 'heuristic',
    cmpId: null,
    cmpName: null,
    banner,
    rejectButton: buttons.reject,
    necessaryButton: buttons.necessary,
  };
}

// nearest ancestor that looks like an overlay and mentions cookies
export function findBannerContainer(
  button: HTMLElement,
  phrases: PhraseSet,
): HTMLElement | null {
  let node = parentAcrossShadow(button);

  while (node && node !== node.ownerDocument.body) {
    if (
      node instanceof HTMLElement &&
      looksLikeContainer(node) &&
      mentionsCookies(node, phrases)
    ) {
      return node;
    }
    node = parentAcrossShadow(node);
  }
  return null;
}

function looksLikeContainer(el: HTMLElement): boolean {
  const position = el.ownerDocument.defaultView?.getComputedStyle(el).position;
  if (position === 'fixed' || position === 'sticky') {
    return true;
  }

  const role = el.getAttribute('role');
  if (
    el.tagName === 'DIALOG' ||
    role === 'dialog' ||
    role === 'alertdialog' ||
    el.getAttribute('aria-modal') === 'true'
  ) {
    return true;
  }

  const names = `${el.id} ${el.getAttribute('class') ?? ''}`;
  return CONTAINER_NAME_PATTERN.test(names);
}

function mentionsCookies(el: HTMLElement, phrases: PhraseSet): boolean {
  const text = (el.textContent ?? '').toLowerCase();
  return phrases.bannerKeywords.some((keyword) => text.includes(keyword));
}

// "consent or pay" buttons
function isPayWall(text: string, phrases: PhraseSet): boolean {
  const lower = text.toLowerCase();
  return phrases.payWall.some((word) => lower.includes(word));
}

function firstMatch(
  roots: SearchRoot[],
  selectors: string[],
  check: (el: HTMLElement) => boolean,
): HTMLElement | null {
  for (const selector of selectors) {
    const match = queryAll(roots, selector).find(check);
    if (match) {
      return match;
    }
  }
  return null;
}
