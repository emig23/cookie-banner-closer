import { afterEach, describe, expect, it } from 'vitest';

import {
  collectRoots,
  getButtonText,
  isUsable,
  isVisible,
  normalizeText,
  queryAll,
} from '../../src/dom';
import { resetDocument } from '../helpers';

afterEach(resetDocument);

function byId(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) {
    throw new Error(`No element with id "${id}"`);
  }
  return el;
}

describe('normalizeText', () => {
  it('lowercases, removes punctuation and collapses spaces', () => {
    expect(normalizeText('  Reject   ALL!  ')).toBe('reject all');
  });

  it('removes straight and curly apostrophes', () => {
    expect(normalizeText("Don't accept")).toBe('dont accept');
    expect(normalizeText('Don’t accept')).toBe('dont accept');
  });

  it('turns symbols and line breaks into single spaces', () => {
    expect(normalizeText('Reject\n  all →')).toBe('reject all');
  });
});

describe('getButtonText', () => {
  it('reads text content, input values and aria-label', () => {
    document.body.innerHTML = `
      <button id="a">Reject all</button>
      <input id="b" type="button" value="Decline" />
      <button id="c" aria-label="Deny"><svg></svg></button>`;
    expect(getButtonText(byId('a'))).toBe('Reject all');
    expect(getButtonText(byId('b'))).toBe('Decline');
    expect(getButtonText(byId('c'))).toBe('Deny');
  });
});

describe('isVisible', () => {
  it('is true for a normal element', () => {
    document.body.innerHTML = '<div id="a">Hi</div>';
    expect(isVisible(byId('a'))).toBe(true);
  });

  it('is false when an ancestor has display: none', () => {
    document.body.innerHTML =
      '<div style="display: none"><span id="a">Hi</span></div>';
    expect(isVisible(byId('a'))).toBe(false);
  });

  it('is false for visibility: hidden, opacity: 0 and the hidden attribute', () => {
    document.body.innerHTML = `
      <div style="visibility: hidden"><span id="a">Hi</span></div>
      <div style="opacity: 0"><span id="b">Hi</span></div>
      <div hidden><span id="c">Hi</span></div>`;
    expect(isVisible(byId('a'))).toBe(false);
    expect(isVisible(byId('b'))).toBe(false);
    expect(isVisible(byId('c'))).toBe(false);
  });

  it('is false when the shadow host is hidden', () => {
    document.body.innerHTML = '<div id="host" style="display: none"></div>';
    const shadow = byId('host').attachShadow({ mode: 'open' });
    shadow.innerHTML = '<button>Deny</button>';
    expect(isVisible(shadow.querySelector('button')!)).toBe(false);
  });
});

describe('isUsable', () => {
  it('rejects disabled and aria-disabled buttons', () => {
    document.body.innerHTML = `
      <button id="a">OK</button>
      <button id="b" disabled>OK</button>
      <a id="c" role="button" aria-disabled="true">OK</a>`;
    expect(isUsable(byId('a'))).toBe(true);
    expect(isUsable(byId('b'))).toBe(false);
    expect(isUsable(byId('c'))).toBe(false);
  });
});

describe('collectRoots and queryAll', () => {
  it('finds elements inside nested open shadow roots', () => {
    document.body.innerHTML = '<button>Outside</button><div id="outer"></div>';
    const outer = byId('outer').attachShadow({ mode: 'open' });
    outer.innerHTML = '<button>Level 1</button><div id="inner"></div>';
    const inner = outer.getElementById('inner')!.attachShadow({ mode: 'open' });
    inner.innerHTML = '<button>Level 2</button>';

    const roots = collectRoots(document);
    expect(roots).toHaveLength(3);

    const texts = queryAll(roots, 'button').map((b) => b.textContent);
    expect(texts).toEqual(['Outside', 'Level 1', 'Level 2']);
  });
});
